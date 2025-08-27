import { describe, it, expect } from 'vitest';

const SERVER_URL = 'http://localhost:8787';

describe('API de Acortador de URLs', () => {

  // Test 1: Prueba el flujo completo de creación y redirección
  it('debería crear un slug y luego redirigir a su destino', async () => {
    // Arrange: Preparamos los datos para un slug único que no exista
    const slug = `test-${Date.now()}`;
    const destination = 'https://www.google.com/search?q=cloudflare';

    // Act 1: Creamos el slug a través de la API
    const createResponse = await fetch(`${SERVER_URL}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, destination }),
    });

    // Assert 1: Verificamos que la API respondió correctamente
    expect(createResponse.status).toBe(201);
    const createdJson = await createResponse.json();
    expect(createdJson.slug).toBe(slug);

    // Act 2: Visitamos el slug creado para probar la redirección
    const redirectResponse = await fetch(`${SERVER_URL}/${slug}`, {
      redirect: 'manual', // Importante: evita que fetch siga la redirección
    });

    // Assert 2: Verificamos que la redirección funciona
    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get('Location')).toBe(destination);
  });

  // Test 2: Prueba el caso de error cuando un slug no existe
  it('debería devolver un 404 para un slug inexistente', async () => {
    // Arrange: Un slug que garantizamos que no existe
    const nonExistentSlug = `slug-que-no-existe-${Date.now()}`;

    // Act: Intentamos visitar ese slug
    const response = await fetch(`${SERVER_URL}/${nonExistentSlug}`);

    // Assert: Verificamos que la respuesta es un 404
    expect(response.status).toBe(404);
  });
  
  // Test 3: Prueba la validación de la API
  it('debería devolver un 400 si falta el destino en la petición de creación', async () => {
    // Act: Hacemos una petición inválida a la API
    const badResponse = await fetch(`${SERVER_URL}/api/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'slug-invalido' }), // Falta 'destination'
    });
    
    // Assert: Verificamos que la API devuelve un error de cliente
    expect(badResponse.status).toBe(400);
  });
});