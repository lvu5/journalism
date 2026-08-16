import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    // Next replaces this marker at build time. Vitest runs server actions in
    // jsdom, so map only the test environment to a no-op marker.
    alias: { 'server-only': fileURLToPath(new URL('./tests/server-only.ts', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.{ts,tsx}'],
    // Payload init and real Postgres round-trips are slower than unit tests.
    testTimeout: 30_000,
    hookTimeout: 90_000,
    // One shared database: run spec files serially so Payload's dev-mode
    // schema push and the test fixtures cannot race each other.
    fileParallelism: false,
  },
})
