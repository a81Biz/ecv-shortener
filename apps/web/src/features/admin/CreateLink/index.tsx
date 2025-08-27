import { useState } from 'react';
import { AdminApi } from '../../../infra/api/AdminApiClient';
import { shortOrigin } from '../../../app/hosts';

const isLocal = /^(127\.0\.0\.1|localhost|.+\.localhost)$/.test(location.hostname);
const goLoginIf401 = (e: any) => {
  if (isLocal && String(e?.message) === 'UNAUTHORIZED') location.replace('/admin/dev-login');
  throw e;
};

export default function CreateLink() {
  const [slug, setSlug] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [short, setShort] = useState<string>('');

  const validUrl = (u: string) => {
    try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; }
    catch { return false; }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validUrl(targetUrl)) { setError('URL inválida'); return; }
    setSaving(true);
    try {
      const res = await AdminApi.create({ slug: slug || undefined, targetUrl });
      setShort(res.short);
      setSlug(''); setTargetUrl('');
    } catch (err: any) {
      if (/SLUG_EXISTS/i.test(String(err))) setError('El slug ya existe');
      else setError(String(err.message || err));
      try { goLoginIf401(err); } catch {}
    } finally {
      setSaving(false);
    }
  }

  const origin = shortOrigin();

  return (
    <section className="container">
      <div className="card">
        <h1>Crear enlace</h1>
        <form onSubmit={onSubmit}>
          <label>Slug (opcional)</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="ej: cf"/>
          <label>URL de destino</label>
          <input value={targetUrl} onChange={e=>setTargetUrl(e.target.value)} placeholder="https://..."/>
          <div className="toolbar">
            <button className="btn primary" disabled={saving || !validUrl(targetUrl)}>
              {saving?'Creando…':'Crear'}
            </button>
          </div>
        </form>
        {error && <p className="muted">Error: {error}</p>}
        {short && <p>Enlace creado: <a href={`${origin}/${short.split('/').pop()}`} target="_blank">abrir</a></p>}
      </div>
    </section>
  );
}
