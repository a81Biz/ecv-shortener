import { onRequestPost as __admin_api_admin_flush_ts_onRequestPost } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\admin\\flush.ts"
import { onRequestGet as __admin_api_qr__slug__ts_onRequestGet } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\qr\\[slug].ts"
import { onRequestPatch as __admin_api__slug__state_ts_onRequestPatch } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\[slug]\\state.ts"
import { onRequestPost as __admin_api_create_ts_onRequestPost } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\create.ts"
import { onRequestGet as __admin_api_links_ts_onRequestGet } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\links.ts"
import { onRequestGet as __admin_api_whoami_ts_onRequestGet } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\whoami.ts"
import { onRequestGet as __ui_api_links_ts_onRequestGet } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\ui\\api\\links.ts"
import { onRequestDelete as __admin_api__slug__ts_onRequestDelete } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\[slug].ts"
import { onRequestGet as __admin_api__slug__ts_onRequestGet } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\[slug].ts"
import { onRequestPut as __admin_api__slug__ts_onRequestPut } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\admin\\api\\[slug].ts"
import { onRequestGet as __ui_api__slug__ts_onRequestGet } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\ui\\api\\[slug].ts"
import { onRequest as ____path___ts_onRequest } from "C:\\DevOps\\Desarrollos\\ecv-shortener\\functions\\[[path]].ts"

export const routes = [
    {
      routePath: "/admin/api/admin/flush",
      mountPath: "/admin/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__admin_api_admin_flush_ts_onRequestPost],
    },
  {
      routePath: "/admin/api/qr/:slug",
      mountPath: "/admin/api/qr",
      method: "GET",
      middlewares: [],
      modules: [__admin_api_qr__slug__ts_onRequestGet],
    },
  {
      routePath: "/admin/api/:slug/state",
      mountPath: "/admin/api/:slug",
      method: "PATCH",
      middlewares: [],
      modules: [__admin_api__slug__state_ts_onRequestPatch],
    },
  {
      routePath: "/admin/api/create",
      mountPath: "/admin/api",
      method: "POST",
      middlewares: [],
      modules: [__admin_api_create_ts_onRequestPost],
    },
  {
      routePath: "/admin/api/links",
      mountPath: "/admin/api",
      method: "GET",
      middlewares: [],
      modules: [__admin_api_links_ts_onRequestGet],
    },
  {
      routePath: "/admin/api/whoami",
      mountPath: "/admin/api",
      method: "GET",
      middlewares: [],
      modules: [__admin_api_whoami_ts_onRequestGet],
    },
  {
      routePath: "/ui/api/links",
      mountPath: "/ui/api",
      method: "GET",
      middlewares: [],
      modules: [__ui_api_links_ts_onRequestGet],
    },
  {
      routePath: "/admin/api/:slug",
      mountPath: "/admin/api",
      method: "DELETE",
      middlewares: [],
      modules: [__admin_api__slug__ts_onRequestDelete],
    },
  {
      routePath: "/admin/api/:slug",
      mountPath: "/admin/api",
      method: "GET",
      middlewares: [],
      modules: [__admin_api__slug__ts_onRequestGet],
    },
  {
      routePath: "/admin/api/:slug",
      mountPath: "/admin/api",
      method: "PUT",
      middlewares: [],
      modules: [__admin_api__slug__ts_onRequestPut],
    },
  {
      routePath: "/ui/api/:slug",
      mountPath: "/ui/api",
      method: "GET",
      middlewares: [],
      modules: [__ui_api__slug__ts_onRequestGet],
    },
  {
      routePath: "/:path*",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [____path___ts_onRequest],
    },
  ]