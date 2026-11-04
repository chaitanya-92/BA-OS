# MBA OS product roadmap

## Phase 1 — Public experience (implemented)
- Editorial landing page with responsive shared sticky navigation, grouped dropdowns, left-side back control on internal pages and mobile menu.
- Subtle 180 ms route transition with reduced-motion support; short non-blocking hero entrance animation.
- Topic-priority reference rendered as a table, with its supplied-source disclaimer.
- Consistent filter-select styling and exam/subject-grouped PYQ filter options.
- PYQ, mock, sectional test, resource, B-school and entrance-date routes.
- GSAP scroll reveals, skeletons, reusable modal component and toast host.

## Phase 2 — Platform and identity foundations (implemented)
- Neon PostgreSQL connection, Drizzle schema, complete initial migration and repeatable taxonomy seed.
- Database health endpoint, catalogue API, validated/paginated published-question APIs and protected question import/review.
- Email/password registration and login using scrypt password hashes; opaque random session tokens stored as hashes in PostgreSQL and HTTP-only same-site cookies.
- Editable student profile with display name, bio, target exam and target year.
- User-owned attempt submission, attempt history and ownership-protected result review.
- Admin-only question import, provenance inspection, answer-key review and publish/dispute workflow.

## Phase 3 — Learning and content operations (implemented foundation)
- Topic accordion learning library with subject/topic navigation, search and resource detail modal.
- Editorial authoring for notes, formulas, traps, shortcuts and checklists; create, edit, archive and review/publish workflow.
- Protected JSON batch ingestion (up to 250 entries), source registry details, source/page references, rights notes, duplicate-slug handling and unreviewed draft state.
- Initial content seed structures 37 entries from the supplied independent CAT Quant combined revision material, including arithmetic, algebra, geometry, number system, modern mathematics and trap sections, plus a separate arithmetic answer-key audit note.
- Imported entries remain drafts until source and content review. The supplied Oswaal book is not reproduced.
- Further CATALYST/source packs and lecture-index spreadsheets can be ingested when their source files are available and rights/provenance are confirmed.

## Phase 4 — Testing and personal learning loop (implemented foundation)
- Published test catalogue and answer-key-protected test detail API.
- Timed test runner with section navigation, question palette, local session recovery, review flags, start instructions and submit confirmation.
- Sign-in required before a saved test starts; server-side grading and persisted user-owned attempts.
- Attempt history, detailed answer review and personal dashboard with score/accuracy summaries, recent activity and due weak-topic signals.
- Incorrect and unanswered questions automatically enter the student's revision queue.
- Spaced-repetition scheduling updates after a student rates recall; revision records are private to the owning account.

## Phase 5 — Intelligence and admissions (initial directories implemented)
- Source-aware college and MBA programme directory with fees, placement outcomes and reporting years.
- Entrance and admission calendar with official URLs, statuses and verification timestamps.
- Personal weak-topic signals from due revision items.
- Historical frequency table with visible source coverage.
- Verified college/event ingestion, richer score-trend analytics and a full question-level error-book remain to be expanded.

## Phase 6 — Remaining production hardening
- Email verification, password reset and optional OAuth identity providers.
- Distributed rate limiting, automated security tests and deeper accessibility checks.
- Full in-progress attempt persistence across devices (completed attempts are persisted now).
- Database backup/restore drills, operational monitoring, structured logs and error reporting.
- Deployment, production smoke tests and rollback procedure.

The core student workflow is implemented, but email verification/password recovery and production security hardening are still outstanding.