import { Env } from '../../../core/env';
import { json } from '../../../core/response';
import { requireAccess } from '../../../core/security/access';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  requireAccess(ctx.request);

  let deleted = 0;
  let cursor: string | undefined = undefined;

  do {
    const page = await ctx.env.LINKS.list({ cursor });
    for (const k of page.keys) {
      await ctx.env.LINKS.delete(k.name);
      deleted++;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return json({ ok: true, deleted });
};
