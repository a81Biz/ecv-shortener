import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'junit'],
      reportsDirectory: 'reports',
      thresholds: {
        lines: 0,
        functions: 0,
        statements: 0,
        branches: 0
      }
    },
    outputFile: {
      junit: 'reports/junit-domain.xml'
    }
  }
})
