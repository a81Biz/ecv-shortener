import type { Env } from '../env';
import jwt from '@tsndr/cloudflare-worker-jwt';

function isTrue(v: unknown) {
  return v === true || v === 'true' || v === '1';
}

export function isLocalHost(host: string): boolean {
  return (
    host === 'localhost' ||
    /^.+\.localhost$/.test(host) ||
    /^127(?:\.\d{1,3}){3}$/.test(host) ||
    host === '0.0.0.0'
  );
}


/**
 * Error HTTP con status para atraparlo en los handlers y responder JSON
 */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Devuelve el email autenticado si viene desde Cloudflare Access.
 * En producción, esta cabecera debe existir siempre.
 */
export function getAccessEmail(req: Request): string | null {
  const jwtToken = req.headers.get('Cf-Access-Jwt-Assertion');
  if (jwtToken) {
    try {
      const decoded = jwt.decode(jwtToken);
      return decoded?.payload?.email ?? null;
    } catch { /* ignore y cae a fallback dev */ }
  }
  return (
    req.headers.get('Cf-Access-Authenticated-User-Email') ||
    req.headers.get('X-Dev-Email')
  );
}
function devLoginFlowEnabled(req: Request, env: Env): boolean {
  const host = new URL(req.url).host;
  const devEnabled = String((env as any).DEV_LOGIN_ENABLED || '').toLowerCase() === 'true';
  return devEnabled && isLocalHost(host);
}

// Versión blanda: no lanza; solo informa estado actual
export function checkAccess(req: Request, env: Env):
  { email?: string, devRequired?: boolean } {
  const email = getAccessEmail(req);
  if (email) return { email };
  if (devLoginFlowEnabled(req, env)) return { devRequired: true };
  return {};
}

// Versión estricta para endpoints realmente protegidos
export function requireAccess(req: Request, env: Env): string {
  const { email, devRequired } = checkAccess(req, env);
  if (email) return email;
  if (devRequired) throw new HttpError(401, 'DEV_LOGIN_REQUIRED'); // SOLO local
  throw new HttpError(401, 'UNAUTHORIZED'); // Producción u otros casos
}
