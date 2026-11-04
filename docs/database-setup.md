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
8. Start the app with `npm run dev` and verify `/api/health`.

## Current schema domains

- Exam catalogue and configurable exam sections.
- Subject, topic and subtopic taxonomy.
- Source registry with source kind and rights notes.
- Questions, options and independently tracked solutions.
- Tests, test sections and question assignments.
- Attempts and per-question responses.
- Topic-linked study resources.

Question records preserve exam year, slot, source reference, source page, source question number, content fingerprint, difficulty and verification status. Publication is opt-in: `is_published` defaults to false. The public question API only returns published records.

## API

- `GET /api/health`: checks database connectivity without returning credentials or internal error details.
- `GET /api/questions`: returns published questions with validated filters and bounded offset pagination.

Supported question filters: `examId`, `subjectId`, `topicId`, `year`, `difficulty`, `limit` (1–50) and `offset` (0–10000).

## Important implementation boundaries

- Authentication is not yet selected, so attempts currently have a nullable `user_id` placeholder and must not be treated as user-isolated production data until authentication and ownership enforcement are implemented.
- The schema is committed, but the first migration has not yet been generated or applied against the user's Neon instance.
- Do not import the whole PYQ collection until its per-question provenance, answer verification and publishing rights have been reviewed.
- Keep original source documents private. The database should store only content that is appropriate to publish, plus provenance and review metadata.
