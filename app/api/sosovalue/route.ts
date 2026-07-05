import { NextRequest, NextResponse } from 'next/server';
import { probeSosovalue, sosovalueRuntimeStatus, SOSOVALUE_PRESETS } from '../../../lib/sosovalue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  const preset = url.searchParams.get('preset') || '';
  const paramsText = url.searchParams.get('params') || '{}';
  const params = (() => {
    try {
      return paramsText ? JSON.parse(paramsText) : {};
    } catch {
      return {};
    }
  })();
  const resolvedPath = path || SOSOVALUE_PRESETS.find((item) => item.key === preset)?.path || '';

  if (!resolvedPath) {
    return NextResponse.json({
      ok: false,
      error: 'path is required',
      runtime: sosovalueRuntimeStatus(),
      presets: SOSOVALUE_PRESETS
    }, { status: 400 });
  }

  const result = await probeSosovalue(resolvedPath, params);
  return NextResponse.json({
    ok: result.ok,
    runtime: sosovalueRuntimeStatus(),
    preset,
    path: resolvedPath,
    params,
    result
  });
}
