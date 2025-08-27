import { Env } from '../../../core/env';
import { requireAccess } from '../../../core/security/access';
import { QrSvg } from '../../../infra/qr/QrSvg';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params as { slug: string };
  const short = `https://${ctx.env.PUBLIC_HOST}/${slug}`;
  const svg = QrSvg(short);
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml' } });
};
