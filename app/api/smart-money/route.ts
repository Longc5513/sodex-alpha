import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioLive, sodexRuntimeStatus } from '../../../lib/sodex';
import { getMarket } from '../../../lib/market';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AssetLite = {
  symbol: string;
  sodexSymbol?: string;
  pair: string;
  price: number | null;
};

function parseNum(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function assetForSymbol(symbol: string, assets: AssetLite[]) {
  const clean = symbol.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return assets.find((asset) => {
    const variants = [
      asset.symbol,
      asset.sodexSymbol || '',
      asset.pair.replace(/[^A-Z0-9]/gi, '')
    ].map((value) => value.toUpperCase());
    return variants.some((value) => value.includes(clean) || clean.includes(value));
  }) || null;
}

function buildLivePnl(rows: any[], assets: AssetLite[]) {
  const grouped = new Map<string, { qty: number; cost: number; realized: number; trades: number; volume: number }>();
  for (const row of rows || []) {
    const symbol = String(row.symbol || row.s || row.name || '').trim();
    if (!symbol) continue;
    const price = parseNum(row.price || row.p) || 0;
    const quantity = parseNum(row.quantity || row.q || row.size) || 0;
    const sideRaw = String(row.side || row.S || '').toUpperCase();
    const side = sideRaw.includes('SELL') || sideRaw === '2' ? 'SELL' : 'BUY';
    const state = grouped.get(symbol) || { qty: 0, cost: 0, realized: 0, trades: 0, volume: 0 };
    if (side === 'BUY') {
      state.qty += quantity;
      state.cost += quantity * price;
    } else {
      const avgCost = state.qty > 0 ? state.cost / state.qty : price;
      const closedQty = Math.min(state.qty, quantity);
      state.realized += (price - avgCost) * closedQty;
      state.qty -= closedQty;
      state.cost -= avgCost * closedQty;
    }
    state.trades += 1;
    state.volume += quantity * price;
    grouped.set(symbol, state);
  }
  return Array.from(grouped.entries()).map(([symbol, state]) => {
    const asset = assetForSymbol(symbol, assets);
    const mark = asset?.price || 0;
    const avgCost = state.qty > 0 ? state.cost / state.qty : 0;
    const unrealized = state.qty > 0 && mark ? (mark - avgCost) * state.qty : 0;
    return {
      symbol,
      label: asset?.symbol || symbol,
      qty: state.qty,
      avgCost,
      mark,
      realized: state.realized,
      unrealized,
      net: state.realized + unrealized,
      trades: state.trades,
      volume: state.volume
    };
  });
}

function summarizePeer(address: string, live: Awaited<ReturnType<typeof getPortfolioLive>>, assets: AssetLite[]) {
  const pnlRows = buildLivePnl(live.trades || [], assets);
  const pnlTotal = pnlRows.reduce((sum, row) => sum + row.net, 0);
  const recentVolume = pnlRows.reduce((sum, row) => sum + row.volume, 0);
  const recentTrades = Array.isArray(live.trades) ? live.trades : [];
  const symbols = Array.from(new Set(recentTrades.map((row: any) => String(row.symbol || row.s || '').trim()).filter(Boolean)));
  const lastTradeAt = recentTrades.reduce((latest: number, row: any) => Math.max(latest, Number(row.time || row.T || 0) || 0), 0);
  return {
    address,
    aid: live.state.aid,
    uid: live.state.uid,
    accountReady: live.accountReady,
    openOrders: live.openOrders.length,
    balances: live.balances.length,
    trades: recentTrades.length,
    recentVolume,
    pnlTotal,
    symbols: symbols.slice(0, 5),
    lastTradeAt,
    exposure: pnlRows
      .filter((row) => Math.abs(row.qty) > 0 || Math.abs(row.net) > 0.01)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
      .slice(0, 4)
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const peersRaw = url.searchParams.get('peers') || '';
  const userAddress = url.searchParams.get('userAddress') || '';
  const symbol = url.searchParams.get('symbol') || '';
  const peers = peersRaw
    .split(/[,\n\r\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter(isAddress);

  if (!peers.length) {
    return NextResponse.json({
      ok: false,
      runtime: sodexRuntimeStatus(),
      error: 'at least one peer wallet address is required'
    }, { status: 400 });
  }

  try {
    const market = await getMarket();
    const assets = market.assets.map((asset) => ({
      symbol: asset.symbol,
      sodexSymbol: asset.sodexSymbol,
      pair: asset.pair,
      price: asset.price
    }));

    const peerLives = await Promise.all(peers.slice(0, 8).map(async (address) => ({
      address,
      live: await getPortfolioLive(address, '', symbol)
    })));

    const rows = peerLives.map(({ address, live }) => summarizePeer(address, live, assets));
    const sortedByPnl = rows.slice().sort((a, b) => b.pnlTotal - a.pnlTotal);
    const sortedByVolume = rows.slice().sort((a, b) => b.recentVolume - a.recentVolume);

    const consensus = new Map<string, { buyVolume: number; sellVolume: number; traders: number }>();
    for (const { live } of peerLives) {
      const touched = new Set<string>();
      for (const trade of live.trades || []) {
        const symbolKey = String(trade.symbol || trade.s || '').trim();
        if (!symbolKey) continue;
        const price = parseNum(trade.price || trade.p) || 0;
        const quantity = parseNum(trade.quantity || trade.q || trade.size) || 0;
        const sideRaw = String(trade.side || trade.S || '').toUpperCase();
        const notional = price * quantity;
        const state = consensus.get(symbolKey) || { buyVolume: 0, sellVolume: 0, traders: 0 };
        if (!touched.has(symbolKey)) {
          state.traders += 1;
          touched.add(symbolKey);
        }
        if (sideRaw.includes('SELL') || sideRaw === '2') state.sellVolume += notional;
        else state.buyVolume += notional;
        consensus.set(symbolKey, state);
      }
    }

    const consensusRows = Array.from(consensus.entries()).map(([key, state]) => {
      const asset = assetForSymbol(key, assets);
      const net = state.buyVolume - state.sellVolume;
      return {
        symbol: asset?.symbol || key,
        venueSymbol: key,
        traders: state.traders,
        buyVolume: state.buyVolume,
        sellVolume: state.sellVolume,
        totalVolume: state.buyVolume + state.sellVolume,
        bias: Math.abs(net) < (state.buyVolume + state.sellVolume) * 0.08 ? 'MIXED' : net >= 0 ? 'BUY' : 'SELL'
      };
    }).sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 8);

    let user = null as null | {
      address: string;
      pnlTotal: number;
      recentVolume: number;
      pnlRank: number | null;
      volumeRank: number | null;
      pnlVsPeerAvg: number;
      volumeVsPeerAvg: number;
    };

    if (isAddress(userAddress)) {
      const live = await getPortfolioLive(userAddress, '', symbol);
      const summary = summarizePeer(userAddress, live, assets);
      const pnlAvg = rows.reduce((sum, row) => sum + row.pnlTotal, 0) / Math.max(rows.length, 1);
      const volumeAvg = rows.reduce((sum, row) => sum + row.recentVolume, 0) / Math.max(rows.length, 1);
      user = {
        address: userAddress,
        pnlTotal: summary.pnlTotal,
        recentVolume: summary.recentVolume,
        pnlRank: sortedByPnl.findIndex((row) => row.address.toLowerCase() === userAddress.toLowerCase()) >= 0 ? sortedByPnl.findIndex((row) => row.address.toLowerCase() === userAddress.toLowerCase()) + 1 : null,
        volumeRank: sortedByVolume.findIndex((row) => row.address.toLowerCase() === userAddress.toLowerCase()) >= 0 ? sortedByVolume.findIndex((row) => row.address.toLowerCase() === userAddress.toLowerCase()) + 1 : null,
        pnlVsPeerAvg: summary.pnlTotal - pnlAvg,
        volumeVsPeerAvg: summary.recentVolume - volumeAvg
      };
    }

    return NextResponse.json({
      ok: true,
      runtime: sodexRuntimeStatus(),
      updatedAt: new Date().toISOString(),
      data: {
        peers: rows,
        scorecard: {
          peerCount: rows.length,
          avgPnl: rows.reduce((sum, row) => sum + row.pnlTotal, 0) / Math.max(rows.length, 1),
          avgVolume: rows.reduce((sum, row) => sum + row.recentVolume, 0) / Math.max(rows.length, 1),
          bestPnl: sortedByPnl[0]?.pnlTotal || 0,
          topVolume: sortedByVolume[0]?.recentVolume || 0
        },
        consensus: consensusRows,
        user
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      runtime: sodexRuntimeStatus(),
      error: error?.message || 'Failed to build smart money watch'
    }, { status: 500 });
  }
}
