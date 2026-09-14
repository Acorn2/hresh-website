import { createClient } from 'npm:@supabase/supabase-js@2.112.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const HASH_SALT = Deno.env.get('WHITEBOARD_HASH_SALT') || '';
const WRITE_ENABLED = Deno.env.get('WHITEBOARD_WRITE_ENABLED') === 'true';
const MIN_FORM_FILL_MS = 1_500;
const MAX_FORM_AGE_MS = 30 * 60 * 1_000;
const MAX_PENDING_SUBMISSIONS = 100;
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('WHITEBOARD_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const MESSAGE_COLORS = new Set(['#F4D758', '#2B7FD8', '#FFF9EC', '#756F64', '#211E1A']);
const STICKERS = new Set([
  '😀', '😂', '🥹', '😍', '🤔', '😴', '🙃', '😎', '🥳', '😭', '👍', '🫶',
  '❤️', '🔥', '✨', '🎉', '🍀', '🌙', '⭐', '🐱', '🐶', '🍉', '☕', '🚀',
]);

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') || '';
  const cors = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return ALLOWED_ORIGINS.has(origin)
      ? new Response('ok', { headers: cors })
      : json({ ok: false, error: 'origin not allowed' }, 403, cors);
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405, cors);
  if (!ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: 'origin not allowed' }, 403, cors);
  if (!WRITE_ENABLED) return json({ ok: false, error: 'writing is disabled' }, 503, cors);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !HASH_SALT) {
    console.error('whiteboard-write is missing required server configuration');
    return json({ ok: false, error: 'service unavailable' }, 503, cors);
  }

  try {
    const raw = await request.text();
    if (raw.length > 20_000) return json({ ok: false, error: 'payload too large' }, 413, cors);
    const body = JSON.parse(raw);
    const deviceToken = cleanString(body.deviceToken, 100);
    if (!/^[0-9a-f-]{20,100}$/i.test(deviceToken)) {
      return json({ ok: false, error: 'invalid device token' }, 400, cors);
    }

    const ip = clientIp(request);
    const ipHash = await sha256(`${HASH_SALT}:ip:${ip}`);
    const deviceHash = await sha256(`${HASH_SALT}:device:${deviceToken}`);
    const sourceHash = await sha256(`${HASH_SALT}:source:${ip}:${deviceToken}`);

    if (body.action === 'submit') {
      return await handleSubmission(body, { ipHash, deviceHash, sourceHash, cors });
    }
    if (body.action === 'vote') {
      return await handleVote(body, { ipHash, sourceHash, cors });
    }
    return json({ ok: false, error: 'unsupported action' }, 400, cors);
  } catch (error) {
    console.error('whiteboard-write failed', error);
    return json({ ok: false, error: 'request failed' }, 500, cors);
  }
});

async function handleSubmission(
  body: Record<string, unknown>,
  context: { ipHash: string; deviceHash: string; sourceHash: string; cors: HeadersInit },
) {
  if (!passesAntiBotChecks(body.antiBot)) {
    return json({ ok: false, error: 'submission rejected' }, 400, context.cors);
  }

  const sourceAllowed = await consumeLimits([
    ['submit-ip-10m', context.ipHash, 2, 600],
    ['submit-ip-day', context.ipHash, 5, 86_400],
    ['submit-device-10m', context.deviceHash, 2, 600],
    ['submit-device-day', context.deviceHash, 3, 86_400],
  ]);
  if (!sourceAllowed) {
    return json({ ok: false, error: 'rate limit exceeded' }, 429, context.cors);
  }

  const globalAllowed = await consumeLimits([
    ['submit-global-hour', 'global', 20, 3_600],
    ['submit-global-day', 'global', 50, 86_400],
  ]);
  if (!globalAllowed) {
    return json({ ok: false, error: 'rate limit exceeded' }, 429, context.cors);
  }

  const sanitized = sanitizeCard(body.card);
  if (!sanitized) return json({ ok: false, error: 'invalid card' }, 400, context.cors);

  const contentHash = await sha256(JSON.stringify(sanitized.card));
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: duplicate, error: duplicateError } = await db
    .from('wb_submissions')
    .select('id')
    .eq('source_hash', context.sourceHash)
    .eq('content_hash', contentHash)
    .gte('created_at', since)
    .limit(1)
    .maybeSingle();
  if (duplicateError) throw duplicateError;
  if (duplicate) return json({ ok: false, error: 'duplicate submission' }, 409, context.cors);

  const { data: submissionId, error } = await db.rpc('wb_enqueue_submission', {
    p_kind: sanitized.kind,
    p_payload: { card: sanitized.card },
    p_source_hash: context.sourceHash,
    p_content_hash: contentHash,
    p_max_pending: MAX_PENDING_SUBMISSIONS,
  });
  if (error?.message?.includes('review backlog is full')) {
    return json({ ok: false, error: 'review backlog is full' }, 503, context.cors);
  }
  if (error) throw error;

  return json({ ok: true, status: 'pending', submissionId }, 202, context.cors);
}

