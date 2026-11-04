# MBA OS content ingestion

## Source inventory received

| File | Scope stated in the source | Initial handling |
|---|---|---|
| Oswaal CAT Chapter-wise & Topic-wise Solved Papers (2024 edition) | CAT 1991–2008 and 2017–2023; VARC, DILR and QA | Use syllabus, structure and trend metadata as references. Do not republish substantial question/solution text without permission. |
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

## Copyright and permissions
The Oswaal file's front matter states that all rights are reserved and reproduction requires written permission. The public MBA OS repository/site should not contain bulk verbatim reproduction of its questions, explanations, book pages or scans unless the required permission is obtained.

Safe path: build taxonomy and schema; retain bibliographic/source references and factual metadata; create original explanations, concept notes and practice; import only content the project owns or is licensed to publish. Keep source-only extraction private for review until rights are clarified.

This inventory does not mean every question has been imported or independently verified.
