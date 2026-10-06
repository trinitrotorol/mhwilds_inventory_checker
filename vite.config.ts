import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

import { resolveBasePath } from './config/basePath'

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd())

  return {
    base: resolveBasePath(environment.VITE_BASE_PATH),
    plugins: [react()],
  test: {
    isolate: process.env.VITEST_REUSE_ENV !== '1',
      maxWorkers: 1,
      pool: 'threads',
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'config/**/*.{test,spec}.ts'],
      css: true,
    },
  }
})
