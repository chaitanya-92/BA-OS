"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type AdminTest = { id: string; title: string; slug: string; kind: string; durationMinutes: number; isPublished: boolean; sectionCount: number; questionCount: number };
type PublishedQuestion = { id: string; prompt: string; examYear: number | null; examSlot: string | null; verificationStatus: string };
const example = {
  title: "CAT Quantitative Aptitude — Arithmetic Practice",
  slug: "cat-quant-arithmetic-practice",
  description: "A reviewed, topic-focused practice test. Replace the question IDs with published question IDs from the question bank.",
  instructions: "Attempt all questions. Use the configured marking scheme.",
  kind: "topic_practice",
  durationMinutes: 30,
  sections: [{
    title: "Arithmetic",
    durationMinutes: 30,
    marksPerCorrect: 3,
    marksPerIncorrect: -1,
    questionIds: ["00000000-0000-4000-8000-000000000001"]
  }]
};

export function AdminTestDesk() {
  const [token, setToken] = useState("");
  const [payload, setPayload] = useState(JSON.stringify(example, null, 2));
  const [items, setItems] = useState<AdminTest[]>([]);
  const [questions, setQuestions] = useState<PublishedQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/tests", { headers: { "x-admin-import-token": token }, cache: "no-store" });
      const data = await response.json() as { items?: AdminTest[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load tests.");
      setItems(data.items ?? []);
      const questionResponse = await fetch("/api/admin/questions?published=true", { headers: { "x-admin-import-token": token }, cache: "no-store" });
      const questionData = await questionResponse.json() as { items?: PublishedQuestion[]; error?: string };
      if (!questionResponse.ok) throw new Error(questionData.error ?? "Unable to load published questions.");
      setQuestions(questionData.items ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load tests."); }
    finally { setBusy(false); }
  }, [token]);


  async function create() {
    let value: unknown;
    try { value = JSON.parse(payload); } catch { setError("The test configuration is not valid JSON."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/tests", { method: "POST", headers: { "content-type": "application/json", "x-admin-import-token": token }, body: JSON.stringify(value) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Test creation failed.");
      setMessage("Draft test created. Review its configuration, then publish it when ready.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Test creation failed."); }
    finally { setBusy(false); }
  }

  async function publish(id: string, action: "publish" | "unpublish") {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/tests", { method: "PATCH", headers: { "content-type": "application/json", "x-admin-import-token": token }, body: JSON.stringify({ id, action }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Publishing failed.");
      setMessage(action === "publish" ? "Test is now visible in the student test library." : "Test unpublished.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Publishing failed."); }
    finally { setBusy(false); }
  }

  return <main className="page-shell min-h-screen py-12 sm:py-16">
    <p className="eyebrow">Assessment operations</p>
    <h1 className="editorial-heading mt-4 text-5xl">Test builder.</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-[#716c63]">Assemble tests only from reviewed, published question IDs. New tests are drafts and remain invisible to students until explicitly published.</p>
    <div className="mt-4 flex gap-4 text-xs"><Link href="/admin" className="text-[#8b4a3f] underline">← Admin workspace</Link><Link href="/admin/questions" className="text-[#8b4a3f] underline">Question bank</Link></div>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-[var(--line)] bg-white/65 p-5">
        <label className="block text-xs font-semibold">Admin import token</label>
        <input type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[var(--line)] bg-[#fbfaf7] px-3 text-sm" placeholder="ADMIN_IMPORT_TOKEN" />
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4">
          <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Published question picker</h2><span className="text-[10px] text-[#817b72]">{questions.length} available</span></div>
          <p className="mt-1 text-[11px] leading-5 text-[#817b72]">Select verified questions, then insert their IDs into the test configuration. Only published questions are eligible.</p>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{questions.map(question => <label key={question.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--line)] bg-white p-3">
            <input type="checkbox" checked={selectedIds.includes(question.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, question.id] : current.filter(id => id !== question.id))} className="mt-1 accent-[#8b4a3f]" />
            <span className="min-w-0"><span className="block line-clamp-2 text-xs leading-5">{question.prompt}</span><span className="mt-1 block font-mono text-[9px] text-[#918a80]">{question.id}</span></span>
          </label>)}
          {questions.length === 0 && <p className="py-5 text-center text-xs text-[#817b72]">No published questions yet. Import and verify questions in the <Link href="/admin/questions" className="underline">question desk</Link> first.</p>}</div>
          <button disabled={!selectedIds.length} onClick={() => setPayload(JSON.stringify({ ...example, sections: [{ ...example.sections[0], questionIds: selectedIds }] }, null, 2))} className="btn btn-outline btn-sm mt-3 rounded-full normal-case">Insert {selectedIds.length} selected question IDs</button>
        </div>
        <div className="mt-5 flex items-center justify-between"><h2 className="text-sm font-semibold">Test configuration JSON</h2><button onClick={() => setPayload(JSON.stringify(example,null,2))} className="text-xs text-[#8b4a3f] underline">Load example</button></div>
        <textarea value={payload} onChange={e => setPayload(e.target.value)} rows={24} spellCheck={false} className="mt-3 w-full rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4 font-mono text-xs leading-6" />
        <button disabled={busy || !token.trim()} onClick={() => void create()} className="btn btn-neutral mt-3 rounded-full normal-case">Create draft test</button>
        <p className="mt-3 text-[11px] leading-5 text-[#817b72]">The example question ID is deliberately a placeholder. Copy real IDs from reviewed questions; the server validates every ID.</p>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-white/65 p-5">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Test catalogue administration</h2><button onClick={() => void load()} disabled={busy || !token.trim()} className="text-xs text-[#8b4a3f] underline">Refresh</button></div>
        {message && <p role="status" className="mt-4 rounded-lg bg-[#edf2eb] p-3 text-xs text-[#526b55]">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-[#fbf3f0] p-3 text-xs text-[#87483e]">{error}</p>}
        <div className="mt-4 space-y-3">{items.map(item => <article key={item.id} className="rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4">
          <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold">{item.title}</h3><span className="text-[10px] uppercase text-[#817b72]">{item.isPublished ? "Published" : "Draft"}</span></div>
          <p className="mt-2 text-xs text-[#817b72]">{item.kind.replaceAll("_"," ")} · {item.durationMinutes} min · {item.sectionCount} sections · {item.questionCount} questions</p>
          <div className="mt-3 flex gap-3 text-xs"><Link href={`/tests/${item.slug}`} className="text-[#8b4a3f] underline">Preview</Link><button disabled={busy || (!item.isPublished && item.questionCount === 0)} onClick={() => void publish(item.id, item.isPublished ? "unpublish" : "publish")} className="text-[#8b4a3f] underline">{item.isPublished ? "Unpublish" : "Publish"}</button></div>
        </article>)}
        {items.length === 0 && <p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-xs text-[#817b72]">No tests created yet.</p>}</div>
      </div>
    </section>
  </main>;
}
