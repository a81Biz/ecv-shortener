import { Env } from '../../core/env';
import { json } from '../../core/response';
import { requireAccess, HttpError } from '../../core/security/access';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const email = requireAccess(ctx.request, ctx.env);;
  if (!email) return new Response('Unauthorized', { status: 401 });
  return json({ email });
};
