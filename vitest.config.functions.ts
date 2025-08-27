import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { resolve } from "path";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        // Esta es la parte CRÍTICA que faltaba.
        // Apunta al punto de entrada de tu worker.
        main: resolve(__dirname, "functions/[[path]].ts"),
        wrangler: {
          configPath: resolve(__dirname, "wrangler.toml"),
        },
      },
    },
    // Con "poolOptions" definido, el resto funciona como se espera.
    pool: "workers",
    globals: true,
    include: ["tests/functions/smoke.spec.ts"], // <-- Atención a esta línea
  },
});