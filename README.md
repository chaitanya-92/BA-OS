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

Check `/api/health` for database connectivity. The published-question endpoint is `GET /api/questions`; unpublished records are excluded by default. See `docs/database-setup.md` for details.

## Current implementation

The public landing page, database schema foundation, database health endpoint and initial published-question API are committed. The first migration still needs to be generated and applied against the user's Neon database. Authentication, question import/admin review, the interactive mock engine and student analytics are not yet complete.
