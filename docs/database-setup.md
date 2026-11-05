# Database foundation

## Stack
- Neon PostgreSQL for hosted PostgreSQL.
- Drizzle ORM for typed queries and schema definitions.
- Drizzle Kit for migration generation and execution.
- The application uses the Neon-compatible PostgreSQL wire protocol through the `postgres` driver.

## Local setup

1. Rotate the Neon database password if it has ever been shared in chat, a screenshot, source control or another public place.
2. Copy `.env.example` to `.env.local`.
3. Put the new pooled Neon connection string in `DATABASE_URL`. Keep `.env.local` out of Git.
4. Install the updated dependencies with `npm install`.
5. Run `npm run db:bootstrap` to apply migrations, seed exam/subject taxonomy and queue the supplied independent CAT Quant revision material in one ordered command. The command stops at the first failure.
6. Start the app with `npm run dev` and verify `/api/health`.
7. Open `/admin/content` to review the Quant drafts. They remain invisible in `/learn` until explicitly approved and published.

## Current schema domains

- Exam catalogue and configurable exam sections.
- Subject, topic and subtopic taxonomy.
- Source registry with source kind and rights notes.
- Questions, options and independently tracked solutions.
- Tests, test sections and question assignments.
- Attempts and per-question responses.
- Topic-linked study resources.
- College directory, MBA programme fees and placement outcome records with source references and reporting years.
- Admission and entrance calendar events with official URLs, statuses and verification timestamps.
- Student accounts, hashed-password credentials, revocable sessions and editable profiles.
- User-owned attempts, responses and spaced-revision scheduling.
- Source-attributed notes, formulas, traps, shortcuts and checklists with draft/review/published states.

Question records preserve exam year, slot, source reference, source page, source question number, content fingerprint, difficulty and verification status. Publication is opt-in: `is_published` defaults to false. The public question API only returns published records.

## API

- `GET /api/health`: checks database connectivity without returning credentials or internal error details.
- `GET /api/catalog`: returns active exams, exam sections, subjects and topics for filter controls.
- `GET /api/resources`: returns published learning resources with subject/topic filters.
- `GET /api/tests`: returns published test metadata.
- `GET /api/tests/:slug`: returns a published test and questions/options without exposing answer keys.
- `GET /api/attempts/:id`: returns the completed attempt's score, submitted responses, verified answer keys and explanations.
- `POST /api/tests/:slug/submit`: requires a signed-in student, validates assignment membership, grades against stored answer keys, saves a user-owned attempt and queues incorrect/unanswered questions for revision.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`: account and session lifecycle.
- `PATCH /api/profile`: updates the signed-in student's profile.
- `GET /api/dashboard`, `GET /api/attempts`: personal performance summary and attempt history.
- `GET /api/revision`, `POST /api/revision`: spaced-repetition queue and review scheduling.
- `GET/POST/PATCH /api/admin/content`: protected bulk content ingestion and draft review.
- `GET /api/questions`: returns published questions with validated filters and bounded offset pagination.
- `GET /api/questions/:id`: returns a published question, options and available explanations.
- `GET /api/colleges`: returns active colleges with published MBA programmes.
- `GET /api/calendar`: returns published entrance and admission events, including source and verification metadata.
- `GET /api/admin/questions`: lists pending questions, returns full answer-key details when an `id` query parameter is supplied, or lists published question IDs for test assembly with `?published=true`.
- `GET/POST/PATCH /api/admin/tests`: protected test authoring, question assignment and publish/unpublish workflow. Tests remain drafts until published; every assigned question must already be published.
- `POST /api/admin/questions`: imports one question using the `x-admin-import-token` header. It always creates an unpublished, unreviewed record; content fingerprinting is scoped by exam/year/slot/source reference.
- `PATCH /api/admin/questions`: verifies and publishes an eligible question or marks it disputed. MCQs require a correct option; non-MCQs require a verified answer key.

Supported question filters: `examId`, `sectionId`, `subjectId`, `topicId`, `year`, `difficulty`, `q`, `limit` (1–50) and `offset` (0–10000).

Set a long random `ADMIN_IMPORT_TOKEN` in `.env.local` before using the protected question and content authoring endpoints. Run `npm run db:bootstrap` for the ordered database setup. Use `/admin/questions` to import and review questions, then `/admin/tests` to select published question IDs, assemble sections and publish complete tests. Use `/admin/content` to review and publish notes/formulas/traps. The student libraries intentionally show only published material. Do not put this token in client-side code or commit it. Imported records remain unpublished until reviewed and explicitly approved.

## Important implementation boundaries

- Attempts submitted through the test engine now require a signed-in account and are scoped to that user. Legacy anonymous attempts, if any, remain unowned and are not exposed through the account history.
- The student-platform migration is committed in `drizzle/0000_user_platform.sql`. Apply it with `npm run db:migrate` before using authentication, dashboard, revision or content-authoring features.
- Do not import the whole PYQ collection until its per-question provenance, answer verification and publishing rights have been reviewed.
- Keep original source documents private. The database should store only content that is appropriate to publish, plus provenance and review metadata.
\n## Authentication notes\n\nPasswords are stored using Node's scrypt password derivation. Session tokens are random, stored as SHA-256 hashes in PostgreSQL and sent only in an HTTP-only, same-site cookie. Email verification, password reset, social sign-in and production-grade distributed rate limiting are not implemented yet; do not treat this as a finished identity provider.\n