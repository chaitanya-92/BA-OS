# MBA OS product roadmap

## Phase 1 — Public landing page (implemented foundation)
- DM Sans-only typography system and responsive navigation with hover dropdowns and animated sticky header.
- PYQ, mock, sectional test, resource and entrance-date sections.
- User-supplied topic-frequency reference table with provenance note.
- GSAP entrance and scroll-reveal animation with reduced-motion support.
- Reusable skeleton primitives and toast host.

## Phase 2 — Platform foundations (next priority)
- Neon PostgreSQL using a rotated secret; Drizzle schema and migrations.
- Authentication and user profile.
- Subject/topic/subtopic taxonomy and source registry.
- Admin-only import and review workflows.

## Phase 3 — Learning library
- PYQ explorer, filters, question details and linked solutions.
- Notes, formula sheets, traps, shortcuts and worked examples.
- Lecture index from the spreadsheet once provided as XLSX/CSV.
- Question/source provenance in the interface.

## Phase 4 — Testing
- Configurable exam patterns and marking schemes.
- Full mocks and sectional tests.
- Timer, autosave, navigation palette, review flags and submit flow.
- Attempt history and solution review.

## Phase 5 — Intelligence
- Topic-level accuracy and time analytics.
- Historical frequency with visible source coverage.
- Error log and revision scheduling.
- Entrance calendar with source and verification timestamps.

## Phase 6 — Production hardening
- Automated tests, accessibility checks and security review.
- Database backups, migrations and operational monitoring.
- Rate limiting, structured logs and error reporting.
- CI build/typecheck/lint gates, deployment and rollback procedure.

The current landing-page commit does not claim authentication, question-bank APIs, mock execution, a college predictor or a live entrance-date feed are implemented.
