// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// The Payload config fails fast without these (see payload.config.ts). Test
// runs get throwaway defaults; real values always win when set.
process.env.PAYLOAD_SECRET ||= 'integration-test-secret-do-not-use-in-production'
process.env.DATABASE_URL ||=
  'postgres://journalism:journalism@127.0.0.1:5432/journalism'
