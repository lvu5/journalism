# Hồ Sơ Mở — Open Journalism Vietnam

An MVP for a Vietnamese investigative-journalism publication. It combines a public newsroom with a private editorial workflow for authors, reviewers, and administrators.

## What is included

- Public homepage with a lead investigation, recent articles, and a notable incident
- Recent-articles index
- Case index with a five-stage public lifecycle and separate verification state
- Public case pages with structured sources and approved community evidence
- Moderated community contribution intake for cases that opt into crowdsourcing
- Accessible incident timeline
- Markdown article pages with sanitized output and structured citations
- Payload admin area at `/admin`
- Supabase email/password accounts for public authors, with email confirmation and password reset
- A separate author area at `/author` for submitting and tracking articles
- Drafts, autosave, revision history, and separated workflow states
- Role-aware access for administrators, reviewers, and authors
- Private review decisions and feedback
- Dated public corrections on published articles
- Encrypted contributor contact emails (AES-256-GCM) and an append-only audit log
- Terminal review queue for contribution triage (`pnpm tui`)
- PostgreSQL-backed content and Supabase-backed public authentication

## Stack

- Next.js 16 and React 19
- Payload CMS 3
- Supabase Auth, PostgreSQL, and private S3-compatible media storage
- Cloudflare Turnstile
- Resend-compatible SMTP
- TypeScript
- React Markdown, GFM, and HTML sanitization
- Ink (terminal UI)
- Playwright and Vitest

## Local setup

Requirements: Node.js 20.9 or newer, pnpm, and PostgreSQL 14 or newer.

1. Copy `.env.example` to `.env`.
2. Create a PostgreSQL role and database that match `DATABASE_URL`.
3. Replace `PAYLOAD_SECRET` with a long random value.
4. Add the URL and publishable key from your Supabase project to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Install, migrate, and run:

   ```bash
   pnpm install
   pnpm payload migrate
   pnpm dev
   ```

6. Before opening public registration, open `http://localhost:3000/admin` and create the first staff user. The first user receives the administrator role. This must happen before the first Supabase author is confirmed.

The public site is available at `http://localhost:3000`.

### PostgreSQL with Docker

The included Compose file runs only PostgreSQL, leaving the app on the host for fast reloads:

```bash
docker compose up -d
pnpm dev
```

## Supabase Auth setup

Public authors use Supabase; reviewers and administrators continue to use Payload at `/admin`.

In Supabase Auth:

1. Enable the Email provider and keep **Confirm email** enabled.
2. Set **Site URL** to `http://localhost:3000` locally and to `NEXT_PUBLIC_SITE_URL` in production.
3. Add `http://localhost:3000/auth/callback` and the production equivalent to **Redirect URLs**.
4. For SSR confirmation, change the **Confirm signup** email link to:

   ```text
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/author
   ```

5. Change the **Reset password** email link to:

   ```text
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/update-password
   ```

Configure custom SMTP before launch. Supabase's built-in sender is intended only for testing and has a very low delivery limit.

No Supabase `service_role` key is required by this app. Do not put one in a `NEXT_PUBLIC_*` variable.

## Editorial roles

- **Public registration:** `/register` creates a Supabase account. After email confirmation, the server creates a linked, active Payload Author profile with an inaccessible random local password. Reviewer and Administrator roles remain administrator-controlled.
- **Author:** uses `/author` to submit reporting and track its status. The public session never grants access to `/admin`.
- **Reviewer:** has author capabilities and can review all submitted work, approve it, request changes, or reject it.
- **Administrator:** manages users and roles, controls incidents and media, and is the only role that publishes in the MVP.

A user can have more than one role. Reviewers can therefore continue writing under the same account.

## Article workflow

```text
Draft → Submitted → In review → Changes requested → Submitted
                              ↘ Approved → Published
                              ↘ Rejected
```

Payload's `_status` remains `draft` throughout editorial review. It changes to `published` only when an administrator publishes, preventing workflow approval from accidentally making a story public.

## Case and community workflow

Case lifecycle labels are public and intentionally separate from evidence verification:

```text
Hồ sơ mới mở → Đang điều tra → Kêu gọi cộng đồng → Đang thẩm định → Đã đóng hồ sơ
```

An editor can enable community intake on any case except a closed case. Public submissions use this private review queue:

```text
Đã tiếp nhận → Đang sàng lọc → Cần thêm thông tin
                              ↘ Đã duyệt → optionally shown on the case
                              ↘ Không sử dụng
```

Raw writes to the contribution collection are blocked. The server-side intake validates the case and form, sets every submission to `Received`, and prevents public display until a reviewer both approves it and selects `Show on the public case page`. Contact email, consent records, and reviewer notes stay private. Contact emails are encrypted at rest (AES-256-GCM, key derived from `PAYLOAD_SECRET`), and staff views of individual submissions plus every review-status change are recorded in an append-only audit log (admins can read it; nobody can edit or delete entries).

The MVP accepts source links rather than file uploads. Add a secure, encrypted document-drop workflow before asking sources to submit sensitive files.

## Content model

- **Articles:** title, event date, summary, Markdown body, optional account authors, optional public bylines, keyed citations (`\\cite{source-key}`), topics, related incidents, and workflow state.
- **Cases:** event date range, lifecycle status, verification status, crowdsourcing switch, significance, severity, citations, location, and related articles.
- **Community contributions:** case, contribution type, public content, private contact details, review state, reviewer notes, and publication approval.
- **Reviews:** private reviewer decision and feedback linked to an article.
- **Users:** Payload profile, Supabase identity mapping, roles, active state, staff login protection, and revision history.
- **Media:** images or PDFs, private by default and public only when explicitly marked.

## Useful commands

