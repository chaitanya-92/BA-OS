"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowPathIcon, CheckCircleIcon, ClipboardDocumentIcon, ExclamationTriangleIcon, LockClosedIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/modal";

type PendingQuestion = {
  id: string;
  prompt: string;
  passage: string | null;
  questionType: string;
  difficulty: string;
  examYear: number | null;
  examSlot: string | null;
  sourceReference: string | null;
  sourcePage: string | null;
  verificationStatus: string;
  createdAt: string;
  options?: { id: string; optionKey: string; content: string; isCorrect: boolean | null }[];
  solutions?: { methodName: string | null; content: string; answerText: string | null; answerVerification: string }[];
};

type ImportResult = { status: string; questionId: string | null; published: false; verificationStatus: string };

const sample = `{
  "examYear": 2025,
  "examSlot": "Slot 1",
  "questionType": "mcq_single",
  "difficulty": "unrated",
  "prompt": "Paste content you are permitted to publish here.",
  "options": [
    { "key": "A", "content": "Option A" },
    { "key": "B", "content": "Option B" },
    { "key": "C", "content": "Option C" },
    { "key": "D", "content": "Option D" }
  ],
  "solution": {
    "methodName": "Verified explanation",
    "content": "Add an explanation after checking the answer.",
    "answerText": "A"
  }
}`;

