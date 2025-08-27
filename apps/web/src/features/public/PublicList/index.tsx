import { useEffect, useState } from 'react';
import { UiApi, LinkDTO } from '../../../infra/api/UiApiClient';
import { qrPngDataUrl } from '../../../infra/qr/QrGenerator';
import { shortOrigin } from '../../../app/hosts';

export default function PublicList(){
  const [items,setItems]=useState<LinkDTO[]>([]);
  const [err,setErr]=useState(''); const [qr,setQr]=useState(''); const origin=shortOrigin();

  async function load(){ try{ setErr(''); const r=await UiApi.list({active:true}); setItems(r.items);}
  catch(e:any){ setErr(String(e?.message||e)); } }
  useEffect(()=>{ void load(); },[]);

  return (
    <div className="container">
      <h1>Enlaces</h1>
      <div className="card">
        <div className="toolbar">
          <button className="btn" onClick={load}>Actualizar</button>
          {err && <span className="muted">Error: {err}</span>}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Original</th><th>Corto</th><th>Clics</th><th>QR</th></tr>
            </thead>
            <tbody>
              {items.map(l=>(
                <tr key={l.slug}>
                  <td><a href={l.targetUrl} target="_blank" rel="noreferrer">{l.targetUrl}</a></td>
                  <td><a href={`${origin}/${l.slug}`} target="_blank" rel="noreferrer">{`${origin}/${l.slug}`}</a></td>
                  <td>{l.clickCount}</td>
                  <td className="row">
                    <button className="btn" onClick={async()=>setQr(await qrPngDataUrl(`${origin}/${l.slug}`,8))}>Ver</button>
                    <button className="btn ghost" onClick={async()=>{
                      const dataUrl=await qrPngDataUrl(`${origin}/${l.slug}`,8);
                      const a=document.createElement('a'); a.href=dataUrl; a.download=`qr-${l.slug}.png`; a.click();
                    }}>Descargar</button>
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
