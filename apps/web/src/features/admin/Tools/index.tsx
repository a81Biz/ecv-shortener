import { useState } from 'react';
import { AdminApi } from '../../../infra/api/AdminApiClient';

function goLoginIf401(err: any) {
  const status = err?.status || err?.response?.status;
  if (status === 401) {
    const next = encodeURIComponent('/admin/links');
    location.replace(`/admin/dev-login?next=${next}`);
    throw err;
  }
}

export default function AdminTools() {
  const [slug, setSlug] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function onDeactivate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setErr('');
    const s = slug.trim();
    if (!s) { setErr('Ingresa un slug.'); return; }
    try {
      await AdminApi.toggle(s, false);
      setMsg(`Desactivado: ${s}`);
    } catch (e: any) { try { goLoginIf401(e); } catch {} setErr(String(e?.message || e)); }
  }

  async function onFlushAll() {
    if (!confirm('Esto borrará TODOS los enlaces del KV. ¿Continuar?')) return;
    setMsg(''); setErr('');
    try {
      const r = await AdminApi.flushAll();
      setMsg(`KV limpiado. Eliminadas ${r.deleted} claves.`);
    } catch (e: any) { try { goLoginIf401(e); } catch {} setErr(String(e?.message || e)); }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Herramientas de administración</h1>
        {err && <p className="muted" style={{ color: '#ef4444' }}>{err}</p>}
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="card">
        <h3>Desactivar enlace</h3>
        <form onSubmit={onDeactivate}>
          <label htmlFor="dv-slug">Slug</label>
          <input id="dv-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ej: cf" />
          <div className="toolbar">
            <button className="btn" type="submit">Desactivar</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Borrar todos los datos de enrutamiento</h3>
        <p className="muted">Acción destructiva: vacía por completo el KV.</p>
        <div className="toolbar">
          <button className="btn danger" type="button" onClick={onFlushAll}>Borrar todo (flush)</button>
        </div>
      </div>
    </div>
  );
}
