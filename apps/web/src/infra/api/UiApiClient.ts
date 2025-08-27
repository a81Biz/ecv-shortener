export type LinkDTO = {
  slug: string; targetUrl: string; active: boolean;
  createdBy: string; createdAt: string; updatedAt: string;
  clickCount: number; tags: string[];
};
type ListResponse = { items: LinkDTO[]; nextCursor?: string };

async function uiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/ui/api${path}`, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`UI API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const UiApi = {
  list(params: { search?: string; active?: boolean } = {}) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.active !== undefined) sp.set('active', String(params.active));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return uiFetch<ListResponse>(`/links${qs}`);
  },
  get(slug: string) {
    return uiFetch<{ link: LinkDTO }>(`/${slug}`);
  },
};
