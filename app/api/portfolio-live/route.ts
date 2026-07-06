import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioLive, sodexRuntimeStatus } from '../../../lib/sodex';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address') || '';
  const accountID = url.searchParams.get('accountID') || '';
  const symbol = url.searchParams.get('symbol') || '';

  if (!address) {
    return NextResponse.json({
      ok: false,
      error: 'address is required',
      runtime: sodexRuntimeStatus()
    }, { status: 400 });
  }

  try {
    const data = await getPortfolioLive(address, accountID, symbol);
    return NextResponse.json({
      ok: true,
      runtime: sodexRuntimeStatus(),
      updatedAt: new Date().toISOString(),
      data
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      runtime: sodexRuntimeStatus(),
      error: error?.message || 'Failed to read SoDEX live portfolio'
    }, { status: 500 });
  }
}
