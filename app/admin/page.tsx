import Link from "next/link";
import { ArrowUpRightIcon, BookOpenIcon, ClipboardDocumentListIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

const workspaces = [
  {
    title: "Learning content",
    description: "Review, edit, archive and publish notes, formulas, traps, shortcuts and checklists.",
    href: "/admin/content",
    action: "Open content desk",
    icon: BookOpenIcon,
    status: "CAT Quant revision content awaiting import and review",
  },
  {
    title: "Question bank",
    description: "Import questions with exam, year, slot, answer key and source provenance. Verify before publication.",
    href: "/admin/questions",
    action: "Open question desk",
    icon: ClipboardDocumentListIcon,
    status: "Question ingestion and review",
  },
  {
    title: "Test builder",
    description: "Assemble full mocks, sectional tests and topic practice from reviewed, published questions.",
    href: "/admin/tests",
    action: "Open test builder",
    icon: ClipboardDocumentListIcon,
    status: "Create, preview and publish assessments",
  },
];

const studentAreas = [
  ["Dashboard", "/dashboard", "Personal progress and analytics"],
  ["PYQ library", "/pyqs", "Published previous-year questions"],
  ["Learning library", "/learn", "Published notes and topic resources"],
  ["Mock tests", "/tests", "Published tests and timed practice"],
  ["Attempts", "/attempts", "Completed test history and analysis"],
  ["Revision", "/revision", "Questions due for spaced revision"],
  ["B-schools", "/colleges", "College and programme directory"],
  ["Admission calendar", "/calendar", "Entrance and admission dates"],
] as const;

export default function AdminHomePage() {
  return (
    <main className="page-shell min-h-screen py-12 sm:py-16">
      <p className="eyebrow">MBA OS · Operations</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="editorial-heading text-5xl">Workspace.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#716c63]">
            Manage the learning material and question bank, then preview the student experience.
            Admin APIs remain protected by your configured import token.
          </p>
        </div>
        <Link href="/" className="btn btn-outline rounded-full border-[var(--line)] normal-case">View public site <ArrowUpRightIcon className="size-4" /></Link>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-2" aria-label="Administration workspaces">
        {workspaces.map((workspace) => {
          const Icon = workspace.icon;
          return (
            <article key={workspace.href} className="rounded-2xl border border-[var(--line)] bg-white/70 p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#efede7] text-[#8b4a3f]"><Icon className="size-5" /></div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.14em] text-[#8b4a3f]">{workspace.status}</p>
              <h2 className="mt-2 font-display text-2xl">{workspace.title}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#716c63]">{workspace.description}</p>
              <Link href={workspace.href} className="btn btn-neutral mt-5 rounded-full normal-case">{workspace.action} <ArrowUpRightIcon className="size-4" /></Link>
            </article>
          );
        })}
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-2"><Squares2X2Icon className="size-4 text-[#8b4a3f]" /><p className="eyebrow">Student experience</p></div>
        <h2 className="mt-2 font-display text-2xl">Preview every product area</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {studentAreas.map(([title, href, description]) => (
            <Link key={href} href={href} className="group rounded-xl border border-[var(--line)] bg-white/55 p-4 transition hover:-translate-y-0.5 hover:bg-white">
              <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{title}</h3><ArrowUpRightIcon className="size-4 text-[#918a80] transition group-hover:text-[#8b4a3f]" /></div>
              <p className="mt-2 text-xs leading-5 text-[#817b72]">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <aside className="mt-10 rounded-xl border border-[#e5d8c5] bg-[#f7f1e7] p-5 text-xs leading-6 text-[#71624d]">
        <strong>Publishing rule:</strong> content and questions stay hidden from students until reviewed and explicitly published. The current CAT Quant import is a set of editorial drafts, not a published PYQ or mock-test bank.
      </aside>
    </main>
  );
}
