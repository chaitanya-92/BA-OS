"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  FlagIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/modal";

type TestQuestion = {
  id: string;
  prompt: string;
  passage: string | null;
  questionType: string;
  difficulty: string;
  displayOrder: number;
  options: { id: string; optionKey: string; content: string }[];
};
type TestSection = {
  id: string;
  title: string;
  displayOrder: number;
  durationMinutes: number | null;
  marksPerCorrect: number;
  marksPerIncorrect: number;
  questions: TestQuestion[];
};
type TestData = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  kind: string;
  durationMinutes: number;
  instructions: string | null;
  sections: TestSection[];
  questionCount: number;
};
type SavedResponse = {
  selectedOptionIds: string[];
  answerText: string;
  marked: boolean;
  visited: boolean;
};
type Result = {
  attemptId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
};

const emptyResponse = (): SavedResponse => ({
  selectedOptionIds: [],
  answerText: "",
  marked: false,
  visited: false,
});

export function TestRunner({ slug }: { slug: string }) {
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, SavedResponse>>({});
  const [startedAt, setStartedAt] = useState("");
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => { fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.json()).then((data) => setAuthenticated(Boolean(data.user))).catch(() => setAuthenticated(false)); }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/tests/${encodeURIComponent(slug)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "This test is not published or does not exist." : "Unable to load this test.");
        return response.json() as Promise<TestData>;
      })
      .then((data) => {
        setTest(data);
        const storageKey = `mba-os:test:${slug}`;
        const raw = window.sessionStorage.getItem(storageKey);
        let start = "";
        let saved: Record<string, SavedResponse> = {};
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { startedAt?: string; responses?: Record<string, SavedResponse> };
            if (parsed.startedAt && Date.now() - new Date(parsed.startedAt).getTime() >= 0 && Date.now() - new Date(parsed.startedAt).getTime() < data.durationMinutes * 60_000) {
              start = parsed.startedAt;
              saved = parsed.responses ?? {};
            }
          } catch {
            window.sessionStorage.removeItem(storageKey);
          }
        }
        setStartedAt(start);
        setStarted(Boolean(start));
        const firstQuestionId = data.sections[0]?.questions[0]?.id;
        if (firstQuestionId) saved[firstQuestionId] = { ...(saved[firstQuestionId] ?? emptyResponse()), visited: true };
        setResponses(saved);
        setRemaining(start ? Math.max(0, data.durationMinutes * 60 - Math.floor((Date.now() - new Date(start).getTime()) / 1000)) : data.durationMinutes * 60);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Unable to load test.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!test || !startedAt || !started || result) return;
    window.sessionStorage.setItem(`mba-os:test:${slug}`, JSON.stringify({ startedAt, responses }));
  }, [test, slug, startedAt, started, responses, result]);

  const allQuestions = useMemo(() => test?.sections.flatMap((section) => section.questions) ?? [], [test]);
  const section = test?.sections[sectionIndex];
  const questions = section?.questions ?? [];
  const question = questions[questionIndex];
  const currentResponse = question ? responses[question.id] ?? emptyResponse() : emptyResponse();

  const submit = useCallback(async () => {
    if (!test || !startedAt || !started || submitting || result) return;
    setSubmitting(true);
    try {
      const timeSpentSeconds = Math.max(0, test.durationMinutes * 60 - remaining);
      const payload = {
        startedAt,
        timeSpentSeconds,
        responses: allQuestions.map((item) => {
          const response = responses[item.id] ?? emptyResponse();
          return {
            questionId: item.id,
            selectedOptionIds: response.selectedOptionIds,
            answerText: response.answerText,
            isMarkedForReview: response.marked,
            isVisited: response.visited,
            timeSpentSeconds: 0,
          };
        }),
      };
      const response = await fetch(`/api/tests/${encodeURIComponent(slug)}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "Submission failed. Please try again.");
      }
      const data = await response.json() as Result;
      setResult(data);
      setReviewOpen(false);
      window.sessionStorage.removeItem(`mba-os:test:${slug}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }, [test, startedAt, started, submitting, result, remaining, allQuestions, responses, slug]);

  useEffect(() => {
    if (!test || !startedAt || !started || result) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const next = Math.max(0, test.durationMinutes * 60 - elapsed);
      setRemaining(next);
      if (next === 0) void submit();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [test, startedAt, started, result, submit]);

  function startTest() {
    if (!test || started) return;
    if (!authenticated) { setError("Sign in before starting so your result can be saved to your personal history."); return; }
    const start = new Date().toISOString();
    setStartedAt(start);
    setRemaining(test.durationMinutes * 60);
    setStarted(true);
  }

  function updateResponse(id: string, patch: Partial<SavedResponse>) {
    setResponses((current) => ({
      ...current,
      [id]: { ...(current[id] ?? emptyResponse()), ...patch },
    }));
  }

  function chooseOption(optionId: string) {
    if (!question) return;
    const selected = currentResponse.selectedOptionIds;
    const next = question.questionType === "mcq_multiple"
      ? selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId]
      : selected.includes(optionId) ? [] : [optionId];
    updateResponse(question.id, { selectedOptionIds: next });
  }

  function goToQuestion(index: number, targetSection = sectionIndex) {
    const targetQuestion = test?.sections[targetSection]?.questions[index];
    if (targetQuestion) updateResponse(targetQuestion.id, { visited: true });
    setSectionIndex(targetSection);
    setQuestionIndex(index);
    setShowPalette(false);
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const answeredCount = allQuestions.filter((item) => {
    const response = responses[item.id];
    return Boolean(response?.selectedOptionIds.length || response?.answerText.trim());
  }).length;
  const markedCount = allQuestions.filter((item) => responses[item.id]?.marked).length;
  const isLastQuestion = questionIndex === questions.length - 1;
  const isLastSection = sectionIndex === (test?.sections.length ?? 1) - 1;

  if (loading) return <main className="min-h-screen bg-[var(--paper)] p-6"><div className="mx-auto max-w-5xl animate-pulse space-y-5 pt-20"><div className="h-5 w-40 rounded bg-[#e9e5dc]"/><div className="h-14 w-2/3 rounded bg-[#e9e5dc]"/><div className="h-72 rounded-2xl bg-[#e9e5dc]"/></div></main>;
  if (error && !test) return <main className="page-shell min-h-screen py-20"><p className="eyebrow">Test room</p><h1 className="mt-4 font-display text-3xl">Unable to open this test.</h1><p className="mt-3 text-sm text-[#817b72]">{error}</p>{error.toLowerCase().includes("sign in")&&<Link href="/login" className="btn btn-neutral mt-4 rounded-full normal-case">Sign in to save your attempt</Link>}<Link href="/tests" className="btn btn-outline mt-6 rounded-full">Back to tests</Link></main>;
  if (result) return (
    <main className="min-h-screen bg-[var(--paper)]">
      <div className="page-shell max-w-4xl py-16 sm:py-24">
        <p className="eyebrow">Attempt submitted</p>
        <h1 className="editorial-heading mt-4 text-5xl">Your review starts here.</h1>
        <div className="mt-10 rounded-2xl border border-[var(--line)] bg-white/70 p-7 sm:p-10">
          <p className="text-xs uppercase tracking-widest text-[#817b72]">Final score</p>
          <p className="mt-2 font-display text-6xl">{result.score}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Correct",result.correctCount],["Incorrect",result.incorrectCount],["Unanswered",result.unansweredCount],["Total",result.totalQuestions]].map(([label,value]) => <div key={label} className="rounded-xl bg-[#efede7] p-4"><p className="font-display text-3xl">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#817b72]">{label}</p></div>)}
          </div>
          <p className="mt-6 text-xs text-[#817b72]">Time used: {formatTime(result.timeSpentSeconds)} · Attempt ID: {result.attemptId}</p>
        </div>
        <div className="mt-7 flex flex-wrap gap-3"><Link href={`/attempts/${result.attemptId}`} className="btn btn-neutral rounded-full normal-case">Review answers <ArrowRightIcon className="size-4"/></Link><Link href="/tests" className="btn btn-ghost rounded-full normal-case">Return to test library</Link></div>
      </div>
    </main>
  );

  if (!test || !question) return <main className="page-shell min-h-screen py-20"><h1 className="font-display text-3xl">This test has no available questions yet.</h1><Link href="/tests" className="btn btn-outline mt-6 rounded-full">Back to tests</Link></main>;

  return (
    <main className="min-h-screen bg-[#f3f1eb]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#fbfaf7]/95 backdrop-blur">
        <div className="page-shell flex min-h-[72px] items-center justify-between gap-4">
          <div className="min-w-0"><Link href="/tests" className="text-[10px] text-[#817b72] hover:text-[#242321]">← Test library</Link><h1 className="truncate font-display text-lg font-semibold">{test.title}</h1></div>
          <div className="flex shrink-0 items-center gap-3"><div className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm tabular-nums ${remaining < 300 ? "border-[#d8b5a9] bg-[#fbefeb] text-[#9b473d]" : "border-[var(--line)] bg-white"}`}><ClockIcon className="size-4"/>{formatTime(remaining)}</div><button onClick={() => setReviewOpen(true)} className="btn btn-neutral btn-sm rounded-full normal-case">Submit test</button></div>
        </div>
      </header>

      <div className="page-shell grid gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {test.sections.map((item, index) => <button key={item.id} onClick={() => goToQuestion(0,index)} className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold ${index === sectionIndex ? "border-[#292824] bg-[#292824] text-white" : "border-[var(--line)] bg-white text-[#625d55]"}`}>{item.title}</button>)}
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div><p className="text-[10px] uppercase tracking-widest text-[#817b72]">{section?.title}</p><p className="mt-1 text-xs text-[#817b72]">Question {questionIndex + 1} of {questions.length}</p></div>
              <span className="rounded-full bg-[#efede7] px-3 py-1 text-[10px] uppercase tracking-wider text-[#716c63]">{question.difficulty}</span>
            </div>
            {question.passage && <div className="my-6 rounded-xl bg-[#f5f3ee] p-5 text-sm leading-7 text-[#514d46]"><p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#8b4a3f]">Passage</p>{question.passage}</div>}
            <p className="my-7 whitespace-pre-wrap text-base leading-8 text-[#292824]">{question.prompt}</p>
            {question.questionType === "numeric" || question.questionType === "text" ? (
              <label className="block max-w-sm"><span className="mb-2 block text-xs font-semibold text-[#625d55]">Your answer</span><input value={currentResponse.answerText} onChange={(event) => updateResponse(question.id,{answerText:event.target.value})} placeholder="Enter your answer" className="h-12 w-full rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-4 text-sm outline-none focus:border-[#8b4a3f]"/></label>
            ) : (
              <div className="space-y-3">
                {question.options.map((option) => {
                  const active = currentResponse.selectedOptionIds.includes(option.id);
                  return <button key={option.id} onClick={() => chooseOption(option.id)} className={`flex w-full cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-colors ${active ? "border-[#8b4a3f] bg-[#fbf3f0]" : "border-[var(--line)] bg-[#fbfaf7] hover:bg-[#f4f2ec]"}`}>
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${active ? "border-[#8b4a3f] bg-[#8b4a3f] text-white" : "border-[#d7d1c7] text-[#716c63]"}`}>{option.optionKey}</span>
                    <span className="pt-1 text-sm leading-6 text-[#49463f]">{option.content}</span>
                  </button>;
                })}
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
              <button onClick={() => updateResponse(question.id,{marked:!currentResponse.marked})} className={`btn btn-sm rounded-full normal-case ${currentResponse.marked ? "btn-warning" : "btn-ghost border border-[var(--line)]"}`}><FlagIcon className="size-4"/>{currentResponse.marked ? "Marked for review" : "Mark for review"}</button>
              <div className="flex items-center gap-2">
                <button disabled={questionIndex === 0 && sectionIndex === 0} onClick={() => questionIndex > 0 ? goToQuestion(questionIndex - 1) : goToQuestion((test.sections[sectionIndex - 1]?.questions.length ?? 1) - 1,sectionIndex - 1)} className="btn btn-outline btn-sm rounded-full normal-case"><ArrowLeftIcon className="size-4"/> Previous</button>
                <button onClick={() => !isLastQuestion ? goToQuestion(questionIndex + 1) : !isLastSection ? goToQuestion(0,sectionIndex + 1) : setReviewOpen(true)} className="btn btn-neutral btn-sm rounded-full normal-case">{isLastQuestion && isLastSection ? "Review" : "Next"} <ArrowRightIcon className="size-4"/></button>
              </div>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-[var(--line)] bg-white p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Question palette</h2><button className="lg:hidden" onClick={() => setShowPalette(!showPalette)} aria-expanded={showPalette}><ListBulletIcon className="size-5"/></button></div>
          <div className={`mt-4 ${showPalette ? "block" : "hidden lg:block"}`}>
            <div className="mb-4 grid grid-cols-2 gap-2 text-[10px] text-[#817b72]">
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#526b55]"/> Answered</span>
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#a17b43]"/> Review</span>
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#d8d3c9]"/> Unanswered</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((item,index) => {
                const response = responses[item.id] ?? emptyResponse();
                const answered = response.selectedOptionIds.length > 0 || Boolean(response.answerText.trim());
                return <button key={item.id} onClick={() => goToQuestion(index)} aria-label={`Question ${index+1}`} className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg border text-xs font-semibold ${index === questionIndex ? "border-[#292824] ring-2 ring-[#292824]/15" : "border-[var(--line)]"} ${response.marked ? "bg-[#f3ead9] text-[#8a6837]" : answered ? "bg-[#edf2eb] text-[#526b55]" : "bg-[#f7f5f0] text-[#716c63]"}`}>{index+1}</button>;
              })}
            </div>
          </div>
          <div className="mt-6 border-t border-[var(--line)] pt-4">
            <div className="flex justify-between text-xs"><span className="text-[#817b72]">Answered</span><strong>{answeredCount}/{allQuestions.length}</strong></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#efede7]"><div className="h-full rounded-full bg-[#526b55] transition-all" style={{width:`${allQuestions.length ? answeredCount/allQuestions.length*100 : 0}%`}}/></div>
            <p className="mt-3 text-[10px] text-[#817b72]">{markedCount} marked for review</p>
          </div>
        </aside>
      </div>

      {error && <div role="alert" className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#e2c7bf] bg-[#fbf3f0] px-4 py-3 text-sm text-[#87483e] shadow-lg">{error}</div>}

      <Modal
        open={Boolean(test) && !started}
        onClose={() => undefined}
        title={test?.title ?? "Test instructions"}
        description="Read the instructions before the timer begins."
        size="lg"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        {test && <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#efede7] p-4"><p className="font-display text-2xl">{test.durationMinutes}</p><p className="text-[10px] uppercase tracking-wider text-[#817b72]">Minutes</p></div>
            <div className="rounded-xl bg-[#efede7] p-4"><p className="font-display text-2xl">{test.questionCount}</p><p className="text-[10px] uppercase tracking-wider text-[#817b72]">Questions</p></div>
            <div className="rounded-xl bg-[#efede7] p-4"><p className="font-display text-2xl">{test.sections.length}</p><p className="text-[10px] uppercase tracking-wider text-[#817b72]">Sections</p></div>
          </div>
          {test.instructions && <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#625d55]">{test.instructions}</div>}
          <ul className="mt-5 list-disc space-y-2 pl-5 text-xs leading-6 text-[#817b72]">
            <li>The timer begins only after you select Start test.</li>
            <li>Your answers are saved in this browser tab so you can recover after a refresh.</li>
            <li>Use the question palette to navigate and mark questions for review.</li>
            <li>Submission is final. Your score is calculated using the configured marking scheme.</li>
          </ul>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">{authenticated===false&&<Link href="/login" className="text-xs font-semibold text-[#8b4a3f] underline underline-offset-4">Sign in to continue</Link>}<button disabled={authenticated!==true} onClick={startTest} className="btn btn-neutral rounded-full px-6 normal-case disabled:opacity-50">{authenticated===null?"Checking account…":"Start test"} <ArrowRightIcon className="size-4"/></button></div>
        </>}
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Review before submission" description="Check your responses before ending this attempt." size="md">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#edf2eb] p-3"><p className="font-display text-2xl">{answeredCount}</p><p className="text-[10px] text-[#526b55]">Answered</p></div>
          <div className="rounded-xl bg-[#f3ead9] p-3"><p className="font-display text-2xl">{markedCount}</p><p className="text-[10px] text-[#8a6837]">For review</p></div>
          <div className="rounded-xl bg-[#efede7] p-3"><p className="font-display text-2xl">{allQuestions.length-answeredCount}</p><p className="text-[10px] text-[#716c63]">Unanswered</p></div>
        </div>
        <p className="mt-5 text-sm leading-6 text-[#625d55]">Once submitted, this attempt cannot be changed. Your score will be calculated using the test&apos;s configured marking scheme.</p>
        <div className="mt-6 flex justify-end gap-2"><button onClick={() => setReviewOpen(false)} className="btn btn-ghost rounded-full normal-case">Continue test</button><button disabled={submitting} onClick={() => void submit()} className="btn btn-neutral rounded-full normal-case">{submitting ? "Submitting…" : "Confirm submission"}</button></div>
      </Modal>
    </main>
  );
}
