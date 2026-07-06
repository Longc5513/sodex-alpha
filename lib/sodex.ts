import { createHmac, randomUUID } from 'crypto';

type AnyRecord = Record<string, any>;

export const SODEX_SPOT_ENDPOINT = process.env.SODEX_SPOT_ENDPOINT || 'https://mainnet-gw.sodex.dev/api/v1/spot';
export const SODEX_PERPS_ENDPOINT = process.env.SODEX_PERPS_ENDPOINT || 'https://mainnet-gw.sodex.dev/api/v1/perps';
export const SODEX_CHAIN_ID = Number(process.env.SODEX_CHAIN_ID || '286623');
export const SODEX_API_KEY_NAME = process.env.SODEX_API_KEY_NAME || '';
export const SODEX_API_PUBLIC_KEY = process.env.SODEX_API_PUBLIC_KEY || process.env.SODEX_PUBLIC_KEY || '';
export const SODEX_API_PRIVATE_KEY = process.env.SODEX_API_PRIVATE_KEY || '';
export const SODEX_VERIFYING_CONTRACT = '0x0000000000000000000000000000000000000000';

const CURVE_P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
const CURVE_N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const CURVE_GX = BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240');
const CURVE_GY = BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424');
const G_POINT = { x: CURVE_GX, y: CURVE_GY };
const MASK_64 = (1n << 64n) - 1n;

const ROTATION_OFFSETS = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14
];

const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n,
  0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n,
  0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn,
  0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n,
  0x0000000080000001n, 0x8000000080008008n
];

type Point = { x: bigint; y: bigint } | null;

export type SpotOrderInput = {
  walletAddress: string;
  accountID: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  quantity?: string;
  funds?: string;
  price?: string;
  timeInForce?: number;
  reduceOnly?: boolean;
  clientOrderId?: string;
};

export type PreparedSpotOrder = {
  venue: 'spot';
  path: '/trade/orders/batch';
  actionType: 'newOrder';
  params: AnyRecord;
  payloadHash: string;
  nonce: number;
  typedData: AnyRecord;
  signature?: string;
  apiKeyName: string;
  apiPublicKey: string;
  chainId: number;
  walletAddress: string;
  accountID: number;
  symbol: string;
  symbolID: number;
};

function mod(value: bigint, base: bigint) {
  const result = value % base;
  return result >= 0n ? result : result + base;
}

function modPow(base: bigint, exponent: bigint, modulo: bigint) {
  let result = 1n;
  let current = mod(base, modulo);
  let exp = exponent;
  while (exp > 0n) {
    if (exp & 1n) result = mod(result * current, modulo);
    current = mod(current * current, modulo);
    exp >>= 1n;
  }
  return result;
}

function modInv(value: bigint, modulo: bigint) {
  let a = mod(value, modulo);
  let b = modulo;
  let x0 = 1n;
  let x1 = 0n;
  while (b !== 0n) {
    const q = a / b;
    [a, b] = [b, a % b];
    [x0, x1] = [x1, x0 - q * x1];
  }
  if (a !== 1n) throw new Error('mod inverse does not exist');
  return mod(x0, modulo);
}

function pointAdd(a: Point, b: Point): Point {
  if (!a) return b;
  if (!b) return a;
  if (a.x === b.x && mod(a.y + b.y, CURVE_P) === 0n) return null;
  const lambda = a.x === b.x && a.y === b.y
    ? mod((3n * a.x * a.x) * modInv(2n * a.y, CURVE_P), CURVE_P)
    : mod((b.y - a.y) * modInv(b.x - a.x, CURVE_P), CURVE_P);
  const x = mod(lambda * lambda - a.x - b.x, CURVE_P);
  const y = mod(lambda * (a.x - x) - a.y, CURVE_P);
  return { x, y };
}

function scalarMultiply(k: bigint, point: Point = G_POINT): Point {
  let n = mod(k, CURVE_N);
  let result: Point = null;
  let addend = point;
  while (n > 0n) {
    if (n & 1n) result = pointAdd(result, addend);
    addend = pointAdd(addend, addend);
    n >>= 1n;
  }
  return result;
}

