import { Env } from '../../core/env';
import { json } from '../../core/response';
import { getAuthenticatedEmail } from '../../core/security/access';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const email = getAuthenticatedEmail(ctx.request);
  if (!email) return new Response('Unauthorized', { status: 401 });
  return json({ email });
};
