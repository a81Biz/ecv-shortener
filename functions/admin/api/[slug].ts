import { Env } from '../../core/env';
import { json } from '../../core/response';
import { requireAccess } from '../../core/security/access';
import { GetLink, UpdateLink, toDTO } from '../../../packages/domain/src';
import { KvLinkRepository } from '../../infra/kv/KvLinkRepository';

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
