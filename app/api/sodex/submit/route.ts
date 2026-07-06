import { NextRequest, NextResponse } from 'next/server';
import { submitSignedSpotOrder, sodexRuntimeStatus, type PreparedSpotOrder } from '../../../../lib/sodex';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { prepared: PreparedSpotOrder; signature: string };
    if (!body?.prepared || !body?.signature) {
      throw new Error('prepared payload and signature are required');
    }
    const result = await submitSignedSpotOrder(body.prepared, body.signature);
    return NextResponse.json({
      ok: true,
      runtime: sodexRuntimeStatus(),
      result
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      runtime: sodexRuntimeStatus(),
      error: error?.message || 'Failed to submit signed order'
    }, { status: 400 });
  }
}
