import { Env } from '../../core/env';
import { json } from '../../core/response';
import { requireAccess, HttpError } from '../../core/security/access';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const email = requireAccess(ctx.request, ctx.env);
    return json({ ok: true, email });
  } catch (e: any) {
    // --- CÓDIGO DE DEPURACIÓN MEJORADO ---
    // 1. Extraemos las cabeceras y las convertimos a un objeto simple
    const headers = Object.fromEntries(ctx.request.headers);

    // 2. Creamos un objeto de depuración con la info que nos interesa
    const debugInfo = {
      url: ctx.request.url,
      method: ctx.request.method,
      headers: headers, // Ahora las cabeceras se verán en el JSON
    };

    const status = e instanceof HttpError ? e.status : 500;
    const msg = e?.message || 'Unexpected error';

    // 3. Devolvemos el objeto de depuración en lugar del request original
    return json({ ok: false, error: msg, request: debugInfo, env: ctx.env }, status);
  }
};