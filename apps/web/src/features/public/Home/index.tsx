export default function Home() {
  return (
    <section style={{ padding: 24 }}>
      <h2>ecv-shortener</h2>
      <p>Esta es la página pública. La administración está en <a href="/admin/links">/admin/links</a>.</p>
      <p>Los enlaces cortos se resuelven en este host (sin <code>admin.</code>).</p>
    </section>
  );
}