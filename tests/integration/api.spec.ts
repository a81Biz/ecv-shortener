import { describe, it, expect, afterAll } from 'vitest';

const SERVER_URL = 'http://localhost:8788'; 

const AUTH_EMAIL = 'test@example.com';
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Cf-Access-Authenticated-User-Email': AUTH_EMAIL,
};

// 1. REGISTRO DE SLUGS CREADOS
// Usamos un Set para guardar los slugs únicos que las pruebas crean.
const slugsToCleanUp = new Set<string>();

// 2. HOOK DE LIMPIEZA
// Se ejecuta una vez, después de que todas las pruebas de este archivo han terminado.
afterAll(async () => {
  if (slugsToCleanUp.size === 0) return;

  console.log(`\n🧹 Limpiando ${slugsToCleanUp.size} slugs creados durante las pruebas...`);
  
  const deletePromises = Array.from(slugsToCleanUp).map(slug => {
    return fetch(`${SERVER_URL}/admin/api/${slug}`, {
      method: 'DELETE',
      headers: { 'Cf-Access-Authenticated-User-Email': AUTH_EMAIL },
    });
  });

  await Promise.all(deletePromises);
  console.log('✅ Limpieza completada.');
});

describe('API de Acortador de URLs - Flujo Completo', () => {

  it('debería crear un nuevo enlace exitosamente', async () => {
    const slug = `test-create-${Date.now()}`;
    slugsToCleanUp.add(slug); // Se añade el slug a la lista de limpieza

    const response = await fetch(`${SERVER_URL}/admin/api/create`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ slug, targetUrl: 'https://cloudflare.com/' }),
    });

    expect(response.status).toBe(200);
  });

  it('debería listar los enlaces existentes', async () => {
    const slug = `test-list-${Date.now()}`;
    slugsToCleanUp.add(slug); // Se añade el slug a la lista de limpieza
    
    await fetch(`${SERVER_URL}/admin/api/create`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ slug, targetUrl: 'https://vitest.dev/' }),
    });

    const response = await fetch(`${SERVER_URL}/admin/api/links`, {
      headers: { 'Cf-Access-Authenticated-User-Email': AUTH_EMAIL },
    });
    
    expect(response.status).toBe(200);
    const responseJson = await response.json();
    expect(responseJson.items.some(link => link.slug === slug)).toBe(true);
  });

  it('debería desactivar un enlace y evitar su redirección', async () => {
    const slug = `test-state-${Date.now()}`;
    slugsToCleanUp.add(slug); // Se añade el slug a la lista de limpieza
    
    await fetch(`${SERVER_URL}/admin/api/create`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ slug, targetUrl: 'https://github.com/' }),
    });

    const patchResponse = await fetch(`${SERVER_URL}/admin/api/${slug}/state`, {
        method: 'PATCH',
        headers: AUTH_HEADERS,
        body: JSON.stringify({ active: false }),
    });

    expect(patchResponse.status).toBe(200);

    const redirectResponse = await fetch(`${SERVER_URL}/${slug}`, {
        redirect: 'manual',
    });

    expect(redirectResponse.status).toBe(404);
  });
  
  it('debería redirigir un slug activo sin necesidad de autenticación', async () => {
    const slug = `test-redirect-${Date.now()}`;
    slugsToCleanUp.add(slug); // Se añade el slug a la lista de limpieza
    const targetUrl = 'https://es.wikipedia.org/';
    
    await fetch(`${SERVER_URL}/admin/api/create`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ slug, targetUrl: targetUrl }),
    });

    const response = await fetch(`${SERVER_URL}/${slug}`, {
      redirect: 'manual',
    });
    
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(targetUrl);
  });
});