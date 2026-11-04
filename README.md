# MBA OS

**The MBA aspirant's companion.** A research-led preparation platform for CAT and other MBA entrance examinations.

## Product direction

- Professional, minimal visual identity: DM Sans throughout, warm paper surfaces and restrained ink typography.
- Question discovery, concept library, timed practice, mock examinations and preparation analytics.
- Source-aware content ingestion with provenance and verification status.
- Next.js App Router, TypeScript, Tailwind CSS 4, daisyUI, GSAP, Heroicons and Drizzle ORM.

## Getting started

1. Use Node.js 22.13 or later.
2. Copy `.env.example` to `.env.local`.
3. Add a newly rotated Neon PostgreSQL connection string to `DATABASE_URL`.
4. Install dependencies with `npm install`.
5. Start the development server with `npm run dev`.

## Environment variables

See `.env.example`. Never commit `.env.local`, database passwords, API keys or production credentials.

## Content integrity

Imported educational data must retain source attribution, page/slot metadata, answer provenance and a review status. Do not assume a compilation layout identifies the original source of a question. Preserve each question’s actual provenance and publish only material that is public, user-created or appropriately licensed. See `docs/content-ingestion.md`.

## Database foundation

The initial Drizzle schema and Neon connection are in `lib/db`. Generate and review the first migration locally before applying it to Neon:

```bash
npm install
cp .env.example .env.local
# Set a newly rotated Neon DATABASE_URL in .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

Check `/api/health` for database connectivity. Generate and apply the schema migration, then run `npm run db:seed` to add the initial CAT, XAT, SNAP, NMAT and CMAT exam taxonomy. The dedicated PYQ library is available at `/pyqs`, the topic accordion learning library at `/learn`, the mock/sectional test catalogue at `/tests`, the source-aware college directory at `/colleges`, the admission calendar at `/calendar`, and the admin import/review workspace at `/admin/questions`. Completed test attempts include a detailed answer review. Public question endpoints only return published records. The protected ingestion endpoint requires `ADMIN_IMPORT_TOKEN` and always queues imported questions as unpublished for review. See `docs/database-setup.md` for details.

## Current implementation

The public landing page, PYQ library, topic-based learning library, published test catalogue, timed test runner, shared modal system, admin import/review workspace, database APIs and taxonomy seed script are committed. The first migration still needs to be generated and applied against the user's Neon database. Authentication, student-owned attempt history, analytics, a full content authoring editor and production hardening remain in progress.
