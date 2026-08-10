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
- PostgreSQL-backed content and authentication

The public site shows clearly labelled demonstration content until the first real article or incident is published.

## Stack

- Next.js 16 and React 19
- Payload CMS 3
- PostgreSQL
- TypeScript
- React Markdown, GFM, and HTML sanitization
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
```

Run `pnpm generate:types` whenever a Payload collection or field changes.

## Before a public launch

- Add mandatory MFA or an MFA-capable identity provider for staff accounts.
- Configure a transactional email provider for verification and password recovery.
- Move uploads to private S3-compatible storage and use signed access for unpublished files.
- Add rate limiting and bot protection to community intake, plus a WAF, encrypted off-site backups, and log redaction.
- Replace the local database credentials and rotate `PAYLOAD_SECRET`.
- Review publication, corrections, source-protection, and takedown policies with qualified local counsel.
# journalism
