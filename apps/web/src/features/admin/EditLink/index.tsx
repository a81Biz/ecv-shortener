import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminApi, LinkDTO } from '../../../infra/api/AdminApiClient';

const isLocal = /^(127\.0\.0\.1|localhost|.+\.localhost)$/.test(location.hostname);
const goLoginIf401 = (e: any) => {
  if (isLocal && String(e?.message) === 'UNAUTHORIZED') location.replace('/admin/dev-login');
  throw e;
};

export default function EditLink() {
  const { slug = '' } = useParams();
  const [link, setLink] = useState<LinkDTO | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const origin = window.location.origin;
  const short = `${origin}/${slug}`;

  const load = async () => {
    try {
      const r = await AdminApi.get(slug);
      setLink(r.link);
      setTargetUrl(r.link.targetUrl);
    } catch (e) { try { goLoginIf401(e); } catch {} }
  };

  useEffect(() => { void load(); }, [slug]);

  const validUrl = (u: string) => {
    try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; }
    catch { return false; }
  };

  async function save() {
    setError(''); setSaving(true);
    try {
      const r = await AdminApi.update(slug, { targetUrl });
      setLink(r.link);
    } catch (e: any) {
      setError(String(e.message || e));
      try { goLoginIf401(e); } catch {}
    } finally { setSaving(false); }
  }

// dentro del componente EditLink
const [qrOpen, setQrOpen] = useState(false);
const [qrDataUrl, setQrDataUrl] = useState<string>("");

async function showQr() {
  const data = await qrPngDataUrl(`${origin}/${link!.slug}`, 8);
  setQrDataUrl(data);
  setQrOpen(true);
}
async function downloadQr() {
  const data = await qrPngDataUrl(`${origin}/${link!.slug}`, 8);
  const a = document.createElement("a");
  a.href = data; a.download = `qr-${link!.slug}.png`; a.click();
}

if (!link) return <section style={{ padding: 24 }}>Cargando…</section>;

return (
  <div className="container">
    <div className="card">
      <h1>Editar enlace</h1>

      <div className="row muted" style={{ marginBottom: 12 }}>
        <span>Slug:</span>
        <strong>{link.slug}</strong>
        <span style={{ marginLeft: 12 }}>Corto:</span>
        <a href={`${origin}/${link.slug}`} target="_blank" rel="noreferrer">
          {`${origin}/${link.slug}`}
        </a>
      </div>

      <form onSubmit={onSave}>
        <label htmlFor="ed-target">URL de destino</label>
        <input
          type="url"
          id="ed-target"
          placeholder="https://..."
          required
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
        />

        <div className="toolbar">
          <button className="btn primary" type="submit">Guardar</button>
          <button className="btn" type="button" onClick={toggle}>
            {link.active ? "Desactivar" : "Activar"}
          </button>
          <button className="btn" type="button" onClick={showQr}>QR</button>
          <button className="btn ghost" type="button" onClick={downloadQr}>Descargar QR</button>
        </div>
      </form>

      <p className="muted" style={{ marginTop: 10 }}>
        Creado por <span>{link.createdBy}</span> ·{" "}
        <span>{new Date(link.createdAt).toLocaleString()}</span> ·{" "}
        Clics: <span>{link.clickCount}</span>
      </p>
    </div>

    {qrOpen && (
      <div className="modal" onClick={() => setQrOpen(false)}>
        <div className="box"><img src={qrDataUrl} alt="QR" /></div>
      </div>
    )}
  </div>
);

}
