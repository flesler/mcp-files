import path from 'path'
import { defineConfig } from 'vitest/config'

const APP_NAME = path.basename(__dirname)

export default defineConfig(() => ({
  cacheDir: `/tmp/${APP_NAME}`,
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tmp'],
    reporters: ['dot'],
    logHeapUsage: false,
    outputFile: undefined, // Disable file output
    silent: false, // Keep error messages visible
    ui: false, // Disable web UI
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: { singleThread: false, useAtomics: true },
    },
    // Skip heavy operations for speed
    coverage: {
      enabled: false, // Disable by default for speed
    },
  },
  // Use ESM for better performance
  esbuild: {
    target: 'node20',
  },
}))
