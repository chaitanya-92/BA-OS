# MBA OS product roadmap

## Phase 1 — Public landing page (implemented foundation)
- DM Sans-only typography system and responsive navigation with hover dropdowns and animated sticky header.
- PYQ, mock, sectional test, resource and entrance-date sections.
- User-supplied topic-frequency reference table with provenance note.
- GSAP entrance and scroll-reveal animation with reduced-motion support.
- Reusable skeleton primitives and toast host.

## Phase 2 — Platform foundations (active)
- Neon PostgreSQL connection, Drizzle schema, typed database client and Drizzle Kit migration tooling (schema committed; first migration still needs local generation and application).
- Database health endpoint, catalogue API, validated/paginated published-question APIs and protected idempotent question-import endpoint.
- Dedicated searchable PYQ library page with exam, section, subject, topic, year and difficulty filters.
- Shared accessible modal component used by search, question details, learning resources and test review.
- Repeatable CAT/XAT/SNAP/NMAT/CMAT and QA/DILR/VARC taxonomy seed script.
- Exam/section and subject/topic/subtopic taxonomy, source registry, question/options/solutions, tests/attempts/responses and study-resource tables.
- Authentication and user profile (provider decision still pending).
- Admin-only JSON import, provenance inspection, answer-key review and publish/dispute workflow.

## Phase 3 — Learning library (initial interface implemented)
- Topic accordion library with subject/topic navigation and resource search.
- Published resource API and detail modal for notes, formula sheets, traps, shortcuts and worked examples.
- PYQ explorer, filters, question details and linked solutions.
- Lecture index from the spreadsheet once provided as XLSX/CSV.
- Question/source provenance in the interface.

## Phase 4 — Testing (initial engine implemented)
- Published test catalogue and protected-answer test detail API.
- Timed test runner with section navigation, question palette, local session recovery, review flags and submit confirmation.
- Server-side MCQ/numeric grading using answer keys and persisted anonymous attempt records.
- Configurable exam patterns and marking schemes, attempt history and detailed solution review remain to be completed.

## Phase 5 — Intelligence & admissions (initial directories implemented)
- Source-aware college and MBA programme directory with fees, placement outcomes and reporting years.
- Entrance and admission calendar with official URLs, statuses and verification timestamps.
- Topic-level accuracy and time analytics.
- Historical frequency with visible source coverage.
- Error log and revision scheduling.

## Phase 6 — Production hardening
- Automated tests, accessibility checks and security review.
- Database backups, migrations and operational monitoring.
- Rate limiting, structured logs and error reporting.
- CI build/typecheck/lint gates, deployment and rollback procedure.

The current landing-page commit does not claim authentication, question-bank APIs, mock execution, a college predictor or a live entrance-date feed are implemented.
