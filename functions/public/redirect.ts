import { Env } from '../core/env';
import { redirectNoCache, notFound } from '../core/response';
import { KvLinkRepository } from '../infra/kv/KvLinkRepository';

export async function handlePublicRedirect(ctx: EventContext<Env, any, any>, slug: string) {
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await repo.get(slug);
  if (!link || !link.props.active) return notFound();

  await Promise.all([
    repo.incrementClick(slug),
    repo.touchLastAccess(slug, new Date().toISOString()),
  ]);

  return redirectNoCache(link.props.targetUrl, 302);
}
