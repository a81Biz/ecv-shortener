# ecv-shortener

Acortador oficial de enlaces y generador de QR para **El Castillo Vagabundo** bajo el dominio [ecv.lat](https://ecv.lat).

---

## 📌 Descripción del Producto
Este proyecto provee un servicio de URLs cortas y QRs mínimos, con un panel de administración seguro para gestionar slugs y destinos.

- **Dominio público**: `https://ecv.lat/{slug}` → Redirección pública a la URL larga.
- **Panel privado**: `https://admin.ecv.lat` → Gestión de enlaces, accesible solo para correos autorizados mediante **Cloudflare Access + Google IdP**.

**Documento de alcance funcional completo**:  
👉 [Descripción del Producto](./docs/01-producto.md)

---

## ⚙️ Requerimiento Técnico
El sistema está diseñado con una arquitectura modular, separada por capas (Dominio, Infraestructura, Aplicación y UI).  
Incluye un paquete compartido `packages/domain` consumido por el front (React) y el backend (Cloudflare Functions).

**Documento técnico detallado**:  
👉 [Requerimiento Técnico](./docs/02-requerimiento-tecnico.md)

---

## 🏗️ Estructura General
```

ecv-shortener/
├─ apps/web         # React SPA (admin + landing)
├─ functions        # Cloudflare Pages Functions (API y redirect)
├─ packages/domain  # Paquete compartido (entidades, casos de uso, VO, contratos)
├─ infra            # Configuración de despliegue (wrangler, IaC)
└─ docs             # Documentación de producto y requerimiento técnico

```

---

## 🚀 Tecnologías
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Cloudflare Pages](https://pages.cloudflare.com/) + [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Workers KV](https://developers.cloudflare.com/kv/) para almacenamiento de slugs
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/) con Google como IdP

---

## 🔐 Seguridad
- **admin.ecv.lat** protegido con **Cloudflare Access**.  
- Lista blanca de correos autorizados.  
- El público solo accede a redirecciones en `ecv.lat/{slug}`.

---

## 📅 Roadmap
- **V1**: CRUD de enlaces, QR SVG/PNG, métricas básicas (clicks, último acceso).
- **V1.1**: Expiración de slugs, etiquetas, import/export CSV.
- **V2**: Roles, estadísticas avanzadas, API privada firmada.

---

## 📖 Licencia
MIT
```

---

👉 Lo que sigue es crear el repositorio **`ecv-shortener`** en GitHub, añadir la carpeta `docs/` con los dos documentos:

* `docs/01-producto.md` → la **Descripción del Producto** completa que ya hicimos.
* `docs/02-requerimiento-tecnico.md` → el **Requerimiento Técnico** detallado.

---

## 🧪 Ejecutar en local (localhost:8788)

> Esta sección guía el setup **desde clonar el repo** hasta tener la app corriendo en `http://localhost:8788` (público) y `http://admin.localhost:8788` (admin).
> Arquitectura y alcance: ver **Descripción del Producto** y **Requerimiento Técnico** enlazados en este README.&#x20;

### 1) Prerrequisitos

* **Node.js 20.x** (recomendado 20 LTS)
* **pnpm 9.x**

  ```bash
  corepack enable
  corepack prepare pnpm@9 --activate
  ```
* **Wrangler** (se usa vía `npx wrangler@4`, no necesitas instalar global)
* Sistema soportado: macOS, Linux o Windows 10/11

> `*.localhost` (como `admin.localhost`) resuelve por norma a `127.0.0.1`, no necesitas editar el `hosts`.

---

### 2) Clonar e instalar dependencias

```bash
git clone https://github.com/a81Biz/ecv-shortener.git
cd ecv-shortener

pnpm install
```

---

### 3) Configuración local (KV + variables)

El repo ya incluye un `wrangler.toml` preparado para local. Verifica que tenga (o añade) algo equivalente:

```toml
name = "ecv-shortener"
main = "functions/[[path]].ts"
compatibility_date = "2024-11-01"

[vars]
PUBLIC_HOST = "localhost:8788"
ADMIN_HOST  = "admin.localhost:8788"

[[kv_namespaces]]
binding = "LINKS"
id = "dev-links"
preview_id = "dev-links-preview"
```

* `LINKS` es el **Workers KV** que se usa como almacenamiento local durante el dev.
* `PUBLIC_HOST` y `ADMIN_HOST` determinan cómo el front arma URLs y QR en local.

---

### 4) Compilar el front

```bash
pnpm --filter @ecv/web build
```

Esto genera el build estático en `apps/web/dist`.

> Nota: el CSS global se sirve como `/app.css` desde `public/`. Ya viene incluido en `index.html` y permitido en `functions/[[path]].ts`.

---

### 5) Levantar todo con Wrangler (Pages + Functions)

```bash
npx wrangler@4 pages dev apps/web/dist --compatibility-date=2024-11-01
```

* **Público:** `http://localhost:8788/`
* **Admin (protegido):** `http://admin.localhost:8788/admin/links`

