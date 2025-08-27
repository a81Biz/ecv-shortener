# 1) Qué es el producto

Un **servicio de URLs cortas** y **QRs mínimos** para uso interno de *El Castillo Vagabundo* (y aliados autorizados).

* Dominio público: **`ecv.lat`** → resuelve URLs cortas tipo `https://ecv.lat/x7` y redirige al destino largo.
* Panel privado: **`admin.ecv.lat`** → crea, edita, desactiva y consulta enlaces. Acceso controlado por **correo** usando **Cloudflare Access** con **Google como IdP** (Single Sign-On).

# 2) Objetivo

* Facilitar **enlaces ultra-cortos** para **QRs muy pequeños** (tokens 3D, stickers, carteles).
* Centralizar la **gestión de slugs** (códigos cortos) con control de acceso por **lista de correos autorizados**.
* Minimizar costos y complejidad (sin servidores dedicados, aprovechando Cloudflare Pages/Workers).

# 3) Usuarios y permisos

* **Administradores** (tú y quien autorices por correo):

  * Entrar al panel `admin.ecv.lat` (SSO Google vía Cloudflare Access).
  * Crear/editar/eliminar **slugs**.
  * Generar y **descargar QR (SVG/PNG)** por slug.
  * Ver métricas básicas (clics, últimos accesos).
* **Público**:

  * Accede a `https://ecv.lat/{slug}` y es **redirigido** a la URL larga. No requiere login.

# 4) Qué hace (funcionalidades V1)

1. **Creación de enlace corto**

   * Formulario: *URL destino* + *slug* (opcional; si lo omites, se genera uno corto).
   * Validaciones: URL válida; slug único; longitud mínima (1–3 caracteres recomendado).
2. **Gestión de enlaces**

   * Listado con búsqueda/filtrado (por slug, etiqueta, fecha).
   * Editar destino, activar/desactivar, copiar link, ver QR.
3. **Generación de QR**

   * **SVG** (vector) y **PNG**.
   * Parámetros por defecto para QR **mínimo**: Versión 1 (21×21), corrección **L**, borde 1.
4. **Métricas básicas**

   * Conteo de clics por slug.
   * Último acceso (timestamp).
   * (Opcional V1.1) UTM helper al crear destino.
5. **Seguridad de acceso al panel**

   * **Cloudflare Access + Google IdP**: solo correos autorizados entran al panel.
   * Sin manejo de contraseñas ni secretos TOTP propios.
6. **Experiencia pública**

   * `GET /{slug}` → **301/302** al destino. Siempre público.
   * `404` claro si el slug no existe o está desactivado.

# 5) Lo que **no** hará en V1 (para acotar)

* No habrá registro/alta de usuarios desde la app (el **control es por Access** y tu lista de correos).
* No hay *roles* granulares (admin vs editor) en V1: quien entra al panel, administra.
* Sin caducidades automáticas por fecha (se puede añadir en V2).
* Sin estadísticas avanzadas (geografía, navegador, IP) — solo conteo y último acceso (V1).
* Sin APIs públicas para terceros (solo UI y endpoints internos del panel).
* Sin páginas de destino personalizadas (solo redirección).

# 6) Reglas de negocio

* **Slug**

  * Único global (no duplicable).
  * Permitidos: `[A-Za-z0-9_-]`. Recomendado: **base62** (0–9, A–Z, a–z) de 1–3 chars para QR mínimo.
  * Puede **desactivarse** (mantiene histórico; devuelve 404 si inactivo).
* **URL destino**

  * Debe ser válida (`http/https`).
  * (Opcional) Normalizar (`https://` por defecto).
* **QR**

  * Por defecto: v1/L/borde1 en **SVG**; posibilidad de exportar **PNG**.
  * El QR siempre codifica la **URL corta** (no la larga).
* **Auditoría mínima**

  * Guarda: creador (email), fecha creación, fecha edición, estado (activo/inactivo), contador de clics, último acceso.

