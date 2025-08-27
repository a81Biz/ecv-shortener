import { Env } from '../../core/env';
import { json } from '../../core/response';
import { GetLink, toDTO } from '../../../packages/domain/src';
import { KvLinkRepository } from '../../infra/kv/KvLinkRepository';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { slug } = ctx.params as { slug: string };
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await GetLink(repo, slug);
  if (!link) return new Response('Not Found', { status: 404 });
  return json({ link: toDTO(link) });
};
