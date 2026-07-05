export type Signal = 'BUY' | 'HOLD' | 'WATCH';

export type Asset = {
  symbol: string;
  name: string;
  pair: string;
  sodexSymbol?: string;
  price: number | null;
  change24h: number;
  change7d: number;
  volume24h: number | null;
  marketCap: number | null;
  dominance?: number;
  signal: Signal;
  confidence: number;
  entry: number | null;
  stop: number | null;
  take: number | null;
  spark: number[];
  category: string;
  icon: string;
};

const SPOT_ENDPOINT = process.env.SODEX_SPOT_ENDPOINT || 'https://mainnet-gw.sodex.dev/api/v1/spot';
const SODEX_API_KEY_NAME = process.env.SODEX_API_KEY_NAME || '';
const SODEX_API_PUBLIC_KEY = process.env.SODEX_API_PUBLIC_KEY || '';
const SODEX_API_PRIVATE_KEY = process.env.SODEX_API_PRIVATE_KEY || '';
const MARKET_FALLBACK_ENDPOINT = process.env.MARKET_FALLBACK_ENDPOINT || 'https://api.coingecko.com/api/v3';

const WATCHLIST = [
  { symbol: 'BTC', name: 'Bitcoin', pair: 'BTC / USDC', sodex: 'vBTC_vUSDC', id: 'bitcoin', category: 'Crypto Asset', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', pair: 'ETH / USDC', sodex: 'vETH_vUSDC', id: 'ethereum', category: 'Crypto Asset', icon: '◆' },
  { symbol: 'SOSO', name: 'SoSoValue', pair: 'SOSO / USDC', sodex: 'SOSO_USDC', id: 'sosovalue', category: 'ValueChain Asset', icon: 'S' },
  { symbol: 'SOL', name: 'Solana', pair: 'SOL / USDC', sodex: 'vSOL_vUSDC', id: 'solana', category: 'Crypto Asset', icon: '◎' },
  { symbol: 'LINK', name: 'Chainlink', pair: 'LINK / USDC', sodex: 'vLINK_vUSDC', id: 'chainlink', category: 'Crypto Asset', icon: '⬡' }
] as const;

const INDEXES = [
  { symbol: 'MAGI7', name: 'MAGI7.ssi Index', pair: 'MAGI7.ssi', price: null, change24h: 0, change7d: 0, category: 'SSI Index', icon: 'M' },
  { symbol: 'USSI', name: 'USSI Treasury Index', pair: 'USSI', price: null, change24h: 0, change7d: 0, category: 'SSI Index', icon: 'U' }
];

type AnyRecord = Record<string, any>;

function asNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickNumber(row: AnyRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = key.split('.').reduce<any>((obj, part) => obj?.[part], row);
    const n = asNumber(value);
    if (n !== null) return n;
  }
  return null;
}

function pickString(row: AnyRecord, keys: string[]): string {
  for (const key of keys) {
    const value = key.split('.').reduce<any>((obj, part) => obj?.[part], row);
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function unwrapData(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.tickers)) return payload.tickers;
  if (Array.isArray(payload?.data?.list)) return payload.data.list;
  return [];
}