async function handleVote(
  body: Record<string, unknown>,
  context: { ipHash: string; sourceHash: string; cors: HeadersInit },
) {
  const cardId = cleanString(body.cardId, 100);
  const optionIndex = Number(body.optionIndex);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(cardId) || !Number.isInteger(optionIndex)) {
    return json({ ok: false, error: 'invalid vote' }, 400, context.cors);
  }

  if (!(await consumeLimit('vote-ip-hour', context.ipHash, 30, 3_600))) {
    return json({ ok: false, error: 'rate limit exceeded' }, 429, context.cors);
  }
  if (!(await consumeLimit('vote-global-day', 'global', 1_000, 86_400))) {
    return json({ ok: false, error: 'rate limit exceeded' }, 429, context.cors);
  }

  const { data: publicCard, error: cardError } = await db
    .from('wb_public_cards')
    .select('data')
    .eq('id', cardId)
    .maybeSingle();
  if (cardError) throw cardError;
  const options = publicCard?.data?.data?.options;
  if (!Array.isArray(options) || optionIndex < 0 || optionIndex >= Math.min(options.length, 4)) {
    return json({ ok: false, error: 'poll not found' }, 404, context.cors);
  }

  const { data: existing, error: existingError } = await db
    .from('wb_public_votes')
    .select('option_index')
    .eq('card_id', cardId)
    .eq('voter_hash', context.sourceHash)
    .maybeSingle();
  if (existingError) throw existingError;

  let selectedOption: number | null = optionIndex;
  if (existing?.option_index === optionIndex) {
    const { error } = await db
      .from('wb_public_votes')
      .delete()
      .eq('card_id', cardId)
      .eq('voter_hash', context.sourceHash);
    if (error) throw error;
    selectedOption = null;
  } else {
    const { error } = await db.from('wb_public_votes').upsert({
      card_id: cardId,
      voter_hash: context.sourceHash,
      option_index: optionIndex,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  return json({ ok: true, selectedOption }, 200, context.cors);
}

function sanitizeCard(value: unknown): { kind: string; card: Record<string, unknown> } | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const x = clampNumber(input.x, -500, 3000, 900);
  const y = clampNumber(input.y, -500, 3000, 500);
  const createdAt = Date.now();

  if (!input.tpl) {
    const text = cleanString(input.text, 140);
    if (!text) return null;
    return {
      kind: 'message',
      card: {
        kind: 'message',
        name: cleanString(input.name, 12) || '匿名',
        text,
        color: MESSAGE_COLORS.has(String(input.color)) ? input.color : '#F4D758',
        x,
        y,
        w: 240,
        h: 96,
        createdAt,
      },
    };
  }

  const data = input.data && typeof input.data === 'object'
    ? input.data as Record<string, unknown>
    : {};
  if (input.tpl === 'sticker') {
    const emoji = cleanString(data.emoji, 8);
    if (!STICKERS.has(emoji)) return null;
    return {
      kind: 'sticker',
      card: { kind: 'message', tpl: 'sticker', data: { emoji }, x, y, w: 150, h: 100, createdAt },
    };
  }
  if (input.tpl === 'intro') {
    const name = cleanString(data.name, 12);
    if (!name) return null;
    const tags = Array.isArray(data.tags)
      ? data.tags.map((tag) => cleanString(tag, 12)).filter(Boolean).slice(0, 3)
      : [];
    const link = sanitizeUrl(data.link);
    return {
      kind: 'intro',
      card: {
        kind: 'message',
        tpl: 'intro',
        data: {
          emoji: STICKERS.has(cleanString(data.emoji, 8)) ? data.emoji : '😀',
          name,
          bio: cleanString(data.bio, 40),
          tags,
          link,
          color: MESSAGE_COLORS.has(String(data.color)) ? data.color : '#F4D758',
        },
        x,
        y,
        w: 300,
        h: 230,
        createdAt,
      },
    };
  }
  return null;
}

function passesAntiBotChecks(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const antiBot = value as Record<string, unknown>;
  if (cleanString(antiBot.website, 200)) return false;
  const elapsedMs = Number(antiBot.elapsedMs);
  return Number.isFinite(elapsedMs)
    && elapsedMs >= MIN_FORM_FILL_MS
    && elapsedMs <= MAX_FORM_AGE_MS;
}

async function consumeLimits(limits: Array<[string, string, number, number]>) {
  for (const [scope, subjectHash, limit, seconds] of limits) {
    if (!(await consumeLimit(scope, subjectHash, limit, seconds))) return false;
  }
  return true;
}

async function consumeLimit(scope: string, subjectHash: string, limit: number, seconds: number) {
  const { data, error } = await db.rpc('wb_consume_rate_limit', {
    p_scope: scope,
    p_subject_hash: subjectHash,
    p_limit: limit,
    p_window_seconds: seconds,
  });
  if (error) throw error;
  return data === true;
}

function sanitizeUrl(value: unknown) {
  const raw = cleanString(value, 300);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function cleanString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(Math.min(max, Math.max(min, number))) : fallback;
}

function clientIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(body: Record<string, unknown>, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers });
}
