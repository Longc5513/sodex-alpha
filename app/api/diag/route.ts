import { NextRequest, NextResponse } from 'next/server';
import { getMarket, sodexRuntimeStatus } from '../../../lib/market';
import { groqRuntimeStatus } from '../../../lib/groq';
import { SOSOVALUE_PRESETS, sosovalueRuntimeStatus } from '../../../lib/sosovalue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SPOT_ENDPOINT = process.env.SODEX_SPOT_ENDPOINT || 'https://mainnet-gw.sodex.dev/api/v1/spot';
const SODEX_SAMPLE_SYMBOL = process.env.SODEX_SAMPLE_SYMBOL || 'vBTC_vUSDC';

async function probeJson(name: string, url: string) {
  const start = performance.now();
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    const text = await res.text();
    return {
      name,
      ok: res.ok,
      status: res.status,
      ms: Math.round(performance.now() - start),
      url,
      preview: text.slice(0, 180)
    };
  } catch (error: any) {
    return {
      name,
      ok: false,
      status: 0,
      ms: Math.round(performance.now() - start),
      url,
      preview: error?.message || 'request failed'
    };
  }
}

function walletMissingProbe(name: string) {
  return {
    name,
    ok: false,
    status: 0,
    ms: 0,
    url: '',
    preview: 'wallet not connected'
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address') || '';
  const accountID = url.searchParams.get('accountID') || '';
  const symbol = url.searchParams.get('symbol') || SODEX_SAMPLE_SYMBOL;

  const accountQuery = accountID ? `?accountID=${encodeURIComponent(accountID)}` : '';
  const symbolQuery = accountID && symbol ? `?accountID=${encodeURIComponent(accountID)}&symbol=${encodeURIComponent(symbol)}` : symbol ? `?symbol=${encodeURIComponent(symbol)}` : accountQuery;

  const [probes, market] = await Promise.all([
    Promise.all([
    probeJson('Spot tickers', `${SPOT_ENDPOINT}/markets/tickers`),
    probeJson('Spot book tickers', `${SPOT_ENDPOINT}/markets/bookTickers`),
    probeJson(`Spot orderbook ${symbol}`, `${SPOT_ENDPOINT}/markets/${encodeURIComponent(symbol)}/orderbook?limit=25`),
    probeJson(`Spot trades ${symbol}`, `${SPOT_ENDPOINT}/markets/${encodeURIComponent(symbol)}/trades?limit=25`),
    probeJson('SoSoValue explorer', `${url.origin}/api/sosovalue?path=%2Fcurrencies%2F%7Bcurrency_id%7D%2Fmarket-snapshot&params=${encodeURIComponent(JSON.stringify({ currency_id: '1673723677362319866' }))}&preset=currency-snapshot`),
    address ? probeJson(`Balances ${address}`, `${SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/balances${accountQuery}`) : Promise.resolve(walletMissingProbe('Balances')),
    address ? probeJson(`Orders ${address}`, `${SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/orders${symbolQuery}`) : Promise.resolve(walletMissingProbe('Orders')),
    address ? probeJson(`State ${address}`, `${SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/state${accountQuery}`) : Promise.resolve(walletMissingProbe('State')),
    address ? probeJson(`Fee rate ${address}`, `${SPOT_ENDPOINT}/accounts/${encodeURIComponent(address)}/fee-rate${symbol ? `?symbol=${encodeURIComponent(symbol)}` : ''}${accountID ? `${symbol ? '&' : '?'}accountID=${encodeURIComponent(accountID)}` : ''}`) : Promise.resolve(walletMissingProbe('Fee rate'))
  ]),
    getMarket().catch(() => null)
  ]);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    runtime: sodexRuntimeStatus(),
    groq: groqRuntimeStatus(),
    marketOverview: market?.overview || null,
    sosovalue: {
      ...sosovalueRuntimeStatus(),
      presets: SOSOVALUE_PRESETS.slice(0, 6),
      marketNote: 'Use the explorer to probe docs-aligned SoSoValue paths and keep research visible in the demo.'
    },
    probes
  });
}
