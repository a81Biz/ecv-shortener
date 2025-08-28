export function isLocalHost(): boolean {
  // Evita crashear en SSR / prerender
  if (typeof location === 'undefined') return false;

  const host = location.hostname;
  // localhost y subdominios (admin.localhost, ui.localhost, etc.)
  if (/^(localhost|.+\.localhost)$/.test(host)) return true;

  // 127.0.0.1, 127.0.1.1, 127.*.*.*
  if (/^127(?:\.\d{1,3}){3}$/.test(host)) return true;

  // (Opcional) 0.0.0.0 en algunos entornos
  if (host === '0.0.0.0') return true;

  return false;
}

const KEY = 'devAccessEmail';

export function getDevEmail(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  const v = raw && raw.trim();
  return v ? v : null;
}

export function setDevEmail(email: string) {
  if (typeof localStorage === 'undefined') return;
  const v = (email || '').trim();
  if (v) localStorage.setItem(KEY, v);
  else localStorage.removeItem(KEY);
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