```bash
pnpm dev              # local development
pnpm build            # production build
pnpm generate:types   # refresh Payload-generated TypeScript types
pnpm lint             # lint the codebase
pnpm test:int         # integration tests
pnpm test:e2e         # browser tests
pnpm tui              # terminal review queue (staff)
```

Integration and browser tests never touch the development database. They use a dedicated `journalism_test` database (overridable via `TEST_DATABASE_URL`). Set it up once:

```bash
docker compose up -d
docker exec journalism-postgres-1 psql -U journalism -c "CREATE DATABASE journalism_test"
pnpm migrate:test
```

Run `pnpm generate:types` whenever a Payload collection or field changes.

Schema changes ship through migrations only — dev-mode schema push is disabled (`push: false`) because Payload's generated DDL cannot express the hand-tuned foreign-key delete rules. After changing a collection or field, run `pnpm payload migrate:create <change-name>` and commit both the migration and its `.json` snapshot; apply it locally with `pnpm payload migrate` and to the test database with `pnpm migrate:test`. A healthy check: `migrate:create` on an unchanged schema should report "No schema changes detected".

## Terminal review queue (TUI)

Reviewers and administrators can triage community contributions from the terminal:

```bash
pnpm tui
```

It uses the same `.env` (`DATABASE_URL`, `PAYLOAD_SECRET`) as the app — no extra setup beyond `docker compose up -d`.

Sign in with a reviewer or admin account. The queue lists pending submissions; open one to screen it, request more information, approve it, mark it unused, toggle public display (approved only), or edit private reviewer notes. The TUI talks to Payload's local API with your user attached, so every server-side rule still applies: role checks, review workflow hooks, contact-email decryption only for staff, and the append-only audit log all work exactly as in the admin UI.

## Deploy to Vercel

The recommended low-cost MVP setup is Vercel for the Next.js application, the existing Supabase project for PostgreSQL, Auth, and media storage, Cloudflare Turnstile for signup protection, and Resend for transactional email. Vercel's Hobby plan is suitable only while this remains a personal, non-commercial project; review its plan terms before monetizing the site.

### 1. Prepare Supabase

1. In **Project Settings → Database**, copy two connection strings:
   - Use the **transaction-mode pooler** (port `6543`) for `DATABASE_URL`. Serverless requests use this connection with a one-connection pool per function.
   - Use the direct connection, or the **session-mode pooler** (port `5432`) if IPv4 is required, for `MIGRATION_DATABASE_URL`.
2. In **Storage**, create a private bucket named `media`.
3. Enable the project's S3 connection and create an S3 access key. Record the endpoint, region, access-key ID, and secret. The app serves private media through signed downloads and uploads directly from authenticated Payload sessions.
4. Add a bucket CORS rule that permits `PUT` from the production site origin. Add `http://localhost:3000` only if cloud uploads are also needed during local development.

Do not use the Supabase `service_role` key for any of these values, and never expose S3 credentials through a `NEXT_PUBLIC_*` variable.

### 2. Configure Turnstile and email

1. Create a Cloudflare Turnstile widget for the production hostname and record its public site key and secret key.
2. In **Supabase → Auth → Bot and Abuse Protection**, enable Turnstile and enter the secret key. The app sends the browser token to Supabase for login, registration, and password-recovery requests.
3. In Resend, verify the sending domain and create an API key.
4. In **Supabase → Auth → SMTP Settings**, use Resend's SMTP host, port, username, API key, and a sender on the verified domain. This delivers public account confirmations and password resets.
5. Keep the confirmation and reset templates from [Supabase Auth setup](#supabase-auth-setup), then set the production **Site URL** and `/auth/callback` redirect URL.

### 3. Add Vercel environment variables

Import the GitHub repository into Vercel and set these for the **Production** environment before the first deployment:

```text
DATABASE_URL
MIGRATION_DATABASE_URL
PAYLOAD_SECRET
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
S3_BUCKET
S3_ENDPOINT
S3_REGION
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS
SMTP_FROM
```

Generate a unique `PAYLOAD_SECRET` of at least 32 characters and store it only in Vercel. `NEXT_PUBLIC_SITE_URL` must be the final HTTPS origin without a trailing path. `SMTP_PASS` is the Resend API key; `SMTP_FROM` must use the verified sending domain.

The committed `vercel.json` runs `pnpm run vercel-build`. That command applies committed Payload migrations with `MIGRATION_DATABASE_URL` and then builds the site. Avoid attaching preview deployments to the production database: preview builds would also run migrations. Use a separate Supabase project for previews, or disable previews for the MVP.

### 4. Launch and verify

1. Deploy from the production branch and attach the final domain in Vercel.
2. Update the Supabase Auth Site URL, redirect allow-list, Turnstile hostname, and Storage CORS origin if the final domain changed.
3. Visit `/admin` and create the first Payload administrator before allowing public registrations.
4. Verify registration and confirmation, login/logout, password reset, article submission, staff review, media upload, and one public article on the production domain.
5. Keep Vercel and Supabase usage alerts enabled. Free plans are enough for a small launch but have storage, traffic, email, and compute limits.

## Before a public launch

- Add mandatory MFA or an MFA-capable identity provider for staff accounts.
- Review Supabase Auth rate limits before opening public registration.
- Community intake already has a per-instance rate limit and honeypot; add a shared rate-limit store for multi-instance deployments and extend Turnstile protection to that form before promoting it widely.
- Replace the local database credentials. Rotating `PAYLOAD_SECRET` additionally requires re-encrypting stored contributor emails (see the runbook in `src/lib/field-crypto.ts`).
- Schedule PostgreSQL and private-media backups; free tiers should not be treated as the only copy of investigative material.
- Review publication, corrections, source-protection, and takedown policies with qualified local counsel.
