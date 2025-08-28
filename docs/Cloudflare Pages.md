# Guía Completa: Desarrollo y Pruebas de una Aplicación Cloudflare Pages

Este documento detalla el proceso para configurar un entorno de desarrollo, crear una suite de pruebas de integración, desplegar y asegurar una aplicación full-stack en Cloudflare Pages con un backend de Functions y una base de datos KV.

## 1. Configuración del Entorno de Pruebas de Integración

El objetivo es crear un sistema que pruebe la aplicación de la misma forma en que un usuario lo haría, haciendo peticiones HTTP a un servidor local.

#### 1.1. Instalar Dependencias
Se necesitan dos paquetes principales para el entorno de pruebas:
* **`vitest`**: El framework para ejecutar las pruebas.
* **`start-server-and-test`**: Una utilidad para iniciar el servidor, esperar a que esté listo y luego ejecutar las pruebas en entornos automatizados (CI).

```bash
pnpm add -D -w vitest start-server-and-test
```

#### 1.2. Crear la Configuración de Vitest
En la raíz del proyecto, se crea el archivo `vitest.config.integration.ts` para definir cómo se ejecutarán estas pruebas específicas:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Entorno Node.js para poder hacer peticiones `fetch`
    environment: 'node',
    globals: true,
    // Ubicación de los archivos de prueba
    include: ['tests/integration/**/*.spec.ts'],
  },
});
```

#### 1.3. Añadir Scripts a `package.json`
Se añaden scripts al `package.json` principal para facilitar la ejecución de tareas comunes:
```json
"scripts": {
  "dev:pages": "wrangler pages dev apps/web/dist --kv=LINKS --persist-to=.wrangler/state",
  "test:integration": "vitest run --config vitest.config.integration.ts",
  "test:ci": "start-server-and-test dev:pages http://localhost:8788 test:integration"
}
```
* **`dev:pages`**: Inicia el servidor local de Wrangler, conectando el KV (`--kv=LINKS`) y guardando los datos (`--persist-to`).
* **`test:integration`**: Ejecuta la suite de pruebas de Vitest.
* **`test:ci`**: Orquesta todo para la Integración Continua.

---
## 2. Escribiendo las Pruebas de Integración

Las pruebas se crean en la carpeta `tests/integration/`. El siguiente archivo `api.spec.ts` cubre el ciclo de vida completo de un enlace (crear, listar, actualizar estado, borrar) y se limpia a sí mismo.

```typescript
import { describe, it, expect, afterAll } from 'vitest';

const SERVER_URL = 'http://localhost:8788'; 
const AUTH_EMAIL = 'test-runner@example.com'; 
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Cf-Access-Authenticated-User-Email': AUTH_EMAIL,
};
const slugsToCleanUp = new Set<string>();

// Hook que se ejecuta al final para borrar todos los slugs creados en las pruebas
afterAll(async () => {
  if (slugsToCleanUp.size === 0) return;
  console.log(`\n🧹 Limpiando ${slugsToCleanUp.size} slugs...`);
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
  // Aquí van los tests...
});
```

---
## 3. Despliegue y Configuración en Producción

#### 3.1. Conectar Repositorio y Configurar Build
1.  En el Dashboard de Cloudflare, crear un proyecto de **Pages** y conectarlo al repositorio de GitHub.
2.  Configurar el build con:
    * **Comando de build**: `pnpm build`
    * **Directorio de salida**: `apps/web/dist`

#### 3.2. Configurar Bindings y Variables
1.  **Crear un KV Namespace** de producción en **Workers & Pages > KV**.
2.  En el proyecto de Pages, ir a **Settings > Functions > KV namespace bindings** y conectar la variable `LINKS` al KV recién creado.
3.  En **Settings > Environment variables**, añadir las variables de producción: `PUBLIC_HOST` (`ecv.lat`) y `ADMIN_HOST` (`admin.ecv.lat`).

#### 3.3. Configurar Dominio y Subdominio
1.  Añadir `ecv.lat` como un sitio en Cloudflare, y apuntar los **Nameservers** desde el registrador (GoDaddy) a Cloudflare.
2.  En la configuración **DNS** de `ecv.lat` en Cloudflare, crear un registro `CNAME` para `admin` apuntando a la URL del proyecto (ej. `ecv-shortener.pages.dev`).
3.  En el proyecto de Pages, ir a **Custom domains** y añadir tanto `ecv.lat` como `admin.ecv.lat`.

#### 3.4. Configurar Seguridad con Cloudflare Access
1.  En el Dashboard de **Zero Trust**, ir a **Access > Applications**.
2.  Crear una aplicación **Self-hosted** para proteger el subdominio `admin` del dominio `ecv.lat`.
3.  Crear una política de **Allow** que solo permita el acceso a una lista específica de **Emails**.

---
## 4. Integración Continua (CI) con GitHub Actions

Para automatizar las pruebas, se crea el archivo `.github/workflows/ci.yml`:
```yaml
name: Pruebas de Integración
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build # <-- Paso crucial
      - run: pnpm test:ci
```

---
## 5. Guía de Errores Comunes y Soluciones

| Error | Causa | Solución |
| --- | --- | --- |
| `Failed to load url .../workers` | Configuración inicial incorrecta de Vitest con el "pool" de workers. | Se cambió la estrategia a **pruebas de integración**, usando `wrangler` como servidor y `vitest` con un entorno Node para hacer peticiones `fetch`. |
| `ERR_REQUIRE_ESM` en `wrangler dev` | Conflicto de dependencias en una versión de `wrangler` que intentaba usar `require()` en un módulo ESM (`youch`). | Se forzó la instalación de una **versión estable** y probada de `wrangler` (ej. `^3.61.0`) en `package.json` y se realizó una instalación limpia. |
| `Error: No response!` en `wrangler dev` | El código de la función no tenía una respuesta por defecto, crasheando si una ruta no coincidía. | Se añadió un `return new Response('Not Found', { status: 404 });` al final de la lógica del enrutador. |
| La CI se quedaba colgada en `HEAD / 404` | `start-server-and-test` esperaba un `200 OK`, pero el sitio estático no estaba construido en el entorno de CI. | Se añadió el paso `pnpm build` al archivo de workflow de GitHub Actions, antes de ejecutar las pruebas. |
| `Error: #<Response>` en logs de producción | El código de seguridad usaba `throw new Response()` en lugar de `return new Response()`, lo que crasheaba el worker. | Se refactorizó la función de seguridad (`access.ts`) para que lanzara un `new Error()`, y que el enrutador (`router.ts`) lo capturara en un `try...catch` para generar la respuesta `401`. |
| `"request":{}` (Request vacío en logs) | `JSON.stringify()` no puede serializar el objeto `Request` directamente. | Se extrajeron manualmente las propiedades de interés (`url`, `method`, `headers`) a un objeto simple antes de incluirlo en la respuesta de depuración. |
| API devolvía `UNAUTHORIZED` en producción | El código buscaba la cabecera `cf-access-authenticated-user-email`, pero Cloudflare Access solo inyectaba la cabecera JWT (`cf-access-jwt-assertion`). | Se modificó el helper de seguridad para que decodificara el token JWT usando la librería `@tsndr/cloudflare-worker-jwt` y extrajera el email desde ahí. |
| Error 522 en `admin.ecv.lat` | El proyecto de Cloudflare Pages no estaba configurado para aceptar tráfico desde el subdominio `admin.ecv.lat`. | Se añadió `admin.ecv.lat` a la lista de **Custom domains** en la configuración del proyecto de Pages. |