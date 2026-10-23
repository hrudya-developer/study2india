import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, BookOpen, FileText, MapPin, Sparkles } from "lucide-react";
import { searchSite, collegeListHref, type SuggestItem } from "@/lib/queries/search";
import { PageHero } from "@/components/page-hero";
import { SearchBox } from "@/components/search-box";
import { STREAMS } from "@/data/reference";
import { POPULAR_STATES } from "@/components/site-header";
import { slugify } from "@/lib/slug";
import { one, type SearchParams } from "@/lib/params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

const POPULAR: SuggestItem[] = [
  { label: "MBBS colleges in Karnataka", href: "/colleges?course=mbbs&state=karnataka" },
  { label: "B.Sc Nursing colleges in Kerala", href: "/colleges?course=bsc-nursing&state=kerala" },
  { label: "BDS colleges in Tamil Nadu", href: "/colleges?course=bds&state=tamil-nadu" },
  { label: "B.Tech colleges in Kerala", href: "/colleges?course=btech&state=kerala" },
  { label: "NEET UG", href: "/exam/neet-ug" },
  { label: "NIRF rankings", href: "/rankings" },
];

const fmt = (n: number) => n.toLocaleString("en-IN");

function ResultList({ items, big }: { items: SuggestItem[]; big?: boolean }) {
  return (
    <ul className="divide-y divide-rule">
      {items.map((c) => (
        <li key={c.href}>
          <Link href={c.href} className="group block rounded-lg py-3">
            <span className={`block font-bold leading-snug group-hover:text-brand-hover group-hover:underline ${big ? "text-[1.02rem]" : ""}`}>{c.label}</span>
            {c.meta ? <span className="mt-0.5 block text-[0.88rem] text-muted">{c.meta}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SideCard({ id, title, icon: Icon, items }: { id: string; title: string; icon: typeof BookOpen; items: SuggestItem[] }) {
  if (!items.length) return null;
  return (
    <section id={id} className="card scroll-mt-24 p-5" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-bold">
        <Icon size={19} className="text-muted" aria-hidden="true" />
        {title} <span className="tabular font-normal text-muted">({items.length})</span>
      </h2>
      <div className="mt-1">
        <ResultList items={items} />
      </div>
    </section>
  );
}

function Starters() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="card p-5 sm:p-6" aria-labelledby="pop-title">
        <h2 id="pop-title" className="text-lg font-bold">
          Popular searches
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {POPULAR.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="inline-block rounded-full border border-rule px-3 py-1.5 text-[0.92rem] text-ink-soft hover:border-brand hover:text-ink">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-5 sm:p-6" aria-labelledby="field-title">
        <h2 id="field-title" className="text-lg font-bold">
          Browse by field
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.93rem]">
          {STREAMS.map((s) => (
            <li key={s.slug}>
              <Link href={`/colleges?stream=${s.slug}`} className="block py-1 text-ink-soft hover:text-brand-hover hover:underline">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-5 sm:p-6" aria-labelledby="state-title">
        <h2 id="state-title" className="text-lg font-bold">
          Browse by state
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.93rem]">
          {POPULAR_STATES.map((s) => (
            <li key={s}>
              <Link href={`/colleges?state=${slugify(s)}`} className="block py-1 text-ink-soft hover:text-brand-hover hover:underline">
                {s}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/colleges" className="mt-3 inline-flex items-center gap-1 font-bold text-brand-hover hover:underline">
          All states <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = one((await searchParams).q) ?? "";
  const searchable = q.replace(/[^a-z0-9]/gi, "").length >= 2;
  const [res, allHref] = searchable
    ? await Promise.all([searchSite(q, { colleges: 50, courses: 12, exams: 10, states: 6 }), collegeListHref(q)])
    : [null, null];
  const total = res ? res.quick.length + res.colleges.length + res.courses.length + res.exams.length + res.states.length : 0;

  const hasSide = !!res && res.courses.length + res.exams.length + res.states.length > 0;
  const jump = res
    ? [
        { id: "r-colleges", label: "Colleges", n: res.colleges.length ? res.collegeTotal : 0 },
        { id: "r-courses", label: "Courses", n: res.courses.length },
        { id: "r-exams", label: "Exams", n: res.exams.length },
        { id: "r-states", label: "States", n: res.states.length },
      ].filter((x) => x.n > 0)
    : [];

  const summary = res
    ? [
        res.collegeTotal ? `${fmt(res.collegeTotal)} ${res.collegeTotal === 1 ? "college" : "colleges"}` : null,
        res.courses.length ? `${res.courses.length} ${res.courses.length === 1 ? "course" : "courses"}` : null,
        res.exams.length ? `${res.exams.length} ${res.exams.length === 1 ? "exam" : "exams"}` : null,
      ].filter(Boolean)
    : [];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Search" }]}
        title={q ? `Results for “${q}”` : "Search colleges, courses and exams"}
        intro={res && total ? `Found ${summary.join(", ")}.` : q ? undefined : "Type a college name, a course, an exam or a state. You can combine them, for example “nursing Kottayam” or “MBBS Karnataka”."}
      >
        <div className="relative z-30 mt-6 max-w-2xl">
          <SearchBox id="s-q" variant="page" defaultValue={q} placeholder="College, course, exam or state" />
        </div>
      </PageHero>

      <div className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          {!q ? (
            <Starters />
          ) : !searchable ? (
            <>
              <p className="mb-6 text-ink-soft">Type at least two letters or numbers to search.</p>
              <Starters />
            </>
          ) : !res || total === 0 ? (
            <>
              <div className="card mb-6 p-6 sm:p-8">
                <h2 className="text-2xl font-bold">Nothing matched &ldquo;{q}&rdquo;</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-soft">
                  <li>Check the spelling, or try one distinctive word from the college name.</li>
                  <li>Search by town instead, for example &ldquo;Thrissur&rdquo;.</li>
                  <li>Combine a course with a state, for example &ldquo;BDS Karnataka&rdquo;.</li>
                </ul>
                <p className="mt-3 text-ink-soft">We are still adding colleges from official lists. If a college you know is missing, our counsellors can check it for you.</p>
              </div>
              <Starters />
            </>
          ) : (
            <>
              {res.quick.length ? (
                <section className="mb-5 rounded-2xl border-2 border-brand bg-paper p-5 sm:p-6" aria-labelledby="best-title">
                  <h2 id="best-title" className="flex items-center gap-2 text-[0.82rem] font-bold uppercase tracking-wide text-brand-hover">
                    <Sparkles size={16} aria-hidden="true" /> Best match
                  </h2>
                  <ul className="mt-2 space-y-2">
                    {res.quick.map((x) => (
                      <li key={x.href} className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <Link href={x.href} className="text-[1.25rem] font-bold hover:underline sm:text-[1.4rem]">
                            {x.label}
                          </Link>
                          {x.meta ? <p className="tabular text-[0.92rem] text-muted">{x.meta}</p> : null}
                        </div>
                        <Link href={x.href} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-ink px-4 font-bold text-white hover:bg-ink-2">
                          View list <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {jump.length > 1 ? (
                <nav aria-label="Result groups" className="mb-5 flex flex-wrap gap-2 lg:hidden">
                  {jump.map((x) => (
                    <a key={x.id} href={`#${x.id}`} className="rounded-full border border-rule bg-paper px-3 py-1.5 text-[0.9rem] font-bold text-ink-soft hover:border-ink">
                      {x.label} <span className="tabular font-normal text-muted">{fmt(x.n)}</span>
                    </a>
                  ))}
                </nav>
              ) : null}

              <div className={`grid items-start gap-5 ${hasSide ? "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" : "max-w-4xl"}`}>
                {res.colleges.length ? (
                  <section id="r-colleges" className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby="r-colleges-title">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 id="r-colleges-title" className="flex items-center gap-2 text-xl font-bold">
                        <Building2 size={20} className="text-muted" aria-hidden="true" />
                        Colleges <span className="tabular font-normal text-muted">({fmt(res.collegeTotal)})</span>
                      </h2>
                      {res.collegeTotal > res.colleges.length ? (
                        <p className="text-[0.9rem] text-muted">
                          Showing {res.colleges.length} of {fmt(res.collegeTotal)}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-1">
                      <ResultList items={res.colleges} big />
                    </div>
                    {res.collegeTotal > res.colleges.length && !allHref ? (
                      <p className="mt-4 text-[0.92rem] text-muted">Add a word from the name or the town to narrow the list.</p>
                    ) : null}
                    {res.collegeTotal > res.colleges.length && allHref ? (
                      <Link href={allHref} className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-lg border-2 border-ink px-4 font-bold hover:bg-band">
                        See all {fmt(res.collegeTotal)} with filters <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    ) : null}
                  </section>
                ) : (
                  <section className="card p-5 sm:p-6">
                    <h2 className="text-xl font-bold">No college names matched</h2>
                    <p className="mt-2 text-ink-soft">The courses and exams below match your search. To find a college, try a word from its name or its town.</p>
                  </section>
                )}
                <div className={hasSide ? "space-y-5" : "hidden"}>
                  <SideCard id="r-courses" title="Courses" icon={BookOpen} items={res.courses} />
                  <SideCard id="r-exams" title="Entrance exams" icon={FileText} items={res.exams} />
                  <SideCard id="r-states" title="States" icon={MapPin} items={res.states} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
