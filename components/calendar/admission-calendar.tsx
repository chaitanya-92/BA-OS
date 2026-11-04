"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, CalendarDaysIcon, ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/modal";

type EventItem = {
  id: string;
  title: string;
  eventType: string;
  startsAt: string | null;
  endsAt: string | null;
  status: "announced" | "scheduled" | "open" | "closed" | "tentative";
  officialUrl: string | null;
  sourceReference: string | null;
  lastVerifiedAt: string | null;
  examName: string | null;
  collegeName: string | null;
};

const statusLabels: Record<EventItem["status"], string> = {
  announced: "Announced",
  scheduled: "Scheduled",
  open: "Applications open",
  closed: "Closed",
  tentative: "Tentative",
};

function dateLabel(value: string | null) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function AdmissionCalendar() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/calendar", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Admission calendar is unavailable.");
        return response.json() as Promise<{ items: EventItem[] }>;
      })
      .then((data) => setEvents(data.items))
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Unable to load calendar.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesStatus = status === "all" || event.status === status;
      const matchesText = !term || [event.title,event.eventType,event.examName,event.collegeName].some((value) => value?.toLowerCase().includes(term));
      return matchesStatus && matchesText;
    }).sort((a,b) => {
      if (!a.startsAt) return 1;
      if (!b.startsAt) return -1;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [events, query, status]);

  const grouped = useMemo(() => {
    const groups = new Map<string, EventItem[]>();
    for (const event of visible) {
      const key = event.startsAt
        ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(event.startsAt))
        : "Date to be announced";
      groups.set(key, [...(groups.get(key) ?? []), event]);
    }
    return [...groups.entries()];
  }, [visible]);

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[#f7f5f0]/95"><div className="page-shell flex h-[76px] items-center justify-between"><Link href="/" className="font-display text-xl font-bold tracking-[-.06em]">MBA OS<span className="text-[var(--accent)]">.</span></Link><Link href="/" className="text-sm text-[#706b63] hover:text-[#242321]">Back to overview</Link></div></header>
      <section className="page-shell pb-10 pt-14 sm:pt-20">
        <p className="eyebrow">The admissions calendar</p>
        <h1 className="editorial-heading mt-4 text-5xl sm:text-6xl">Never lose sight of a deadline.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#716c63]">Entrance exam notifications, registration windows, admit cards, results and B-school application milestones — with source links and last-verified dates.</p>
      </section>
      <section className="page-shell pb-20">
        <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white/65 p-4 sm:grid-cols-[1fr_240px] sm:p-5">
          <label className="flex h-12 items-center gap-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-4"><MagnifyingGlassIcon className="size-4 text-[#817b72]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exam, college or milestone…" className="w-full bg-transparent text-sm outline-none"/></label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 cursor-pointer rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3 text-sm outline-none"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>
        <div className="mt-5 flex items-center justify-between text-xs text-[#817b72]"><span>{loading ? "Loading milestones…" : `${visible.length} published milestones`}</span><span>Officially sourced records only</span></div>
        {error && <div role="alert" className="mt-5 rounded-xl border border-[#e2c7bf] bg-[#fbf3f0] p-4 text-sm text-[#87483e]">{error}</div>}
        {loading && <div className="mt-5 space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-[var(--line)] bg-white/55"/>)}</div>}
        {!loading && !error && visible.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-white/40 px-6 py-16 text-center"><CalendarDaysIcon className="mx-auto size-8 text-[#928b80]"/><h2 className="mt-4 font-display text-2xl">Your calendar is ready for verified dates.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#817b72]">No official milestones have been published yet. Dates will only appear after checking the relevant exam or institution source; tentative dates will be labelled clearly.</p></div>}
        {!loading && grouped.length > 0 && <div className="mt-7 space-y-8">{grouped.map(([month,items]) => <section key={month}><h2 className="mb-3 font-display text-2xl">{month}</h2><div className="space-y-3">{items.map((event) => <article key={event.id} className="soft-card flex flex-col gap-4 rounded-2xl bg-white/65 p-5 sm:flex-row sm:items-center"><div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#efede7]"><span className="font-mono text-[9px] uppercase text-[#817b72]">{event.startsAt ? new Date(event.startsAt).toLocaleDateString("en-IN",{month:"short"}) : "TBA"}</span><span className="font-display text-2xl">{event.startsAt ? new Date(event.startsAt).getDate() : "—"}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] uppercase tracking-wider text-[var(--accent)]">{event.eventType.replaceAll("_"," ")}</span><span className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-wider ${event.status === "open" ? "bg-[#edf2eb] text-[#526b55]" : "bg-[#efede7] text-[#716c63]"}`}>{statusLabels[event.status]}</span></div><h3 className="mt-1 text-base font-semibold">{event.title}</h3><p className="mt-1 text-xs text-[#817b72]">{[event.examName,event.collegeName].filter(Boolean).join(" · ")}</p></div><button onClick={() => setSelected(event)} className="cursor-pointer self-start text-xs font-semibold text-[var(--accent)] sm:self-center">Details <ArrowUpRightIcon className="inline size-4"/></button></article>)}</div></section>)}</div>}
      </section>
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? "Admission milestone"} description={selected ? [selected.examName,selected.collegeName].filter(Boolean).join(" · ") : undefined}>
        {selected && <>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#efede7] p-4"><p className="text-[9px] uppercase tracking-wider text-[#817b72]">Start date</p><p className="mt-1 text-sm font-semibold">{dateLabel(selected.startsAt)}</p></div><div className="rounded-xl bg-[#efede7] p-4"><p className="text-[9px] uppercase tracking-wider text-[#817b72]">End date</p><p className="mt-1 text-sm font-semibold">{dateLabel(selected.endsAt)}</p></div></div>
          <p className="mt-5 text-xs text-[#817b72]">Status: {statusLabels[selected.status]}</p>
          {selected.sourceReference && <p className="mt-3 text-xs leading-6 text-[#625d55]">Source: {selected.sourceReference}</p>}
          {selected.lastVerifiedAt && <p className="mt-2 text-[10px] text-[#817b72]">Last verified: {dateLabel(selected.lastVerifiedAt)}</p>}
          {selected.officialUrl && <a href={selected.officialUrl} target="_blank" rel="noreferrer" className="btn btn-neutral mt-5 rounded-full normal-case">Open official source <ArrowUpRightIcon className="size-4"/></a>}
        </>}
      </Modal>
    </main>
  );
}