async function fetchJson(url: string) {
  const headers: HeadersInit = { Accept: 'application/json' };
  // Public market reads do not need signatures. These values stay server-side for future private routes.
  if (SODEX_API_KEY_NAME) headers['X-API-Key'] = SODEX_API_KEY_NAME;
  const res = await fetch(url, { headers, next: { revalidate: 45 } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function matchesSymbol(row: AnyRecord, sodexSymbol: string, clean: string) {
  const raw = [
    pickString(row, ['symbol', 's', 'symbolName', 'market', 'name', 'pair']),
    pickString(row, ['baseAsset', 'baseCoin', 'base', 'coin']),
    pickString(row, ['quoteAsset', 'quoteCoin', 'quote'])
  ].filter(Boolean).join('_').toUpperCase();
  return raw.includes(sodexSymbol.toUpperCase()) || raw.replace(/V/g, '').includes(clean.toUpperCase());
}

async function getSodexTickers() {
  try {
    const payload = await fetchJson(`${SPOT_ENDPOINT}/markets/tickers`);
    return unwrapData(payload);
  } catch {
    try {
      const payload = await fetchJson(`${SPOT_ENDPOINT}/markets/miniTickers`);
      return unwrapData(payload);
    } catch {
      return [];
    }
  }
}

async function getFallbackMarkets() {
  const ids = WATCHLIST.map((w) => w.id).join(',');
  try {
    const url = `${MARKET_FALLBACK_ENDPOINT}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=30&page=1&sparkline=false&price_change_percentage=7d`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('fallback market unavailable');
    const rows = await res.json();
    return Object.fromEntries(rows.map((row: AnyRecord) => [row.id, row]));
  } catch {
    return {} as Record<string, AnyRecord>;
  }
}

function spark(base: number, pct: number) {
  const safe = Math.max(0.00001, base);
  return Array.from({ length: 36 }, (_, i) => {
    const wave = Math.sin(i / 3.2) * safe * 0.012;
    const pulse = Math.cos(i / 7.1) * safe * 0.007;
    const trend = safe * (pct / 100) * (i / 35) * 0.62;
    return Math.max(0.00001, safe + wave + pulse + trend);
  });
}

function deriveSignal(change24h: number): Signal {
  if (change24h > 0.75) return 'BUY';
  if (change24h < -1.25) return 'HOLD';
  return 'WATCH';
}

function finishAsset(input: Omit<Asset, 'signal' | 'confidence' | 'entry' | 'stop' | 'take' | 'spark'>): Asset {
  const price = input.price;
  const change = input.change24h || 0;
  const signal = deriveSignal(change);
  const confidence = Math.min(92, Math.max(58, Math.round(64 + Math.abs(change) * 4.2)));
  return {
    ...input,
    signal,
    confidence,
    entry: price,
    stop: price === null ? null : price * (change >= 0 ? 0.958 : 0.94),
    take: price === null ? null : price * (change >= 0 ? 1.038 : 1.025),
    spark: spark(price || 1, change)
  };
}

function fromSodex(row: AnyRecord, item: (typeof WATCHLIST)[number]): Partial<Asset> | null {
  const price = pickNumber(row, ['lastPrice', 'last', 'price', 'close', 'c', 'markPrice', 'indexPrice', 'weightedAvgPrice']);
  if (price === null || price <= 0) return null;
  const open = pickNumber(row, ['openPrice', 'open', 'o']);
  const rawChange = pickNumber(row, ['priceChangePercent', 'priceChangePercentage', 'change24h', 'changePercent', 'P', 'priceChangePct']);
  const change24h = rawChange !== null ? (Math.abs(rawChange) > 1 ? rawChange : rawChange * 100) : open ? ((price - open) / open) * 100 : 0;
  return {
    price,
    change24h,
    volume24h: pickNumber(row, ['quoteVolume', 'volumeUsd', 'volumeUSDC', 'volume24h', 'quoteVolume24h', 'q']) || null,
    marketCap: null
  };
}

function fromFallback(row: AnyRecord | undefined) {
  if (!row) return { price: null, change24h: 0, change7d: 0, marketCap: null, volume24h: null };
  return {
    price: asNumber(row.current_price),
    change24h: asNumber(row.price_change_percentage_24h) || 0,
    change7d: asNumber(row.price_change_percentage_7d_in_currency) || 0,
    marketCap: asNumber(row.market_cap),
    volume24h: asNumber(row.total_volume)
  };
}

export async function getMarket(): Promise<Asset[]> {
  const [sodexTickers, fallback] = await Promise.all([getSodexTickers(), getFallbackMarkets()]);

  const assets = WATCHLIST.map((item) => {
    const clean = `${item.symbol}_USDC`;
    const sodexRow = sodexTickers.find((row) => matchesSymbol(row, item.sodex, clean));
    const live = sodexRow ? fromSodex(sodexRow, item) : null;
    const secondary = fromFallback(fallback[item.id]);

    return finishAsset({
      symbol: item.symbol,
      name: item.name,
      pair: item.pair,
      sodexSymbol: item.sodex,
      price: live?.price ?? secondary.price,
      change24h: live?.change24h ?? secondary.change24h,
      change7d: secondary.change7d,
      volume24h: live?.volume24h ?? secondary.volume24h,
      marketCap: secondary.marketCap,
      category: item.category,
      icon: item.icon
    });
  });

  const indexes = INDEXES.map((idx) => finishAsset({
    symbol: idx.symbol,
    name: idx.name,
    pair: idx.pair,
    price: idx.price,
    change24h: idx.change24h,
    change7d: idx.change7d,
    marketCap: null,
    volume24h: null,
    category: idx.category,
    icon: idx.icon
  }));

  const ordered = ['BTC', 'ETH', 'SOSO', 'MAGI7', 'SOL', 'USSI', 'LINK'];
  return [...assets, ...indexes].sort((a, b) => ordered.indexOf(a.symbol) - ordered.indexOf(b.symbol));
}

export function sodexRuntimeStatus() {
  return {
    spotEndpoint: SPOT_ENDPOINT,
    hasApiKeyName: Boolean(SODEX_API_KEY_NAME),
    hasApiPublicKey: Boolean(SODEX_API_PUBLIC_KEY),
    hasApiPrivateKey: Boolean(SODEX_API_PRIVATE_KEY)
  };
}
