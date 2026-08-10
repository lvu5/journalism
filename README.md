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
- Drafts, autosave, revision history, and separated workflow states
- Role-aware access for administrators, reviewers, and authors
- Private review decisions and feedback
- Dated public corrections on published articles
- Encrypted contributor contact emails (AES-256-GCM) and an append-only audit log
- Terminal review queue for contribution triage (`pnpm tui`)
- PostgreSQL-backed content and authentication

The public site shows clearly labelled demonstration content until the first real article or incident is published.

## Stack

- Next.js 16 and React 19
- Payload CMS 3
- PostgreSQL
- TypeScript
- React Markdown, GFM, and HTML sanitization
- Ink (terminal UI)
- Playwright and Vitest

## Local setup

Requirements: Node.js 20.9 or newer, pnpm, and PostgreSQL 14 or newer.

1. Copy `.env.example` to `.env`.
2. Create a PostgreSQL role and database that match `DATABASE_URL`.
3. Replace `PAYLOAD_SECRET` with a long random value.
4. Install and run:

   ```bash
   pnpm install
   pnpm dev
   ```

5. Open `http://localhost:3000/admin` and create the first user. The first user receives the administrator role.

The public site is available at `http://localhost:3000`.

### PostgreSQL with Docker

The included Compose file runs only PostgreSQL, leaving the app on the host for fast reloads:

```bash
docker compose up -d
pnpm dev
```

## Editorial roles

- **Author:** creates and edits their own drafts, then moves them to `Submitted`. An author can revise a story after changes are requested.
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

- **Articles:** title, event date, summary, Markdown body, optional account authors, optional public bylines, citations, topics, related incidents, and workflow state.
- **Cases:** event date range, lifecycle status, verification status, crowdsourcing switch, significance, severity, citations, location, and related articles.
- **Community contributions:** case, contribution type, public content, private contact details, review state, reviewer notes, and publication approval.
- **Reviews:** private reviewer decision and feedback linked to an article.
- **Users:** profile, roles, active state, login protection, and revision history.
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

## Before a public launch

- Add mandatory MFA or an MFA-capable identity provider for staff accounts.
- Configure production SMTP credentials (`SMTP_HOST` is required at boot in production; development falls back to an Ethereal test inbox).
- Move uploads to private S3-compatible storage and use signed access for unpublished files. Until then, mount a persistent volume at `/app/media` — the container's upload directory is writable by the app user but ephemeral without a volume.
- Community intake already has a per-instance rate limit and honeypot; add a shared rate-limit store (multi-instance), bot protection, and a WAF before opening it widely.
- Replace the local database credentials. Rotating `PAYLOAD_SECRET` additionally requires re-encrypting stored contributor emails (see the runbook in `src/lib/field-crypto.ts`).
- Review publication, corrections, source-protection, and takedown policies with qualified local counsel.
