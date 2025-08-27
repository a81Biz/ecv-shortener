import { notFound } from './core/response';
import { handlePublicRedirect } from './public/redirect';
import type { Env } from './core/env';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url  = new URL(ctx.request.url);
  const path = url.pathname;
  const host = url.host.toLowerCase();

  // 0) Archivos estáticos de la SPA
  if (
    path.startsWith('/assets/') ||
    path === '/favicon.ico' ||
    path === '/robots.txt' ||
    path.startsWith('/icons/') ||
    path.startsWith('/images/') ||
    path.startsWith('/static/') ||
    path === '/app.css'   
  ) {
    return ctx.env.ASSETS.fetch(ctx.request);
  }

  // 1) API UI sin auth (solo lectura para el front local)
  if (path.startsWith('/ui/api/')) return ctx.env.ASSETS.fetch(ctx.request);

  // 2) Admin por HOST: admin.localhost:8788 (o cualquier admin.*)
  if (host.startsWith('admin.')) {
    if (path === '/') {
      // atajo: caer al listado admin
      return Response.redirect(`${url.protocol}//${host}/admin/links`, 302);
    }
    // cualquier ruta en admin.* sirve la SPA
    return ctx.env.ASSETS.fetch(ctx.request);
  }

  // 3) Admin por PATH (sigue activo también)
  if (path.startsWith('/admin/api/')) return ctx.env.ASSETS.fetch(ctx.request);
  if (path.startsWith('/admin'))      return ctx.env.ASSETS.fetch(ctx.request);

  // 4) Landing / SPA raíz
  if (path === '/' || path === '/index.html') return ctx.env.ASSETS.fetch(ctx.request);

  // 5) Redirección pública /:slug
  const m = path.match(/^\/([A-Za-z0-9_-]{1,32})$/);
  if (m) return handlePublicRedirect(ctx, m[1]);

  return notFound();
};
