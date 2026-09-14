// 产品工作台数据层
// local：浏览器本地白板，保留完整编辑和涂鸦能力。
// supabase：受控公开互动墙。访客只读已发布内容，投稿和投票统一经过 Edge Function。

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const SITE_OWNER = 'hresh';
export const TOKEN_KEY = 'hresh.wb.myToken';
export const CARDS_KEY = 'hresh.wb.cards.v1';
export const STROKES_KEY = 'hresh.wb.strokes.v1';
export const VOTE_SELECTIONS_KEY = 'hresh.wb.voteSelections.v2';

export const WB_CONFIG = {
  MODE: import.meta.env.VITE_WHITEBOARD_MODE || 'local',
  SUPABASE_URL: supabaseUrl,
  SUPABASE_KEY: supabaseKey,
  PUBLIC_CARDS_TABLE: 'wb_public_cards',
  VOTE_COUNTS_VIEW: 'wb_vote_counts',
  WRITE_FUNCTION: import.meta.env.VITE_WHITEBOARD_WRITE_FUNCTION || 'whiteboard-write',
  REFRESH_MS: 60_000,
  PUBLIC_CARD_LIMIT: 200,
};

export function supabaseReady() {
  return (
    WB_CONFIG.MODE === 'supabase' &&
    !!WB_CONFIG.SUPABASE_URL &&
    !!WB_CONFIG.SUPABASE_KEY
  );
}

// ---------- local 模式 ----------

export function getMyToken() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('admin') === SITE_OWNER) localStorage.setItem(TOKEN_KEY, SITE_OWNER);
  } catch {
    /* ignore */
  }
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function isAdmin(token) {
  return token === SITE_OWNER;
}

export function loadLocalCards() {
  try {
    return JSON.parse(localStorage.getItem(CARDS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveLocalCards(cards) {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch {
    /* ignore local quota */
  }
}

export function loadLocalStrokes() {
  try {
    return JSON.parse(localStorage.getItem(STROKES_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveLocalStrokes(strokes) {
  try {
    localStorage.setItem(STROKES_KEY, JSON.stringify(strokes));
  } catch {
    /* ignore local quota */
  }
}

export function loadVoteSelections() {
  try {
    return JSON.parse(localStorage.getItem(VOTE_SELECTIONS_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveVoteSelection(cardId, optionIndex) {
  const selections = loadVoteSelections();
  if (optionIndex == null) delete selections[cardId];
  else selections[cardId] = optionIndex;
  localStorage.setItem(VOTE_SELECTIONS_KEY, JSON.stringify(selections));
}

// ---------- 受控远程模式 ----------

let sb = null;
export function getSb() {
  if (!sb) sb = createClient(WB_CONFIG.SUPABASE_URL, WB_CONFIG.SUPABASE_KEY);
  return sb;
}

const rowToCard = (row) => ({ ...row.data, id: row.id, owner: 'visitor' });

export async function fetchPublicCards() {
  const { data, error } = await getSb()
    .from(WB_CONFIG.PUBLIC_CARDS_TABLE)
    .select('id,data,published_at')
    .order('published_at', { ascending: false })
    .limit(WB_CONFIG.PUBLIC_CARD_LIMIT);
  if (error) throw error;
  return (data || []).map(rowToCard);
}

export async function fetchVoteCounts() {
  const { data, error } = await getSb()
    .from(WB_CONFIG.VOTE_COUNTS_VIEW)
    .select('card_id,option_index,vote_count');
  if (error) throw error;
  return data || [];
}

function getDeviceToken() {
  const key = 'hresh.wb.device.v1';
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

async function invokeWrite(body) {
  const { data, error } = await getSb().functions.invoke(WB_CONFIG.WRITE_FUNCTION, {
    body: { ...body, deviceToken: getDeviceToken() },
  });
  if (error) {
    let message = error.message;
    try {
      const payload = await error.context?.json?.();
      message = payload?.error || message;
    } catch {
      /* response body is optional */
    }
    const wrapped = new Error(message || 'request failed');
    wrapped.status = error.context?.status;
    throw wrapped;
  }
  if (!data?.ok) throw new Error(data?.error || 'request failed');
  return data;
}

export function submitCardForReview(card, antiBot) {
  return invokeWrite({
    action: 'submit',
    card,
    antiBot: {
      website: antiBot?.website || '',
      elapsedMs: Math.max(0, Date.now() - Number(antiBot?.formStartedAt || Date.now())),
    },
  });
}

export function submitVoteRemote(cardId, optionIndex) {
  return invokeWrite({ action: 'vote', cardId, optionIndex });
}

// 聚合票数只包含计数，不把匿名访客标识暴露给公开客户端。
export function mergeVoteCounts(cards, rows, selections = loadVoteSelections()) {
  const counts = new Map(
    rows.map((row) => [`${row.card_id}:${row.option_index}`, Number(row.vote_count)])
  );
  return cards.map((card) => {
    if (card.tpl !== 'vote') return card;
    const selected = selections[card.id];
    const options = (card.data?.options || []).map((option, index) => ({
      ...option,
      voteCount: counts.get(`${card.id}:${index}`) || 0,
      mine: selected === index,
    }));
    return { ...card, data: { ...card.data, options } };
  });
}
