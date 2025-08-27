import { useState } from 'react';
import { AdminApi } from '../../../infra/api/AdminApiClient';

export default function QrModal() {
  const [slug, setSlug] = useState('');
  const [svg, setSvg] = useState<string>('');
  async function fetchSvg() { if (!slug) return; const s = await AdminApi.qrSvg(slug); setSvg(s); }
  return (
    <section style={{ padding: 24 }}>
      <h2>QR</h2>
      <input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <button onClick={fetchSvg}>Generar</button>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </section>
  );
}
