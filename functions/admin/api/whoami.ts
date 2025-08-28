import { Env } from '../../core/env';
import { json } from '../../core/response';
import { requireAccess, HttpError } from '../../core/security/access';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const email = requireAccess(ctx.request, ctx.env);;
    // if (!email) return new Response('Unauthorized', { status: 401 });
    return json({ ok:true, email });
    
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    const msg    = e?.message || 'Unexpected error';
    return json({ ok: false, error: msg }, status);
  }
};
