import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    pool: "workers",              // Usa el runtime Cloudflare
    environment: "miniflare",     // Entorno básico
    globals: true,                // Habilita expect, fetch, etc.
    include: ["tests/functions/**/*.spec.ts"], // Solo tests de Functions
  },
});
