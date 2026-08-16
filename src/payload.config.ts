import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
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
import { AuditLogs } from './collections/AuditLogs'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Fail fast at boot rather than signing sessions with an empty secret or
// failing late with an opaque database error.
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_VERCEL = process.env.VERCEL === '1'
const IS_MIGRATION_COMMAND = process.argv.some((argument) => argument.startsWith('migrate'))

const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET
if (!PAYLOAD_SECRET) {
  throw new Error(
    'PAYLOAD_SECRET is required. Copy .env.example to .env and set a long random value.',
  )
}
if (IS_PRODUCTION && PAYLOAD_SECRET.length < 32) {
  throw new Error('PAYLOAD_SECRET must contain at least 32 characters in production.')
}

const RUNTIME_DATABASE_URL = process.env.DATABASE_URL
if (!RUNTIME_DATABASE_URL) {
  throw new Error('DATABASE_URL is required (PostgreSQL connection string).')
}
const DATABASE_URL =
  IS_MIGRATION_COMMAND && process.env.MIGRATION_DATABASE_URL
    ? process.env.MIGRATION_DATABASE_URL
    : RUNTIME_DATABASE_URL

// Without SMTP the email adapter falls back to ethereal.email, a third-party
// mock service — password-reset links (and the staff addresses they embed)
// must never leave via that path in production.
const SMTP_HOST = process.env.SMTP_HOST
if (IS_PRODUCTION && !SMTP_HOST) {
  throw new Error(
    'SMTP_HOST is required in production so transactional email uses a real provider.',
  )
}

const storage = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  bucket: process.env.S3_BUCKET,
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
}
const storageConfigured = Object.values(storage).every(Boolean)
if (IS_VERCEL && !storageConfigured) {
  throw new Error(
    'S3 storage is required on Vercel. Configure S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.',
  )
}

if (IS_VERCEL) {
  const requiredVercelVariables = [
    'MIGRATION_DATABASE_URL',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    'SMTP_FROM',
    'SMTP_PASS',
    'SMTP_USER',
  ] as const
  const missingVariables = requiredVercelVariables.filter((name) => !process.env[name])
  if (missingVariables.length) {
    throw new Error(`Missing required Vercel environment variables: ${missingVariables.join(', ')}`)
  }

  for (const [name, value] of [
    ['DATABASE_URL', RUNTIME_DATABASE_URL],
    ['MIGRATION_DATABASE_URL', process.env.MIGRATION_DATABASE_URL!],
    ['NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL!],
  ] as const) {
    const parsed = new URL(value)
    if (['localhost', '127.0.0.1'].includes(parsed.hostname)) {
      throw new Error(`${name} cannot point to localhost on Vercel.`)
    }
  }
  if (!process.env.NEXT_PUBLIC_SITE_URL!.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS on Vercel.')
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Articles, Incidents, CommunityContributions, Reviews, Media, AuditLogs],
  editor: lexicalEditor(),
  secret: PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL,
      // Vercel functions are short-lived. A single client-side connection per
      // function works with Supabase's transaction-mode pooler without
      // exhausting the free project's backend connection allowance.
      max: IS_VERCEL && !IS_MIGRATION_COMMAND ? 1 : undefined,
    },
    // Schema changes ship via migrations only. Dev-mode push would silently
    // revert the hand-fixed FK delete rules (see
    // 20260810_110000_fix_relationship_delete_rules) — Payload's generated DDL
    // cannot express them. Run `pnpm payload migrate` after pulling, and
    // `pnpm payload migrate:create <name>` after changing collections.
    push: false,
    // Pending migrations run automatically when the production server boots,
    // so deploying a new container also migrates its database.
    // Long-running Docker services migrate once while starting. Vercel runs
    // migrations once in `vercel-build` instead of racing on cold starts.
    ...(!IS_VERCEL ? { prodMigrations: migrations } : {}),
  }),
  // Transactional email (password recovery, verification). SMTP_* is required
  // in production; in development, mail goes to an Ethereal test inbox logged
  // at boot.
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM || 'no-reply@example.com',
    defaultFromName: 'Hồ Sơ Mở',
    ...(SMTP_HOST
      ? {
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: ['465', '2465'].includes(process.env.SMTP_PORT || ''),
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
  plugins: [
    s3Storage({
      // Keep the generated schema identical in local development and on
      // Vercel even when cloud credentials are only present in production.
      alwaysInsertFields: true,
      bucket: storage.bucket || 'media',
      clientUploads: {
        access: ({ req }) => Boolean(req.user),
      },
      collections: {
        media: {
          prefix: 'media',
          signedDownloads: true,
        },
      },
      config: {
        credentials: {
          accessKeyId: storage.accessKeyId || 'disabled-locally',
          secretAccessKey: storage.secretAccessKey || 'disabled-locally',
        },
        endpoint: storage.endpoint || 'http://127.0.0.1',
        forcePathStyle: true,
        region: storage.region || 'local',
      },
      enabled: storageConfigured,
    }),
  ],
})
