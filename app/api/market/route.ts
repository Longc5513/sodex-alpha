import { NextResponse } from 'next/server';
import { getMarket, sodexRuntimeStatus } from '../../../lib/market';
import { sosovalueRuntimeStatus } from '../../../lib/sosovalue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const assets = await getMarket();
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    runtime: {
      sodex: sodexRuntimeStatus(),
      sosovalue: sosovalueRuntimeStatus()
    },
    assets
  });
}
