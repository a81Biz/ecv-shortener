# Documento Técnico – Proyecto **ecv-shortener**

*Bitácora de desarrollo, problemas resueltos y glosario*

---

## 1. Introducción

El proyecto **ecv-shortener** se desarrolló como un servicio completo de **acortamiento de URLs** (URL Shortener) basado en **Cloudflare Pages + Functions + KV**, con interfaz de administración y vista pública.
Se buscó implementar una arquitectura modular, con separación de capas y un entorno replicable tanto en local como en producción.

Este documento detalla:

* Todo lo que se construyó correctamente.
* Los problemas que surgieron durante el desarrollo.
* Las soluciones aplicadas.
* Una explicación de cada concepto técnico.
* Un glosario final de términos relevantes.

---

## 2. Funcionalidades implementadas correctamente

### 2.1 Back-End (Functions en Cloudflare Pages)

* **Creación de enlaces cortos** con slug opcional.
* **Consulta de enlaces** individuales (`/admin/api/:slug`).
* **Listado de enlaces** (`/admin/api/links`).
* **Cambio de estado (activar/inactivar)** mediante `PATCH`.
* **Redirección pública** (`/:slug`) solo si el enlace está activo.
* **Conteo de clics** incrementado automáticamente al redirigir.
* **Generación de QR** en SVG y descarga como PNG.
* **Flush del KV** (borrado completo de la base de datos de enrutamiento).
* **Protección de rutas de administración** con autenticación simulada en local (`dev-login`) y con Cloudflare Access en despliegue real.

### 2.2 Front-End (React + Vite)

* **Página pública (`/`)**

  * Lista de enlaces activos.
  * Columna de clics actualizada.
  * Botones para ver y descargar QR.
  * Diseño minimalista con **cards**, bordes suaves y tipografía clara.
* **Panel de administración (`/admin/links`)**

  * Listado completo (activos e inactivos).
  * Acciones por fila: **Editar, QR, Activar/Desactivar**.
* **Crear enlace (`/admin/create`)**

  * Formulario con validación de URL.
  * Muestra el enlace creado con link de acceso.
* **Editar enlace (`/admin/edit/:slug`)**

  * Cambio de URL destino.
  * Botón de activar/desactivar.
  * Acceso rápido a QR y clics.
* **Herramientas (`/admin/tools`)**

  * Desactivar enlace por slug.
  * Borrar todos los datos del KV.
* **Autenticación simulada (`/admin/dev-login`)**

  * Ingreso de correo (almacenado en `localStorage.devAccessEmail`).
  * Barra superior mostrando “Autenticado: [correo@ejemplo.com](mailto:correo@ejemplo.com)”.
  * Botón de salir (elimina sesión y redirige al login).

---

## 3. Problemas encontrados y soluciones aplicadas

### 3.1 Errores en compilación inicial (Vite + pnpm)

* **Error:** `vite build` fallaba con *“Could not resolve entry module index.html”*.
* **Causa:** faltaba la referencia correcta en `apps/web/index.html`.
* **Solución:** mover `index.html` al lugar correcto y configurar `vite.config.ts` para apuntar a `src/main.tsx`.

---

### 3.2 JSX malformado en componentes

* **Error:** `Expected identifier but found "<"`.
* **Causa:** etiquetas HTML mal cerradas (`<th>Slug</</th>`).
* **Solución:** corregir sintaxis JSX (usar `className` en lugar de `class`, `htmlFor` en lugar de `for`).

---

### 3.3 Dependencias faltantes

* **Error:** `vite no se reconoce como comando`.
* **Causa:** dependencias no instaladas en workspace.
* **Solución:** ejecutar `pnpm install` y usar `pnpm -r build`.

---

### 3.4 KV Repository undefined

* **Error:** `Cannot read properties of undefined (reading 'get')`.
* **Causa:** `ctx.env.LINKS` no estaba definido correctamente en entorno local.
* **Solución:** añadir en `wrangler.toml` la sección `[[kv_namespaces]]` con `binding = "LINKS"`.

---

### 3.5 Archivos ausentes (`core/response`, `infra/kv`)

