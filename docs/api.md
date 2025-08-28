# 0) Convenciones del proyecto

* **Routing (Cloudflare Pages Functions):**
  Los handlers viven en `functions/` y su **ruta HTTP** se deriva **del path del archivo**:

  * `functions/admin/api/links.ts` → `POST/GET /admin/api/links`
  * `functions/admin/api/[slug].ts` → `GET/DELETE /admin/api/:slug`
  * `functions/admin/api/[slug]/state.ts` → `PATCH /admin/api/:slug/state`
  * `functions/ui/api/links.ts` → `GET /ui/api/links` (público)
* **Capas**:

  * `packages/domain/src/usecases/*` → Casos de uso (puro dominio, sin I/O).
  * `functions/infra/*` → Infraestructura (KV, QR, etc.).
  * `functions/core/*` → Utilidades comunes (`response`, `security/access`, `env`).
  * `apps/web/src/infra/api/*` → Clientes HTTP del front (AdminApi/UiApi).
  * `apps/web/src/features/*` → Pantallas o componentes que consumen esas APIs.

---

# 1) Decide el tipo de API

1. **Administración (protegida)**

   * Ruta base: `/admin/api/...`
   * Archivo: `functions/admin/api/...`
   * **Debe** llamar a `requireAccess()`.

2. **Pública (solo lectura / UI)**

   * Ruta base: `/ui/api/...`
   * Archivo: `functions/ui/api/...`
   * **No** requiere `requireAccess()`, pero valida inputs.

> Si la API afecta datos (crear/editar/borrar), debe ser **admin**. Si solo lista o expone datos públicos, puede ser **ui**.

---

# 2) Estructura a crear/modificar (checklist)

Supón que quieres una API nueva llamada **“stats”**:

| Capa               | ¿Qué crear?              | Ubicación                                                         | Notas                                        |
| ------------------ | ------------------------ | ----------------------------------------------------------------- | -------------------------------------------- |
| Dominio            | Caso de uso              | `packages/domain/src/usecases/GetStats.ts`                        | Puro: recibe puertos, devuelve DTO           |
| Dominio (índice)   | Export                   | `packages/domain/src/index.ts`                                    | `export * from './usecases/GetStats';`       |
| Infra              | Método(s) repo           | `functions/infra/kv/KvLinkRepository.ts`                          | P. ej. `stats()`; ¡sin lógica de negocio!    |
| Core               | Nada nuevo (normalmente) | `functions/core/*`                                                | Reutiliza `json()`, `requireAccess()`, `Env` |
| Function           | Handler HTTP             | `functions/admin/api/stats.ts` **o** `functions/ui/api/stats.ts`  | Usa el caso de uso y el repo                 |
| Front (API client) | Método                   | `apps/web/src/infra/api/AdminApiClient.ts` **o** `UiApiClient.ts` | Llama al endpoint nuevo                      |
| Front (UI)         | Pantalla/uso             | `apps/web/src/features/...`                                       | Botones/listas que consumen el client        |

---

# 3) Plantillas (copiar/pegar y renombrar)

### 3.1 Dominio: caso de uso

`packages/domain/src/usecases/GetStats.ts`

```ts
export interface IStatsRepo {
  total(): Promise<number>;
  active(): Promise<number>;
  clicks(): Promise<number>;
}

export type StatsDTO = { total: number; active: number; clicks: number };

export async function GetStats(repo: IStatsRepo): Promise<{ ok: true; data: StatsDTO }> {
  const [total, active, clicks] = await Promise.all([repo.total(), repo.active(), repo.clicks()]);
  return { ok: true, data: { total, active, clicks } };
}
```

`packages/domain/src/index.ts`

```ts
export * from './usecases/GetStats';
```

### 3.2 Infra: extender el repo KV (o crear uno específico)

`functions/infra/kv/KvLinkRepository.ts`

```ts
// ...import y clase existentes

export class KvLinkRepository {
  constructor(private kv: KVNamespace) {}

  // Métodos existentes (get/put/delete/list/state/click...)

  async total(): Promise<number> {
    let count = 0, cursor: string|undefined = undefined;
    do {
      const page = await this.kv.list({ cursor, prefix: 'link:' });
      count += page.keys.length;
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return count;
  }

  async active(): Promise<number> {
    // Si guardas el estado dentro del valor JSON, puedes contar activo/inactivo
    // de forma aproximada listando y filtrando en memoria (para local está bien).
    let cursor: string|undefined = undefined, active = 0;
    do {
      const page = await this.kv.list({ cursor, prefix: 'link:' });
      for (const k of page.keys) {
        const raw = await this.kv.get(k.name);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (obj.active) active++;
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return active;
  }

  async clicks(): Promise<number> {
    // idem: sumatoria de clickCount del valor JSON
    let cursor: string|undefined = undefined, sum = 0;
    do {
      const page = await this.kv.list({ cursor, prefix: 'link:' });
      for (const k of page.keys) {
        const raw = await this.kv.get(k.name);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        sum += Number(obj.clickCount || 0);
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return sum;
  }
}
```

> Si necesitas otra fuente (R2, D1, API externa), crea `functions/infra/<fuente>/<Repo>.ts` y provee la misma interfaz que el caso de uso espera.

### 3.3 Handler HTTP (admin o ui)

**Admin protegido:** `functions/admin/api/stats.ts`

