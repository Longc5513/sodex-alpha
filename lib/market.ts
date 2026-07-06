import { requestSosovalue } from './sosovalue';
import { SODEX_API_KEY_NAME, SODEX_SPOT_ENDPOINT as SPOT_ENDPOINT, sodexRuntimeStatus as coreSodexRuntimeStatus } from './sodex';

export type Signal = 'BUY' | 'HOLD' | 'WATCH';

export type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Asset = {
  symbol: string;
  name: string;
  pair: string;
  sodexSymbol?: string;
  sosoCurrencyId?: string;
  logo?: string;
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
  chart: CandlePoint[];
  category: string;
  icon: string;
};

export type MarketOverview = {
  totalMarketCap: number | null;
  totalVolume24h: number | null;
  btcDominance: number | null;
  breadthPct: number | null;
  leaders: string[];
};

export type MarketDetail = {
  symbol: string;
  pair: string;
  price: number | null;
  spreadBps: number | null;
  orderbook: { bids: [number, number][]; asks: [number, number][] };
  trades: { time: number; side: string; price: number; size: number }[];
  klines: CandlePoint[];
};

const WATCHLIST = [
  { symbol: 'BTC', name: 'Bitcoin', pair: 'BTC / USDC', sodex: 'vBTC_vUSDC', category: 'Crypto Asset', icon: '₿', logo: '/tokens/btc.svg' },
  { symbol: 'ETH', name: 'Ethereum', pair: 'ETH / USDC', sodex: 'vETH_vUSDC', category: 'Crypto Asset', icon: '◆', logo: '/tokens/eth.svg' },
  { symbol: 'SOSO', name: 'SoSoValue', pair: 'SOSO / USDC', sodex: 'SOSO_USDC', category: 'ValueChain Asset', icon: 'S', logo: '/tokens/soso.svg' },
  { symbol: 'SOL', name: 'Solana', pair: 'SOL / USDC', sodex: 'vSOL_vUSDC', category: 'Crypto Asset', icon: '◎', logo: '/tokens/sol.svg' },
  { symbol: 'LINK', name: 'Chainlink', pair: 'LINK / USDC', sodex: 'vLINK_vUSDC', category: 'Crypto Asset', icon: '⬡', logo: '/tokens/link.svg' }
] as const;

const INDEXES = [
  { symbol: 'MAGI7', name: 'MAGI7.ssi Index', pair: 'MAG7ssi / USDC', sodex: 'vMAG7ssi_vUSDC', sosoIndex: 'ssiMAG7', category: 'SSI Index', icon: 'M', logo: '/tokens/magi7.svg' },
  { symbol: 'USSI', name: 'USSI Treasury Index', pair: 'USSI / USDC', sodex: 'vUSSI_vUSDC', sosoIndex: 'ssiRWA', category: 'SSI Index', icon: 'U', logo: '/tokens/ussi.svg' }
] as const;

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

function unwrapList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.tickers)) return payload.tickers;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.data?.list)) return payload.data.list;
  return [];
}

