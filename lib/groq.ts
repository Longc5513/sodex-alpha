type GroqBriefInput = {
  asset?: {
    symbol?: string;
    name?: string;
    price?: number | null;
    change24h?: number | null;
    change7d?: number | null;
    volume24h?: number | null;
    marketCap?: number | null;
    confidence?: number | null;
    signal?: string | null;
    spreadBps?: number | null;
    depthUsd?: number | null;
  } | null;
  leadStory?: {
    title?: string;
    summary?: string;
    tags?: string[];
    source?: string;
  } | null;
  macro?: {
    date?: string;
    events?: string[];
  } | null;
  venue?: {
    topBid?: number | null;
    topAsk?: number | null;
    spreadBps?: number | null;
    depthUsd?: number | null;
  } | null;
};

export function groqRuntimeStatus() {
  return {
    hasApiKey: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1'
  };
}

function clip(text: string, limit = 280) {
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function buildPrompt(input: GroqBriefInput) {
  const asset = input.asset || {};
  const leadStory = input.leadStory || {};
  const macro = input.macro || {};
  const venue = input.venue || {};

  return [
    'You are a crypto execution copilot for a SoSoValue x SoDEX trading terminal.',
    'Use only the provided facts. Do not invent missing data. Keep it concise and actionable.',
    'Return valid JSON only with this exact shape:',
    '{"summary":"", "regime":"", "action":"BUY|SELL|HOLD|WATCH", "confidence":0, "thesis":["",""], "risks":["",""], "executionPlan":["",""]}',
    '',
    `asset_symbol: ${asset.symbol || ''}`,
    `asset_name: ${asset.name || ''}`,
    `price: ${asset.price ?? ''}`,
    `change_24h_pct: ${asset.change24h ?? ''}`,
    `change_7d_pct: ${asset.change7d ?? ''}`,
    `volume_24h_usd: ${asset.volume24h ?? ''}`,
    `market_cap_usd: ${asset.marketCap ?? ''}`,
    `signal: ${asset.signal || ''}`,
    `confidence_pct: ${asset.confidence ?? ''}`,
    `spread_bps: ${venue.spreadBps ?? asset.spreadBps ?? ''}`,
    `visible_depth_usd: ${venue.depthUsd ?? asset.depthUsd ?? ''}`,
    `top_bid: ${venue.topBid ?? ''}`,
    `top_ask: ${venue.topAsk ?? ''}`,
    `lead_story_title: ${clip(leadStory.title || '', 180)}`,
    `lead_story_summary: ${clip(leadStory.summary || '', 320)}`,
    `lead_story_tags: ${(leadStory.tags || []).join(', ')}`,
    `macro_date: ${macro.date || ''}`,
    `macro_events: ${(macro.events || []).join(', ')}`,
    '',
    'If spread is wide or depth is weak, mention passive staging or waiting.',
    'If there is not enough evidence, choose WATCH or HOLD.'
  ].join('\n');
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function generateGroqBrief(input: GroqBriefInput) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const started = performance.now();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are a fast execution analyst. Return JSON only.'
        },
        {
          role: 'user',
          content: buildPrompt(input)
        }
      ]
    }),
    cache: 'no-store'
  });

  const text = await res.text();
  let payload: any = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${typeof payload === 'object' ? JSON.stringify(payload).slice(0, 240) : text.slice(0, 240)}`);
  }

  const content = payload?.choices?.[0]?.message?.content || '';
  const parsed = safeParseJson(content);
  return {
    ok: Boolean(parsed),
    ms: Math.round(performance.now() - started),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    parsed,
    raw: content
  };
}
