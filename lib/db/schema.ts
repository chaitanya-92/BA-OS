import {
  boolean,
  type AnyPgColumn,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const examStatusEnum = pgEnum("exam_status", ["active", "archived", "draft"]);
export const questionTypeEnum = pgEnum("question_type", ["mcq_single", "mcq_multiple", "numeric", "text", "passage", "set"]);
export const difficultyEnum = pgEnum("difficulty_level", ["easy", "moderate", "difficult", "unrated"]);
export const sourceKindEnum = pgEnum("source_kind", ["official_exam", "user_collection", "third_party", "original_practice", "expected_question", "editorial"]);
export const verificationStatusEnum = pgEnum("verification_status", ["unreviewed", "verified", "source_key_only", "independently_checked", "disputed", "missing"]);
export const testKindEnum = pgEnum("test_kind", ["full_mock", "sectional", "topic_practice", "diagnostic"]);
export const attemptStatusEnum = pgEnum("attempt_status", ["in_progress", "submitted", "auto_submitted", "abandoned"]);

export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  description: text("description"),
  status: examStatusEnum("status").notNull().default("active"),
  officialWebsite: text("official_website"),
  ...timestamps,
}, (table) => [
  uniqueIndex("exams_slug_uidx").on(table.slug),
]);

export const examSections = pgTable("exam_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  durationMinutes: integer("duration_minutes"),
  questionCount: integer("question_count"),
  marksPerCorrect: integer("marks_per_correct"),
  marksPerIncorrect: integer("marks_per_incorrect").default(0),
  ...timestamps,
}, (table) => [
  uniqueIndex("exam_sections_exam_slug_uidx").on(table.examId, table.slug),
  index("exam_sections_exam_order_idx").on(table.examId, table.displayOrder),
]);

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
}, (table) => [uniqueIndex("subjects_slug_uidx").on(table.slug)]);

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }),
  parentTopicId: uuid("parent_topic_id").references((): AnyPgColumn => topics.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  index("topics_subject_idx").on(table.subjectId),
  index("topics_parent_idx").on(table.parentTopicId),
  uniqueIndex("topics_subject_slug_uidx").on(table.subjectId, table.slug),
]);

export const subtopics = pgTable("subtopics", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  index("subtopics_topic_idx").on(table.topicId),
  uniqueIndex("subtopics_topic_slug_uidx").on(table.topicId, table.slug),
]);

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 240 }).notNull(),
  kind: sourceKindEnum("kind").notNull(),
  publisher: varchar("publisher", { length: 180 }),
  sourceUrl: text("source_url"),
  rightsNote: text("rights_note"),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("sources_kind_idx").on(table.kind)]);

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "set null" }),
  examSectionId: uuid("exam_section_id").references(() => examSections.id, { onDelete: "set null" }),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
  subtopicId: uuid("subtopic_id").references(() => subtopics.id, { onDelete: "set null" }),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  sourceReference: varchar("source_reference", { length: 240 }),
  sourcePage: varchar("source_page", { length: 40 }),
  sourceQuestionNumber: varchar("source_question_number", { length: 40 }),
  examYear: integer("exam_year"),
  examSlot: varchar("exam_slot", { length: 80 }),
  questionType: questionTypeEnum("question_type").notNull().default("mcq_single"),
  difficulty: difficultyEnum("difficulty").notNull().default("unrated"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unreviewed"),
  prompt: text("prompt").notNull(),
  passage: text("passage"),
  explanationNote: text("explanation_note"),
  contentFingerprint: varchar("content_fingerprint", { length: 64 }),
  isPublished: boolean("is_published").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
}, (table) => [
  index("questions_exam_year_slot_idx").on(table.examId, table.examYear, table.examSlot),
  index("questions_section_topic_idx").on(table.examSectionId, table.topicId),
  index("questions_verification_idx").on(table.verificationStatus),
  index("questions_published_idx").on(table.isPublished),
  uniqueIndex("questions_fingerprint_uidx").on(table.contentFingerprint),
]);

export const questionOptions = pgTable("question_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  optionKey: varchar("option_key", { length: 8 }).notNull(),
  content: text("content").notNull(),
  isCorrect: boolean("is_correct"),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  uniqueIndex("question_options_question_key_uidx").on(table.questionId, table.optionKey),
  index("question_options_question_order_idx").on(table.questionId, table.displayOrder),
]);

export const solutions = pgTable("solutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  methodName: varchar("method_name", { length: 160 }),
  content: text("content").notNull(),
  answerText: text("answer_text"),
  answerVerification: verificationStatusEnum("answer_verification").notNull().default("unreviewed"),
  isEditorial: boolean("is_editorial").notNull().default(false),
  ...timestamps,
}, (table) => [index("solutions_question_idx").on(table.questionId)]);

