"use client";

import { useEffect, useState } from "react";
import { LearningCallout } from "@/components/learning/learning-callout";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type Question = {
  id: string;
  examYear: number | null;
  examSlot: string | null;
  questionType: string;
  difficulty: "easy" | "moderate" | "difficult" | "unrated";
  prompt: string;
  verificationStatus: string;
  createdAt: string;
};

type QuestionDetail = Question & {
  options: { id: string; optionKey: string; content: string; isCorrect: boolean | null }[];
  solutions: { methodName: string | null; content: string; answerText: string | null; answerVerification: string }[];
};

const difficultyLabels: Record<Question["difficulty"], string> = {
  easy: "Easy",
  moderate: "Moderate",
  difficult: "Difficult",
  unrated: "Not rated",
};

function prettyType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PyqLibrary() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [catalog, setCatalog] = useState<{ exams: {id:string;name:string}[]; sections: {id:string;examId:string;name:string}[]; subjects: {id:string;name:string}[]; topics: {id:string;subjectId:string;name:string}[] }>({ exams:[], sections:[], subjects:[], topics:[] });
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Question[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<QuestionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogue unavailable");
        return response.json();
      })
      .then((data) => setCatalog(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ limit: "20", offset: String(page * 20) });
      if (query.trim()) params.set("q", query.trim());
      if (year) params.set("year", year);
      if (difficulty) params.set("difficulty", difficulty);
      if (examId) params.set("examId", examId);
      if (sectionId) params.set("sectionId", sectionId);
      if (subjectId) params.set("subjectId", subjectId);
      if (topicId) params.set("topicId", topicId);
      try {
        const response = await fetch(`/api/questions?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(response.status === 503 ? "The question bank is not connected yet. Complete the Neon migration to load questions." : "Unable to load questions.");
        const data = (await response.json()) as { items: Question[]; pagination: { hasMore: boolean } };
        setItems(data.items);
        setHasMore(data.pagination.hasMore);
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setItems([]);
        setHasMore(false);
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, year, difficulty, examId, sectionId, subjectId, topicId, page]);

  async function openQuestion(id: string) {
    setDetailLoading(true);
    setSelected(null);
    try {
      const response = await fetch(`/api/questions/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("This question could not be opened.");
      setSelected((await response.json()) as QuestionDetail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open question.");
    } finally {
      setDetailLoading(false);
    }
  }

  function resetFilters() {
    setQuery("");
    setYear("");
    setDifficulty("");
    setExamId("");
    setSectionId("");
    setSubjectId("");
    setTopicId("");
    setPage(0);
  }

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[rgba(247,245,240,.94)]">
        <div className="page-shell flex h-[76px] items-center justify-between">
          <a href="/" className="cursor-pointer text-xl font-bold tracking-[-.06em]">MBA OS<span className="text-[var(--accent)]">.</span></a>
          <a href="/" className="cursor-pointer text-sm text-[#706b63] hover:text-[var(--ink)]">Back to overview</a>
        </div>
      </header>

      <section className="page-shell pb-10 pt-14 sm:pt-20">
        <p className="eyebrow">The question archive</p>
        <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Previous-year questions</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#716c63]">Search the question collection and narrow it down by year or difficulty. Each published record should retain its source and review status.</p>
          </div>
          <div className="text-sm text-[#817b72]"><span className="font-semibold text-[#242321]">{loading ? "—" : items.length}</span> questions on this page</div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="rounded-2xl border border-[var(--line)] bg-white/65 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex h-12 items-center gap-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-4">
              <MagnifyingGlassIcon className="size-4 shrink-0 text-[#817b72]"/>
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search within question text…" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a29b90]"/>
            </label>
            <label className="flex h-12 items-center rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3">
              <span className="mr-2 text-xs text-[#817b72]">Exam</span>
              <select value={examId} onChange={(event) => { setExamId(event.target.value); setSectionId(""); setPage(0); }} className="w-full cursor-pointer bg-transparent text-sm outline-none">
                <option value="">All exams</option>
                {catalog.exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
              </select>
            </label>
            <label className="flex h-12 items-center rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3">
              <span className="mr-2 text-xs text-[#817b72]">Section</span>
              <select value={sectionId} onChange={(event) => { setSectionId(event.target.value); setPage(0); }} className="w-full cursor-pointer bg-transparent text-sm outline-none">
                <option value="">All sections</option>
                {catalog.sections.filter((section) => !examId || section.examId === examId).map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
              </select>
            </label>
            <label className="flex h-12 items-center rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3">
              <span className="mr-2 text-xs text-[#817b72]">Subject</span>
              <select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(""); setPage(0); }} className="w-full cursor-pointer bg-transparent text-sm outline-none">
                <option value="">All subjects</option>
                {catalog.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="flex h-12 items-center rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3">
              <span className="mr-2 text-xs text-[#817b72]">Topic</span>
              <select value={topicId} onChange={(event) => { setTopicId(event.target.value); setPage(0); }} disabled={!subjectId} className="w-full cursor-pointer bg-transparent text-sm outline-none disabled:opacity-50">
                <option value="">All topics</option>
                {catalog.topics.filter((topic) => topic.subjectId === subjectId).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
            <label className="flex h-12 items-center rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3">
              <span className="mr-2 text-xs text-[#817b72]">Year</span>
              <select value={year} onChange={(event) => { setYear(event.target.value); setPage(0); }} className="w-full cursor-pointer bg-transparent text-sm outline-none">
                <option value="">All years</option>
                {Array.from({ length: 36 }, (_, index) => 2026 - index).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="flex h-12 items-center rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3">
              <span className="mr-2 text-xs text-[#817b72]">Level</span>
              <select value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(0); }} className="w-full cursor-pointer bg-transparent text-sm outline-none">
                <option value="">All levels</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
                <option value="unrated">Not rated</option>
              </select>
            </label>
            <button onClick={resetFilters} className="btn h-12 cursor-pointer rounded-xl border border-[var(--line)] bg-transparent px-4 text-sm font-medium normal-case hover:bg-[#efede7]"><ArrowPathIcon className="size-4"/> Reset</button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#817b72]"><FunnelIcon className="size-4"/> Filters apply to published questions only.</div>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl border border-[#e2c7bf] bg-[#fbf3f0] p-4 text-sm leading-6 text-[#87483e]">{error}</div>}

        <div className="mt-6 space-y-3">
          {loading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-[var(--line)] bg-white/55"/>)}
          {!loading && !error && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#d5cfc4] bg-white/40 px-6 py-16 text-center">
              <BookOpenIcon className="mx-auto size-8 text-[#928b80]"/>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">No published questions yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#817b72]">The library is ready for verified content. Once the database migration is applied and approved questions are imported, they will appear here.</p>
              {(query || year || difficulty || examId || sectionId || subjectId || topicId) && <button onClick={resetFilters} className="btn btn-outline mt-5 cursor-pointer rounded-full normal-case">Clear filters</button>}
            </div>
          )}
          {!loading && items.map((question, index) => (
            <article key={question.id} className="rounded-2xl border border-[var(--line)] bg-white/65 p-5 transition-colors hover:border-[#c9c1b4] sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#817b72]">
                <span className="rounded-full bg-[#efede7] px-2.5 py-1 font-semibold text-[#514d46]">Q{page * 20 + index + 1}</span>
                {question.examYear && <span>{question.examYear}</span>}
                {question.examSlot && <span>· {question.examSlot}</span>}
                <span>· {prettyType(question.questionType)}</span>
                <span className="ml-auto rounded-full border border-[var(--line)] px-2.5 py-1">{difficultyLabels[question.difficulty]}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#292824]">{question.prompt}</p>
              <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
                <span className="text-[10px] uppercase tracking-wider text-[#938c81]">{question.verificationStatus.replaceAll("_", " ")}</span>
                <button onClick={() => void openQuestion(question.id)} className="cursor-pointer text-sm font-semibold text-[var(--accent)] hover:underline">Open question</button>
              </div>
            </article>
          ))}
        </div>

        {!loading && (page > 0 || hasMore) && <div className="mt-7 flex items-center justify-between">
          <button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="btn btn-outline cursor-pointer rounded-full normal-case disabled:cursor-not-allowed"><ChevronLeftIcon className="size-4"/> Previous</button>
          <span className="text-xs text-[#817b72]">Page {page + 1}</span>
          <button disabled={!hasMore} onClick={() => setPage((value) => value + 1)} className="btn btn-outline cursor-pointer rounded-full normal-case disabled:cursor-not-allowed">Next <ChevronRightIcon className="size-4"/></button>
        </div>}
      </section>

      {(detailLoading || selected) && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-label="Question details" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-6 shadow-2xl sm:p-8">
          <div className="flex items-center justify-between"><p className="eyebrow">Question details</p><button onClick={() => setSelected(null)} className="btn btn-ghost btn-square btn-sm cursor-pointer" aria-label="Close"><XMarkIcon className="size-5"/></button></div>
          {detailLoading && <div className="space-y-3 py-10"><div className="h-5 w-2/3 animate-pulse rounded bg-[#e9e5dc]"/><div className="h-20 animate-pulse rounded bg-[#e9e5dc]"/></div>}
          {selected && <>
            <p className="mt-6 whitespace-pre-wrap text-base leading-8">{selected.prompt}</p>
            {selected.options.length > 0 && <div className="mt-6 space-y-2">{selected.options.map((option) => <div key={option.id} className="rounded-xl border border-[var(--line)] bg-white/70 p-4 text-sm"><span className="mr-3 font-semibold text-[#8b4a3f]">{option.optionKey}.</span>{option.content}</div>)}</div>}
            {selected.solutions.length > 0 ? <div className="mt-7 space-y-4 border-t border-[var(--line)] pt-6"><h3 className="text-sm font-semibold">Solution & explanation</h3>{selected.solutions.map((solution, index) => <LearningCallout key={index} kind="note" title={solution.methodName ?? "Solution"}><p className="whitespace-pre-wrap">{solution.content}</p>{solution.answerText && <p className="mt-3 font-semibold">Answer: {solution.answerText}</p>}</LearningCallout>)}</div> : <p className="mt-6 rounded-xl bg-[#efede7] p-4 text-sm text-[#706b63]">A verified solution has not been added to this question yet.</p>}
          </>}
        </section>
      </div>}
    </main>
  );
}
