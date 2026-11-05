# Importing the supplied MBA OS study library

The repository contains a protected, idempotent import path for original question-bank records and extracted study resources.

## Environment

Set:
- `MBA_OS_BASE_URL`: deployed MBA OS origin (or `http://localhost:3000`)
- `ADMIN_IMPORT_TOKEN`: the same secret configured on the deployment

Never commit the token.

## Question bank

Place `cat-arithmetic-320-original.json` at `data/imports/`, then run:

```bash
npm run import:question-bank -- data/imports/cat-arithmetic-320-original.json
```

The 320 records are original practice MCQs: 240 core questions and 80 explicitly labelled PYQ-pattern practice questions. They are not official CAT PYQs. Records are imported unpublished. Source-provided solutions are retained. The source workbook contains worked solutions for only the first 40 percentage questions; the other 280 do not have individual answer keys/solutions in the supplied workbook and remain unkeyed. One add-on percentage item has a documented mismatch between its worked solution and its options; it is flagged for review.

The script sends records to the protected question intake API in small concurrent batches. It reports imported, duplicate and failed records.

## Study notes

Place `mba-os-study-resources.json` at `data/imports/`, then run:

```bash
npm run import:study-resources -- data/imports/mba-os-study-resources.json
```

Resources are stored unpublished in the learning library, preserving extracted text. PDF diagrams, tables and layout should be checked before publication.

## Authentic PYQs and third-party source material

Do not relabel original practice as actual PYQs. The 784-page PDF named `OSWAL CAT BOOK(4).pdf` identifies itself as the Oswaal CAT 2024 fourth-edition book and attributes the content to Oswaal's editorial board. Register it as a source/reference only; do not copy its full question collection or solutions into a public question bank without an appropriate licence. Actual PYQ entries need a source/year/slot record and an authorised source text or link.
