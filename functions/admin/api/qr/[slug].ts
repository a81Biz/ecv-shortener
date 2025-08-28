import type { Env } from '../../../core/env';
import { json } from '../../../core/response';
import { requireAccess, HttpError } from '../../../core/security/access';
import { kvRepoFromEnv } from '../../../infra/kv/KvLinkRepository';
import { QrSvg } from '../../../infra/qr/QrSvg'; // tu generador de SVG

function protoFor(host: string) {
  return host.includes('localhost') ? 'http' : 'https';
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    // 1) Autenticación (prod: Cloudflare Access; local: dev-login)
    requireAccess(ctx.request, ctx.env);

    // 2) Parámetros
    const { slug } = ctx.params as { slug: string };
    if (!slug) return json({ ok: false, error: 'Missing slug' }, 400);

    const url = new URL(ctx.request.url);
    const q = url.searchParams;
    const size = Math.max(96, Math.min(1024, Number(q.get('size') || 256))); // 96..1024
    const margin = Math.max(0, Math.min(8, Number(q.get('margin') || 2)));    // 0..8
    const download = q.get('download') === '1';

    // 3) Buscar el enlace (opcional: validar activo)
    const repo = kvRepoFromEnv(ctx.env);
    const raw = await repo.get(slug);
    if (!raw) return json({ ok: false, error: 'Not found' }, 404);

    const link = JSON.parse(raw);
    // Si quieres bloquear QR de enlaces inactivos, descomenta:
    // if (!link.active) return json({ ok:false, error:'Inactive link' }, 409);

    // 4) Armar la URL corta pública
    const short = `${protoFor(ctx.env.PUBLIC_HOST)}://${ctx.env.PUBLIC_HOST}/${slug}`;

    // 5) Generar SVG
    const svg = QrSvg(short); // usa tu helper existente

    // 6) Responder SVG (inline o descarga)
    const headers: HeadersInit = {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'no-store',
    };
    if (download) {
      headers['content-disposition'] = `attachment; filename="qr-${slug}.svg"`;
    }
    return new Response(svg, { status: 200, headers });
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    const msg = e?.message || 'Unexpected error';
    // Responder SIEMPRE JSON en error para que el front pueda decidir (dev-login, etc.)
    return json({ ok: false, error: msg }, status);
  }
};
