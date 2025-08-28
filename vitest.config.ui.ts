import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['apps/web/**/*.spec.ts?(x)'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      include: ['apps/web/src/**'],
      reportsDirectory: 'coverage/ui',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    setupFiles: [],
  },
});
