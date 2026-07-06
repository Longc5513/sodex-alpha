import { NextRequest, NextResponse } from 'next/server';
import { prepareSpotOrder, sodexRuntimeStatus, type SpotOrderInput } from '../../../../lib/sodex';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SpotOrderInput;
    const prepared = await prepareSpotOrder(body);
    return NextResponse.json({
      ok: true,
      runtime: sodexRuntimeStatus(),
      prepared
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      runtime: sodexRuntimeStatus(),
      error: error?.message || 'Failed to prepare order'
    }, { status: 400 });
  }
}
