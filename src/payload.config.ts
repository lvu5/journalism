import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Articles, Incidents, CommunityContributions, Reviews, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Pending migrations run automatically when the production server boots,
    // so deploying a new container also migrates its database.
    prodMigrations: migrations,
  }),
  // Transactional email (password recovery, verification). With SMTP_HOST set,
  // mail goes out over SMTP; otherwise it is logged to the server console.
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM || 'no-reply@example.com',
    defaultFromName: 'Hồ Sơ Mở',
    ...(process.env.SMTP_HOST
      ? {
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            ...(process.env.SMTP_USER
              ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
              : {}),
          },
        }
      : {}),
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
