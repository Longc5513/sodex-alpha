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
  { symbol: 'SOSO', name: 'SoSoValue', pair: 'SOSO / USDC', sodex: 'WSOSO_vUSDC', category: 'ValueChain Asset', icon: 'S', logo: '/tokens/soso.svg' },
  { symbol: 'SOL', name: 'Solana', pair: 'SOL / USDC', sodex: 'vSOL_vUSDC', category: 'Crypto Asset', icon: '◎', logo: '/tokens/sol.svg' },
  { symbol: 'LINK', name: 'Chainlink', pair: 'LINK / USDC', sodex: 'vLINK_vUSDC', category: 'Crypto Asset', icon: '⬡', logo: '/tokens/link.svg' }
] as const;

const INDEXES = [
  { symbol: 'MAGI7', name: 'MAGI7.ssi Index', pair: 'MAG7ssi / USDC', sodex: 'vMAG7ssi_vUSDC', sosoIndex: 'ssiMAG7', category: 'SSI Index', icon: 'M', logo: '/tokens/magi7.svg' },
  { symbol: 'USSI', name: 'USSI Treasury Index', pair: 'USSI / USDC', sodex: 'vUSSI_vUSDC', sosoIndex: 'ssiRWA', category: 'SSI Index', icon: 'U', logo: '/tokens/ussi.svg' }
] as const;

const KNOWN_UNIVERSE_META: Record<string, { name: string; category: string; logo?: string; icon: string }> = {
  BTC: { name: 'Bitcoin', category: 'Majors', logo: '/tokens/btc.svg', icon: '₿' },
  ETH: { name: 'Ethereum', category: 'Majors', logo: '/tokens/eth.svg', icon: '◆' },
  SOSO: { name: 'SoSoValue', category: 'ValueChain Asset', logo: '/tokens/soso.svg', icon: 'S' },
  SOL: { name: 'Solana', category: 'Layer 1', logo: '/tokens/sol.svg', icon: '◎' },
  LINK: { name: 'Chainlink', category: 'Infrastructure', logo: '/tokens/link.svg', icon: '⬡' },
  XRP: { name: 'XRP', category: 'Payments', icon: 'X' },
  ADA: { name: 'Cardano', category: 'Layer 1', icon: 'A' },
  DOGE: { name: 'Dogecoin', category: 'Meme', icon: 'D' },
  AVAX: { name: 'Avalanche', category: 'Layer 1', icon: 'A' },
  SUI: { name: 'Sui', category: 'Layer 1', icon: 'S' },
  UNI: { name: 'Uniswap', category: 'DeFi', icon: 'U' },
  AAVE: { name: 'Aave', category: 'DeFi', icon: 'A' },
  PENDLE: { name: 'Pendle', category: 'DeFi', icon: 'P' },
  ONDO: { name: 'Ondo', category: 'RWA', icon: 'O' },
  ENA: { name: 'Ethena', category: 'RWA', icon: 'E' },
  HYPE: { name: 'Hyperliquid', category: 'Perps / Trading', icon: 'H' },
  WIF: { name: 'dogwifhat', category: 'Meme', icon: 'W' },
  PEPE: { name: 'Pepe', category: 'Meme', icon: 'P' },
  BONK: { name: 'Bonk', category: 'Meme', icon: 'B' },
  NEAR: { name: 'NEAR', category: 'Layer 1', icon: 'N' },
  TAO: { name: 'Bittensor', category: 'AI / Data', icon: 'T' },
  FET: { name: 'Fetch.ai', category: 'AI / Data', icon: 'F' },
  RNDR: { name: 'Render', category: 'AI / Data', icon: 'R' },
  ARB: { name: 'Arbitrum', category: 'Layer 2', icon: 'A' },
  OP: { name: 'Optimism', category: 'Layer 2', icon: 'O' }
};

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