function bytesToBigInt(bytes: Uint8Array) {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return BigInt(`0x${hex || '00'}`);
}

function bigIntToBytes(value: bigint, length = 32) {
  const hex = value.toString(16).padStart(length * 2, '0');
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

function concatBytes(...parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function utf8(value: string) {
  return new TextEncoder().encode(value);
}

function rotl64(value: bigint, shift: number) {
  const amount = BigInt(shift % 64);
  if (!amount) return value & MASK_64;
  return ((value << amount) | (value >> (64n - amount))) & MASK_64;
}

function bytesToLane(input: Uint8Array, offset: number) {
  let lane = 0n;
  for (let i = 0; i < 8; i += 1) {
    lane |= BigInt(input[offset + i] || 0) << BigInt(i * 8);
  }
  return lane;
}

function laneToBytes(value: bigint) {
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number((value >> BigInt(i * 8)) & 0xffn);
  }
  return out;
}

function keccakF1600(state: bigint[]) {
  const b = new Array<bigint>(25).fill(0n);
  const c = new Array<bigint>(5).fill(0n);
  const d = new Array<bigint>(5).fill(0n);

  for (let round = 0; round < 24; round += 1) {
    for (let x = 0; x < 5; x += 1) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x += 1) {
      d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] = (state[x + 5 * y] ^ d[x]) & MASK_64;
      }
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const index = x + 5 * y;
        const nx = y;
        const ny = (2 * x + 3 * y) % 5;
        b[nx + 5 * ny] = rotl64(state[index], ROTATION_OFFSETS[index]);
      }
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const index = x + 5 * y;
        state[index] = (b[index] ^ ((~b[((x + 1) % 5) + 5 * y]) & b[((x + 2) % 5) + 5 * y])) & MASK_64;
      }
    }
    state[0] = (state[0] ^ ROUND_CONSTANTS[round]) & MASK_64;
  }
}

export function keccak256(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? utf8(input) : input;
  const state = new Array<bigint>(25).fill(0n);
  const rate = 136;
  let offset = 0;

  while (offset + rate <= bytes.length) {
    const block = bytes.slice(offset, offset + rate);
    for (let lane = 0; lane < rate / 8; lane += 1) {
      state[lane] ^= bytesToLane(block, lane * 8);
    }
    keccakF1600(state);
    offset += rate;
  }

  const tail = new Uint8Array(rate);
  tail.set(bytes.slice(offset));
  tail[bytes.length - offset] ^= 0x01;
  tail[rate - 1] ^= 0x80;
  for (let lane = 0; lane < rate / 8; lane += 1) {
    state[lane] ^= bytesToLane(tail, lane * 8);
  }
  keccakF1600(state);

  const out = new Uint8Array(32);
  let outOffset = 0;
  let lane = 0;
  while (outOffset < 32) {
    const laneBytes = laneToBytes(state[lane]);
    out.set(laneBytes.slice(0, Math.min(8, 32 - outOffset)), outOffset);
    outOffset += 8;
    lane += 1;
  }
  return out;
}

function compactJson(value: unknown) {
  return JSON.stringify(value);
}

function asHex(bytes: Uint8Array) {
  return `0x${Buffer.from(bytes).toString('hex')}`;
}

function normalizePrivateKey(value: string) {
  const raw = value.trim().replace(/^0x/i, '');
  if (raw.length !== 64) throw new Error('Expected a 32-byte SoDEX private key');
  return raw;
}

function hmacSha256(key: Uint8Array, data: Uint8Array) {
  const hmac = createHmac('sha256', Buffer.from(key));
  hmac.update(Buffer.from(data));
  return Uint8Array.from(hmac.digest());
}

