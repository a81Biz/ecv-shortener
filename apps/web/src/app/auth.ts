export const isLocalHost =
  /^(127\.0\.0\.1|localhost|.+\.localhost)$/.test(location.hostname);

const KEY = 'devAccessEmail';

export function getDevEmail(): string | null {
  const v = localStorage.getItem(KEY);
  return v && v.trim() ? v.trim() : null;
}
export function setDevEmail(email: string) {
  localStorage.setItem(KEY, email.trim());
}
export function clearDevEmail() {
  localStorage.removeItem(KEY);
}

/** Devuelve un next seguro (nunca dev-login) y limitado a rutas /admin/... */
export function safeNextFromLocation(): string {
  const path = location.pathname + location.search;
  if (!path.startsWith('/admin/') || path.startsWith('/admin/dev-login')) {
    return '/admin/links';
  }
  return path;
}

/** Normaliza el parámetro next que llega por query */
export function normalizeNextParam(raw: string | null): string {
  if (!raw) return '/admin/links';
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
  if (!decoded.startsWith('/admin/') || decoded.startsWith('/admin/dev-login')) {
    return '/admin/links';
  }
  return decoded;
}

