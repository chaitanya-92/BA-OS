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

export function LearningLibrary() {
  const [catalogue, setCatalogue] = useState<Catalogue>({ subjects: [], topics: [] });
  const [resources, setResources] = useState<Resource[]>([]);
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [selected, setSelected] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/catalog", { signal: controller.signal, cache: "no-store" }),
      fetch("/api/resources", { signal: controller.signal, cache: "no-store" }),
    ]).then(async ([catalogueResponse, resourceResponse]) => {
      if (!catalogueResponse.ok || !resourceResponse.ok) throw new Error("Library unavailable");
      const [catalogueData, resourceData] = await Promise.all([
        catalogueResponse.json() as Promise<Catalogue>,
        resourceResponse.json() as Promise<{ items: Resource[] }>,
      ]);
      setCatalogue(catalogueData);
      setResources(resourceData.items);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === "AbortError") return;
      setCatalogueError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
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
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="h-12 cursor-pointer rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3 text-sm outline-none">
            <option value="all">All subjects</option>
            {catalogue.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </div>

        {catalogueError && <div role="alert" className="mt-5 rounded-xl border border-[#e2c7bf] bg-[#fbf3f0] p-4 text-sm text-[#87483e]">The learning catalogue could not be loaded. Check the database migration and connection.</div>}

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
                  </div>
                </div>
              </details>
            );
          })}
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
