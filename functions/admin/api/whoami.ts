import { Env } from '../../core/env';
import { json } from '../../core/response';
import { checkAccess, HttpError } from '../../core/security/access';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const { email, devRequired } = checkAccess(ctx.request, ctx.env);

    // 1) Identificado (JWT prod o header local) -> OK
    if (email) return json({ ok: true, email });

    // 2) Solo en local + dev-login habilitado -> pedir dev-login
    if (devRequired) return json({ ok: false, error: 'DEV_LOGIN_REQUIRED' }, 401);

    // 3) Producción (o cualquier otro caso) -> 401 estándar
    return json({ ok: false, error: 'UNAUTHORIZED' }, 401);
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    return json({ ok: false, error: e?.message || 'Unexpected error' }, status);
  }
};