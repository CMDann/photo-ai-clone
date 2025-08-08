// Default to same-origin so cookies are first-party via Next.js rewrites.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || data || `Request failed: ${res.status}`);
  return data;
}
