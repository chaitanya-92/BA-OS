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
5. Generate the first migration with `npm run db:generate`.
6. Review the generated SQL in `drizzle/` before applying it.
7. Apply the migration with `npm run db:migrate`.
8. Seed the exam and subject taxonomy with `npm run db:seed` (safe to re-run; uses upserts).
9. Start the app with `npm run dev` and verify `/api/health`.

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

Question records preserve exam year, slot, source reference, source page, source question number, content fingerprint, difficulty and verification status. Publication is opt-in: `is_published` defaults to false. The public question API only returns published records.

## API

- `GET /api/health`: checks database connectivity without returning credentials or internal error details.
- `GET /api/catalog`: returns active exams, exam sections, subjects and topics for filter controls.
- `GET /api/resources`: returns published learning resources with subject/topic filters.
- `GET /api/tests`: returns published test metadata.
- `GET /api/tests/:slug`: returns a published test and questions/options without exposing answer keys.
- `POST /api/tests/:slug/submit`: validates assignment membership, grades against stored answer keys and saves an anonymous attempt.
- `GET /api/questions`: returns published questions with validated filters and bounded offset pagination.
- `GET /api/questions/:id`: returns a published question, options and available explanations.
- `GET /api/admin/questions`: lists pending questions or returns full answer-key details when an `id` query parameter is supplied.
- `POST /api/admin/questions`: imports one question using the `x-admin-import-token` header. It always creates an unpublished, unreviewed record; content fingerprinting is scoped by exam/year/slot/source reference.
- `PATCH /api/admin/questions`: verifies and publishes an eligible question or marks it disputed. MCQs require a correct option; non-MCQs require a verified answer key.

Supported question filters: `examId`, `sectionId`, `subjectId`, `topicId`, `year`, `difficulty`, `q`, `limit` (1–50) and `offset` (0–10000).

Set a long random `ADMIN_IMPORT_TOKEN` in `.env.local` before using the protected import endpoint. Do not put this token in client-side code or commit it. Imported records remain unpublished until reviewed and explicitly approved.

## Important implementation boundaries

- Authentication is not yet selected, so attempts currently have a nullable `user_id` placeholder and must not be treated as user-isolated production data until authentication and ownership enforcement are implemented.
- The schema is committed, but the first migration has not yet been generated or applied against the user's Neon instance.
- Do not import the whole PYQ collection until its per-question provenance, answer verification and publishing rights have been reviewed.
- Keep original source documents private. The database should store only content that is appropriate to publish, plus provenance and review metadata.
