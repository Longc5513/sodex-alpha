import { NextRequest, NextResponse } from 'next/server';
import { getMarket, getMarketDetail, sodexRuntimeStatus } from '../../../lib/market';
import { sosovalueRuntimeStatus } from '../../../lib/sosovalue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') || '').toUpperCase();

  if (symbol) {
    const detail = await getMarketDetail(symbol);
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      runtime: {
        sodex: sodexRuntimeStatus(),
        sosovalue: sosovalueRuntimeStatus()
      },
      detail
    });
  }

  const market = await getMarket();
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    runtime: {
      sodex: sodexRuntimeStatus(),
      sosovalue: sosovalueRuntimeStatus()
    },
    assets: market.assets,
    overview: market.overview
  });
}
