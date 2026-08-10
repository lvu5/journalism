import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Incidents } from './collections/Incidents'
import { Reviews } from './collections/Reviews'
import { CommunityContributions } from './collections/CommunityContributions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Fail fast at boot rather than signing sessions with an empty secret or
// failing late with an opaque database error.
const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET
if (!PAYLOAD_SECRET) {
  throw new Error(
    'PAYLOAD_SECRET is required. Copy .env.example to .env and set a long random value.',
  )
}
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required (PostgreSQL connection string).')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Articles, Incidents, CommunityContributions, Reviews, Media],
  editor: lexicalEditor(),
  secret: PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL,
    },
  }),
  upload: {
    limits: {
      // Payload-wide cap so any authenticated uploader cannot exhaust disk.
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  },
  sharp,
  plugins: [],
})
