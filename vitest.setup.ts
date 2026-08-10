// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// The Payload config fails fast without these (see payload.config.ts). Test
// runs get throwaway defaults; real values always win when set.
process.env.PAYLOAD_SECRET ||= 'integration-test-secret-do-not-use-in-production'

// Integration tests must never touch the development database. Override with
// TEST_DATABASE_URL; the default is a dedicated database on the local dev
// Postgres (create it once with: createdb journalism_test && pnpm migrate:test).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgres://journalism:journalism@127.0.0.1:5432/journalism_test'