async function fetchJson(url: string) {
  const headers: HeadersInit = { Accept: 'application/json' };
  if (SODEX_API_KEY_NAME) headers['X-API-Key'] = SODEX_API_KEY_NAME;
  const res = await fetch(url, { headers, cache: 'force-cache' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function normalizeSymbol(value: string) {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function matchesSymbol(row: AnyRecord, sodexSymbol: string, symbol: string) {
  const raw = [
    pickString(row, ['symbol', 's', 'symbolName', 'market', 'name', 'pair']),
    pickString(row, ['baseAsset', 'baseCoin', 'base', 'coin']),
    pickString(row, ['quoteAsset', 'quoteCoin', 'quote'])
  ].filter(Boolean).join('_');
  const normalized = normalizeSymbol(raw);
  return normalized.includes(normalizeSymbol(sodexSymbol)) || normalized.includes(normalizeSymbol(symbol));
}

function findTickerRow(rows: AnyRecord[], sodexSymbol: string, symbol: string) {
  const exact = rows.find((row) => {
    const candidates = [
      pickString(row, ['symbol', 's', 'symbolName', 'market', 'name', 'pair']),
      pickString(row, ['baseAsset', 'baseCoin', 'base', 'coin'])
    ].filter(Boolean);
    return candidates.some((value) => normalizeSymbol(value) === normalizeSymbol(sodexSymbol));
  });
  if (exact) return exact;
  return rows.find((row) => matchesSymbol(row, sodexSymbol, symbol));
}

function toCandlePoints(rows: AnyRecord[]) {
  return rows
    .map((row) => ({
      time: asNumber(row.timestamp ?? row.t) || 0,
      open: asNumber(row.open ?? row.o) || 0,
      high: asNumber(row.high ?? row.h) || 0,
      low: asNumber(row.low ?? row.l) || 0,
      close: asNumber(row.close ?? row.c) || 0,
      volume: asNumber(row.volume ?? row.v ?? row.q) || 0
    }))
    .filter((row) => row.time && row.close > 0);
}

function sparkFromChart(chart: CandlePoint[]) {
  return chart.map((point) => point.close);
}

function deriveSignal(change24h: number): Signal {
  if (change24h > 0.75) return 'BUY';
  if (change24h < -1.25) return 'HOLD';
  return 'WATCH';
}

function confidenceFromLive(change24h: number, change7d: number, volume24h: number | null) {
  const momentum = Math.min(18, Math.abs(change24h) * 3.2 + Math.abs(change7d) * 0.8);
  const liquidity = Math.min(12, Math.log10(Math.max(volume24h || 1, 1)) * 1.35);
  return Math.max(52, Math.min(94, Math.round(56 + momentum + liquidity)));
}

function finishAsset(input: Omit<Asset, 'signal' | 'confidence' | 'entry' | 'stop' | 'take'>): Asset {
  const price = input.price;
  const change24h = input.change24h || 0;
  const signal = deriveSignal(change24h);
  const confidence = confidenceFromLive(change24h, input.change7d || 0, input.volume24h);
  return {
    ...input,
    signal,
    confidence,
    entry: price,
    stop: price === null ? null : price * (change24h >= 0 ? 0.962 : 0.946),
    take: price === null ? null : price * (change24h >= 0 ? 1.036 : 1.022)
  };
}

async function getSodexTickers() {
  try {
    const payload = await fetchJson(`${SPOT_ENDPOINT}/markets/tickers`);
    return unwrapList(payload);
  } catch {
    const payload = await fetchJson(`${SPOT_ENDPOINT}/markets/miniTickers`);
    return unwrapList(payload);
  }
}

async function getSodexKlines(symbol: string, limit = 36) {
  try {
    const payload = await fetchJson(`${SPOT_ENDPOINT}/markets/${encodeURIComponent(symbol)}/klines?interval=1h&limit=${limit}`);
    return toCandlePoints(unwrapList(payload)).sort((a, b) => a.time - b.time);
  } catch {
    return [] as CandlePoint[];
  }
}

async function getSosoCurrencyDirectory() {
  try {
    const result = await requestSosovalue('/currencies');
    const rows = unwrapList(result.data);
    return new Map(rows.map((row: AnyRecord) => [String(row.symbol || '').toUpperCase(), String(row.currency_id || '')]));
  } catch {
    return new Map<string, string>();
  }
}

async function getSosoCurrencySnapshot(currencyId: string) {
  const result = await requestSosovalue(`/currencies/${currencyId}/market-snapshot`);
  return result.data || {};
}

async function getSosoCurrencyKlines(currencyId: string, limit = 36) {
  const result = await requestSosovalue(`/currencies/${currencyId}/klines`, { interval: '1d', limit });
  return toCandlePoints(unwrapList(result.data)).sort((a, b) => a.time - b.time);
}

async function getSosoIndexSnapshot(indexTicker: string) {
  const result = await requestSosovalue(`/indices/${indexTicker}/market-snapshot`);
  return result.data || {};
}

async function getSosoIndexKlines(indexTicker: string, limit = 36) {
  const result = await requestSosovalue(`/indices/${indexTicker}/klines`, { interval: '1d', limit });
  return toCandlePoints(unwrapList(result.data)).sort((a, b) => a.time - b.time);
}

function assetFromTicker(item: (typeof WATCHLIST)[number], tickerRow: AnyRecord | undefined, chart: CandlePoint[], snapshot: AnyRecord | null, sosoCurrencyId = '') {
  const price = pickNumber(tickerRow || {}, ['lastPrice', 'last', 'price', 'close', 'c', 'markPrice', 'indexPrice', 'weightedAvgPrice']) ?? asNumber(snapshot?.price);
  const sodexChange = pickNumber(tickerRow || {}, ['priceChangePercent', 'priceChangePercentage', 'change24h', 'changePercent', 'P', 'priceChangePct']);
  const change24h = sodexChange !== null
    ? (Math.abs(sodexChange) > 1 ? sodexChange : sodexChange * 100)
    : (asNumber(snapshot?.change_pct_24h) || 0) * 100;
  const change7d = snapshot?.roi_7d !== undefined ? (asNumber(snapshot.roi_7d) || 0) * 100 : 0;
  const volume24h = pickNumber(tickerRow || {}, ['quoteVolume', 'volumeUsd', 'volumeUSDC', 'volume24h', 'quoteVolume24h', 'q']) ?? asNumber(snapshot?.turnover_24h);
  const marketCap = asNumber(snapshot?.marketcap);
  return finishAsset({
    symbol: item.symbol,
    name: item.name,
    pair: item.pair,
    sodexSymbol: item.sodex,
    sosoCurrencyId,
    logo: item.logo,
    price,
    change24h,
    change7d,
    volume24h,
    marketCap,
    category: item.category,
    icon: item.icon,
    spark: sparkFromChart(chart),
    chart
  });
}

function indexFromSnapshot(item: (typeof INDEXES)[number], snapshot: AnyRecord | null, chart: CandlePoint[]) {
  return finishAsset({
    symbol: item.symbol,
    name: item.name,
    pair: item.pair,
    logo: item.logo,
    price: asNumber(snapshot?.price),
    change24h: (asNumber(snapshot?.change_pct_24h) || 0) * 100,
    change7d: (asNumber(snapshot?.roi_7d) || 0) * 100,
    volume24h: null,
    marketCap: null,
    category: item.category,
    icon: item.icon,
    spark: sparkFromChart(chart),
    chart
  });
}

function indexFromVenue(item: (typeof INDEXES)[number], tickerRow: AnyRecord | undefined, chart: CandlePoint[], snapshot: AnyRecord | null) {
  const price = pickNumber(tickerRow || {}, ['lastPx', 'lastPrice', 'last', 'price', 'close', 'c', 'markPrice', 'indexPrice', 'weightedAvgPrice']) ?? asNumber(snapshot?.price);
  const venueChange = pickNumber(tickerRow || {}, ['changePct', 'priceChangePercent', 'priceChangePercentage', 'change24h', 'changePercent', 'P', 'priceChangePct']);
  const change24h = venueChange !== null
    ? (Math.abs(venueChange) > 1 ? venueChange : venueChange * 100)
    : (asNumber(snapshot?.change_pct_24h) || 0) * 100;
  const change7d = snapshot?.roi_7d !== undefined ? (asNumber(snapshot.roi_7d) || 0) * 100 : 0;
  const volume24h = pickNumber(tickerRow || {}, ['quoteVolume', 'volumeUsd', 'volumeUSDC', 'volume24h', 'quoteVolume24h', 'q']);
  return finishAsset({
    symbol: item.symbol,
    name: item.name,
    pair: item.pair,
    sodexSymbol: item.sodex,
    logo: item.logo,
    price,
    change24h,
    change7d,
    volume24h,
    marketCap: null,
    category: item.category,
    icon: item.icon,
    spark: sparkFromChart(chart),
    chart
  });
}

export async function getMarket(): Promise<{ assets: Asset[]; overview: MarketOverview }> {
  const [tickers, currencyMap] = await Promise.all([getSodexTickers(), getSosoCurrencyDirectory()]);
  const assetPackets = await Promise.all(WATCHLIST.map(async (item) => {
    const tickerRow = findTickerRow(tickers, item.sodex, item.symbol);
    const sosoCurrencyId = currencyMap.get(item.symbol.toUpperCase()) || '';
    const [chart, snapshot] = await Promise.all([
      getSodexKlines(item.sodex, 36),
      sosoCurrencyId ? getSosoCurrencySnapshot(sosoCurrencyId).catch(() => null) : Promise.resolve(null)
    ]);
    return assetFromTicker(item, tickerRow, chart, snapshot, sosoCurrencyId);
  }));

  const indexPackets = await Promise.all(INDEXES.map(async (item) => {
    const tickerRow = findTickerRow(tickers, item.sodex, item.symbol);
    const [snapshot, chart] = await Promise.all([
      getSosoIndexSnapshot(item.sosoIndex).catch(() => null),
      getSodexKlines(item.sodex, 36).catch(() => [])
    ]);
    return indexFromVenue(item, tickerRow, chart, snapshot);
  }));

  const assets = [...assetPackets, ...indexPackets];
  const assetOnly = assetPackets.filter((asset) => asset.marketCap !== null);
  const totalMarketCap = assetOnly.reduce((sum, asset) => sum + (asset.marketCap || 0), 0) || null;
  const totalVolume24h = assetPackets.reduce((sum, asset) => sum + (asset.volume24h || 0), 0) || null;
  const btc = assetPackets.find((asset) => asset.symbol === 'BTC');
  const positiveCount = assetPackets.filter((asset) => asset.change24h > 0).length;
  const overview: MarketOverview = {
    totalMarketCap,
    totalVolume24h,
    btcDominance: totalMarketCap && btc?.marketCap ? (btc.marketCap / totalMarketCap) * 100 : null,
    breadthPct: assetPackets.length ? (positiveCount / assetPackets.length) * 100 : null,
    leaders: assetPackets.slice().sort((a, b) => b.change24h - a.change24h).slice(0, 3).map((asset) => asset.symbol)
  };

  const ordered = ['BTC', 'ETH', 'SOSO', 'MAGI7', 'SOL', 'USSI', 'LINK'];
  return {
    assets: assets.sort((a, b) => ordered.indexOf(a.symbol) - ordered.indexOf(b.symbol)),
    overview
  };
}

function parseDepthRows(rows: any[]) {
  return (rows || [])
    .map((row) => [asNumber(row?.[0]), asNumber(row?.[1])] as [number | null, number | null])
    .filter((row): row is [number, number] => row[0] !== null && row[1] !== null);
}

export async function getMarketDetail(symbol: string): Promise<MarketDetail | null> {
  const item = WATCHLIST.find((row) => row.symbol === symbol) || WATCHLIST.find((row) => row.sodex === symbol) || INDEXES.find((row) => row.symbol === symbol) || INDEXES.find((row) => row.sodex === symbol);
  if (!item) return null;
  const [klinesPayload, orderbookPayload, tradesPayload, tickerPayload] = await Promise.all([
    fetchJson(`${SPOT_ENDPOINT}/markets/${encodeURIComponent(item.sodex)}/klines?interval=1h&limit=48`).catch(() => null),
    fetchJson(`${SPOT_ENDPOINT}/markets/${encodeURIComponent(item.sodex)}/orderbook?limit=12`).catch(() => null),
    fetchJson(`${SPOT_ENDPOINT}/markets/${encodeURIComponent(item.sodex)}/trades?limit=20`).catch(() => null),
    fetchJson(`${SPOT_ENDPOINT}/markets/bookTickers?symbol=${encodeURIComponent(item.sodex)}`).catch(() => null)
  ]);
  const klines = toCandlePoints(unwrapList(klinesPayload)).sort((a, b) => a.time - b.time);
  const orderbookData = orderbookPayload?.data || {};
  const tickerRow = unwrapList(tickerPayload)[0] || {};
  const bid = asNumber(tickerRow.bidPx || tickerRow.bidPrice);
  const ask = asNumber(tickerRow.askPx || tickerRow.askPrice);
  const mid = bid && ask ? (bid + ask) / 2 : klines[klines.length - 1]?.close || null;
  return {
    symbol: item.symbol,
    pair: item.pair,
    price: mid,
    spreadBps: bid && ask && mid ? ((ask - bid) / mid) * 10000 : null,
    orderbook: {
      bids: parseDepthRows(orderbookData.bids).slice(0, 8),
      asks: parseDepthRows(orderbookData.asks).slice(0, 8)
    },
    trades: unwrapList(tradesPayload).map((row: AnyRecord) => ({
      time: asNumber(row.T || row.time) || 0,
      side: String(row.S || row.side || ''),
      price: asNumber(row.p || row.price) || 0,
      size: asNumber(row.q || row.size || row.quantity) || 0
    })).filter((row) => row.time && row.price > 0),
    klines
  };
}

export function sodexRuntimeStatus() {
  return coreSodexRuntimeStatus();
}
