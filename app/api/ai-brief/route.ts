import { NextRequest, NextResponse } from 'next/server';
import { generateGroqBrief, groqRuntimeStatus } from '../../../lib/groq';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await generateGroqBrief(body || {});
    return NextResponse.json({
      ok: result.ok,
      runtime: groqRuntimeStatus(),
      ...result
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      runtime: groqRuntimeStatus(),
      error: error?.message || 'Groq request failed'
    }, { status: 500 });
  }
}