export function AdminQuestionDesk() {
  const [token, setToken] = useState("");
  const [payload, setPayload] = useState("");
  const [pending, setPending] = useState<PendingQuestion[]>([]);
  const [selected, setSelected] = useState<PendingQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);

  const loadPending = useCallback(async () => {
    if (!token.trim()) {
      setError("Enter the admin import token first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/questions", {
        headers: { "x-admin-import-token": token },
        cache: "no-store",
      });
      const data = await response.json() as { items?: PendingQuestion[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load review queue.");
      setPending(data.items ?? []);
      setMessage(`${data.items?.length ?? 0} questions waiting for review.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load review queue.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function importQuestions() {
    if (!token.trim()) return setError("Enter the admin import token first.");
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return setError("The import payload is not valid JSON.");
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (!items.length || items.length > 100) return setError("Import between 1 and 100 questions at a time.");
    setImporting(true);
    setError("");
    setMessage("");
    const imported: ImportResult[] = [];
    try {
      for (const item of items) {
        const response = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "content-type": "application/json", "x-admin-import-token": token },
          body: JSON.stringify(item),
        });
        const data = await response.json() as ImportResult & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Question import failed.");
        imported.push(data);
      }
      setResults(imported);
      setMessage(`Processed ${imported.length} question records. New records remain unpublished until reviewed.`);
      await loadPending();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed.");
      setResults(imported);
    } finally {
      setImporting(false);
    }
  }


  async function openReview(item: PendingQuestion) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/questions?id=${encodeURIComponent(item.id)}`, {
        headers: { "x-admin-import-token": token },
        cache: "no-store",
      });
      const data = await response.json() as PendingQuestion & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load question details.");
      setSelected(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load question details.");
    } finally {
      setLoading(false);
    }
  }

  async function review(action: "approve" | "reject") {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-admin-import-token": token },
        body: JSON.stringify({ questionId: selected.id, action }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Review action failed.");
      setSelected(null);
      setMessage(action === "approve" ? "Question verified and published." : "Question marked as disputed.");
      await loadPending();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review action failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <section className="page-shell pb-10 pt-14 sm:pt-20">
        <p className="eyebrow">Content operations</p>
        <h1 className="editorial-heading mt-4 text-5xl sm:text-6xl">Question import & review.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#716c63]">Bring in properly attributed question records, inspect their provenance and verify answer keys before publishing. The import endpoint never publishes content automatically.</p>
      </section>
      <section className="page-shell grid gap-6 pb-20 lg:grid-cols-[.9fr_1.1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--line)] bg-white/65 p-5 sm:p-6">
            <div className="flex items-center gap-2"><LockClosedIcon className="size-4 text-[var(--accent)]"/><h2 className="text-sm font-semibold">Admin access</h2></div>
            <label className="mt-4 block text-xs font-medium text-[#625d55]">Admin import token</label>
            <input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste ADMIN_IMPORT_TOKEN" className="mt-2 h-12 w-full rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-4 text-sm outline-none focus:border-[#8b4a3f]"/>
            <button onClick={() => void loadPending()} disabled={loading || !token} className="btn btn-neutral mt-3 w-full rounded-full normal-case"><ArrowPathIcon className="size-4"/> Load review queue</button>
            <p className="mt-3 text-[10px] leading-5 text-[#817b72]">The token stays in this page&apos;s memory and is sent only in a request header. Do not share it or commit it.</p>
          </section>
          <section className="rounded-2xl border border-[var(--line)] bg-white/65 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Import questions</h2><span className="text-[10px] uppercase tracking-wider text-[#817b72]">JSON · max 100</span></div>
            <p className="mt-2 text-xs leading-6 text-[#817b72]">Paste one question object or an array of question objects. Include the correct answer and source metadata only when verified.</p>
            <textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={15} placeholder={sample} className="mt-4 w-full rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4 font-mono text-[11px] leading-6 outline-none focus:border-[#8b4a3f]"/>
            <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setPayload(sample)} className="btn btn-ghost btn-sm rounded-full normal-case"><ClipboardDocumentIcon className="size-4"/> Load JSON example</button><button onClick={() => void importQuestions()} disabled={importing || !payload.trim() || !token.trim()} className="btn btn-neutral btn-sm ml-auto rounded-full normal-case">{importing ? "Importing…" : "Import for review"}</button></div>
            {results.length > 0 && <div className="mt-4 rounded-xl bg-[#edf2eb] p-3 text-xs text-[#526b55]">{results.filter((item) => item.status === "queued_for_review").length} new · {results.filter((item) => item.status === "duplicate").length} duplicates</div>}
          </section>
        </div>
        <section className="rounded-2xl border border-[var(--line)] bg-white/65 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Review queue</h2><p className="mt-1 text-xs text-[#817b72]">Unpublished questions requiring human verification.</p></div><span className="rounded-full bg-[#efede7] px-3 py-1 font-mono text-xs">{pending.length}</span></div>
          {message && <p role="status" className="mt-4 rounded-xl bg-[#edf2eb] p-3 text-xs leading-5 text-[#526b55]">{message}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-[#fbf3f0] p-3 text-xs leading-5 text-[#87483e]">{error}</p>}
          <div className="mt-5 space-y-3">
            {pending.map((item) => <article key={item.id} className="rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#817b72]"><span className="rounded-full bg-[#efede7] px-2 py-1 uppercase">{item.questionType.replaceAll("_"," ")}</span>{item.examYear && <span>{item.examYear}</span>}{item.examSlot && <span>· {item.examSlot}</span>}<span className="ml-auto">{item.verificationStatus.replaceAll("_"," ")}</span></div>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#49463f]">{item.prompt}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3"><span className="truncate text-[10px] text-[#8a8378]">{item.sourceReference ?? "Source reference missing"}</span><button onClick={() => void openReview(item)} className="cursor-pointer text-xs font-semibold text-[var(--accent)]">Review record →</button></div>
            </article>)}
            {!loading && pending.length === 0 && <div className="rounded-xl border border-dashed border-[var(--line)] px-5 py-12 text-center"><CheckCircleIcon className="mx-auto size-7 text-[#71816d]"/><p className="mt-3 text-sm font-semibold">No questions waiting</p><p className="mt-1 text-xs text-[#817b72]">Load the queue using your admin token.</p></div>}
          </div>
        </section>
      </section>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Review question" description={selected ? [selected.examYear,selected.examSlot,selected.sourceReference,selected.sourcePage ? `p. ${selected.sourcePage}` : null].filter(Boolean).join(" · ") : undefined} size="lg">
        {selected && <>
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#817b72]"><ExclamationTriangleIcon className="size-4"/> Verify source rights, wording and answer key before approval</div>
          {selected.passage && <div className="mb-4 rounded-xl bg-[#efede7] p-4 text-sm leading-6">{selected.passage}</div>}
          <p className="whitespace-pre-wrap text-sm leading-7">{selected.prompt}</p>
          {selected.options && selected.options.length > 0 && <div className="mt-5 space-y-2">{selected.options.map((option) => <div key={option.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm"><span><strong className="mr-2 text-[#8b4a3f]">{option.optionKey}.</strong>{option.content}</span><span className={`shrink-0 text-[10px] font-semibold ${option.isCorrect ? "text-[#526b55]" : "text-[#817b72]"}`}>{option.isCorrect === true ? "Correct key" : option.isCorrect === false ? "Incorrect" : "Unmarked"}</span></div>)}</div>}
          {selected.solutions?.map((solution,index) => <div key={index} className="mt-5 rounded-xl bg-[#efede7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#8b4a3f]">{solution.methodName ?? "Explanation"} · {solution.answerVerification.replaceAll("_"," ")}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{solution.content}</p>{solution.answerText && <p className="mt-2 text-xs font-semibold">Answer key: {solution.answerText}</p>}</div>)}
          <p className="mt-5 text-xs text-[#817b72]">Question type: {selected.questionType.replaceAll("_"," ")} · Difficulty: {selected.difficulty}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-5"><button onClick={() => void review("reject")} disabled={loading} className="btn btn-ghost rounded-full normal-case text-[#87483e]"><XCircleIcon className="size-4"/> Mark disputed</button><button onClick={() => void review("approve")} disabled={loading} className="btn btn-neutral rounded-full normal-case"><CheckCircleIcon className="size-4"/> Verify & publish</button></div>
        </>}
      </Modal>
    </main>
  );
}
