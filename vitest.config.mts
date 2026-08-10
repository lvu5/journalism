import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
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
