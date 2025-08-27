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