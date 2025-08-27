import { useState } from 'react';
import { setDevEmail, normalizeNextParam } from '../../../app/auth';

export default function DevLogin() {
  const params = new URLSearchParams(location.search);
  const next = normalizeNextParam(params.get('next'));
  const [email, setEmail] = useState('test@example.com');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!v) return alert('Correo requerido');
    setDevEmail(v);
    location.replace(next);
  }

  return (
    <section style={{ padding: 24, maxWidth: 520 }}>
      <h2>Acceso Admin (modo local)</h2>
      <p>Introduce tu correo para simular Cloudflare Access en local.</p>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)}
               style={{display:'block',width:'100%',padding:8,margin:'8px 0 12px'}} />
        <button type="submit">Entrar</button>
      </form>
      <p style={{opacity:.6,marginTop:8}}>Te enviaremos a: <code>{next}</code></p>
    </section>
  );
}
