import { NextRequest, NextResponse } from 'next/server';
import { generateGroqBrief, groqRuntimeStatus } from '../../../lib/groq';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const runtime = groqRuntimeStatus();
  if (!runtime.hasApiKey) {
    return NextResponse.json({
      ok: false,
      runtime,
      error: 'GROQ_API_KEY is not configured on the server'
    });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const result = await generateGroqBrief(body || {});
    return NextResponse.json({
      ok: result.ok,
      runtime,
      ...result
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      runtime,
      error: error?.message || 'Groq request failed'
    });
  }
}
