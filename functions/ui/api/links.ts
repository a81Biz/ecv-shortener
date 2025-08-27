import { Env } from '../../core/env';
import { json } from '../../core/response';
import { ListLinks, toDTO } from '../../../packages/domain/src';
import { KvLinkRepository } from '../../infra/kv/KvLinkRepository';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const opts = {
    search: url.searchParams.get('search') ?? undefined,
    owner: url.searchParams.get('owner') ?? undefined,
    active: url.searchParams.get('active') ? url.searchParams.get('active') === 'true' : undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  };
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const res = await ListLinks(repo, opts);
  return json({ items: res.items.map(toDTO), nextCursor: res.nextCursor });
};
