import { SOSOVALUE_CONSOLE_URL, SOSOVALUE_DOCS_URL } from './sosovalue-meta';

export { SOSOVALUE_PRESETS } from './sosovalue-meta';

type AnyRecord = Record<string, any>;

function trimSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function sosovalueBaseUrl() {
  return trimSlash(process.env.SOSOVALUE_API_BASE_URL || '');
}

export function sosovalueRuntimeStatus() {
  return {
    baseUrl: sosovalueBaseUrl(),
    hasApiKey: Boolean(process.env.SOSOVALUE_API_KEY),
    hasBaseUrl: Boolean(sosovalueBaseUrl()),
    consoleUrl: SOSOVALUE_CONSOLE_URL,
    docsUrl: SOSOVALUE_DOCS_URL
  };
}

export function expandPresetPath(path: string, params: AnyRecord = {}) {
  return path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const raw = params[key];
    return encodeURIComponent(raw === undefined || raw === null ? '' : String(raw));
  });
}

export function buildSosoUrl(path: string, params: AnyRecord = {}) {
  const baseUrl = sosovalueBaseUrl();
  if (!baseUrl) {
    throw new Error('SOSOVALUE_API_BASE_URL is not configured');
  }
  const expanded = expandPresetPath(path, params);
  const url = new URL(expanded.startsWith('/') ? expanded : `/${expanded}`, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (expanded.includes(`{${key}}`)) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function unwrapEnvelope(payload: any) {
  if (payload && typeof payload === 'object') {
    if ('data' in payload) return payload.data;
    if ('result' in payload) return payload.result;
    if ('rows' in payload) return payload.rows;
    if ('list' in payload) return payload.list;
  }
  return payload;
}

export function previewPayload(payload: any, limit = 240) {
  const unwrapped = unwrapEnvelope(payload);
  if (Array.isArray(unwrapped)) return JSON.stringify(unwrapped.slice(0, 2)).slice(0, limit);
  if (typeof unwrapped === 'object' && unwrapped !== null) return JSON.stringify(unwrapped).slice(0, limit);
  return String(unwrapped).slice(0, limit);
}

export async function requestSosovalue(path: string, params: AnyRecord = {}) {
  const url = buildSosoUrl(path, params);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.SOSOVALUE_API_KEY) {
    headers['X-API-Key'] = process.env.SOSOVALUE_API_KEY;
  }
  const res = await fetch(url, { headers, cache: 'no-store' });
  const text = await res.text();
  let payload: any = text;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }
  if (!res.ok) {
    throw new Error(`SoSoValue ${res.status} ${url}`);
  }
  return {
    url,
    raw: payload,
    data: unwrapEnvelope(payload)
  };
}

export async function probeSosovalue(path: string, params: AnyRecord = {}) {
  const started = performance.now();
  try {
    const result = await requestSosovalue(path, params);
    return {
      ok: true,
      ms: Math.round(performance.now() - started),
      path,
      url: result.url,
      preview: previewPayload(result.raw),
      data: result.data
    };
  } catch (error: any) {
    return {
      ok: false,
      ms: Math.round(performance.now() - started),
      path,
      url: sosovalueBaseUrl() ? buildSosoUrl(path, params) : '',
      preview: error?.message || 'request failed',
      data: null
    };
  }
}
