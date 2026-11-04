"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon, BuildingLibraryIcon, MagnifyingGlassIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/modal";

type Program = {
  id: string;
  collegeId: string;
  name: string;
  degree: string | null;
  specialization: string | null;
  feeMin: number | null;
  feeMax: number | null;
  averagePackage: number | null;
  medianPackage: number | null;
  placementYear: number | null;
  sourceReference: string | null;
};
type College = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  website: string | null;
  collegeType: string | null;
  description: string | null;
  verifiedAt: string | null;
  sourceReference: string | null;
  programs: Program[];
};

function inr(value: number | null) {
  if (value === null) return "Not published";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function CollegeDirectory() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [selected, setSelected] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/colleges", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("College directory is unavailable.");
        return response.json() as Promise<{ items: College[] }>;
      })
      .then((data) => setColleges(data.items))
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Unable to load colleges.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const cities = useMemo(() => [...new Set(colleges.map((item) => item.city).filter((value): value is string => Boolean(value)))].sort(), [colleges]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return colleges.filter((college) => {
      const matchesCity = city === "all" || college.city === city;
      const matchesText = !term || [college.name, college.city, college.state, college.description, ...college.programs.map((program) => program.specialization)].some((value) => value?.toLowerCase().includes(term));
      return matchesCity && matchesText;
    });
  }, [colleges, query, city]);

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <section className="page-shell pb-10 pt-14 sm:pt-20">
        <p className="eyebrow">B-school intelligence</p>
        <h1 className="editorial-heading mt-4 text-5xl sm:text-6xl">Choose with evidence.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#716c63]">Compare institutions and programmes using published fees, placement outcomes, locations and source references. Every statistic should carry its reporting year and provenance.</p>
      </section>
      <section className="page-shell pb-20">
        <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white/65 p-4 sm:grid-cols-[1fr_240px] sm:p-5">
          <label className="flex h-12 items-center gap-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-4"><MagnifyingGlassIcon className="size-4 text-[#817b72]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search college, city or specialization…" className="w-full bg-transparent text-sm outline-none"/></label>
          <select value={city} onChange={(event) => setCity(event.target.value)} className="h-12 cursor-pointer rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3 text-sm outline-none"><option value="all">All cities</option>{cities.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        </div>
        <div className="mt-5 flex items-center justify-between text-xs text-[#817b72]"><span>{loading ? "Loading directory…" : `${visible.length} colleges`}</span><span>Only active, reviewed records are shown</span></div>
        {error && <div role="alert" className="mt-5 rounded-xl border border-[#e2c7bf] bg-[#fbf3f0] p-4 text-sm text-[#87483e]">{error}</div>}
        {loading && <div className="mt-5 grid gap-4 md:grid-cols-2">{[0,1,2,3].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl border border-[var(--line)] bg-white/55"/>)}</div>}
        {!loading && !error && visible.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-white/40 px-6 py-16 text-center"><BuildingLibraryIcon className="mx-auto size-8 text-[#928b80]"/><h2 className="mt-4 font-display text-2xl">The directory is ready for verified data.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#817b72]">No college profiles have been published yet. We will add institution and programme information with source references, reporting years and verification dates rather than inventing fees or placement figures.</p></div>}
        {!loading && visible.length > 0 && <div className="mt-5 grid gap-4 md:grid-cols-2">
          {visible.map((college) => <article key={college.id} className="soft-card rounded-2xl bg-white/65 p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">{college.collegeType ?? "B-school"}</p><h2 className="mt-2 font-display text-2xl">{college.name}</h2></div><span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white"><BuildingLibraryIcon className="size-5"/></span></div>
            <p className="mt-3 flex items-center gap-2 text-xs text-[#817b72]"><MapPinIcon className="size-4"/>{[college.city,college.state].filter(Boolean).join(", ") || "Location not published"}</p>
            <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-6 text-[#716c63]">{college.description ?? "Institution profile and programme details."}</p>
            <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4"><span className="text-[10px] text-[#817b72]">{college.programs.length} published programmes</span><button onClick={() => setSelected(college)} className="cursor-pointer text-xs font-semibold text-[var(--accent)]">View profile <ArrowUpRightIcon className="inline size-4"/></button></div>
          </article>)}
        </div>}
      </section>
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? "College profile"} description={selected ? [selected.city,selected.state].filter(Boolean).join(", ") : undefined} size="lg">
        {selected && <>
          {selected.description && <p className="text-sm leading-7 text-[#625d55]">{selected.description}</p>}
          <div className="mt-5 space-y-3">{selected.programs.map((program) => <article key={program.id} className="rounded-xl border border-[var(--line)] bg-white/70 p-4"><h3 className="font-semibold">{program.name}</h3><p className="mt-1 text-xs text-[#817b72]">{[program.degree,program.specialization].filter(Boolean).join(" · ")}</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p className="text-[9px] uppercase tracking-wider text-[#817b72]">Fees</p><p className="mt-1 text-xs font-semibold">{program.feeMin !== null && program.feeMax !== null ? `${inr(program.feeMin)}–${inr(program.feeMax)}` : inr(program.feeMax ?? program.feeMin)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-[#817b72]">Average</p><p className="mt-1 text-xs font-semibold">{inr(program.averagePackage)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-[#817b72]">Median</p><p className="mt-1 text-xs font-semibold">{inr(program.medianPackage)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-[#817b72]">Year</p><p className="mt-1 text-xs font-semibold">{program.placementYear ?? "Not stated"}</p></div></div>{program.sourceReference && <p className="mt-3 text-[10px] text-[#817b72]">Source: {program.sourceReference}</p>}</article>)}</div>
          {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="btn btn-neutral mt-5 rounded-full normal-case">Official website <ArrowUpRightIcon className="size-4"/></a>}
          {selected.verifiedAt && <p className="mt-3 text-[10px] text-[#817b72]">Profile last verified: {new Date(selected.verifiedAt).toLocaleDateString("en-IN")}</p>}
        </>}
      </Modal>
    </main>
  );
}
