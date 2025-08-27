# 0) Principios obligatorios

* **Stack**: React + TypeScript + Vite (SPA), Cloudflare Pages + Pages Functions (edge), Workers KV.
* **Módulos**: UI (componentes), Aplicación (features), **Dominio compartido** (entidades, VO, casos de uso, contratos), Infra (adaptadores KV/QR/API), Core (utils).
* **Separación estricta por fichero**. Sin duplicación de dominio.
* **Paquete compartido** en `packages/domain` consumido por `apps/web` y `functions`.
* **Tipado estricto** (TypeScript), ESLint/Prettier, pruebas unitarias en dominio.

# 1) Estructura de carpetas (monorepo)

```
ecv-shortener/
├─ apps/
│  └─ web/                      # React SPA (admin + landing)
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ main.tsx
│     │  │  └─ routes.tsx
│     │  ├─ components/
│     │  ├─ features/
│     │  │  ├─ admin/
│     │  │  │  ├─ CreateLink/
│     │  │  │  ├─ ListLinks/
│     │  │  │  ├─ EditLink/
│     │  │  │  └─ QrModal/
│     │  │  └─ public/
│     │  │     └─ Landing/
│     │  ├─ infra/
│     │  │  ├─ api/
│     │  │  │  ├─ AdminApiClient.ts
│     │  │  │  └─ PublicApiClient.ts
│     │  │  ├─ qr/
│     │  │  │  └─ QrGenerator.ts
│     │  │  └─ config/
│     │  │     └─ env.ts
│     │  ├─ core/
│     │  │  ├─ validation/
│     │  │  │  ├─ url.ts
│     │  │  │  └─ slug.ts
│     │  │  ├─ errors/
│     │  │  │  ├─ AppError.ts
│     │  │  │  └─ errorMap.ts
│     │  │  ├─ hooks/
│     │  │  │  └─ useToast.ts
│     │  │  └─ utils/
│     │  │     └─ base62.ts
│     │  └─ styles/globals.css
│     ├─ public/index.html
│     ├─ vite.config.ts
│     └─ tsconfig.json
├─ functions/                    # Cloudflare Pages Functions (edge)
│  ├─ [[path]].ts                # Router por host
│  ├─ admin/
│  │  └─ api/
│  │     ├─ create.ts
│  │     ├─ update.ts
│  │     ├─ toggle.ts
│  │     ├─ list.ts
│  │     ├─ get.ts
│  │     └─ qr.ts
│  ├─ public/
│  │  └─ redirect.ts
│  ├─ core/
│  │  ├─ env.ts
│  │  ├─ response.ts
│  │  └─ security/access.ts
│  └─ infra/
│     ├─ kv/
│     │  ├─ KvLinkRepository.ts
│     │  └─ KvIndexes.ts
│     ├─ qr/QrSvg.ts
│     └─ logging/logger.ts
├─ packages/
│  └─ domain/                    # PAQUETE COMPARTIDO (obligatorio)
│     ├─ src/
│     │  ├─ entities/
│     │  │  └─ Link.ts
│     │  ├─ valueObjects/
│     │  │  ├─ Slug.ts
│     │  │  └─ TargetUrl.ts
│     │  ├─ repositories/
│     │  │  └─ ILinkRepository.ts
│     │  ├─ usecases/
│     │  │  ├─ CreateLink.ts
│     │  │  ├─ UpdateLink.ts
│     │  │  ├─ ToggleLink.ts
│     │  │  ├─ GetLink.ts
│     │  │  └─ ListLinks.ts
│     │  ├─ dto/
│     │  │  └─ LinkDTO.ts
│     │  └─ index.ts
│     ├─ tsconfig.json
│     └─ package.json
├─ infra/
│  ├─ wrangler.toml
│  └─ README.md
├─ .github/workflows/deploy.yml
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

# 2) Paquete compartido `packages/domain`

**Obligatorio** para todas las reglas de negocio.

## 2.1 Entidad

`entities/Link.ts`

* Propiedades: `slug`, `targetUrl`, `active`, `createdBy`, `createdAt`, `updatedAt`, `clickCount`, `lastAccessAt?`, `tags?`.
* Invariantes: `slug` válido, `targetUrl` http/https, fechas ISO, `clickCount >= 0`.

## 2.2 Value Objects

`valueObjects/Slug.ts`

* Regex: `^[A-Za-z0-9_-]{1,32}$`.
* Normalización (si aplica): mantener case-sensitive.
* Fábrica y validación.

`valueObjects/TargetUrl.ts`

* Valida `new URL()` y protocolo en `{http:, https:}`.
* Normalización (agrega `https://` si falta).

## 2.3 Contratos

`repositories/ILinkRepository.ts`

* `create(link: Link): Promise<void>`
* `get(slug: string): Promise<Link | null>`
* `update(link: Link): Promise<void>`
* `toggle(slug: string, active: boolean): Promise<Link>`
* `list(opts: { search?: string; owner?: string; active?: boolean; cursor?: string; limit?: number; }): Promise<{ items: Link[]; nextCursor?: string }>`
* `incrementClick(slug: string): Promise<void>`
* `touchLastAccess(slug: string, isoDate: string): Promise<void>`

## 2.4 Casos de uso

* `CreateLink` (valida URL y slug único; genera slug si no se envía; fija metadata).
* `UpdateLink` (modifica destino/tags; actualiza `updatedAt`).
* `ToggleLink` (activa/desactiva).
* `GetLink` (obtiene por slug).
* `ListLinks` (paginación básica).

## 2.5 DTO