* **Error:** imports rotos en Functions (`Could not resolve ../../core/response`).
* **Causa:** el esqueleto inicial no incluía esas carpetas.
* **Solución:** se generaron los archivos base (`response.ts`, `access.ts`, `KvLinkRepository.ts`, etc.) dentro de `core/` e `infra/`.

---

### 3.6 Problemas de autenticación local

* **Error:** al entrar a `/admin/links` aparecía en blanco.
* **Causa:** faltaba simulación de autenticación (`localStorage.devAccessEmail`).
* **Solución:** se creó `/admin/dev-login` que guarda el correo y redirige a la ruta solicitada.

---

### 3.7 Loop infinito al cerrar sesión

* **Error:** la ruta `/admin/dev-login` se redirigía a sí misma en bucle.
* **Causa:** mal manejo del parámetro `next`.
* **Solución:** corrección para que al salir siempre redirija a `/admin/dev-login?next=/admin/links`.

---

### 3.8 Diferencia entre `/` y `/admin/links`

* **Observación:** en público se veían menos enlaces que en admin.
* **Causa:** el público lista solo **activos**; el admin lista **todos**.
* **Solución:** comportamiento esperado, documentado.

---

### 3.9 Estilos que no cargaban

* **Error:** el front buscaba `/assets/index-XXX.css` que no existía.
* **Causa:** configuración de estáticos en Functions (`[[path]].ts`).
* **Solución:** compilar con `vite build`, servir `/app.css` desde `ASSETS`, y asegurar que `routes.tsx` monta el CSS global.

---

### 3.10 Tipos de React faltantes en TypeScript

* **Error:** `No se encontró ningún archivo de declaración para 'react'`.
* **Causa:** faltaba instalar `@types/react` y `@types/react-dom`.
* **Solución:** instalar `pnpm add -D @types/react @types/react-dom`, ajustar `tsconfig.json` y limpiar duplicados en `env.d.ts`.

---

## 4. Resultado final del sistema

1. **Back-End** estable en Cloudflare Functions.
2. **Front-End** en React, minimalista, con vistas separadas para público y admin.
3. **KV Namespace** configurado para local y preparado para producción.
4. **Autenticación simulada** en local lista para ser reemplazada por Cloudflare Access en despliegue real.
5. **UI refinada** con cards, botones claros y tabla limpia.
6. **End-to-end tests** ejecutados y aprobados (creación, consulta, toggle, flush, QR, conteo de clics).

---

## 5. Glosario de términos

* **Slug:** identificador corto que sustituye la URL larga (ej. `/cf` → `https://cloudflare.com`).
* **KV (Key-Value Store):** base de datos distribuida de Cloudflare, usada para guardar enlaces.
* **Cloudflare Pages:** servicio de hosting de sitios estáticos y funciones serverless.
* **Functions:** funciones serverless que procesan peticiones dinámicas en Pages.
* **Wrangler:** CLI oficial de Cloudflare para gestionar proyectos, deploys y bindings.
* **Binding:** variable de entorno o recurso (ej. un KV) expuesto a las Functions.
* **Admin Host:** subdominio dedicado al panel administrativo.
* **Public Host:** dominio público donde resuelven los enlaces cortos.
* **Dev-login:** pantalla de simulación de login en entorno local.
* **Flush:** operación destructiva que elimina todo el contenido de un KV.
* **QR (Quick Response Code):** código bidimensional generado a partir de la URL corta.
* **React + Vite:** stack de front-end usado para crear la interfaz moderna y modular.
* **pnpm:** gestor de paquetes monorepo utilizado para dependencias.
* **TSX:** archivos TypeScript con sintaxis JSX para React.
* **TopBar:** barra superior del admin mostrando navegación y estado de sesión.

---

## 6. Conclusiones

El desarrollo de **ecv-shortener** permitió implementar un sistema completo con enfoque en:

* **Modularidad:** separación clara de back-end, front-end y capa de infraestructura.
* **Escalabilidad:** uso de Cloudflare KV como base distribuida y Pages como hosting sin servidores.
* **Seguridad:** administración protegida por autenticación, adaptable a Cloudflare Access.
* **Mantenibilidad:** arquitectura clara, componentes React reutilizables y funciones serverless independientes.

Este documento sirve como evidencia del proceso de desarrollo, las decisiones técnicas y los problemas resueltos.
