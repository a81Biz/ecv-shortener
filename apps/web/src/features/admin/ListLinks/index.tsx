import { useEffect, useState } from 'react';
import { AdminApi, LinkDTO } from '../../../infra/api/AdminApiClient';
import { qrPngDataUrl } from '../../../infra/qr/QrGenerator';
import { shortOrigin } from '../../../app/hosts';

export default function ListLinks(){
  const [items,setItems]=useState<LinkDTO[]>([]);
  const [err,setErr]=useState(''); const [qr,setQr]=useState('');
  const origin=shortOrigin();

  async function refresh(){
    try{ setErr(''); const r=await AdminApi.list({}); setItems(r.items);}
    catch(e:any){ setErr(String(e?.message||e)); setItems([]); }
  }
  useEffect(()=>{ void refresh(); },[]);

  async function handleDelete(slug: string) {
  if (!confirm(`Eliminar definitivamente el slug "${slug}"? Esta acción no se puede deshacer.`)) return;
  await AdminApi.remove(slug);
  await refresh();
}

  return (
    <div className="container">
      <h1>Enlaces</h1>
      <div className="card">
        <div className="toolbar">
          <a className="btn primary" href="/admin/create">Nuevo</a>
          <button className="btn" onClick={refresh}>Actualizar</button>
          {err && <span className="muted">Error: {err}</span>}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Original</th><th>Corto</th><th>Estado</th><th>Clics</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {items.map(l=>(
                <tr key={l.slug}>
                  <td><a href={l.targetUrl} target="_blank" rel="noreferrer">{l.targetUrl}</a></td>
                  <td><a href={`${origin}/${l.slug}`} target="_blank" rel="noreferrer">{`${origin}/${l.slug}`}</a></td>
                  <td>{l.active?'Activo':'Inactivo'}</td>
                  <td>{l.clickCount}</td>
                  <td className="row">
                    <a className="btn" href={`/admin/edit/${l.slug}`}>Editar</a>
                    <button className="btn" onClick={async()=>setQr(await qrPngDataUrl(`${origin}/${l.slug}`,8))}>QR</button>
                    <button className="btn ghost" onClick={async()=>{ await AdminApi.toggle(l.slug,!l.active); await refresh(); }}>
                      {l.active?'Desactivar':'Activar'}
                    </button>
                    <button className="btn danger" onClick={() => handleDelete(l.slug)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {qr && (
        <div className="modal" onClick={()=>setQr('')}>
          <div className="box"><img src={qr} alt="QR"/></div>
        </div>
      )}
    </div>
  );
}
