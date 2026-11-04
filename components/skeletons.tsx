type SkeletonProps = { className?: string; rounded?: "sm" | "md" | "lg" | "full" };
export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  const radius = { sm:"rounded", md:"rounded-md", lg:"rounded-xl", full:"rounded-full" }[rounded];
  return <span aria-hidden="true" className={"skeleton block " + radius + " " + className} />;
}
export function QuestionListSkeleton() {
  return <div aria-label="Loading questions" role="status" className="space-y-3">{Array.from({ length:5 }).map((_,i) => <div className="rounded-xl border border-[var(--line)] p-4" key={i}><div className="flex gap-3"><Skeleton className="h-8 w-8 shrink-0" rounded="full"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3"/><Skeleton className="h-3 w-5/6"/><Skeleton className="h-3 w-2/3"/></div></div></div>)}<span className="sr-only">Loading questions…</span></div>;
}