import { Env } from '../../../core/env';
import { json } from '../../../core/response';
import { requireAccess } from '../../../core/security/access';
import { ToggleLink, toDTO } from '../../../../packages/domain/src';
import { KvLinkRepository } from '../../../infra/kv/KvLinkRepository';

import { z } from "zod";
const ToggleBody = z.object({ active: z.boolean() });

export const onRequestPatch: PagesFunction<Env> = async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params as { slug: string };
  const body = ToggleBody.parse(await ctx.request.json());
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await ToggleLink(repo, slug, Boolean(body.active));
  return json({ ok: true, link: toDTO(link) });
};