export const tests = pgTable("tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull(),
  description: text("description"),
  kind: testKindEnum("kind").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  instructions: text("instructions"),
  isPublished: boolean("is_published").notNull().default(false),
  ...timestamps,
}, (table) => [uniqueIndex("tests_slug_uidx").on(table.slug)]);

export const testSections = pgTable("test_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  testId: uuid("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  examSectionId: uuid("exam_section_id").references(() => examSections.id, { onDelete: "set null" }),
  title: varchar("title", { length: 160 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  durationMinutes: integer("duration_minutes"),
  marksPerCorrect: integer("marks_per_correct").notNull().default(3),
  marksPerIncorrect: integer("marks_per_incorrect").notNull().default(-1),
  ...timestamps,
}, (table) => [index("test_sections_test_order_idx").on(table.testId, table.displayOrder)]);

export const testQuestions = pgTable("test_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  testSectionId: uuid("test_section_id").notNull().references(() => testSections.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "restrict" }),
  displayOrder: integer("display_order").notNull(),
  marksOverride: integer("marks_override"),
  negativeMarksOverride: integer("negative_marks_override"),
  ...timestamps,
}, (table) => [
  uniqueIndex("test_questions_section_question_uidx").on(table.testSectionId, table.questionId),
  uniqueIndex("test_questions_section_order_uidx").on(table.testSectionId, table.displayOrder),
]);

export const attempts = pgTable("attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  testId: uuid("test_id").notNull().references(() => tests.id, { onDelete: "restrict" }),
  userId: uuid("user_id"),
  status: attemptStatusEnum("status").notNull().default("in_progress"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  score: integer("score"),
  correctCount: integer("correct_count"),
  incorrectCount: integer("incorrect_count"),
  unansweredCount: integer("unanswered_count"),
  timeSpentSeconds: integer("time_spent_seconds"),
  ...timestamps,
}, (table) => [
  index("attempts_user_started_idx").on(table.userId, table.startedAt),
  index("attempts_test_status_idx").on(table.testId, table.status),
]);

export const attemptResponses = pgTable("attempt_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "restrict" }),
  selectedOptionIds: jsonb("selected_option_ids").$type<string[]>().notNull().default([]),
  answerText: text("answer_text"),
  isMarkedForReview: boolean("is_marked_for_review").notNull().default(false),
  isVisited: boolean("is_visited").notNull().default(false),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("attempt_responses_attempt_question_uidx").on(table.attemptId, table.questionId),
  index("attempt_responses_attempt_idx").on(table.attemptId),
]);

export const studyResources = pgTable("study_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
  subtopicId: uuid("subtopic_id").references(() => subtopics.id, { onDelete: "set null" }),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  content: text("content"),
  externalUrl: text("external_url"),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").notNull().default(false),
  ...timestamps,
}, (table) => [
  uniqueIndex("study_resources_slug_uidx").on(table.slug),
  index("study_resources_topic_idx").on(table.topicId),
]);


export const collegeStatusEnum = pgEnum("college_status", ["active", "inactive", "draft"]);
export const admissionEventStatusEnum = pgEnum("admission_event_status", ["announced", "scheduled", "open", "closed", "tentative"]);

export const colleges = pgTable("colleges", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull(),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 120 }),
  website: text("website"),
  collegeType: varchar("college_type", { length: 80 }),
  description: text("description"),
  status: collegeStatusEnum("status").notNull().default("draft"),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  sourceReference: text("source_reference"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("colleges_slug_uidx").on(table.slug),
  index("colleges_status_idx").on(table.status),
]);

export const collegePrograms = pgTable("college_programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  degree: varchar("degree", { length: 80 }),
  specialization: varchar("specialization", { length: 160 }),
  feeMin: integer("fee_min"),
  feeMax: integer("fee_max"),
  averagePackage: integer("average_package"),
  medianPackage: integer("median_package"),
  placementYear: integer("placement_year"),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  sourceReference: text("source_reference"),
  isPublished: boolean("is_published").notNull().default(false),
  ...timestamps,
}, (table) => [
  index("college_programs_college_idx").on(table.collegeId),
  index("college_programs_published_idx").on(table.isPublished),
]);

export const admissionEvents = pgTable("admission_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "set null" }),
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "set null" }),
  title: varchar("title", { length: 220 }).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  status: admissionEventStatusEnum("status").notNull().default("tentative"),
  officialUrl: text("official_url"),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  sourceReference: text("source_reference"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(false),
  ...timestamps,
}, (table) => [
  index("admission_events_starts_idx").on(table.startsAt),
  index("admission_events_published_idx").on(table.isPublished),
]);