# 7) Flujo de uso (resumen)

1. **Admin entra** a `admin.ecv.lat` → Cloudflare Access verifica su **correo** con Google → acceso concedido.
2. **Crea slug** con URL destino → obtiene `https://ecv.lat/{slug}` y descarga QR.
3. **Comparte/Imprime** el QR/URL donde lo necesite.
4. **Usuarios finales escanean/clican** → `ecv.lat/{slug}` responde con **redirect** al destino.
5. **Admin consulta** métricas (clics/último acceso) en el panel.

# 8) Arquitectura (alto nivel, sin entrar al detalle técnico)

* **Front (React SPA)**: una sola base de código.

  * **`admin.ecv.lat`**: renderiza el panel (protegido por Access).
  * **`ecv.lat`**: landing simple (opcional) y manejo público de slugs (por Functions).
* **Cloudflare Pages + Functions (o Worker)**:

  * `GET /{slug}`: busca destino en **KV** y redirige.
  * `POST /admin/api/create|update|disable|list`: gestionan slugs (accesibles solo tras Access).
* **Almacenamiento**: **Workers KV** (clave: slug → valor: JSON con destino y metadatos).
* **Seguridad**: **Cloudflare Access + Google** (lista de correos permitidos).
* **DNS**: `ecv.lat` (público), `admin.ecv.lat` (panel). Ambos apuntan al **mismo proyecto** con rutas/hosts diferenciados.

# 9) UX/UI (puntos clave)

* Panel limpio con:

  * **Crear enlace** (URL + slug opcional + etiqueta opcional).
  * **Tabla**: slug, destino (truncado), estado, clics, último acceso, acciones (copiar, QR, editar, desactivar).
  * **Modal/aside** para **QR** con descarga SVG/PNG.
  * **Buscador** por slug y filtro por estado.
* Notificaciones (“enlace creado”, “slug no disponible”, etc.).
* Copia en 1 clic de URL corta y del **SVG**.

# 10) Métricas de éxito (KPIs)

* **Tiempo de creación** de un enlace (< 10 segundos).
* **Tasa de lectura de QR** en condiciones reales (token 3D, stickers).
* **Estabilidad de redirecciones** (sin errores 5xx; latencia < 150 ms).
* **0 incidencias** de acceso no autorizado al panel.

# 11) Operación y gobernanza

* **Control de acceso**: únicamente correos autorizados en Cloudflare Access.
* **Backups**: exportación periódica del namespace **KV** (CSV/JSON) a repositorio privado.
* **Versionado**: cambios en slugs guardan “lastEditedBy/at” y estado (activo/inactivo).
* **Naming**: reservar slugs “cortísimos” (1–2 chars) para contenidos críticos/impresos.
* **Soporte**: incidencias vía correo interno; logs de errores de Functions.

# 12) Riesgos y mitigaciones

* **Pérdida/robo de slug crítico** → solo admins con Access; posibilidad de **desactivar** y **remapear**.
* **Phishing** (alguien crea slug a sitio malicioso) → lista limitada de **admins** + revisión visual en el panel.
* **Abuso de acceso** → Cloudflare Access con MFA de Google del lado de cada cuenta; revocación por correo.
* **Latencia o caídas** → usar **301** cacheable; Cloudflare edge reduce latencia global.

# 13) Legal y privacidad

* No se almacena **dato personal** del público (solo conteo y timestamp anónimo).
* Se registra **email del admin** (por Access) como “creado por / editado por”.
* Aviso de privacidad: incluir una nota en el panel (no visible para público) y en documentación interna.

# 14) Roadmap sugerido

* **V1**: CRUD de slugs, QR SVG/PNG, métricas básicas, Access + Google, KV.
* **V1.1**: Expiración opcional por fecha; etiquetas y búsqueda mejorada.
* **V2**: Import/export masivo (CSV), roles (admin/editor), API privada firmada, estadísticas ampliadas (país/navegador).
