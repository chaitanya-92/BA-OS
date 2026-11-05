"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon, BookOpenIcon, CalculatorIcon, LightBulbIcon, MagnifyingGlassIcon, DocumentTextIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/modal";
import { LearningCallout } from "@/components/learning/learning-callout";

type Subject = { id: string; name: string; slug: string };
type Topic = { id: string; subjectId: string; name: string; slug: string };
type Resource = {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  title: string;
  slug: string;
  kind: string;
  content: string | null;
  externalUrl: string | null;
  verificationStatus?: string;
  sourceReference?: string | null;
  sourcePage?: string | null;
};
type Catalogue = { subjects: Subject[]; topics: Topic[] };

const kindLabels: Record<string, string> = {
  note: "Concept note",
  formula: "Formula sheet",
  cheat_sheet: "Cheat sheet",
  trap: "Common traps",
  shortcut: "Shortcuts",
  worked_example: "Worked examples",
  video: "Lecture",
};

function iconFor(kind: string) {
  if (kind.includes("formula")) return CalculatorIcon;
  if (kind.includes("trap") || kind.includes("shortcut")) return LightBulbIcon;
  return DocumentTextIcon;
}


function LibraryDropdown({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; label: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return <div className="relative z-20">
    <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-12 w-full items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-4 text-left text-sm text-[#393630] shadow-sm transition hover:border-[#bdb5a8] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"><span>{selected?.label ?? label}</span><span className={"text-[#817b72] transition-transform " + (open ? "rotate-180" : "")}>⌄</span></button>
    {open && <><button aria-label="Close dropdown" className="fixed inset-0 z-[-1] cursor-default" onClick={() => setOpen(false)} /><div role="listbox" aria-label={label} className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-72 overflow-y-auto rounded-xl border border-[var(--line)] bg-[#fffefa] p-1.5 shadow-[0_16px_42px_rgba(25,23,19,.16)]">{options.map((option) => <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => { onChange(option.value); setOpen(false); }} className={"flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition " + (value === option.value ? "bg-[#efede7] font-semibold text-[#171717]" : "text-[#625d55] hover:bg-[#f4f1eb]")}>{option.label}<span>{value === option.value ? "✓" : ""}</span></button>)}</div></>}
  </div>;
}

export function LearningLibrary() {
  const [catalogue, setCatalogue] = useState<Catalogue>({ subjects: [], topics: [] });
  const [resources, setResources] = useState<Resource[]>([]);
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [selected, setSelected] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState(false);
  const [resourceWarning, setResourceWarning] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadLibrary() {
      const [catalogueResult, resourceResult] = await Promise.allSettled([
        fetch("/api/catalog", { signal: controller.signal, cache: "no-store" }),
        fetch("/api/resources", { signal: controller.signal, cache: "no-store" }),
      ]);

      if (controller.signal.aborted) return;

      if (catalogueResult.status === "fulfilled" && catalogueResult.value.ok) {
        try {
          setCatalogue(await catalogueResult.value.json() as Catalogue);
        } catch {
          setCatalogueError(true);
        }
      } else {
        setCatalogueError(true);
      }

      if (resourceResult.status === "fulfilled" && resourceResult.value.ok) {
        try {
          const payload = await resourceResult.value.json() as {
            items?: Resource[];
            partial?: boolean;
          };
          setResources(Array.isArray(payload.items) ? payload.items : []);
          if (payload.partial) {
            setResourceWarning("Some resource storage is unavailable. Material that loaded successfully is still shown below.");
          }
        } catch {
          setResourceWarning("The resource response could not be read.");
        }
      } else {
        setResourceWarning("Published learning resources could not be loaded. Check the database connection and migrations.");
      }

      if (!controller.signal.aborted) setLoading(false);
    }

    void loadLibrary();
    return () => controller.abort();
  }, []);

  const visibleSubjects = useMemo(
    () => catalogue.subjects.filter((subject) => subjectId === "all" || subject.id === subjectId),
    [catalogue.subjects, subjectId],
  );

  const visibleResources = useMemo(() => {
    const term = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSubject = subjectId === "all" || resource.subjectId === subjectId;
      const matchesQuery = !term || resource.title.toLowerCase().includes(term) ||
        (resource.content ?? "").toLowerCase().includes(term);
      return matchesSubject && matchesQuery;
    });
  }, [resources, query, subjectId]);


  return (
    <main className="min-h-screen bg-[var(--paper)]">

      <section className="page-shell pb-10 pt-14 sm:pt-20">
        <p className="eyebrow">The learning desk</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <h1 className="editorial-heading text-5xl sm:text-6xl">Understand first.<br/><span className="italic text-[var(--accent)]">Practise better.</span></h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#716c63]">A structured home for concepts, formulas, worked examples, shortcuts and common traps. Choose a subject, open a topic and keep the learning material beside your practice.</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#8a8378]">Library index</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><p className="font-display text-3xl">{catalogue.subjects.length || "—"}</p><p className="text-[10px] text-[#817b72]">Subjects</p></div>
              <div><p className="font-display text-3xl">{catalogue.topics.length || "—"}</p><p className="text-[10px] text-[#817b72]">Topics</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white/65 p-4 sm:grid-cols-[1fr_260px] sm:p-5">
          <label className="flex h-12 items-center gap-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-4">
            <MagnifyingGlassIcon className="size-4 text-[#817b72]"/>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search concepts, notes, formulas and traps…" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a29b90]"/>
          </label>
          <LibraryDropdown label="Choose subject" value={subjectId} onChange={setSubjectId} options={[{ value: "all", label: "All subjects" }, ...catalogue.subjects.map((subject) => ({ value: subject.id, label: subject.name }))]} />
        </div>

        {catalogueError && <div role="alert" className="mt-5 rounded-xl border border-[#e2c7bf] bg-[#fbf3f0] p-4 text-sm text-[#87483e]">The learning catalogue could not be loaded. Check the database migration and connection.</div>}
        {resourceWarning && <div role="status" className="mt-5 rounded-xl border border-[#e3d5bb] bg-[#f8f1e4] p-4 text-sm text-[#80643a]">{resourceWarning}</div>}

        <div className="mt-7 space-y-4">
          {loading && Array.from({ length: 3 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-[var(--line)] bg-white/55"/>)}
          {!loading && visibleSubjects.map((subject, index) => {
            const topics = catalogue.topics.filter((topic) => topic.subjectId === subject.id);
            const subjectResources = visibleResources.filter((resource) => resource.subjectId === subject.id);
            return (
              <details key={subject.id} className="collapse collapse-arrow rounded-2xl border border-[var(--line)] bg-white/55" open={index === 0 && !query}>
                <summary className="collapse-title flex min-h-[88px] items-center gap-4 pr-12">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#efede7]"><BookOpenIcon className="size-5 text-[#635e55]"/></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl sm:text-2xl">{subject.name}</span>
                    <span className="mt-1 block text-xs font-normal text-[#817b72]">{topics.length} topics · {subjectResources.length} published resources</span>
                  </span>
                </summary>
                <div className="collapse-content">
                  <div className="border-t border-[var(--line)] pt-2">
                    {topics.map((topic) => {
                      const topicResources = visibleResources.filter((resource) => resource.topicId === topic.id);
                      return (
                        <details key={topic.id} className="group border-b border-[var(--line)] last:border-0">
                          <summary className="flex cursor-pointer list-none items-center gap-3 py-4 text-sm marker:hidden">
                            <span className="min-w-0 flex-1 font-medium">{topic.name}</span>
                            <span className="text-[10px] text-[#817b72]">{topicResources.length} resources</span>
                            <span className="text-[#817b72] transition-transform group-open:rotate-180">⌄</span>
                          </summary>
                          {topicResources.length > 0 ? (
                            <div className="grid gap-2 pb-4 sm:grid-cols-2">
                              {topicResources.map((resource) => {
                                const Icon = iconFor(resource.kind);
                                return (
                                  <button key={resource.id} onClick={() => setSelected(resource)} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4 text-left transition-colors hover:border-[#c9c1b4] hover:bg-white">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#efede7]"><Icon className="size-4 text-[var(--accent)]"/></span>
                                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{resource.title}</span><span className="mt-1 block text-[10px] uppercase tracking-wider text-[#8a8378]">{kindLabels[resource.kind] ?? resource.kind.replaceAll("_", " ")}</span>{resource.verificationStatus === "unreviewed" && <span className="mt-2 inline-flex rounded-full border border-[#d9c8a9] bg-[#f8f1e4] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#80643a]">Source-attributed · not yet reviewed</span>}</span>
                                    <ArrowUpRightIcon className="size-4 shrink-0 text-[#817b72]"/>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="pb-4 pl-1 text-xs leading-6 text-[#898378]">No reviewed learning resources published for this topic yet. Notes, formulas, traps and worked examples will appear here as they are approved.</p>
                          )}
                        </details>
                      );
                    })}
                    {subjectResources.filter((resource) => !resource.topicId).length > 0 && (
                      <section className="mt-4 rounded-xl border border-dashed border-[var(--line)] bg-[#fbfaf7] p-4">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold">General resources</h3>
                          <p className="mt-1 text-xs leading-5 text-[#817b72]">Published material assigned to this subject but not yet mapped to a specific topic. It remains available here instead of being hidden.</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {subjectResources.filter((resource) => !resource.topicId).map((resource) => {
                            const Icon = iconFor(resource.kind);
                            return (
                              <button key={resource.id} onClick={() => setSelected(resource)} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-white p-4 text-left transition-colors hover:border-[#c9c1b4]">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#efede7]"><Icon className="size-4 text-[var(--accent)]"/></span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold">{resource.title}</span>
                                  <span className="mt-1 block text-[10px] uppercase tracking-wider text-[#8a8378]">{kindLabels[resource.kind] ?? resource.kind.replaceAll("_", " ")}</span>
                                  {resource.sourcePage && <span className="mt-1 block text-[10px] text-[#817b72]">PDF pages {resource.sourcePage}</span>}
                                  {resource.verificationStatus === "unreviewed" && <span className="mt-2 inline-flex rounded-full border border-[#d9c8a9] bg-[#f8f1e4] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#80643a]">Source-attributed · not yet reviewed</span>}
                                </span>
                                <ArrowUpRightIcon className="size-4 shrink-0 text-[#817b72]"/>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </details>
            );
          })}
          {!loading && subjectId === "all" && visibleResources.some((resource) => !resource.subjectId) && <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/55">
            <div className="flex items-center gap-4 border-b border-[var(--line)] p-5 sm:p-6"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#efede7]"><BookOpenIcon className="size-5 text-[#635e55]"/></span><div><h2 className="font-display text-xl sm:text-2xl">Imported study resources</h2><p className="mt-1 text-xs text-[#817b72]">Source-organised material not yet mapped to a subject or topic · {visibleResources.filter((resource) => !resource.subjectId).length} resources</p></div></div>
            <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">{visibleResources.filter((resource) => !resource.subjectId).map((resource) => <button key={resource.id} onClick={() => setSelected(resource)} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4 text-left transition-colors hover:border-[#c9c1b4] hover:bg-white"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#efede7]"><DocumentTextIcon className="size-4 text-[var(--accent)]"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{resource.title}</span><span className="mt-1 block text-[10px] uppercase tracking-wider text-[#8a8378]">{resource.kind.replaceAll("_", " ")}</span>{resource.sourcePage && <span className="mt-1 block text-[10px] text-[#817b72]">PDF pages {resource.sourcePage}</span>}{resource.verificationStatus === "unreviewed" && <span className="mt-2 inline-flex rounded-full border border-[#d9c8a9] bg-[#f8f1e4] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#80643a]">Source-attributed · not yet reviewed</span>}</span><ArrowUpRightIcon className="size-4 shrink-0 text-[#817b72]"/></button>)}</div>
          </section>}
          {!loading && visibleSubjects.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--line)] py-16 text-center text-sm text-[#817b72]"><XCircleIcon className="mx-auto mb-3 size-7"/>No matching subjects or resources.</div>}
        </div>
      </section>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? "Learning resource"} description={selected ? kindLabels[selected.kind] ?? selected.kind : undefined} size="lg">
        {selected?.verificationStatus === "unreviewed" && <div className="mb-4 rounded-xl border border-[#e3d5bb] bg-[#f8f1e4] p-3 text-xs leading-5 text-[#80643a]">This source-attributed draft has been published for study access, but it has not yet completed editorial verification. Check the source and worked method before relying on it in a scored test.</div>}
        {selected?.sourceReference && <p className="mb-4 text-xs text-[#817b72]">Source: {selected.sourceReference}{selected.sourcePage ? ` · ${selected.sourcePage}` : ""}</p>}
        {selected?.content && <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-7 text-[#49463f]">{selected.content}</div>}
        {selected?.kind === "formula" && <LearningCallout kind="formula">Review the formula carefully and test it with a worked example before relying on it under timed conditions.</LearningCallout>}
        {selected?.externalUrl && <a href={selected.externalUrl} target="_blank" rel="noreferrer" className="btn btn-neutral mt-4 rounded-full normal-case">Open resource <ArrowUpRightIcon className="size-4"/></a>}
        {!selected?.content && !selected?.externalUrl && <p className="text-sm text-[#817b72]">This resource has no published content yet.</p>}
      </Modal>
    </main>
  );
}
