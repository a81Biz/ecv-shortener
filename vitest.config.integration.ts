import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Usamos el entorno por defecto de Node para hacer peticiones HTTP
    environment: 'node',
    globals: true,
    // Aquí vivirán nuestras nuevas pruebas
    include: ['test/integration/*.spec.ts'],
  },
});