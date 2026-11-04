-- Reconcile schema objects missing from databases with incomplete migration history.
-- All types, tables and indexes use guarded/idempotent creation; existing rows are preserved.
-- Complete initial schema for MBA OS, including student accounts and revision/content workflows.
DO $$ BEGIN CREATE TYPE "exam_status" AS ENUM ('active','archived','draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "question_type" AS ENUM ('mcq_single','mcq_multiple','numeric','text','passage','set'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "difficulty_level" AS ENUM ('easy','moderate','difficult','unrated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "source_kind" AS ENUM ('official_exam','user_collection','third_party','original_practice','expected_question','editorial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "verification_status" AS ENUM ('unreviewed','verified','source_key_only','independently_checked','disputed','missing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "test_kind" AS ENUM ('full_mock','sectional','topic_practice','diagnostic'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "attempt_status" AS ENUM ('in_progress','submitted','auto_submitted','abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "college_status" AS ENUM ('active','inactive','draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "admission_event_status" AS ENUM ('announced','scheduled','open','closed','tentative'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "content_entry_type" AS ENUM ('note','formula','trap','shortcut','checklist'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "content_entry_status" AS ENUM ('draft','in_review','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_uidx" ON "users" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_uidx" ON "sessions" ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_expiry_idx" ON "sessions" ("expires_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "exams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL,
  "description" text,
  "status" "exam_status" NOT NULL DEFAULT 'active',
  "official_website" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "exams_slug_uidx" ON "exams" ("slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "exam_sections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "exam_id" uuid NOT NULL REFERENCES "exams"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL,
  "display_order" integer NOT NULL DEFAULT 0,
  "duration_minutes" integer,
  "question_count" integer,
  "marks_per_correct" integer,
  "marks_per_incorrect" integer DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "exam_sections_exam_slug_uidx" ON "exam_sections" ("exam_id","slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exam_sections_exam_order_idx" ON "exam_sections" ("exam_id","display_order");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "subjects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL,
  "description" text,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_slug_uidx" ON "subjects" ("slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "topics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_id" uuid NOT NULL REFERENCES "subjects"("id") ON DELETE RESTRICT,
  "parent_topic_id" uuid,
  "name" varchar(160) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "description" text,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "topics_parent_topic_id_topics_id_fk" FOREIGN KEY ("parent_topic_id") REFERENCES "topics"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topics_subject_idx" ON "topics" ("subject_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topics_parent_idx" ON "topics" ("parent_topic_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "topics_subject_slug_uidx" ON "topics" ("subject_id","slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "subtopics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "topic_id" uuid NOT NULL REFERENCES "topics"("id") ON DELETE CASCADE,
  "name" varchar(160) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "description" text,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subtopics_topic_idx" ON "subtopics" ("topic_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subtopics_topic_slug_uidx" ON "subtopics" ("topic_id","slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(240) NOT NULL,
  "kind" "source_kind" NOT NULL,
  "publisher" varchar(180),
  "source_url" text,
  "rights_note" text,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sources_kind_idx" ON "sources" ("kind");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "exam_id" uuid REFERENCES "exams"("id") ON DELETE SET NULL,
  "exam_section_id" uuid REFERENCES "exam_sections"("id") ON DELETE SET NULL,
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE SET NULL,
  "topic_id" uuid REFERENCES "topics"("id") ON DELETE SET NULL,
  "subtopic_id" uuid REFERENCES "subtopics"("id") ON DELETE SET NULL,
  "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
  "source_reference" varchar(240),
  "source_page" varchar(40),
  "source_question_number" varchar(40),
  "exam_year" integer,
  "exam_slot" varchar(80),
  "question_type" "question_type" NOT NULL DEFAULT 'mcq_single',
  "difficulty" "difficulty_level" NOT NULL DEFAULT 'unrated',
  "verification_status" "verification_status" NOT NULL DEFAULT 'unreviewed',
  "prompt" text NOT NULL,
  "passage" text,
  "explanation_note" text,
  "content_fingerprint" varchar(64),
  "is_published" boolean NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_exam_year_slot_idx" ON "questions" ("exam_id","exam_year","exam_slot");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_section_topic_idx" ON "questions" ("exam_section_id","topic_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_verification_idx" ON "questions" ("verification_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_published_idx" ON "questions" ("is_published");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "questions_fingerprint_uidx" ON "questions" ("content_fingerprint");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "question_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "option_key" varchar(8) NOT NULL,
  "content" text NOT NULL,
  "is_correct" boolean,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "question_options_question_key_uidx" ON "question_options" ("question_id","option_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_options_question_order_idx" ON "question_options" ("question_id","display_order");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "solutions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
  "method_name" varchar(160),
  "content" text NOT NULL,
  "answer_text" text,
  "answer_verification" "verification_status" NOT NULL DEFAULT 'unreviewed',
  "is_editorial" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "solutions_question_idx" ON "solutions" ("question_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "exam_id" uuid REFERENCES "exams"("id") ON DELETE SET NULL,
  "title" varchar(200) NOT NULL,
  "slug" varchar(220) NOT NULL,
  "description" text,
  "kind" "test_kind" NOT NULL,
  "duration_minutes" integer NOT NULL,
  "instructions" text,
  "is_published" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tests_slug_uidx" ON "tests" ("slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "test_sections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "test_id" uuid NOT NULL REFERENCES "tests"("id") ON DELETE CASCADE,
  "exam_section_id" uuid REFERENCES "exam_sections"("id") ON DELETE SET NULL,
  "title" varchar(160) NOT NULL,
  "display_order" integer NOT NULL DEFAULT 0,
  "duration_minutes" integer,
  "marks_per_correct" integer NOT NULL DEFAULT 3,
  "marks_per_incorrect" integer NOT NULL DEFAULT -1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "test_sections_test_order_idx" ON "test_sections" ("test_id","display_order");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "test_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "test_section_id" uuid NOT NULL REFERENCES "test_sections"("id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE RESTRICT,
  "display_order" integer NOT NULL,
  "marks_override" integer,
  "negative_marks_override" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "test_questions_section_question_uidx" ON "test_questions" ("test_section_id","question_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "test_questions_section_order_uidx" ON "test_questions" ("test_section_id","display_order");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "test_id" uuid NOT NULL REFERENCES "tests"("id") ON DELETE RESTRICT,
  "user_id" uuid,
  CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
  "status" "attempt_status" NOT NULL DEFAULT 'in_progress',
  "started_at" timestamptz NOT NULL DEFAULT now(),
  "submitted_at" timestamptz,
  "score" integer,
  "correct_count" integer,
  "incorrect_count" integer,
  "unanswered_count" integer,
  "time_spent_seconds" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "user_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = 'attempts'::regclass AND c.confrelid = 'users'::regclass AND c.contype = 'f' AND pg_get_constraintdef(c.oid) LIKE 'FOREIGN KEY (user_id)%') THEN
  ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

 END IF;

END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_user_started_idx" ON "attempts" ("user_id","started_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_test_status_idx" ON "attempts" ("test_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "attempt_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attempt_id" uuid NOT NULL REFERENCES "attempts"("id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE RESTRICT,
  "selected_option_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "answer_text" text,
  "is_marked_for_review" boolean NOT NULL DEFAULT false,
  "is_visited" boolean NOT NULL DEFAULT false,
  "time_spent_seconds" integer NOT NULL DEFAULT 0,
  "answered_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attempt_responses_attempt_question_uidx" ON "attempt_responses" ("attempt_id","question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempt_responses_attempt_idx" ON "attempt_responses" ("attempt_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "study_resources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE SET NULL,
  "topic_id" uuid REFERENCES "topics"("id") ON DELETE SET NULL,
  "subtopic_id" uuid REFERENCES "subtopics"("id") ON DELETE SET NULL,
  "title" varchar(220) NOT NULL,
  "slug" varchar(240) NOT NULL,
  "kind" varchar(40) NOT NULL,
  "content" text,
  "external_url" text,
  "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
  "is_published" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "study_resources_slug_uidx" ON "study_resources" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_resources_topic_idx" ON "study_resources" ("topic_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "colleges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(220) NOT NULL,
  "slug" varchar(240) NOT NULL,
  "city" varchar(120),
  "state" varchar(120),
  "website" text,
  "college_type" varchar(80),
  "description" text,
  "status" "college_status" NOT NULL DEFAULT 'draft',
  "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
  "source_reference" text,
  "verified_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "colleges_slug_uidx" ON "colleges" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "colleges_status_idx" ON "colleges" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "college_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "college_id" uuid NOT NULL REFERENCES "colleges"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "degree" varchar(80),
  "specialization" varchar(160),
  "fee_min" integer,
  "fee_max" integer,
  "average_package" integer,
  "median_package" integer,
  "placement_year" integer,
  "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
  "source_reference" text,
  "is_published" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "college_programs_college_idx" ON "college_programs" ("college_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "college_programs_published_idx" ON "college_programs" ("is_published");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "admission_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "exam_id" uuid REFERENCES "exams"("id") ON DELETE SET NULL,
  "college_id" uuid REFERENCES "colleges"("id") ON DELETE SET NULL,
  "title" varchar(220) NOT NULL,
  "event_type" varchar(80) NOT NULL,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "status" "admission_event_status" NOT NULL DEFAULT 'tentative',
  "official_url" text,
  "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
  "source_reference" text,
  "last_verified_at" timestamptz,
  "is_published" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admission_events_starts_idx" ON "admission_events" ("starts_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admission_events_published_idx" ON "admission_events" ("is_published");
--> statement-breakpoint

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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "revision_items_user_question_uidx" ON "revision_items" ("user_id","question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revision_items_user_due_idx" ON "revision_items" ("user_id","due_at");
--> statement-breakpoint

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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "content_entries_slug_uidx" ON "content_entries" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_entries_status_type_idx" ON "content_entries" ("status","entry_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_entries_topic_idx" ON "content_entries" ("topic_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_entries_source_idx" ON "content_entries" ("source_id");
--> statement-breakpoint
