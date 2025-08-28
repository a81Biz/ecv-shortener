import { Env } from '../../core/env';
import { json } from '../../core/response';
import { requireAccess } from '../../core/security/access';
import { GetLink, UpdateLink, toDTO } from '../../../packages/domain/src';
import { KvLinkRepository } from '../../infra/kv/KvLinkRepository';
import { DeleteLink } from '../../../packages/domain/src';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params as { slug: string };
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await GetLink(repo, slug);
  if (!link) return new Response('Not Found', { status: 404 });
  return json({ link: toDTO(link) });
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params as { slug: string };
  const body = await ctx.request.json();
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await UpdateLink(repo, { slug, targetUrl: body.targetUrl, tags: body.tags });
  return json({ ok: true, link: toDTO(link) });
};


export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  try {
    requireAccess(ctx.request); // si esto hace throw, lo capturamos abajo
    const { slug } = ctx.params as { slug: string };
    const repo = new KvLinkRepository(ctx.env.LINKS);
    const { deleted } = await DeleteLink(repo, slug);
    if (!deleted) return json({ ok:false, error:'Not found', slug }, 404);
    return json({ ok:true, deleted:true, slug });
  } catch (err:any) {
    // Nunca dejamos que Miniflare pinte su "pretty error"
    const msg = err?.message || 'Unexpected error';
    const code = msg.includes('Unauthorized') ? 401 : 500;
    return json({ ok:false, error: msg }, code);
  }
};
