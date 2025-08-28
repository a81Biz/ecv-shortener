import { Env } from '../../../core/env';
import { json } from '../../../core/response';
import { requireAccess, HttpError  } from '../../../core/security/access';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {

  try {

    requireAccess(ctx.request, ctx.env);
  
    let deleted = 0;
    let cursor: string | undefined = undefined;
  
    do {
      const page: { keys: KVNamespaceListResult<string>["keys"]; list_complete: boolean; cursor?: string } =
        await ctx.env.LINKS.list({ cursor });
      for (const k of page.keys) {
        await ctx.env.LINKS.delete(k.name);
        deleted++;
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  
    return json({ ok: true, deleted });
    
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    const msg    = e?.message || 'Unexpected error';
    return json({ ok: false, error: msg }, status);
  }

};
