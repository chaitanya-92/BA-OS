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

## Current implementation

The initial commit establishes the public landing page and design system. PYQ browsing, authentication, question ingestion, mock engine, student analytics and administration are subsequent implementation milestones; they are not represented as completed features.