function deterministicK(hash: Uint8Array, privateKey: bigint) {
  let v = new Uint8Array(32).fill(1);
  let k = new Uint8Array(32).fill(0);
  const x = bigIntToBytes(privateKey, 32);
  k = hmacSha256(k, concatBytes(v, new Uint8Array([0]), x, hash));
  v = hmacSha256(k, v);
  k = hmacSha256(k, concatBytes(v, new Uint8Array([1]), x, hash));
  v = hmacSha256(k, v);
  while (true) {
    v = hmacSha256(k, v);
    const candidate = bytesToBigInt(v);
    if (candidate > 0n && candidate < CURVE_N) return candidate;
    k = hmacSha256(k, concatBytes(v, new Uint8Array([0])));
    v = hmacSha256(k, v);
  }
}

function signDigestHex(privateKeyHex: string, digestHex: string) {
  const privateKey = BigInt(`0x${normalizePrivateKey(privateKeyHex)}`);
  const digestBytes = Uint8Array.from(Buffer.from(digestHex.replace(/^0x/i, ''), 'hex'));
  const z = bytesToBigInt(digestBytes);
  let k = deterministicK(digestBytes, privateKey);
  while (true) {
    const point = scalarMultiply(k);
    if (!point) {
      k = mod(k + 1n, CURVE_N);
      continue;
    }
    const r = mod(point.x, CURVE_N);
    if (!r) {
      k = mod(k + 1n, CURVE_N);
      continue;
    }
    let s = mod(modInv(k, CURVE_N) * (z + r * privateKey), CURVE_N);
    if (!s) {
      k = mod(k + 1n, CURVE_N);
      continue;
    }
    let v = Number(point.y & 1n) + 27;
    if (s > CURVE_N / 2n) {
      s = CURVE_N - s;
      v = v === 27 ? 28 : 27;
    }
    return `0x01${r.toString(16).padStart(64, '0')}${s.toString(16).padStart(64, '0')}${v.toString(16).padStart(2, '0')}`;
  }
}

function encodeUint(value: bigint | number) {
  return bigIntToBytes(BigInt(value), 32);
}

function addressBytes32(address: string) {
  const raw = address.trim().toLowerCase().replace(/^0x/, '');
  if (raw.length !== 40) throw new Error('Expected a valid 20-byte address');
  return bigIntToBytes(BigInt(`0x${raw}`), 32);
}

function domainHash(domain: { name: string; version: string; chainId: number; verifyingContract: string }) {
  const typeHash = keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)');
  return keccak256(concatBytes(
    typeHash,
    keccak256(domain.name),
    keccak256(domain.version),
    encodeUint(domain.chainId),
    addressBytes32(domain.verifyingContract)
  ));
}

function exchangeActionHash(payloadHashHex: string, nonce: number) {
  const typeHash = keccak256('ExchangeAction(bytes32 payloadHash,uint64 nonce)');
  const payloadHash = Uint8Array.from(Buffer.from(payloadHashHex.replace(/^0x/i, ''), 'hex'));
  return keccak256(concatBytes(typeHash, payloadHash, encodeUint(nonce)));
}

function exchangeActionDigest(domain: { name: string; version: string; chainId: number; verifyingContract: string }, payloadHashHex: string, nonce: number) {
  return asHex(keccak256(concatBytes(
    Uint8Array.from([0x19, 0x01]),
    domainHash(domain),
    exchangeActionHash(payloadHashHex, nonce)
  )));
}

function compactPayloadHash(actionType: string, params: AnyRecord) {
  return asHex(keccak256(compactJson({ type: actionType, params })));
}

function toSideCode(side: 'BUY' | 'SELL') {
  return side === 'BUY' ? 1 : 2;
}

function toDisplayNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildSpotBatchParams(input: SpotOrderInput, symbolID: number) {
  const order: AnyRecord = {
    clOrdID: input.clientOrderId || `launch-${randomUUID().slice(0, 8)}`,
    modifier: 1,
    side: toSideCode(input.side),
    type: input.type === 'MARKET' ? 1 : 2,
    timeInForce: input.timeInForce ?? 3
  };
  if (input.price) order.price = String(input.price);
  if (input.quantity) order.quantity = String(input.quantity);
  if (input.funds) order.funds = String(input.funds);
  order.reduceOnly = Boolean(input.reduceOnly);
  order.positionSide = 1;
  return {
    accountID: Number(input.accountID),
    symbolID,
    orders: [order]
  };
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers || {})
    },
    cache: 'no-store'
  });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    throw new Error(typeof data === 'string' ? data : JSON.stringify(data).slice(0, 300));
  }
  return data;
}

function unwrap(payload: any) {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

export async function getSpotSymbolMeta(symbol: string) {
  const payload = await fetchJson(`${SODEX_SPOT_ENDPOINT}/markets/symbols?symbol=${encodeURIComponent(symbol)}`);
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const match = rows.find((row: AnyRecord) => row.name === symbol || row.displayName === symbol) || rows[0];
  if (!match) throw new Error(`Symbol ${symbol} not found on SoDEX`);
  return match;
}

export function buildSpotTypedData(payloadHash: string, nonce: number) {
  return {
    domain: {
      name: 'spot',
      version: '1',
      chainId: SODEX_CHAIN_ID,
      verifyingContract: SODEX_VERIFYING_CONTRACT
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      ExchangeAction: [
        { name: 'payloadHash', type: 'bytes32' },
        { name: 'nonce', type: 'uint64' }
      ]
    },
    primaryType: 'ExchangeAction',
    message: {
      payloadHash,
      nonce
    }
  };
}

export async function prepareSpotOrder(input: SpotOrderInput) {
  if (!input.walletAddress) throw new Error('walletAddress is required');
  if (!input.accountID && input.accountID !== 0) throw new Error('accountID is required');
  if (!input.symbol) throw new Error('symbol is required');
  if (!input.quantity && !input.funds) throw new Error('quantity or funds is required');
  if (input.type === 'LIMIT' && !input.price) throw new Error('price is required for limit orders');

  const meta = await getSpotSymbolMeta(input.symbol);
  const params = buildSpotBatchParams(input, Number(meta.id));
  const payloadHash = compactPayloadHash('newOrder', params);
  const nonce = Date.now();
  const typedData = buildSpotTypedData(payloadHash, nonce);

  return {
    venue: 'spot' as const,
    path: '/trade/orders/batch' as const,
    actionType: 'newOrder' as const,
    params,
    payloadHash,
    nonce,
    typedData,
    apiKeyName: SODEX_API_KEY_NAME,
    apiPublicKey: SODEX_API_PUBLIC_KEY,
    chainId: SODEX_CHAIN_ID,
    walletAddress: input.walletAddress,
    accountID: Number(input.accountID),
    symbol: input.symbol,
    symbolID: Number(meta.id)
  };
}

export function signPreparedSpotOrder(prepared: PreparedSpotOrder) {
  if (!SODEX_API_PRIVATE_KEY) throw new Error('SODEX_API_PRIVATE_KEY is not configured');
  const digest = exchangeActionDigest({
    name: 'spot',
    version: '1',
    chainId: SODEX_CHAIN_ID,
    verifyingContract: SODEX_VERIFYING_CONTRACT
  }, prepared.payloadHash, prepared.nonce);
  return signDigestHex(SODEX_API_PRIVATE_KEY, digest);
}

export async function submitSignedSpotOrder(prepared: PreparedSpotOrder, signature: string) {
  if (!SODEX_API_KEY_NAME) throw new Error('SODEX_API_KEY_NAME is not configured');
  const result = await fetchJson(`${SODEX_SPOT_ENDPOINT}${prepared.path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': SODEX_API_KEY_NAME,
      'X-API-Sign': signature,
      'X-API-Nonce': String(prepared.nonce)
    },
    body: compactJson(prepared.params)
  });
  return result;
}

export async function executeServerSignedSpotOrder(input: SpotOrderInput) {
  const prepared = await prepareSpotOrder(input);
  const signature = signPreparedSpotOrder(prepared);
  const result = await submitSignedSpotOrder(prepared, signature);
  return { prepared, signature, result };
}

export async function getPortfolioLive(address: string, accountID?: string, symbol?: string) {
  if (!address) throw new Error('address is required');
  const accountQuery = accountID ? `?accountID=${encodeURIComponent(accountID)}` : '';
  const symbolBits = new URLSearchParams();
  if (symbol) symbolBits.set('symbol', symbol);
  if (accountID) symbolBits.set('accountID', accountID);
  const symbolQuery = symbolBits.toString() ? `?${symbolBits.toString()}` : '';

  const [balancesRaw, stateRaw, ordersRaw, historyRaw, tradesRaw, feeRateRaw, apiKeysRaw] = await Promise.all([
    fetchJson(`${SODEX_SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/balances${accountQuery}`).catch(() => ({ data: [] })),
    fetchJson(`${SODEX_SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/state${accountQuery}`).catch(() => ({ data: null })),
    fetchJson(`${SODEX_SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/orders${symbolQuery}`).catch(() => ({ data: { orders: [] } })),
    fetchJson(`${SODEX_SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/orders/history${symbolQuery}`).catch(() => ({ data: [] })),
    fetchJson(`${SODEX_SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/trades${symbolQuery}`).catch(() => ({ data: [] })),
    fetchJson(`${SODEX_SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/fee-rate${symbolQuery}`).catch(() => ({ data: null })),
    fetchJson(`${SODEX_SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/api-keys${accountQuery}`).catch(() => ({ data: [] }))
  ]);

  const state = unwrap(stateRaw) || {};
  const balances = (Array.isArray(unwrap(balancesRaw)) ? unwrap(balancesRaw) : []).map((row: AnyRecord) => ({
    coin: row.coin || row.asset || row.symbol || row.name || 'UNKNOWN',
    total: toDisplayNumber(row.total ?? row.balance ?? row.available),
    available: toDisplayNumber(row.available ?? row.free ?? row.balance),
    locked: toDisplayNumber(row.locked ?? row.freeze ?? row.hold)
  }));
  const orders = Array.isArray(unwrap(ordersRaw)?.orders) ? unwrap(ordersRaw).orders : [];
  const history = Array.isArray(unwrap(historyRaw)) ? unwrap(historyRaw) : [];
  const trades = Array.isArray(unwrap(tradesRaw)) ? unwrap(tradesRaw) : [];

  return {
    address,
    requestedAccountID: accountID || '',
    state: {
      user: state.user || '',
      aid: Number(state.aid || 0),
      uid: Number(state.uid || 0),
      balancesRaw: Array.isArray(state.B) ? state.B : [],
      openOrdersRaw: Array.isArray(state.O) ? state.O : []
    },
    balances,
    openOrders: orders,
    orderHistory: history.slice(0, 20),
    trades: trades.slice(0, 20),
    feeRate: unwrap(feeRateRaw),
    apiKeys: Array.isArray(unwrap(apiKeysRaw)) ? unwrap(apiKeysRaw) : [],
    accountReady: Number(state.aid || 0) > 0 && String(state.user || '').toLowerCase() !== SODEX_VERIFYING_CONTRACT,
    serverSignerLoaded: Boolean(SODEX_API_PRIVATE_KEY && SODEX_API_KEY_NAME)
  };
}

export function sodexRuntimeStatus() {
  return {
    spotEndpoint: SODEX_SPOT_ENDPOINT,
    perpsEndpoint: SODEX_PERPS_ENDPOINT,
    chainId: SODEX_CHAIN_ID,
    hasApiKeyName: Boolean(SODEX_API_KEY_NAME),
    hasApiPublicKey: Boolean(SODEX_API_PUBLIC_KEY),
    hasApiPrivateKey: Boolean(SODEX_API_PRIVATE_KEY),
    apiPublicKey: SODEX_API_PUBLIC_KEY
  };
}
