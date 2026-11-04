# MBA OS content ingestion

## Source inventory received

| File | Scope stated in the source | Initial handling |
|---|---|---|
| User-collected CAT PYQ compilation (working pagination was adapted from an Oswaal-style layout by mistake) | Mixed CAT years, slots and sections; exact coverage must be verified against the individual records | Treat as a user-assembled collection, not an Oswaal publication. Preserve the original source of each underlying question wherever known; do not infer authorship, official status or rights from the compilation layout. |
| CATALYST CAT Quant PYQ Vault 2026 | Source states 215 selected PYQs, 72 expected questions, 18 chapters | Separate source collection; verify answer keys and rights before publication. |
| CATALYST CAT VARC Vault | Source states 12 RC passages, 48 RC questions and 32 VA questions | Retain its taxonomy and verification notes. |
| CATALYST CAT LRDI Vault Pilot | 15 original CAT-style sets; source describes code verification | Mark original practice, not official PYQ. |
| CATALYST LRDI Expected Questions Part 2 | 8 original sets and 40 questions | Mark expected/original practice, not official PYQ. |
| CATALYST QA Set 01 | 40 questions labelled as real CAT questions | Preserve claim and metadata; independently verify before publication. |
| CAT Arithmetic 100 Most Important Questions | 100 original CAT-style questions; 238 arithmetic questions tagged in its research description | Distinguish original practice from historical questions. |
| CAT Parajumbles Decoded 2017–2025 | 55 questions from 19 slots; source says answer key is unofficial | Preserve answer-key status; do not label answers official. |
| CAT 2026 40-Day Planner | Daily schedule, mock calendar, revision and error-log templates | Separate planning reference; check date assumptions before use. |
| CAT 2026 Last 55 Days Master Guide | Topic priorities, mock/PYQ strategy and revision guidance | Time-bound reference; revalidate dates and current exam facts. |
| CAT RC Vocabulary 500 workbook | 500-word bank, passage index, topic analysis and occurrence records | Import structured vocabulary after workbook validation. |

## Data rules
1. Every imported record must retain source name, source type, page/sheet, section and extraction batch.
2. Separate official exam questions, third-party reproductions, original practice, expected questions and editorially curated material.
3. Store answer provenance independently from solution provenance.
4. Answer status: verified, source_key_only, independently_checked, disputed or missing.
5. Never infer a missing year, slot, question number, option, answer or official status.
6. Trend summaries must state coverage window, denominator, source set and methodology.
7. Deduplicate with a stable fingerprint while retaining multiple provenance links.
8. Record extraction confidence and human review status.

## Source identity and publishing rules
The main PYQ compilation is the user's collected question set. Its page numbering/layout was accidentally modelled on an Oswaal-style pagination pattern during editing; that does not make the collection an Oswaal book or establish Oswaal as its source. Do not label the compilation as Oswaal.

For each question, preserve the actual originating exam/year/slot and source reference when known. If an origin is unknown, mark it unknown and send it for review rather than guessing. The fact that questions were collected by the user does not, by itself, establish ownership or publication rights over the underlying exam questions or third-party material. Publish only content that is public, user-created, or appropriately licensed, and retain attribution where required.

This inventory does not mean every question has been imported or independently verified.
\n## Initial original study-content ingestion\n\nThe repository includes `scripts/seed-quant-content.ts`, which structures original revision material from the user-provided **CAT Quant Revision System** (combined book, trap book and master index) into source-attributed draft entries. It captures note/formula/trap/checklist type, Quant topic, source PDF page and printed page where available. The entries remain `unreviewed` and `draft`; they are not shown in the public learning library until editorial review. Run `npm run db:seed:content` after migrations and taxonomy seed.\n\nThe user-provided Oswaal CAT book identifies Oswaal Books & Learning Pvt. Ltd. as publisher and states that all rights are reserved. It must not be bulk-reproduced into MBA OS without written permission. Its bibliography/source metadata may be recorded for provenance, but do not import its question stems, answer explanations or notes as publishable content.\n\nThe admin content desk at `/admin/content` accepts JSON batches (up to 250 entries), creates a source record, rejects unlicensed third-party verbatim imports, deduplicates by slug, and queues entries as drafts with `unreviewed` verification. An editor must check the source/page reference and content before publishing.\n