```ts
import { Env } from '../../core/env';
import { json } from '../../core/response';
import { requireAccess } from '../../core/security/access';
import { KvLinkRepository } from '../../infra/kv/KvLinkRepository';
import { GetStats } from '../../../packages/domain/src';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    requireAccess(ctx.request);
    const repo = new KvLinkRepository(ctx.env.LINKS);
    const result = await GetStats(repo);
    return json(result);
  } catch (err:any) {
    const msg = err?.message || 'Unexpected error';
    const code = /unauthor/i.test(msg) ? 401 : 500;
    return json({ ok:false, error: msg }, code);
  }
};
```

**Público (sin auth):** `functions/ui/api/stats.ts`
(igual, pero **sin** `requireAccess()`).

### 3.4 Cliente del front

**Admin:** `apps/web/src/infra/api/AdminApiClient.ts`

```ts
export const AdminApi = {
  // ...métodos existentes
  stats() {
    return apiFetch<{ ok: true; data: { total:number; active:number; clicks:number } }>(`/stats`);
  },
};
```

**UI:** `apps/web/src/infra/api/UiApiClient.ts`

```ts
export const UiApi = {
  // ...métodos existentes
  stats() {
    return apiFetch<{ ok: true; data: { total:number; active:number; clicks:number } }>(`/stats`);
  },
};
```

> Recuerda: en estos clientes `apiFetch` ya tiene prefijo (`/admin/api` o `/ui/api`) según el archivo. Por eso aquí usamos solo `'/stats'`.

### 3.5 Uso en React (opcional)

`apps/web/src/features/admin/Tools/StatsCard.tsx`

```tsx
import { useEffect, useState } from 'react';
import { AdminApi } from '../../../infra/api/AdminApiClient';

export default function StatsCard(){
  const [data,setData] = useState<{total:number;active:number;clicks:number}|null>(null);
  const [err,setErr] = useState('');
  useEffect(()=>{
    AdminApi.stats().then(r=>setData(r.data)).catch(e=>setErr(String(e?.message||e)));
  },[]);
  return (
    <div className="card">
      <h3>Estadísticas</h3>
      {err && <p className="muted" style={{color:'#ef4444'}}>{err}</p>}
      {!data ? <p className="muted">Cargando…</p> : (
        <ul className="muted">
          <li>Total enlaces: <strong>{data.total}</strong></li>
          <li>Activos: <strong>{data.active}</strong></li>
          <li>Clics acumulados: <strong>{data.clicks}</strong></li>
        </ul>
      )}
    </div>
  );
}
```

---

# 4) Patrón para **rutas con parámetros**

* Archivo: `functions/admin/api/[slug].ts` → `ctx.params.slug`
* Archivo: `functions/admin/api/[slug]/state.ts` → `ctx.params.slug` + subruta `/state`
* Archivo: `functions/admin/api/[type]/[id].ts` → `ctx.params.type`, `ctx.params.id`

Cloudflare Pages Functions mapea **carpetas** a segmentos de ruta y **nombres entre corchetes** a parámetros.

---

# 5) Helpers reusable (no reinventar)

* `functions/core/response.ts`

  ```ts
  export function json(body: unknown, status = 200, headers: HeadersInit = {}) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
    });
  }
  ```
* `functions/core/security/access.ts`

  * **Admin**: `requireAccess(request)` → `throw` si no hay email (en local usa `localStorage.devAccessEmail` y header `Cf-Access-Authenticated-User-Email`).
* `functions/core/env.ts` → tipos y contrato de bindings (`LINKS`, variables, etc.).

Úsalos **siempre**; no escribas respuestas JSON “a mano”.

---

# 6) Checklist al crear una API nueva

1. **Caso de uso** en `packages/domain/...` (puro, testeable).
2. **Repo/Infra**: añade los métodos mínimos que el caso de uso necesita.
3. **Handler** en `functions/<admin|ui>/api/...`:

   * Valida/parsea inputs (query/body/params).
   * **Admin**: `requireAccess(request)`.
   * Llama a **caso de uso** con el repo adecuado.
   * Responde con `json(...)`.
   * **try/catch** (no dejes que suba al pretty error).
4. **Cliente front** (`AdminApi` o `UiApi`).
5. **UI** (solo si será visible).
6. **Build & dev**:

   ```bash
   pnpm --filter @ecv/web build
   pnpm dev:pages
   ```
7. **Smoke test** con cURL/Postman.

---

# 7) Ejemplos de rutas comunes (“recetas”)

* **GET** admin con querystring:
  `functions/admin/api/report.ts` → `/admin/api/report?from=...&to=...`
* **POST** admin con JSON body:
  `functions/admin/api/bulk-create.ts` → `/admin/api/bulk-create` (crear varios slugs)
* **DELETE** admin con id:
  `functions/admin/api/[slug].ts` → `onRequestDelete` (ya lo hiciste)
* **GET** público con filtros:
  `functions/ui/api/links.ts` → `/ui/api/links?active=true`

---

# 8) Errores típicos y cómo evitarlos

* **KV no enlazado** → “`this.kv.get is not a function`”
  Solución: ejecuta wrangler desde la **raíz** (donde está `wrangler.toml`) y valida `LINKS` en `kvRepoFromEnv`.
* **Pretty error de Miniflare (Youch)**
  Solución: siempre `try/catch` y responde tú con `json()`.
* **Rutas mal ubicadas** (no coincide path con URL)
  Solución: respeta la convención *archivo ←→ ruta*.
* **CORS** (si abres a otros orígenes)
  Solución: añade headers en `json()` según necesites (`Access-Control-Allow-Origin`, etc.).
