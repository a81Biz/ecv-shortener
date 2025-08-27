import { useEffect, useState } from 'react';
import { AdminApi } from '../infra/api/AdminApiClient';
import { clearDevEmail, isLocalHost } from './auth';

export default function TopBar(){
  const [email,setEmail]=useState('');
  useEffect(()=>{ AdminApi.whoami().then(r=>setEmail(r.email)).catch(()=>setEmail('')); },[]);
  return (
    <header className="nav">
      <div className="nav-in">
        <a href="/admin/links"><strong>ecv-shortener · Admin</strong></a>
        <a href="/admin/links">Enlaces</a>
        <a href="/admin/create">Crear</a>
        <a href="/admin/tools">Herramientas</a>
        <div className="spacer"/>
        <span className="badge">
          {email?<>Autenticado: <strong>{email}</strong></>: <>Sin sesión</>}
          {isLocalHost && (
            <button className="btn ghost" onClick={()=>{ clearDevEmail(); location.replace('/admin/dev-login?next=/admin/links'); }}>
              Salir
            </button>
          )}
        </span>
      </div>
    </header>
  );
}