function toTitle(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function cleanVenueToken(token: string) {
  if (/^v[A-Z0-9]/.test(token)) return token.slice(1);
  return token;
}

function inferMarketIdentity(row: AnyRecord) {
  const rawPair = pickString(row, ['symbol', 's', 'symbolName', 'market', 'name', 'pair']);
  const directBase = pickString(row, ['baseAsset', 'baseCoin', 'base', 'coin']);
  const directQuote = pickString(row, ['quoteAsset', 'quoteCoin', 'quote']);
  let base = directBase;
  let quote = directQuote;

  if ((!base || !quote) && rawPair.includes('_')) {
    const [left, right] = rawPair.split('_');
    base = base || left;
    quote = quote || right;
  }

  if ((!base || !quote) && rawPair.includes('/')) {
    const [left, right] = rawPair.split('/');
    base = base || left;
    quote = quote || right;
  }

  const venueBase = cleanVenueToken((base || '').trim());
  const venueQuote = cleanVenueToken((quote || '').trim());
  const displaySymbol = normalizeSymbol(venueBase);
  const displayQuote = normalizeSymbol(venueQuote || 'USDC');

  return {
    rawPair,
    sodexSymbol: rawPair || `${base}_${quote}`,
    base: venueBase,
    quote: venueQuote,
    symbol: displaySymbol,
    quoteSymbol: displayQuote
  };
}

function inferDynamicCategory(symbol: string, rawPair: string) {
  const upperPair = rawPair.toUpperCase();
  if (symbol.includes('SSI') || symbol.includes('MAG7') || symbol.includes('USSI')) return 'SSI Index';
  if (symbol === 'SOSO') return 'ValueChain Asset';
  if (KNOWN_UNIVERSE_META[symbol]?.category) return KNOWN_UNIVERSE_META[symbol].category;
  if (/(USDC|USDT|USDE|DAI|FDUSD|USD0|USD)/.test(symbol)) return 'Stable / Cash';
  if (/(AI|TAO|FET|RENDER|RNDR|ARKM)/.test(symbol)) return 'AI / Data';
  if (/(LINK|BAND|PYTH|API3)/.test(symbol)) return 'Infrastructure';
  if (/(AAVE|UNI|MKR|COMP|CRV|PENDLE|SUSHI|JUP)/.test(symbol)) return 'DeFi';
  if (/(DOGE|SHIB|PEPE|WIF|BONK|FLOKI|BRETT)/.test(symbol)) return 'Meme';
  if (/(ARB|OP|MNT|STRK|ZK)/.test(symbol)) return 'Layer 2';
  if (/(ONDO|USSI|RWA|ENA)/.test(symbol)) return 'RWA';
  if (/(SOL|SUI|AVAX|SEI|APT|ATOM|ADA|NEAR|XRP|ETH|BTC)/.test(symbol)) return 'Layer 1';
  if (upperPair.includes('USDC') || upperPair.includes('USDT')) return 'SoDEX Spot';
  return 'Venue Universe';
}

function inferDynamicMeta(symbol: string, rawPair: string) {
  const known = KNOWN_UNIVERSE_META[symbol];
  if (known) return known;
  const icon = symbol.slice(0, 2) || '?';
  return {
    name: toTitle(symbol),
    category: inferDynamicCategory(symbol, rawPair),
    icon
  };
}

function buildSyntheticSpark(price: number | null, change24h: number) {
  if (price === null || !Number.isFinite(price) || price <= 0) return [];
  const start = price / (1 + change24h / 100 || 1);
  return Array.from({ length: 12 }, (_, index) => {
    const ratio = index / 11;
    return Number((start + (price - start) * ratio).toFixed(6));
  });
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

function latestChartClose(chart: CandlePoint[]) {
  return chart.length ? chart[chart.length - 1]?.close || null : null;
}

function deriveVenueChangePercent(tickerRow: AnyRecord | undefined, snapshot: AnyRecord | null) {
  const last = pickNumber(tickerRow || {}, ['lastPx', 'lastPrice', 'last', 'price', 'close', 'c', 'markPrice', 'indexPrice', 'weightedAvgPrice']);
  const open = pickNumber(tickerRow || {}, ['openPx', 'openPrice', 'open', 'o']);
  if (last !== null && open !== null && open > 0) return ((last - open) / open) * 100;
  const venueChange = pickNumber(tickerRow || {}, ['changePct', 'priceChangePercent', 'priceChangePercentage', 'change24h', 'changePercent', 'P', 'priceChangePct']);
  if (venueChange !== null) return Math.abs(venueChange) > 1 ? venueChange : venueChange * 100;
  return (asNumber(snapshot?.change_pct_24h) || 0) * 100;
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
  const price = pickNumber(tickerRow || {}, ['lastPrice', 'last', 'price', 'close', 'c', 'markPrice', 'indexPrice', 'weightedAvgPrice']) ?? asNumber(snapshot?.price) ?? latestChartClose(chart);
  const change24h = deriveVenueChangePercent(tickerRow, snapshot);
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
    price: asNumber(snapshot?.price) ?? latestChartClose(chart),
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
  const price = pickNumber(tickerRow || {}, ['lastPx', 'lastPrice', 'last', 'price', 'close', 'c', 'markPrice', 'indexPrice', 'weightedAvgPrice']) ?? asNumber(snapshot?.price) ?? latestChartClose(chart);
  const change24h = deriveVenueChangePercent(tickerRow, snapshot);
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

function dynamicAssetFromTicker(row: AnyRecord): Asset | null {
  const identity = inferMarketIdentity(row);
  if (!identity.symbol || !identity.quoteSymbol) return null;
  if (!/(USDC|USDT|USDE|USD|USD0|DAI|FDUSD)/.test(identity.quoteSymbol)) return null;
  if (/(BULL|BEAR|UP|DOWN|3L|3S|5L|5S)/.test(identity.symbol)) return null;
  if (/^\d{3,}/.test(identity.symbol)) return null;
  if (identity.symbol.length > 14) return null;

  const price = pickNumber(row, ['lastPx', 'lastPrice', 'last', 'price', 'close', 'c', 'markPrice', 'indexPrice', 'weightedAvgPrice']);
  const volume24h = pickNumber(row, ['quoteVolume', 'volumeUsd', 'volumeUSDC', 'volume24h', 'quoteVolume24h', 'q']);
  if (price === null || price <= 0 || volume24h === null || volume24h <= 0) return null;

  const change24h = deriveVenueChangePercent(row, null);
  const change7d = 0;
  const meta = inferDynamicMeta(identity.symbol, identity.rawPair);

  return finishAsset({
    symbol: identity.symbol,
    name: meta.name,
    pair: `${identity.base} / ${identity.quote}`,
    sodexSymbol: identity.sodexSymbol,
    logo: meta.logo,
    price,
    change24h,
    change7d,
    volume24h,
    marketCap: null,
    category: meta.category,
    icon: meta.icon,
    spark: buildSyntheticSpark(price, change24h),
    chart: []
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

  const curatedSymbols = new Set<string>([...WATCHLIST.map((row) => row.symbol), ...INDEXES.map((row) => row.symbol)]);
  const curatedVenueSymbols = new Set<string>([...WATCHLIST.map((row) => normalizeSymbol(row.sodex)), ...INDEXES.map((row) => normalizeSymbol(row.sodex))]);
  const dynamicUniverse = tickers
    .map((row) => dynamicAssetFromTicker(row))
    .filter((row): row is Asset => Boolean(row))
    .filter((row) => !curatedSymbols.has(row.symbol))
    .filter((row) => !curatedVenueSymbols.has(normalizeSymbol(row.sodexSymbol || '')))
    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
    .slice(0, 180);

  const assets = [...assetPackets, ...indexPackets, ...dynamicUniverse];
  const assetOnly = assetPackets.filter((asset) => asset.marketCap !== null);
  const totalMarketCap = assetOnly.reduce((sum, asset) => sum + (asset.marketCap || 0), 0) || null;
  const totalVolume24h = assets.reduce((sum, asset) => sum + (asset.volume24h || 0), 0) || null;
  const btc = assetPackets.find((asset) => asset.symbol === 'BTC');
  const positiveCount = assets.filter((asset) => asset.change24h > 0).length;
  const overview: MarketOverview = {
    totalMarketCap,
    totalVolume24h,
    btcDominance: totalMarketCap && btc?.marketCap ? (btc.marketCap / totalMarketCap) * 100 : null,
    breadthPct: assets.length ? (positiveCount / assets.length) * 100 : null,
    leaders: assets.slice().sort((a, b) => b.change24h - a.change24h).slice(0, 3).map((asset) => asset.symbol)
  };

  const ordered: string[] = ['BTC', 'ETH', 'SOSO', 'MAGI7', 'SOL', 'USSI', 'LINK'];
  return {
    assets: assets.sort((a, b) => {
      const aIndex = ordered.indexOf(a.symbol);
      const bIndex = ordered.indexOf(b.symbol);
      if (aIndex >= 0 || bIndex >= 0) {
        if (aIndex < 0) return 1;
        if (bIndex < 0) return -1;
        return aIndex - bIndex;
      }
      return (b.volume24h || 0) - (a.volume24h || 0);
    }),
    overview
  };
}

function parseDepthRows(rows: any[]) {
  return (rows || [])
    .map((row) => [asNumber(row?.[0]), asNumber(row?.[1])] as [number | null, number | null])
    .filter((row): row is [number, number] => row[0] !== null && row[1] !== null);
}

export async function getMarketDetail(symbol: string): Promise<MarketDetail | null> {
  const knownItem = WATCHLIST.find((row) => row.symbol === symbol) || WATCHLIST.find((row) => row.sodex === symbol) || INDEXES.find((row) => row.symbol === symbol) || INDEXES.find((row) => row.sodex === symbol);
  let item: { symbol: string; pair: string; sodex: string } | null = knownItem ? {
    symbol: knownItem.symbol,
    pair: knownItem.pair,
    sodex: knownItem.sodex
  } : null;

  if (!item) {
    const tickers = await getSodexTickers();
    const row = findTickerRow(tickers, symbol, symbol) || tickers.map((entry) => ({ row: entry, identity: inferMarketIdentity(entry) })).find((entry) => entry.identity.symbol === normalizeSymbol(symbol) || entry.identity.sodexSymbol === symbol)?.row;
    if (!row) return null;
    const identity = inferMarketIdentity(row);
    if (!identity.sodexSymbol || !identity.symbol) return null;
    item = {
      symbol: identity.symbol,
      pair: `${identity.base} / ${identity.quote}`,
      sodex: identity.sodexSymbol
    };
  }

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
