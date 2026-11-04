CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(320) NOT NULL,
  "password_hash" text NOT NULL,
  "display_name" varchar(120) NOT NULL,
  "avatar_url" text,
  "bio" varchar(500),
  "target_exam" varchar(80),
  "target_year" integer,
  "role" varchar(20) NOT NULL DEFAULT 'student',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_uidx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_uidx" ON "sessions" ("token_hash");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expiry_idx" ON "sessions" ("expires_at");

ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "attempts_user_started_idx" ON "attempts" ("user_id","started_at");

CREATE TABLE IF NOT EXISTS "revision_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "source_attempt_id" uuid REFERENCES "attempts"("id") ON DELETE SET NULL,
  "status" varchar(24) NOT NULL DEFAULT 'due',
  "repetitions" integer NOT NULL DEFAULT 0,
  "interval_days" integer NOT NULL DEFAULT 0,
  "ease_factor" integer NOT NULL DEFAULT 250,
  "due_at" timestamptz NOT NULL DEFAULT now(),
  "last_reviewed_at" timestamptz,
  "last_outcome" varchar(24),
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "revision_items_user_question_uidx" ON "revision_items" ("user_id","question_id");
CREATE INDEX IF NOT EXISTS "revision_items_user_due_idx" ON "revision_items" ("user_id","due_at");

DO $$ BEGIN CREATE TYPE "content_entry_type" AS ENUM ('note','formula','trap','shortcut','checklist'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "content_entry_status" AS ENUM ('draft','in_review','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS "content_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE SET NULL,
  "topic_id" uuid REFERENCES "topics"("id") ON DELETE SET NULL,
  "title" varchar(220) NOT NULL,
  "slug" varchar(240) NOT NULL,
  "entry_type" "content_entry_type" NOT NULL,
  "content" text NOT NULL,
  "source_reference" text,
  "source_page" varchar(40),
  "verification_status" "verification_status" NOT NULL DEFAULT 'unreviewed',
  "status" "content_entry_status" NOT NULL DEFAULT 'draft',
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "reviewed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "content_entries_slug_uidx" ON "content_entries" ("slug");
CREATE INDEX IF NOT EXISTS "content_entries_status_type_idx" ON "content_entries" ("status","entry_type");
CREATE INDEX IF NOT EXISTS "content_entries_topic_idx" ON "content_entries" ("topic_id");
CREATE INDEX IF NOT EXISTS "content_entries_source_idx" ON "content_entries" ("source_id");
