import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

// The Playwright runner process also talks to the database directly (seed
// helpers call getPayload). Force the same test database the webServer uses,
// before any helper imports the Payload config — otherwise seeding lands in
// the development database (or crashes on the fail-fast env check).
process.env.PAYLOAD_SECRET ||= 'e2e-test-secret-do-not-use-in-production'
const testDatabaseURL =
  process.env.TEST_DATABASE_URL ||
  'postgres://journalism:journalism@127.0.0.1:5432/journalism_test'
process.env.DATABASE_URL = testDatabaseURL

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    // E2E tests seed and delete real users — never run them against the dev database.
    command: `cross-env DATABASE_URL=${testDatabaseURL} pnpm dev`,
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:3000',
  },
})
