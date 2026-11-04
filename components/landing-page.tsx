"use client";
import { AcademicCapIcon, ArrowRightIcon, ArrowUpRightIcon, BookOpenIcon, BookmarkSquareIcon, CalendarDaysIcon, ChartBarSquareIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, MagnifyingGlassIcon, MenuIcon, PencilSquareIcon, PlayCircleIcon, QueueListIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const nav = [
  { label:"PYQ Library", href:"#pyqs" },
  { label:"Mock Tests", href:"#mock-tests" },
  { label:"Section Tests", href:"#section-tests" },
  { label:"Entrance Dates", href:"#entrance-dates" },
  { label:"Resources", href:"#resources" },
];

const modules = [
  { n:"01", title:"Previous-year questions", label:"Question library", text:"Browse by exam, year, slot, section, topic and subtopic. Every record will retain its source and review status.", href:"#pyqs", icon:BookOpenIcon },
  { n:"02", title:"Full-length mock tests", label:"Exam simulator", text:"A focused test environment with timer, question palette, autosave and post-test review.", href:"#mock-tests", icon:ClockIcon },
  { n:"03", title:"Sectional practice", label:"Targeted practice", text:"Timed VARC, DILR and QA practice with focused analysis after every attempt.", href:"#section-tests", icon:QueueListIcon },
  { n:"04", title:"Concept library", label:"Learn and revise", text:"Connect fundamentals, worked examples, formulas, traps, revision notes and questions.", href:"#resources", icon:BookmarkSquareIcon },
  { n:"05", title:"Performance intelligence", label:"Progress analysis", text:"Understand accuracy, time spent, weak topics and recurring mistakes.", href:"#intelligence", icon:ChartBarSquareIcon },
  { n:"06", title:"Exam calendar", label:"Stay organised", text:"Keep notifications, application windows, admit cards and result dates together.", href:"#entrance-dates", icon:CalendarDaysIcon },
];

// Transcribed from the user-supplied screenshot (labelled 2017–2024); not independently recalculated.
const trends = [
  ["Mixtures & Alligations","Groups, inclusion–exclusion, averages and mixed ratios","High"],
  ["Profit, Loss & Percentages / SI–CI","Compound vs simple interest, discount cycles, multi-step profit","High"],
  ["Rate / Speed / Work Problems","Trains, relative speed, work done together, pipes filled at different times","High"],
  ["Ratio / Average Chains","Weighted averages, wage ratios and mixing different groups","High"],
  ["Transaction Flow / Sequential Process","Repeated replacement, reinvestment and price-change sequences","High"],
  ["Geometry & Mensuration","Inscribed figures, triangles, rectangles and loci of points","Medium–High"],
  ["Combinatorics / Counting","Non-repeating digits, identical-object distribution and integer solutions","Medium"],
  ["Functions & Logarithms","Functional equations, logarithmic identities and range","Medium"],
  ["Inequalities / Conditions","Feasibility, maximum or minimum values and conditional inequalities","Medium"],
  ["Number Theory & Factors","Largest divisors, factorial conditions and numbers with given factors","Medium"],
  ["Progressions / Sequences","AP, GP and recurrence-style conditions","Medium"],
  ["System of Equations / Algebraic Conditions","Infinite or no solutions, common roots and reciprocal identities","Medium"],
  ["Data Pattern / Progressive Distribution","Natural numbers distributed into groups and series-defined patterns","Low–Medium"],
];

const searchLinks = [
  ...nav.map((x) => ({ ...x, type:"Explore" })),
  { label:"Quantitative Aptitude", href:"#sections", type:"Section" },
  { label:"Data Interpretation & Logical Reasoning", href:"#sections", type:"Section" },
  { label:"Verbal Ability & Reading Comprehension", href:"#sections", type:"Section" },
  { label:"Topic weightage", href:"#topic-trends", type:"Analysis" },
  { label:"Lecture library", href:"#lecture-library", type:"Resources" },
];

function Header() {
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearch(true); }
      if (event.key === "Escape") setSearch(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? searchLinks.filter((x) => x.label.toLowerCase().includes(q)) : searchLinks.slice(0,6);
  }, [query]);
  return <>
    <div className="border-b border-[var(--line)] bg-[#eeece5]">
      <div className="page-shell flex min-h-8 items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-[.16em] text-[#68645d]"><span>THE MBA ASPIRANT’S COMPANION</span><span className="hidden sm:block">A considered way to prepare</span><span className="font-mono">EST. 2026</span></div>
    </div>
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(247,245,240,.93)] backdrop-blur-xl">
      <div className="page-shell flex h-[76px] items-center justify-between gap-5">
        <Link href="#" aria-label="MBA OS home" className="flex shrink-0 items-center gap-2"><span className="font-display text-[2rem] font-semibold tracking-[-.075em]">MBA OS<span className="text-[var(--accent)]">.</span></span><span className="hidden border-l border-[var(--line)] pl-2 font-mono text-[9px] leading-tight tracking-wider text-[#777168] sm:inline">THE<br/>JOURNAL</span></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">{nav.map((x) => <a className="nav-link" href={x.href} key={x.label}>{x.label}</a>)}</nav>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm hidden border border-[var(--line)] bg-white/50 font-normal sm:inline-flex" onClick={() => setSearch(true)} aria-label="Open search"><MagnifyingGlassIcon className="size-4"/><span className="hidden md:inline">Search</span><kbd className="kbd kbd-xs hidden lg:inline-flex">⌘ K</kbd></button>
          <a href="#pyqs" className="btn btn-neutral btn-sm hidden rounded-full px-5 normal-case sm:inline-flex">Explore library <ArrowUpRightIcon className="size-4"/></a>
          <button className="btn btn-ghost btn-square btn-sm lg:hidden" onClick={() => setMobile(!mobile)} aria-label="Toggle navigation" aria-expanded={mobile}>{mobile ? <XMarkIcon className="size-5"/> : <MenuIcon className="size-5"/>}</button>
        </div>
      </div>
      {mobile && <nav className="page-shell grid gap-1 border-t border-[var(--line)] py-3 lg:hidden">{nav.map((x) => <a className="rounded-lg px-3 py-3 text-sm hover:bg-black/5" href={x.href} key={x.label} onClick={() => setMobile(false)}>{x.label}</a>)}<button className="btn btn-outline mt-2 justify-start" onClick={() => { setMobile(false); setSearch(true); }}><MagnifyingGlassIcon className="size-4"/> Search library</button></nav>}
    </header>
    {search && <div className="command-overlay fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearch(false); }}>
      <section role="dialog" aria-modal="true" aria-label="Search MBA OS" className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[#fbfaf7] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4"><MagnifyingGlassIcon className="size-5 text-[#777168]"/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, topics, tests and resources…" className="h-14 w-full bg-transparent text-sm outline-none"/><kbd className="kbd kbd-sm">ESC</kbd></div>
        <div className="p-2"><p className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[#817b72]">Quick navigation</p>{matches.length ? matches.map((x) => <a key={x.label} href={x.href} onClick={() => { setSearch(false); setQuery(""); }} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-[#efede7]"><span>{x.label}</span><span className="font-mono text-[10px] uppercase text-[#969087]">{x.type}</span></a>) : <p className="px-3 py-8 text-center text-sm text-[#777168]">No matching destinations.</p>}</div>
        <div className="flex justify-between border-t border-[var(--line)] px-4 py-3 font-mono text-[10px] text-[#817b72]"><span>Search currently covers site navigation.</span><span>MBA OS</span></div>
      </section>
    </div>}
  </>;
}

function Frequency({ value }: { value:string }) {
  const cls = value === "High" ? "border-[#cbd7ca] bg-[#edf2eb] text-[#526b55]" : value === "Medium–High" ? "border-[#e0d6c4] bg-[#f4efe5] text-[#8b6a3c]" : "border-[var(--line)] bg-[#f0eee9] text-[#6d685f]";
  return <span className={"inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase " + cls}>{value}</span>;
}

export function LandingPage() {
  const root = useRef<HTMLElement | null>(null);
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.timeline({ defaults:{ ease:"power3.out" } })
      .from(".hero-kicker", { y:12, autoAlpha:0, duration:.55 })
      .from(".hero-title", { y:28, autoAlpha:0, duration:.8 }, "-=.28")
      .from(".hero-copy, .hero-actions", { y:15, autoAlpha:0, duration:.6, stagger:.12 }, "-=.35")
      .from(".hero-art", { x:26, autoAlpha:0, duration:.8 }, "-=.6");
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => gsap.fromTo(el, { y:22, autoAlpha:0 }, { y:0, autoAlpha:1, duration:.7, ease:"power2.out", scrollTrigger:{ trigger:el, start:"top 88%", once:true } }));
  }, { scope:root });

  return <main ref={root}>
    <Header/>
    <section className="hero-grid relative overflow-hidden border-b border-[var(--line)]">
      <div className="page-shell grid min-h-[650px] items-center gap-12 py-20 lg:grid-cols-[1.12fr_.88fr]">
        <div className="relative z-10 max-w-[690px]">
          <p className="hero-kicker eyebrow mb-7">A more deliberate way to prepare</p>
          <h1 className="hero-title editorial-heading text-[clamp(3.3rem,7.4vw,6.75rem)]">Make your preparation <span className="italic text-[var(--accent)]">count.</span></h1>
          <p className="hero-copy mt-7 max-w-[570px] text-lg leading-8 text-[#666159]">One considered workspace for previous-year questions, timed practice, concept revision and the decisions that shape your MBA journey.</p>
          <div className="hero-actions mt-9 flex flex-wrap gap-3"><a href="#pyqs" className="btn btn-neutral rounded-full px-6 normal-case">Explore the PYQ library <ArrowRightIcon className="size-4"/></a><a href="#resources" className="btn btn-ghost rounded-full border border-[var(--line)] bg-white/45 px-6 normal-case">Browse study resources</a></div>
          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--line)] pt-5 text-xs text-[#777168]"><span className="inline-flex items-center gap-2"><CheckCircleIcon className="size-4 text-[var(--green)]"/> Source-aware learning</span><span className="inline-flex items-center gap-2"><CheckCircleIcon className="size-4 text-[var(--green)]"/> Focused exam practice</span><span className="inline-flex items-center gap-2"><CheckCircleIcon className="size-4 text-[var(--green)]"/> Built around your progress</span></div>
        </div>
        <div className="hero-art relative mx-auto w-full max-w-[520px]">
          <div className="relative rounded-[1.6rem] border border-[#d9d4ca] bg-[#fbfaf7]/90 p-5 shadow-[0_28px_80px_rgba(55,47,35,.10)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4"><div><p className="font-mono text-[9px] uppercase tracking-widest text-[#898278]">Your preparation desk</p><p className="mt-1 font-display text-2xl">A clearer picture.</p></div><span className="badge badge-outline rounded-full border-[#d8d2c8] bg-white/60 text-[10px] font-normal">Preview</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#efede7] p-4"><p className="font-mono text-[9px] uppercase text-[#817b72]">Practice rhythm</p><p className="mt-2 font-display text-3xl">03<span className="text-lg text-[#888176]">/wk</span></p><p className="mt-1 text-[10px] text-[#777168]">Illustrative weekly target</p></div><div className="rounded-xl border border-[var(--line)] bg-white/75 p-4"><p className="font-mono text-[9px] uppercase text-[#817b72]">Revision queue</p><p className="mt-2 font-display text-3xl">12</p><p className="mt-1 text-[10px] text-[#777168]">Illustrative items</p></div></div>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-white/75 p-4"><div className="mb-4 flex justify-between text-xs font-semibold"><span>A balanced study week</span><span className="font-mono text-[9px] uppercase text-[#8d877e]">Concept view</span></div>{[["Quantitative Aptitude","76%","#35332e"],["DILR","62%","#8b4a3f"],["VARC","84%","#71816d"]].map(([name,width,color]) => <div className="mb-3 last:mb-0" key={name}><div className="mb-1 flex justify-between text-[10px] text-[#68645d]"><span>{name}</span><span className="font-mono">Target</span></div><div className="h-1.5 rounded-full bg-[#ece9e2]"><div className="h-1.5 rounded-full" style={{ width, backgroundColor:color }}/></div></div>)}</div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#292824] p-4 text-[#f7f5f0]"><SparklesIcon className="size-5 text-[#d8c7aa]"/><div><p className="text-xs font-medium">Make every attempt useful.</p><p className="mt-1 text-[10px] text-white/60">Practice, review, identify the gap, return with a plan.</p></div></div>
          </div>
          <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest text-[#918a80]">Illustrative interface preview · Not live data</p>
        </div>
      </div>
    </section>
    <div className="overflow-hidden border-b border-[var(--line)] bg-[#eeece5] py-3"><div className="marquee-track gap-8 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-[#777168]" aria-hidden="true">{[0,1].map((i) => <div className="flex gap-8" key={i}>{["Learn with clarity","Practise with intent","Review every attempt","Build exam confidence","Choose your next step"].map((x,j) => <span className="inline-flex gap-8" key={j}>{x}<span className="text-[var(--accent)]">✳</span></span>)}</div>)}</div></div>
    <section id="sections" className="page-shell py-24"><div data-reveal className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">The preparation desk</p><h2 className="editorial-heading mt-4 text-5xl sm:text-6xl">Everything has its place.</h2></div><p className="max-w-sm text-sm leading-7 text-[#716c63]">A connected set of tools for learning, attempting, reviewing and planning — organised around how MBA aspirants prepare.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{modules.map((m) => { const Icon=m.icon; return <a data-reveal href={m.href} key={m.n} className="soft-card group flex min-h-[245px] flex-col rounded-2xl p-6"><div className="flex justify-between"><span className="font-mono text-[10px] text-[#938c81]">{m.n}</span><span className="flex size-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/70"><Icon className="size-5"/></span></div><span className="mt-7 font-mono text-[9px] uppercase tracking-widest text-[var(--accent)]">{m.label}</span><h3 className="mt-2 font-display text-[1.65rem]">{m.title}</h3><p className="mt-3 text-sm leading-6 text-[#716c63]">{m.text}</p><span className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-semibold">Explore <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1"/></span></a>; })}</div></section>
    <section id="pyqs" className="border-y border-[var(--line)] bg-[#efede7] py-24"><div className="page-shell grid items-center gap-12 lg:grid-cols-[.88fr_1.12fr]"><div data-reveal><p className="eyebrow">01 / The question archive</p><h2 className="editorial-heading mt-4 text-5xl sm:text-6xl">Find the question. Understand the idea.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-[#6e6961]">Move from exam and year to section, topic and subtopic — or begin with a concept and discover the questions connected to it. Solutions, source references and review status stay attached to every record.</p><div className="mt-8 flex flex-wrap gap-2">{["Exam-wise","Year & slot","Section-wise","Topic-wise","Difficulty"].map((x) => <span key={x} className="badge badge-outline rounded-full border-[#d4cec3] bg-white/45 px-3 py-3 text-[10px] font-normal">{x}</span>)}</div><a href="#topic-trends" className="btn btn-neutral mt-9 rounded-full px-6 normal-case">Explore topic trends <ArrowRightIcon className="size-4"/></a></div><div data-reveal className="rounded-2xl border border-[#d8d3c9] bg-[#fbfaf7] p-5 shadow-sm sm:p-7"><p className="font-mono text-[9px] uppercase tracking-widest text-[#8a8378]">Browse by section</p><h3 className="mt-1 border-b border-[var(--line)] pb-5 font-display text-2xl">Choose your starting point</h3>{[{code:"QA",name:"Quantitative Aptitude",desc:"Arithmetic · Algebra · Geometry · Number System",icon:AcademicCapIcon},{code:"DILR",name:"Data Interpretation & Logical Reasoning",desc:"Tables · Charts · Arrangements · Games",icon:ChartBarSquareIcon},{code:"VARC",name:"Verbal Ability & Reading Comprehension",desc:"Reading Comprehension · Para Jumbles · Summary",icon:DocumentTextIcon}].map((x) => { const Icon=x.icon; return <a href="#resources" key={x.code} className="group flex items-center gap-4 border-b border-[var(--line)] py-5 last:border-0"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#efede7] font-mono text-xs font-semibold">{x.code}</span><span className="min-w-0 flex-1"><span className="block font-display text-xl">{x.name}</span><span className="mt-1 block text-[11px] leading-5 text-[#858076]">{x.desc}</span></span><Icon className="hidden size-5 sm:block"/><ArrowUpRightIcon className="size-4"/></a>; })}<p className="mt-3 text-[10px] leading-5 text-[#8a8378]">Taxonomy follows uploaded CAT references. Question-level publishing will follow rights and answer-verification checks.</p></div></div></section>
    <section id="topic-trends" className="page-shell py-24"><div data-reveal className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Research desk / Quantitative Aptitude</p><h2 className="editorial-heading mt-4 text-5xl sm:text-6xl">Patterns worth noticing.</h2></div><p className="max-w-sm text-sm leading-7 text-[#716c63]">A first-pass topic-priority reference from the frequency table you supplied. These labels have not yet been independently recalculated from the question bank.</p></div><div data-reveal className="table-wrap bg-white/55"><table className="table table-zebra"><thead><tr><th>Topic</th><th>Question patterns noted</th><th>Frequency</th></tr></thead><tbody>{trends.map((r) => <tr key={r[0]}><td className="font-semibold">{r[0]}</td><td className="max-w-[500px] text-[#706b63]">{r[1]}</td><td><Frequency value={r[2]}/></td></tr>)}</tbody></table></div><p className="mt-3 text-[10px] leading-5 text-[#8a8378]">Source: user-supplied topic/frequency screenshot labelled 2017–2024. Frequency bands are reproduced as supplied, not official CAT statistics.</p></section>
    <section id="mock-tests" className="border-y border-[var(--line)] bg-[#292824] py-24 text-[#f7f5f0]"><div className="page-shell grid gap-12 lg:grid-cols-2"><div data-reveal><p className="eyebrow !text-[#c2b9aa]">02 / Examination room</p><h2 className="editorial-heading mt-4 text-5xl sm:text-6xl">Practise under pressure. Review without it.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-[#c3beb4]">A dedicated test engine is planned for full mocks and sectional practice, with timing, question navigation, response saving and transparent scoring.</p></div><div className="grid gap-4 sm:grid-cols-2"><div data-reveal className="rounded-2xl border border-white/15 bg-white/[.055] p-6"><ClockIcon className="size-6 text-[#d8c7aa]"/><h3 className="mt-5 font-display text-2xl">Full mock tests</h3><p className="mt-2 text-xs leading-6 text-[#c3beb4]">Exam configuration, countdown, question palette, autosave and review.</p><span className="mt-6 inline-flex rounded-full border border-white/20 px-3 py-1 font-mono text-[9px] uppercase text-[#d8c7aa]">Planned module</span></div><div id="section-tests" data-reveal className="rounded-2xl border border-white/15 bg-white/[.055] p-6"><PlayCircleIcon className="size-6 text-[#d8c7aa]"/><h3 className="mt-5 font-display text-2xl">Section tests</h3><p className="mt-2 text-xs leading-6 text-[#c3beb4]">Focused VARC, DILR and QA attempts with section-level timing.</p><span className="mt-6 inline-flex rounded-full border border-white/20 px-3 py-1 font-mono text-[9px] uppercase text-[#d8c7aa]">Planned module</span></div></div></div></section>
    <section id="intelligence" className="page-shell py-24"><div className="grid gap-12 lg:grid-cols-2"><div data-reveal><p className="eyebrow">03 / Performance intelligence</p><h2 className="editorial-heading mt-4 text-5xl sm:text-6xl">Progress is more than a percentile.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-[#716c63]">Connect every attempt to the topic, method and time spent — so the next study session responds to evidence, not guesswork.</p></div><div data-reveal className="soft-card rounded-2xl p-6 sm:p-8"><p className="border-b border-[var(--line)] pb-4 font-display text-2xl">The review cycle</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["01","Attempt","Record answer, time and confidence."],["02","Understand","Compare your method with the solution."],["03","Classify","Tag concept, setup, calculation or time errors."],["04","Revisit","Schedule practice around the weakness."]].map((x) => <div key={x[0]} className="rounded-xl bg-[#efede7] p-5"><span className="font-mono text-[10px] text-[var(--accent)]">{x[0]}</span><h3 className="mt-3 font-display text-2xl">{x[1]}</h3><p className="mt-2 text-xs leading-6 text-[#777168]">{x[2]}</p></div>)}</div></div></div></section>
    <section id="resources" className="border-y border-[var(--line)] bg-[#efede7] py-24"><div className="page-shell"><div data-reveal className="mb-12 max-w-2xl"><p className="eyebrow">04 / The learning library</p><h2 className="editorial-heading mt-4 text-5xl sm:text-6xl">A good answer begins with a good foundation.</h2><p className="mt-5 text-sm leading-7 text-[#716c63]">Topic-linked study material sits beside practice. Open a concept, revise its formula, learn its traps and attempt related questions.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{title:"Concept notes",detail:"Foundations to advanced ideas",icon:BookOpenIcon},{title:"Formula sheets",detail:"Compact, topic-wise revision",icon:DocumentTextIcon},{title:"Traps & shortcuts",detail:"Common pitfalls and efficient methods",icon:SparklesIcon},{title:"Worked examples",detail:"Reasoning, steps and alternatives",icon:PencilSquareIcon}].map((x) => { const Icon=x.icon; return <div data-reveal key={x.title} className="soft-card rounded-2xl bg-[#faf9f6] p-6"><Icon className="size-6 text-[var(--accent)]"/><h3 className="mt-6 font-display text-2xl">{x.title}</h3><p className="mt-2 text-xs leading-6 text-[#777168]">{x.detail}</p></div>; })}</div><div id="lecture-library" data-reveal className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#d8d3c9] bg-[#faf9f6] p-6 sm:flex-row sm:items-center sm:p-8"><div><span className="font-mono text-[9px] uppercase tracking-widest text-[var(--accent)]">Lecture directory</span><h3 className="mt-2 font-display text-3xl">Learn from your chosen sources.</h3><p className="mt-2 max-w-xl text-xs leading-6 text-[#777168]">The lecture spreadsheet reference is pending an export upload. Once available, lecture links will map to the matching subject, topic and subtopic.</p></div><span className="badge badge-outline rounded-full border-[#d8d3c9] px-4 py-3 text-[10px] font-normal">Awaiting spreadsheet</span></div></div></section>
    <section id="entrance-dates" className="page-shell py-24"><div data-reveal className="grid items-center gap-10 rounded-[1.5rem] border border-[var(--line)] bg-[#fbfaf7] p-7 sm:p-10 lg:grid-cols-[1fr_auto]"><div><p className="eyebrow">05 / The admissions calendar</p><h2 className="editorial-heading mt-4 max-w-[700px] text-5xl sm:text-6xl">Keep the important dates in view.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-[#716c63]">A single calendar for notifications, registration windows, application deadlines, admit cards and results. Dates will carry source and last-verified metadata.</p></div><div className="flex size-28 items-center justify-center rounded-full border border-[#d8d3c9] bg-[#efede7]"><CalendarDaysIcon className="size-12 text-[#5f5a52]"/></div></div></section>
    <footer className="border-t border-[var(--line)] bg-[#eeece5]"><div className="page-shell py-12"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="font-display text-4xl font-semibold tracking-[-.06em]">MBA OS<span className="text-[var(--accent)]">.</span></p><p className="mt-2 max-w-sm text-xs leading-6 text-[#777168]">A more thoughtful way to prepare for the next chapter.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#625d55]">{nav.map((x) => <a href={x.href} key={x.label}>{x.label}</a>)}</div></div><div className="mt-10 flex flex-col justify-between gap-2 border-t border-[var(--line)] pt-5 font-mono text-[9px] uppercase tracking-wider text-[#8b857b] sm:flex-row"><span>© {new Date().getFullYear()} MBA OS · All rights reserved</span><span>Learn · Practise · Review · Repeat</span></div></div></footer>
  </main>;
}
