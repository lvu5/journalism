// Entry point for the staff review-queue TUI: `pnpm tui`
// Loads .env (DATABASE_URL, PAYLOAD_SECRET) before touching Payload config,
// which fails fast without them.
import 'dotenv/config'

import React from 'react'
import { render } from 'ink'

import { App } from './App'

render(<App />)
