import { NextRequest, NextResponse } from 'next/server';
import { executeServerSignedSpotOrder, sodexRuntimeStatus, type SpotOrderInput } from '../../../../lib/sodex';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SpotOrderInput;
    const response = await executeServerSignedSpotOrder(body);
    return NextResponse.json({
      ok: true,
      runtime: sodexRuntimeStatus(),
      ...response
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      runtime: sodexRuntimeStatus(),
      error: error?.message || 'Failed to execute server-signed order'
    }, { status: 400 });
  }
}
