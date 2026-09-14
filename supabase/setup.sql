-- ============================================================
-- Hresh赫什 · 受控访客互动墙
-- 适用于全新安装，也可从旧版匿名共享白板原地迁移。
-- 只创建/锁定数据库对象；不会部署 Edge Function 或配置密钥。
-- ============================================================

create extension if not exists pgcrypto;

-- 公开端只读取这里。访客永远没有直接写权限。
create table if not exists public.wb_public_cards (
  id text primary key,
  data jsonb not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint wb_public_cards_id_length check (char_length(id) between 1 and 100),
  constraint wb_public_cards_payload_size check (pg_column_size(data) <= 65536)
);

-- 所有访客投稿先进入私有审核区。公开客户端不能读取。
create table if not exists public.wb_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('message', 'intro', 'sticker')),
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'rejected', 'archived')),
  public_card_id text unique,
  legacy_id text unique,
  source_hash text not null,
  content_hash text not null,
  moderation_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint wb_submissions_payload_size check (pg_column_size(payload) <= 16384)
);

create index if not exists wb_submissions_status_created_idx
  on public.wb_submissions (status, created_at desc);
create index if not exists wb_submissions_content_hash_idx
  on public.wb_submissions (content_hash, created_at desc);

-- 投票身份仅保存服务端哈希。公开端只读取聚合视图。
create table if not exists public.wb_public_votes (
  card_id text not null references public.wb_public_cards(id) on delete cascade,
  voter_hash text not null,
  option_index integer not null check (option_index between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (card_id, voter_hash)
);

create index if not exists wb_public_votes_card_option_idx
  on public.wb_public_votes (card_id, option_index);

-- 固定时间窗计数器，仅供 Edge Function 的 service_role 调用。
create table if not exists public.wb_rate_limits (
  scope text not null,
  subject_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (scope, subject_hash, window_start)
);

-- 管理员表沿用旧结构，但不再允许公开读取。
create table if not exists public.wb_admins (
  uid text primary key,
  created_at timestamptz not null default now()
);

alter table public.wb_public_cards enable row level security;
alter table public.wb_submissions enable row level security;
alter table public.wb_public_votes enable row level security;
alter table public.wb_rate_limits enable row level security;
alter table public.wb_admins enable row level security;

revoke all on table public.wb_public_cards from public, anon, authenticated;
revoke all on table public.wb_submissions from public, anon, authenticated;
revoke all on table public.wb_public_votes from public, anon, authenticated;
revoke all on table public.wb_rate_limits from public, anon, authenticated;
revoke all on table public.wb_admins from public, anon, authenticated;

drop policy if exists wb_public_cards_read on public.wb_public_cards;
create policy wb_public_cards_read
  on public.wb_public_cards for select
  to anon, authenticated
  using (true);
grant select on table public.wb_public_cards to anon, authenticated;

-- 聚合视图由数据库所有者读取私有投票表，只暴露数量，不暴露 voter_hash。
create or replace view public.wb_vote_counts
with (security_barrier = true)
as
select card_id, option_index, count(*)::bigint as vote_count
from public.wb_public_votes
group by card_id, option_index;

revoke all on table public.wb_vote_counts from public, anon, authenticated;
grant select on table public.wb_vote_counts to anon, authenticated;

-- 原子限流，避免多个并发请求同时穿透配额。
create or replace function public.wb_consume_rate_limit(
  p_scope text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket timestamptz;
  current_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit configuration';
  end if;

  bucket := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.wb_rate_limits(scope, subject_hash, window_start, request_count)
  values (p_scope, p_subject_hash, bucket, 1)
  on conflict (scope, subject_hash, window_start)
  do update set
    request_count = public.wb_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.wb_consume_rate_limit(text, text, integer, integer) from public;
grant execute on function public.wb_consume_rate_limit(text, text, integer, integer) to service_role;

-- 原子检查待审核队列并入队，避免并发请求同时越过队列上限。
create or replace function public.wb_enqueue_submission(
  p_kind text,
  p_payload jsonb,
  p_source_hash text,
  p_content_hash text,
  p_max_pending integer default 100
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_count integer;
  submission_id uuid;
begin
  if p_max_pending < 1 then
    raise exception 'invalid pending queue limit';
  end if;

  perform pg_advisory_xact_lock(hashtext('wb-pending-submission-queue'));
  select count(*) into pending_count
  from public.wb_submissions
  where status = 'pending';

  if pending_count >= p_max_pending then
    raise exception 'review backlog is full';
  end if;

  insert into public.wb_submissions(kind, payload, source_hash, content_hash)
  values (p_kind, p_payload, p_source_hash, p_content_hash)
  returning id into submission_id;

  return submission_id;
end;
$$;

revoke all on function public.wb_enqueue_submission(text, jsonb, text, text, integer) from public;
grant execute on function public.wb_enqueue_submission(text, jsonb, text, text, integer) to service_role;

-- 管理员在 Table Editor 将 status 改为 published/rejected/archived 即可完成审核。
-- 发布时自动复制安全卡片数据；撤回时自动从公开表删除。
create or replace function public.wb_sync_published_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  card jsonb;
  target_id text;
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from new.status or old.payload is distinct from new.payload)
  then
    card := new.payload->'card';
    if card is null or jsonb_typeof(card) <> 'object' then
      raise exception 'submission payload.card must be an object';
    end if;

    target_id := coalesce(new.public_card_id, 'visitor-' || new.id::text);
    card := card || jsonb_build_object('id', target_id, 'owner', 'visitor', 'kind', 'message');

    insert into public.wb_public_cards(id, data, published_at)
    values (target_id, card, now())
    on conflict (id) do update set data = excluded.data, published_at = excluded.published_at;

    new.public_card_id := target_id;
    new.reviewed_at := coalesce(new.reviewed_at, now());
  elsif tg_op = 'UPDATE'
        and new.status in ('rejected', 'archived')
        and old.status = 'published'
  then
    delete from public.wb_public_cards where id = old.public_card_id;
    new.reviewed_at := coalesce(new.reviewed_at, now());
  elsif tg_op = 'UPDATE'
        and new.status in ('rejected', 'archived')
        and old.status is distinct from new.status
  then
    new.reviewed_at := coalesce(new.reviewed_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists wb_sync_published_submission_trigger on public.wb_submissions;
create trigger wb_sync_published_submission_trigger
before insert or update of status, payload on public.wb_submissions
for each row execute function public.wb_sync_published_submission();

-- 代码内置投票卡需要一条数据库记录作为投票外键目标。
insert into public.wb_public_cards(id, data, published_at)
values (
  'seed-vote-who',
  '{"kind":"seed","tpl":"vote","data":{"question":"你是怎么找到这里的？","options":[{"text":"因为某个产品"},{"text":"朋友推荐"},{"text":"互联网偶遇"},{"text":"来看 AI 怎么做产品"}]}}'::jsonb,
  now()
)
on conflict (id) do nothing;

-- 将旧版公开访客卡迁入待审核区，但不直接公开。种子卡由前端代码维护。
do $$
begin
  if to_regclass('public.wb_cards') is not null then
    execute $migration$
      insert into public.wb_submissions(kind, payload, status, legacy_id, source_hash, content_hash)
      select
        case
          when data->>'tpl' = 'intro' then 'intro'
          when data->>'tpl' = 'sticker' then 'sticker'
          else 'message'
        end,
        jsonb_build_object('card', data || jsonb_build_object('id', id, 'owner', 'visitor')),
        'pending',
        id,
        encode(digest('legacy:' || owner, 'sha256'), 'hex'),
        encode(digest(data::text, 'sha256'), 'hex')
      from public.wb_cards
      where id not like 'seed-%'
      on conflict (legacy_id) do nothing
    $migration$;
  end if;
end $$;

-- 锁死旧版匿名直写表并移出 Realtime publication。旧数据暂不删除，便于回退。
do $$
declare
  table_name text;
begin
  foreach table_name in array array['wb_cards', 'wb_strokes', 'wb_votes'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
      if exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime drop table public.%I', table_name);
      end if;
    end if;
  end loop;
end $$;

-- 定期清理建议（确认保留周期后在 Supabase Cron 中创建）：
-- delete from public.wb_submissions where status in ('rejected','archived') and reviewed_at < now() - interval '30 days';
-- delete from public.wb_submissions where status = 'pending' and created_at < now() - interval '7 days';
-- delete from public.wb_rate_limits where window_start < now() - interval '2 days';
