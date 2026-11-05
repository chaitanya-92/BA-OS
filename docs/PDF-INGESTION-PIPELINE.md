# MBA OS PDF source ingestion

## Current pipeline

1. Preserve the source PDF as the immutable reference.
2. Extract one JSONL record per PDF page using `scripts/extract-pdf-pages.ts`.
3. Parse questions from the extracted page text into the existing question import schema.
4. Keep uncertain OCR, diagrams, tables, answer-key mismatches and DILR set boundaries in manual review.
5. Send structured records to the protected `POST /api/admin/questions` endpoint. Imported questions remain unpublished.
6. Verify each record in `/admin/questions`; only explicit approval publishes it to `/pyqs`.
7. Build full mocks, sectionals and topic tests only from approved/published records.

## Extract a source

Requires Poppler's `pdftotext` utility.

```bash
npx tsx scripts/extract-pdf-pages.ts "./your-source.pdf" "./your-source.pages.jsonl"
```

Each page record contains the original filename, SHA-256 checksum, one-based PDF page number, extraction status, and extracted text. Empty text pages are marked for OCR or visual review. Page boundaries are preserved.

## Question record validation

- Preserve the supplied stem, options, answer and solution; do not paraphrase the source.
- Store PDF page and printed page separately in source provenance.
- MCQ single-answer records need options and exactly one correct option before publication.
- Numeric/TITA records need a verified answer key before publication.
- Keep DILR passages/sets linked to all their questions.
- Fingerprint normalized question text for duplicate detection; never delete the source record.
- Keep source-provided solution text. Add editorial corrections separately and flag discrepancies for review.
- Store exam/year/slot/section/topic only when the source supports those values.

## Important distinction

Page extraction is not the same as question extraction or answer verification. The script deliberately does not invent question boundaries, answer keys, difficulty, exam slots, or solutions. All records remain private until the review desk approves them.

## Test formats

- **Full mock:** approved questions matching the exam blueprint and duration.
- **Sectional:** approved questions restricted to one exam section.
- **Topic practice:** approved questions restricted to a topic/subtopic.
- Preserve exam-specific marking rules from the relevant blueprint; do not assume one universal scheme.
