"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { ArrowRightIcon, BookOpenIcon, ClockIcon, DocumentTextIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/modal";

type TestItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  kind: "full_mock" | "sectional" | "topic_practice" | "diagnostic";
  durationMinutes: number;
};

const kindLabels: Record<TestItem["kind"], string> = {
  full_mock: "Full-length mock",
  sectional: "Sectional test",
  topic_practice: "Topic practice",
  diagnostic: "Diagnostic",
};


function TestTypeDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = [{ value: "all", label: "All test types" }, { value: "full_mock", label: "Full mocks" }, { value: "sectional", label: "Sectional tests" }, { value: "topic_practice", label: "Topic practice" }, { value: "diagnostic", label: "Diagnostics" }];
  const selected = options.find((option) => option.value === value) ?? options[0];
  return <div className="relative z-20 min-w-[170px]">
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-10 w-full items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3 text-left text-xs text-[#393630] shadow-sm transition hover:border-[#bdb5a8] focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
      <span>{selected.label}</span><span className={"text-[#817b72] transition-transform " + (open ? "rotate-180" : "")}>⌄</span>
    </button>
    {open && <><button aria-label="Close test type menu" className="fixed inset-0 z-[-1] cursor-default" onClick={() => setOpen(false)} /><div role="listbox" aria-label="Filter tests" className="absolute right-0 top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[#fffefa] p-1.5 shadow-[0_16px_42px_rgba(25,23,19,.16)]">
      {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => { onChange(option.value); setOpen(false); }} className={"flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition " + (value === option.value ? "bg-[#efede7] font-semibold text-[#171717]" : "text-[#625d55] hover:bg-[#f4f1eb]")}>{option.label}<span>{value === option.value ? "✓" : ""}</span></button>)}
    </div></>}
  </div>;
}

export function TestLibrary() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<TestItem | null>(null);
  const [kind, setKind] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tests", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Test catalogue is unavailable. Check the database connection.");
        return response.json() as Promise<{ items: TestItem[] }>;
      })
      .then((data) => setTests(data.items))
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Unable to load tests.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const visible = tests.filter((test) => kind === "all" || test.kind === kind);

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <section className="page-shell pb-10 pt-14 sm:pt-20">
        <p className="eyebrow">The examination room</p>
        <h1 className="editorial-heading mt-4 text-5xl sm:text-6xl">Practise with purpose.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#716c63]">Full mocks, sectional tests and topic-level practice belong in one place. Every published test will use a configured duration, section order and marking scheme.</p>
      </section>
      <section className="page-shell pb-20">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/60 p-4">
          <div className="flex items-center gap-2 text-xs text-[#817b72]"><DocumentTextIcon className="size-4"/> {loading ? "Loading test catalogue…" : `${tests.length} published tests`}</div>
          <TestTypeDropdown value={kind} onChange={setKind} />
        </div>
        {error && <div role="alert" className="mt-5 rounded-xl border border-[#e2c7bf] bg-[#fbf3f0] p-4 text-sm text-[#87483e]">{error}</div>}
        {loading && <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[0,1,2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-[var(--line)] bg-white/55"/>)}</div>}
        {!loading && !error && visible.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-[#d5cfc4] bg-white/40 px-6 py-16 text-center">
          <BookOpenIcon className="mx-auto size-8 text-[#928b80]"/>
          <h2 className="mt-4 font-display text-2xl">Your test room is being prepared.</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#817b72]">There are no published tests yet. Once reviewed questions are assigned to a test and its sections, the test will appear here. We won&apos;t fill this library with fabricated questions.</p>
        </div>}
        {!loading && visible.length > 0 && <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((test) => <article key={test.id} className="soft-card flex min-h-64 flex-col rounded-2xl bg-white/65 p-6">
            <div className="flex items-start justify-between"><span className="rounded-full border border-[var(--line)] bg-[#efede7] px-3 py-1 text-[10px] uppercase tracking-wider text-[#716c63]">{kindLabels[test.kind]}</span><button onClick={() => setSelected(test)} className="btn btn-ghost btn-square btn-sm" aria-label={`Details for ${test.title}`}><InformationCircleIcon className="size-5"/></button></div>
            <h2 className="mt-6 font-display text-2xl">{test.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-[#716c63]">{test.description ?? "A structured practice session."}</p>
            <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4"><span className="inline-flex items-center gap-2 text-xs text-[#817b72]"><ClockIcon className="size-4"/>{test.durationMinutes} minutes</span><Link href={`/tests/${test.slug}`} className="inline-flex items-center gap-2 text-xs font-semibold">Open test <ArrowRightIcon className="size-4"/></Link></div>
          </article>)}
        </div>}
      </section>
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? "Test details"} description={selected ? kindLabels[selected.kind] : undefined}>
        <p className="text-sm leading-7 text-[#625d55]">{selected?.description ?? "This practice test is configured by the MBA OS content team."}</p>
        <div className="mt-5 rounded-xl bg-[#efede7] p-4"><p className="text-[10px] uppercase tracking-wider text-[#817b72]">Duration</p><p className="mt-1 font-display text-2xl">{selected?.durationMinutes} minutes</p></div>
        <p className="mt-4 text-xs leading-6 text-[#817b72]">The test player will display instructions, section navigation, a timer and a submission review before scoring.</p>
      </Modal>
    </main>
  );
}