`dto/LinkDTO.ts`

* Contratos de entrada/salida para API admin.

## 2.6 Export

`index.ts` reexporta todas las piezas del dominio.

# 3) API (admin.ecv.lat)

Autenticación: **Cloudflare Access** (obligatorio). Email del usuario desde header `Cf-Access-Authenticated-User-Email`.
Todas las rutas admin requieren ese header.

* `POST /admin/api/create`

  * Body: `{ slug?: string, targetUrl: string, tags?: string[] }`
  * Respuesta: `{ ok: true, short: "https://ecv.lat/{slug}", link: LinkDTO }`

* `PUT /admin/api/:slug`

  * Body: `{ targetUrl?: string, tags?: string[] }`
  * Respuesta: `{ ok: true, link: LinkDTO }`

* `PATCH /admin/api/:slug/state`

  * Body: `{ active: boolean }`
  * Respuesta: `{ ok: true, link: LinkDTO }`

* `GET /admin/api/:slug`

  * Respuesta: `{ link: LinkDTO }`

* `GET /admin/api/links?search=&active=&owner=&limit=&cursor=`

  * Respuesta: `{ items: LinkDTO[], nextCursor?: string }`

* `GET /admin/api/qr/:slug.svg`

  * Respuesta: **SVG** del QR `https://ecv.lat/{slug}` (v1, corrección L, borde 1).

# 4) Rutas públicas (ecv.lat)

* `GET /:slug`

  * Si existe y `active=true`: `301` a `targetUrl`; incrementa `clickCount` y actualiza `lastAccessAt`.
  * Si no existe o `active=false`: `404`.

# 5) Implementaciones de Infra (Functions)

* **KV**: `LINKS` (namespace).

  * Claves:

    * `link:{slug}` → JSON `Link`.
    * `idx:owner:{email}` → JSON `{ slugs: string[], cursor?: string }`.

* `infra/kv/KvLinkRepository.ts`

  * Implementa `ILinkRepository` contra KV.
  * Control de colisiones de slug (reintento si es generado).
  * `incrementClick` y `touchLastAccess` con `ctx.waitUntil`.

* `infra/qr/QrSvg.ts`

  * Genera SVG (versión 1, nivel L, margin 1) para `https://ecv.lat/{slug}`.

* `core/security/access.ts`

  * Extrae email de `Cf-Access-Authenticated-User-Email`. Devuelve 401 si no está.

* `core/response.ts`

  * Respuestas JSON y errores tipificados; cabeceras apropiadas.

* `[[path]].ts`

  * Router por `host`:

    * `admin.ecv.lat` → API admin y SPA del panel.
    * `ecv.lat` → redirecciones públicas y landing.

# 6) Front-End (apps/web)

* **SPA React** con rutas:

  * `admin.ecv.lat` → Panel (CreateLink, ListLinks, EditLink, QrModal).
  * `ecv.lat` → Landing pública opcional (no gestiona slugs).
* **Clientes API**:

  * `infra/api/AdminApiClient.ts`: llamadas tipadas a `/admin/api/*`.
* **Generación de QR (cliente)**:

  * `infra/qr/QrGenerator.ts`: wrapper para previsualización (SVG/PNG). La descarga final puede usar el SVG del servidor.

# 7) Reglas de negocio (obligatorias)

* Slug: `[A-Za-z0-9_-]{1,32}`; recomendado 1–3 caracteres (base62).
* URL: `http/https`; normalización automática de esquema si falta.
* QR: versión 1, error correction L, borde 1.
* Auditoría: guardar `createdBy`, `createdAt`, `updatedAt`, `clickCount`, `lastAccessAt`.

# 8) Seguridad (obligatoria)

* **Cloudflare Access** aplicado a `admin.ecv.lat/*` (Google IdP; allow-list por correo).
* Rechazo 401 en admin si falta el header de Access.
* Restricción de métodos y validación estricta de inputs.
* Rate limit a `/admin/api/*` a nivel CF.

# 9) Configuración y build

* **pnpm workspaces**:

  * `pnpm-workspace.yaml` incluye `apps/*`, `functions`, `packages/*`.
* **tsconfig.path**:

  * `tsconfig.base.json` con alias `@domain/*` → `packages/domain/src/*`.
* `apps/web` y `functions` **importan** desde `@domain/*`.
* **wrangler.toml**:

  * `kv_namespaces` para `LINKS`.
  * Vars: `PUBLIC_HOST=ecv.lat`, `ADMIN_HOST=admin.ecv.lat`.

# 10) CI/CD

* GitHub Actions:

  * Lint + Typecheck.
  * Tests de `packages/domain`.
  * Build Vite + Functions.
  * Deploy a Cloudflare Pages (un proyecto) con **dos dominios**: `ecv.lat` y `admin.ecv.lat`.

# 11) Pruebas

* **Dominio** (`packages/domain/__tests__`): entidades, VO, casos de uso.
* **Infra** (Miniflare): `KvLinkRepository`, endpoints admin, redirect público.
* **E2E** (Playwright): flujos del panel (con Access habilitado en entorno de staging).

# 12) Criterios de aceptación

* `apps/web` y `functions` **compilan** consumiendo exclusivamente el dominio desde `packages/domain`.
* `admin.ecv.lat` protegido por Cloudflare Access (correo Google autorizado).
* Crear enlace retorna `https://ecv.lat/{slug}` y genera **SVG** conforme a las constantes definidas.
* `GET https://ecv.lat/{slug}` redirige con latencia edge y actualiza métricas.
* Estructura modular exacta y sin duplicaciones del dominio.