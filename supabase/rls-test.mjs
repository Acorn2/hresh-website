// 受控互动墙权限自测：公开客户端只能读已发布卡片和聚合票数。
// 运行：SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run test:rls
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('请设置 SUPABASE_URL、SUPABASE_ANON_KEY 和 SUPABASE_SERVICE_ROLE_KEY。');
  process.exit(1);
}

const anon = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
const service = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });
const id = `rls-test-${Date.now()}`;
const sourceHash = `${id}-source`;
const results = [];
const check = (name, condition) => results.push([condition ? 'PASS' : 'FAIL', name]);

try {
  const { error: seedError } = await service.from('wb_public_cards').insert({
    id,
    data: { kind: 'message', name: 'test', text: 'controlled wall RLS test', x: 0, y: 0 },
  });
  check('service_role 可以创建已发布测试卡', !seedError);

  const { data: visible, error: readError } = await anon
    .from('wb_public_cards')
    .select('id')
    .eq('id', id);
  check('匿名访客可以读取已发布卡片', !readError && visible?.length === 1);

  const { error: publicInsertError } = await anon.from('wb_public_cards').insert({
    id: `${id}-attack`,
    data: { text: 'should fail' },
  });
  check('匿名访客不能直接发布卡片', !!publicInsertError);

  const { data: submissions, error: submissionsReadError } = await anon
    .from('wb_submissions')
    .select('id')
    .limit(1);
  check('匿名访客不能读取审核区', !!submissionsReadError || submissions?.length === 0);

  const { error: submissionsInsertError } = await anon.from('wb_submissions').insert({
    kind: 'message',
    payload: { card: { text: 'should fail' } },
    source_hash: 'attack',
    content_hash: 'attack',
  });
  check('匿名访客不能绕过 Edge Function 投稿', !!submissionsInsertError);

  const { error: enqueueError } = await service.rpc('wb_enqueue_submission', {
    p_kind: 'message',
    p_payload: { card: { kind: 'message', text: 'queue test' } },
    p_source_hash: sourceHash,
    p_content_hash: `${id}-content`,
    p_max_pending: 100_000,
  });
  check('service_role 可以通过受控队列入稿', !enqueueError);

  const { error: anonymousEnqueueError } = await anon.rpc('wb_enqueue_submission', {
    p_kind: 'message',
    p_payload: { card: { kind: 'message', text: 'should fail' } },
    p_source_hash: `${sourceHash}-attack`,
    p_content_hash: `${id}-attack-content`,
    p_max_pending: 100_000,
  });
  check('匿名访客不能直接调用入稿函数', !!anonymousEnqueueError);

  const { error: votesInsertError } = await anon.from('wb_public_votes').insert({
    card_id: id,
    voter_hash: 'attack',
    option_index: 0,
  });
  check('匿名访客不能直接写投票明细', !!votesInsertError);

  const { data: votes, error: votesReadError } = await anon
    .from('wb_public_votes')
    .select('*')
    .limit(1);
  check('匿名访客不能读取投票身份哈希', !!votesReadError || votes?.length === 0);

  const { error: countsError } = await anon.from('wb_vote_counts').select('*').limit(1);
  check('匿名访客可以读取聚合票数', !countsError);

  const { data: admins, error: adminsError } = await anon.from('wb_admins').select('*').limit(1);
  check('匿名访客不能读取管理员名单', !!adminsError || admins?.length === 0);
} finally {
  await service.from('wb_submissions').delete().like('source_hash', `${sourceHash}%`);
  await service.from('wb_public_cards').delete().eq('id', id);
  await service.from('wb_public_cards').delete().eq('id', `${id}-attack`);
}

let failures = 0;
for (const [status, name] of results) {
  if (status === 'FAIL') failures += 1;
  console.log(status, name);
}
console.log(failures ? `\n${failures} 项未通过 ❌` : '\n全部通过 ✅');
process.exit(failures ? 1 : 0);
