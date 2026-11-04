"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { LearningCallout } from "@/components/learning/learning-callout";

type ReviewQuestion = {
  questionId: string;
  prompt: string;
  passage: string | null;
  questionType: string;
  sectionTitle: string;
  selectedOptionIds: string[];
  answerText: string | null;
  isMarkedForReview: boolean;
  options: { id: string; optionKey: string; content: string; isCorrect: boolean | null }[];
  solutions: { methodName: string | null; content: string; answerText: string | null }[];
  isCorrect: boolean | null;
  correctAnswer: string[];
};
type AttemptData = {
  attempt: {
    id: string;
    score: number | null;
    correctCount: number | null;
    incorrectCount: number | null;
    unansweredCount: number | null;
    timeSpentSeconds: number | null;
    submittedAt: string | null;
  };
  questions: ReviewQuestion[];
};

function timeLabel(value: number | null) {
  const seconds = value ?? 0;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function AttemptReview({ attemptId }: { attemptId: string }) {
  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/attempts/${encodeURIComponent(attemptId)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("This completed attempt could not be found.");
        return response.json() as Promise<AttemptData>;
      })
      .then(setData)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Unable to load attempt review.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attemptId]);

  if (loading) return <main className="page-shell min-h-screen space-y-5 py-20"><div className="h-10 w-1/2 animate-pulse rounded bg-[#e9e5dc]"/><div className="h-40 animate-pulse rounded-2xl bg-[#e9e5dc]"/></main>;
  if (error || !data) return <main className="page-shell min-h-screen py-20"><h1 className="font-display text-3xl">Review unavailable</h1><p className="mt-3 text-sm text-[#817b72]">{error}</p><Link href="/tests" className="btn btn-outline mt-6 rounded-full">Back to tests</Link></main>;

  const { attempt, questions } = data;
  const accuracy = questions.length ? Math.round(((attempt.correctCount ?? 0) / questions.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[var(--paper)]">
            <section className="page-shell pb-8 pt-12 sm:pt-16">
        <p className="eyebrow">Attempt analysis</p>
        <h1 className="editorial-heading mt-4 text-5xl">Learn from every response.</h1>
        <p className="mt-3 text-sm text-[#817b72]">Submitted {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString("en-IN") : "—"} · Attempt {attempt.id.slice(0,8)}</p>
      </section>
      <section className="page-shell pb-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[["Score",attempt.score ?? 0],["Correct",attempt.correctCount ?? 0],["Incorrect",attempt.incorrectCount ?? 0],["Unanswered",attempt.unansweredCount ?? 0],["Accuracy",`${accuracy}%`]].map(([label,value]) => <div key={label} className="rounded-2xl border border-[var(--line)] bg-white/65 p-5"><p className="font-display text-3xl">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#817b72]">{label}</p></div>)}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#817b72]"><ClockIcon className="size-4"/> Time spent: {timeLabel(attempt.timeSpentSeconds)}</div>
        <div className="mt-9 space-y-8">
          {Object.entries(questions.reduce<Record<string,ReviewQuestion[]>>((groups,item) => {
            (groups[item.sectionTitle] ??= []).push(item);
            return groups;
          },{})).map(([section,items]) => <section key={section}>
            <h2 className="mb-3 font-display text-2xl">{section}</h2>
            <div className="space-y-3">
              {items.map((item,index) => <details key={item.questionId} className="rounded-2xl border border-[var(--line)] bg-white/65">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-5 marker:hidden">
                  {item.isCorrect === true ? <CheckCircleIcon className="size-5 shrink-0 text-[#526b55]"/> : item.isCorrect === false ? <XCircleIcon className="size-5 shrink-0 text-[#9b473d]"/> : <span className="size-5 shrink-0 rounded-full border border-[var(--line)]"/>}
                  <span className="min-w-0 flex-1 text-sm font-semibold">Question {index+1}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#817b72]">{item.isCorrect === null ? "Unanswered" : item.isCorrect ? "Correct" : "Incorrect"}</span>
                  <span className="text-[#817b72]">⌄</span>
                </summary>
                <div className="border-t border-[var(--line)] p-5 sm:p-7">
                  {item.passage && <div className="mb-5 rounded-xl bg-[#efede7] p-4 text-sm leading-7">{item.passage}</div>}
                  <p className="whitespace-pre-wrap text-sm leading-7">{item.prompt}</p>
                  {item.options.length > 0 && <div className="mt-5 space-y-2">{item.options.map((option) => {
                    const selected = item.selectedOptionIds.includes(option.id);
                    const correct = option.isCorrect === true;
                    return <div key={option.id} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${correct ? "border-[#b9cbb7] bg-[#edf2eb]" : selected ? "border-[#d8b5a9] bg-[#fbf3f0]" : "border-[var(--line)] bg-[#fbfaf7]"}`}><span className="font-semibold">{option.optionKey}.</span><span className="flex-1">{option.content}</span>{selected && <span className="text-[9px] uppercase tracking-wider text-[#817b72]">Your answer</span>}{correct && <span className="text-[9px] uppercase tracking-wider text-[#526b55]">Correct</span>}</div>;
                  })}</div>}
                  {item.answerText && <p className="mt-4 text-xs text-[#817b72]">Your numeric/text answer: <strong className="text-[#292824]">{item.answerText}</strong></p>}
                  {item.solutions.map((solution,solutionIndex) => <LearningCallout key={solutionIndex} kind="note" title={solution.methodName ?? "Verified explanation"}><p className="whitespace-pre-wrap">{solution.content}</p>{solution.answerText && <p className="mt-2 font-semibold">Answer: {solution.answerText}</p>}</LearningCallout>)}
                </div>
              </details>)}
            </div>
          </section>)}
        </div>
      </section>
    </main>
  );
}
