import Link from "next/link";
import { ArrowUpRightIcon, BookOpenIcon, ClipboardDocumentCheckIcon, DocumentMagnifyingGlassIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export const metadata = { title: "PDF Ingestion | MBA OS", description: "Stage PDF study sources and validate question records before publishing." };

const stages = [
  { n: "01", title: "Register the source", body: "Keep the original PDF, filename, checksum, page count and source attribution together. Duplicate uploads are detected by checksum.", icon: BookOpenIcon },
  { n: "02", title: "Extract page-by-page", body: "Preserve page boundaries and printed page references. Text-only pages can be extracted automatically; scanned pages and diagrams are flagged for visual review.", icon: DocumentMagnifyingGlassIcon },
  { n: "03", title: "Structure & validate", body: "Convert questions into prompt, options, answer key and supplied solution. Check missing options, answer mapping, duplicate fingerprints and passage/set integrity.", icon: ClipboardDocumentCheckIcon },
  { n: "04", title: "Review, then publish", body: "Every extracted record stays private until reviewed. Publish only approved questions; keep the source page and original wording traceable.", icon: ShieldCheckIcon },
];

export default function IngestionPage() {
  return <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 md:px-8">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[var(--accent)]">Content operations / intake</p><h1 className="mt-2 font-serif text-4xl text-[var(--ink)]">PDF ingestion desk</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">A controlled pipeline for your CAT, XAT, SNAP and other MBA entrance material. Original source files remain the reference; extraction never silently rewrites your content.</p></div>
      <Link href="/admin/questions" className="btn btn-neutral rounded-full normal-case">Open question review <ArrowUpRightIcon className="size-4"/></Link>
    </div>
    <section className="grid gap-3 sm:grid-cols-2">
      {stages.map((stage) => <article key={stage.n} className="rounded-2xl border border-[var(--line)] bg-white/70 p-5">
        <div className="flex items-start justify-between"><span className="font-mono text-xs text-[var(--accent)]">{stage.n} / PIPELINE</span><stage.icon className="size-5 text-[var(--accent)]"/></div>
        <h2 className="mt-5 font-serif text-xl text-[var(--ink)]">{stage.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{stage.body}</p>
      </article>)}
    </section>
    <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[#f1eee7] p-5 md:p-7">
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[var(--accent)]">Validation rules</p>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {["Source page + printed page provenance", "Question wording and option completeness", "Answer key matches exactly one MCQ option", "Supplied solution retained verbatim", "Duplicate detection without deleting originals", "DILR passage/set questions remain linked", "Scanned pages and diagrams flagged for review", "Full / sectional / topic test eligibility only after approval"].map((item) => <div key={item} className="flex items-start gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--accent)]"/><span>{item}</span></div>)}
      </div>
    </section>
    <section className="mt-8 flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--line)] p-5 md:flex-row md:items-center md:justify-between">
      <div><h2 className="font-serif text-xl">Question review queue</h2><p className="mt-1 text-sm text-[var(--muted)]">Import structured records in batches, inspect each record and explicitly approve publication.</p></div>
      <Link href="/admin/questions" className="btn btn-outline rounded-full normal-case">Go to review queue <ArrowUpRightIcon className="size-4"/></Link>
    </section>
    <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Important: this desk describes the ingestion workflow. A PDF is not considered imported merely because it exists in your ChatGPT Library; the source must be transferred into the MBA OS ingestion process. No question is published automatically.</p>
  </main>;
}