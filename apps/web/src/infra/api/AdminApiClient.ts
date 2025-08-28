import { getDevEmail, isLocalHost, safeNextFromLocation } from '../../app/auth';

export type LinkDTO = {
  slug: string; targetUrl: string; active: boolean;
  createdBy: string; createdAt: string; updatedAt: string;
  clickCount: number; tags: string[];
};
type ListResponse = { items: LinkDTO[]; nextCursor?: string };

function devHeaders(): HeadersInit {
  if (!isLocalHost) return {};
  const email = getDevEmail();
  return email ? { 'Cf-Access-Authenticated-User-Email': email } : {};
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/admin/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...devHeaders(), ...(init.headers || {}) },
    credentials: 'same-origin',
  });
  if (res.status === 401) {
    if (!location.pathname.startsWith('/admin/dev-login')) {
      const next = encodeURIComponent(safeNextFromLocation());
      location.replace(`/admin/dev-login?next=${next}`);
    }
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const AdminApi = {
  whoami() { return apiFetch<{ email: string }>(`/whoami`); },
  list(params: { search?: string; owner?: string; active?: boolean }) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.owner) sp.set('owner', params.owner);
    if (params.active !== undefined) sp.set('active', String(params.active));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiFetch<ListResponse>(`/links${qs}`);
  },
  get(slug: string) { return apiFetch<{ link: LinkDTO }>(`/${slug}`); },
  create(body: { slug?: string; targetUrl: string; tags?: string[] }) {
    return apiFetch<{ ok: true; link: LinkDTO; short: string }>(`/create`, {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  update(slug: string, body: { targetUrl: string; tags?: string[] }) {
    return apiFetch<{ ok: true; link: LinkDTO }>(`/${slug}`, {
      method: 'PUT', body: JSON.stringify(body),
    });
  },
  toggle(slug: string, active: boolean) {
    return apiFetch<{ ok: true; link: LinkDTO }>(`/${slug}/state`, {
      method: 'PATCH', body: JSON.stringify({ active }),
    });
  },remove(slug: string) {
    return apiFetch<{ ok: true; deleted: true; slug: string }>(`/${slug}`, {
      method: 'DELETE',
    });
  },
    flushAll() {
    return apiFetch<{ ok: true; deleted: number }>(`/admin/flush`, {
      method: 'POST'
    });
  },
    async qrSvg(slug: string): Promise<string> {
    const res = await fetch(`/admin/qr/${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: { 'accept': 'image/svg+xml' },
      });
      if (!res.ok) throw new Error(`QR fetch failed: ${res.status}`);
      return res.text();
    }
};
