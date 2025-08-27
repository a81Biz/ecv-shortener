import { Env } from '../../core/env';
import { json } from '../../core/response';
import { requireAccess } from '../../core/security/access';
import { CreateLink, toDTO } from '../../../packages/domain/src';
import { KvLinkRepository } from '../../infra/kv/KvLinkRepository';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const email = requireAccess(ctx.request);
  const body = await ctx.request.json();
  const repo = new KvLinkRepository(ctx.env.LINKS);
  try {
    const link = await CreateLink(repo, {
      slug: body.slug,
      targetUrl: body.targetUrl,
      tags: body.tags,
      createdBy: email,
    });
    const short = `https://${ctx.env.PUBLIC_HOST}/${link.props.slug}`;
    return json({ ok: true, short, link: toDTO(link) });
  } catch (e: any) {
    if (e instanceof Error && e.message === 'Slug already exists') {
      return json({ ok: false, error: 'SLUG_EXISTS', message: 'El slug ya existe' }, { status: 409 });
    }
    throw e;
  }
};