Wrangler muestra en consola las peticiones y cualquier error de Functions/Routes.

---

### 6) Autenticación en local (modo “dev-login”)

El panel de administración exige autenticación. En local, se simula así:

1. Visita `http://admin.localhost:8788`
   Se redirige automáticamente a `http://admin.localhost:8788/admin/dev-login?next=%2Fadmin%2Flinks`.
2. Ingresa un correo (por ejemplo, `test@example.com`) y pulsa **Entrar**.
   Se guarda en `localStorage.devAccessEmail` y verás la TopBar con “Autenticado: …”.

> En **Postman/cURL** puedes simular un usuario enviando el header `Cf-Access-Authenticated-User-Email`. Ver ejemplos abajo.

---

### 7) Rutas útiles en local

* **Público**

  * `/` → listado de enlaces **activos**
  * `/{slug}` → resolución y redirección (incrementa contador de clics)
* **Admin (autenticado)**

  * `/admin/links` → listado completo (activos/inactivos), acciones
  * `/admin/create` → crear enlace
  * `/admin/edit/{slug}` → editar destino, activar/desactivar, QR
  * `/admin/tools` → desactivar enlace por slug y **flush** (borrado total del KV)
  * `/admin/api/*` → endpoints JSON (crear, listar, toggle, qr, flush)

---

### 8) Pruebas rápidas con cURL/Postman

> Añade este header en las llamadas **/admin/api/** si no estás usando el login del navegador:
> `Cf-Access-Authenticated-User-Email: test@example.com`

**Crear enlace**

```bash
curl -s -H "Content-Type: application/json" \
  -H "Cf-Access-Authenticated-User-Email: test@example.com" \
  -d '{"targetUrl":"https://example.org/","slug":"ex"}' \
  http://127.0.0.1:8788/admin/api/create
```

**Listar (admin)**

```bash
curl -s -H "Cf-Access-Authenticated-User-Email: test@example.com" \
  http://127.0.0.1:8788/admin/api/links
```

**Cambiar estado**

```bash
curl -s -X PATCH -H "Content-Type: application/json" \
  -H "Cf-Access-Authenticated-User-Email: test@example.com" \
  -d '{"active":false}' \
  http://127.0.0.1:8788/admin/api/ex/state
```

**Ver QR (SVG)**

```bash
curl -s -H "Cf-Access-Authenticated-User-Email: test@example.com" \
  http://127.0.0.1:8788/admin/api/qr/ex > ex.svg
```

**Borrar todo el KV (destructivo)**

```bash
curl -s -X POST -H "Cf-Access-Authenticated-User-Email: test@example.com" \
  http://127.0.0.1:8788/admin/api/admin/flush
```

**Probar la redirección**

```bash
# Abre en el navegador para verificar redirect y conteo de clics:
http://localhost:8788/ex
```

---

### 9) Flujo esperado de validación manual

1. **Crear** 2–3 enlaces en `/admin/create`.
2. **Listar** en `/admin/links`: ver slugs, estado y clics.
3. **Visitar** `http://localhost:8788/{slug}` 1–2 veces y confirmar incremento en **clics**.
4. **Desactivar** un slug y verificar que en público `/` ya **no aparece** (y que `/{slug}` no redirige).
5. **QR**: usar los botones **Ver/Descargar** en público o admin.
6. **Flush** desde `/admin/tools` y verificar que el listado queda vacío.

---

### 10) Solución de problemas comunes

* **No carga estilos / se ve “plano”**
  Verificar en DevTools → Network que `/app.css` responde **200**. Si no:

  * `apps/web/public/app.css` existe.
  * `apps/web/index.html` incluye `<link rel="stylesheet" href="/app.css" />`.
  * `functions/[[path]].ts` permite `path === '/app.css'` dentro del bloque de estáticos.
  * Recompilar: `pnpm --filter @ecv/web build`.

* **401 en /admin/api/**

  * En navegador: inicia sesión en `/admin/dev-login`.
  * En Postman/cURL: agrega `Cf-Access-Authenticated-User-Email`.

* **“Slug already exists”** al crear
  Cambia el slug o deja vacío para generar uno aleatorio.

* **KV vacío tras flush**
  Es el comportamiento esperado del botón “Borrar todo”.

---

### 11) Comandos útiles

```bash
# Instalar dependencias
pnpm install

# Build del front (React + Vite)
pnpm --filter @ecv/web build

# Servir front + functions en local (Pages dev)
npx wrangler@4 pages dev apps/web/dist --compatibility-date=2024-11-01
```

> Cuando pases a despliegue, configura `PUBLIC_HOST`, `ADMIN_HOST` y el **KV de producción** como bindings del proyecto de Pages (en GitHub Actions/Cloudflare). El diseño de dominios y CI/CD no cambia el flujo local.

---

Con esto puedes levantar el entorno local, autenticarte en admin, crear/editar enlaces, generar QR y probar redirecciones en `http://localhost:8788`.
