import type { Env } from '../env';
import jwt from '@tsndr/cloudflare-worker-jwt';

function isTrue(v: unknown) {
  return v === true || v === 'true' || v === '1';
}

function isLocalHost(host: string) {
  return host.includes('localhost');
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
  const token = req.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;

  try {
    // La librería decodifica el token sin necesidad de verificar la firma,
    // ya que confiamos en que Cloudflare ya lo ha hecho.
    const decoded = jwt.decode(token);
    return decoded.payload.email || null;
  } catch (e) {
    console.error('Error al decodificar JWT:', e);
    return null;
  }
}

/**
 * Requiere autenticación:
 * - Producción: SOLO acepta Cloudflare Access (cabecera Cf-Access-Authenticated-User-Email).
 * - Local: si DEV_LOGIN_ENABLED=true y host es localhost/admin.localhost:
 *     - si viene cabecera Cf-Access-Authenticated-User-Email => OK (simulación local)
 *     - si NO viene => lanza 401 con mensaje "DEV_LOGIN_REQUIRED" (el front redirige a /admin/dev-login)
 * - En cualquier otro caso => 401 "UNAUTHORIZED"
 *
 * @returns email autenticado (string)
 * @throws HttpError 401
 */
export function requireAccess(req: Request, env: Env): string {
  const url = new URL(req.url);
  const host = url.host;
  const email = getAccessEmail(req);

  // 1) Si ya viene por Access (o simulación) => OK
  if (email) return email;

  // 2) Local con dev-login habilitado explícitamente
  const devEnabled = isTrue((env as any).DEV_LOGIN_ENABLED);
  if (devEnabled && isLocalHost(host)) {
    // No hay header => pedimos dev-login en el cliente
    throw new HttpError(401, 'DEV_LOGIN_REQUIRED');
  }

  // 3) Producción (o local sin dev-login) sin header => no autorizado
  throw new HttpError(401, 'UNAUTHORIZED');
}
