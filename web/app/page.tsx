import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck, Phone, Users, Target, GitCompareArrows, Compass, BadgeIndianRupee, Clock, ExternalLink, ArrowUpRight, CheckCircle2, ChevronDown, FileCheck2 } from "lucide-react";
import { getStreams, getTopRankings, getStateCounts, getExams, getSearchOptions, getAllCourses } from "@/lib/queries/home";
import { getCoverage, getPopularCombos } from "@/lib/queries/trust";
import { CounsellingForm } from "@/components/counselling-form";
import { RankingTabs } from "@/components/ranking-tabs";
import { FieldIcon } from "@/components/field-icon";
import { SentenceSelect } from "@/components/sentence-select";
import { SearchBox } from "@/components/search-box";
import { POPULAR_STATES } from "@/components/site-header";
import { CONTACT } from "@/data/reference";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

// Title and description come from the root layout's defaults.
export const metadata: Metadata = { alternates: { canonical: "/" } };

const POPULAR_COURSES = ["mbbs", "bds", "bsc-nursing", "bams", "btech", "mba", "ba-llb", "b-pharm"];
const COMBO_COURSES = ["mbbs", "bds", "bsc-nursing", "bams", "btech", "b-pharm"];
const COMBO_STATES = ["kerala", "karnataka", "tamil-nadu"];
const HERO_CHIPS = [
  { label: "MBBS in Karnataka", href: "/colleges/mbbs/karnataka" },
  { label: "B.Sc Nursing in Kerala", href: "/colleges/bsc-nursing/kerala" },
  { label: "BDS in Tamil Nadu", href: "/colleges/bds/tamil-nadu" },
  { label: "NEET UG", href: "/exam/neet-ug" },
  { label: "B.Tech in Kerala", href: "/colleges/btech/kerala" },
];
const LEVEL_LABEL: Record<string, string> = { ug: "Undergraduate", pg: "Postgraduate", diploma: "Diploma", doctorate: "Doctorate", certificate: "Certificate", integrated: "Integrated" };

const fmt = (n: number) => n.toLocaleString("en-IN");

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(d: string | null) {
  if (!d) return null;
  const date = new Date(`${d.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function SectionHead({ id, title, intro, href, cta }: { id: string; title: string; intro?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 sm:mb-7">
      <div>
        <h2 id={id} className="text-[1.6rem] font-bold sm:text-[2.1rem]">
          {title}
        </h2>
        {intro ? <p className="mt-1.5 max-w-[62ch] text-ink-soft">{intro}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="flex items-center gap-1 rounded font-bold text-brand-hover hover:underline">
          {cta} <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

/** A row that scrolls sideways on phones and becomes a grid from the small breakpoint up. */
const rowList = "scroll-row relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0";
const rowItem = "w-[80%] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none";

export default async function HomePage() {
  const [coverage, streams, rankingLists, stateCounts, exams, options, courses, combos] = await Promise.all([
    getCoverage(),
    getStreams(),
    getTopRankings(5),
    getStateCounts(),
    getExams(),
    getSearchOptions(),
    getAllCourses(),
    getPopularCombos(COMBO_COURSES, COMBO_STATES),
  ]);

  const popular = POPULAR_COURSES.map((s) => courses.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);
  const stateCount = new Map(stateCounts.map((s) => [s.slug, s.institutions]));
  const examsByStream = (streamName: string) => exams.filter((e) => e.streams.includes(streamName)).map((e) => e.short);
  const checked = formatDate(coverage.lastChecked);

  // Each course in the three states our students most often choose, ordered course by course.
  const comboLinks = COMBO_COURSES.flatMap((slug) => COMBO_STATES.map((st) => combos.find((c) => c.courseSlug === slug && c.stateSlug === st)).filter((c): c is NonNullable<typeof c> => !!c));

  const stats = [
    { value: coverage.institutions, label: "Colleges listed" },
    { value: coverage.seats, label: "Approved seats on record" },
    { value: courses.length, label: "Courses" },
    { value: exams.length, label: "Entrance exams" },
  ].filter((s) => s.value > 0);

  return (
    <>
      {/* Hero: one search box for everything, then a guided finder for students who are not sure what to type. */}
      <section className="relative bg-[linear-gradient(115deg,#fff7ee_0%,#fff_45%,#eef1fb_100%)]" aria-labelledby="hero-title">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 sm:pb-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:pt-14">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[0.85rem] font-bold text-ink-soft shadow-[var(--shadow-card)] sm:text-[0.88rem]">
              <ShieldCheck size={16} className="shrink-0 text-verified" aria-hidden="true" />
              Every college traced to an official list
            </p>
            <h1 id="hero-title" className="mt-4 text-[2.4rem] font-extrabold leading-[1.02] sm:mt-5 sm:text-[3.5rem]">
              Find your college in India.
            </h1>
            <p className="mt-3 max-w-[56ch] text-[1.02rem] text-ink-soft sm:mt-4 sm:text-[1.08rem]">
              Search {coverage.institutions > 0 ? fmt(coverage.institutions) : ""} colleges by name, course, exam or state. Seats and rankings come from the regulators&apos; own lists, with the source beside each figure.
            </p>

            <div className="relative z-30 mt-6 max-w-2xl sm:mt-8">
              <SearchBox id="hero-q" variant="hero" placeholder="Try “MBBS Kerala” or “AIIMS”" />
            </div>

            <div className="mt-4 flex max-w-2xl flex-wrap items-center gap-2 text-[0.88rem]">
              <span className="text-muted">Popular:</span>
              {HERO_CHIPS.map((c) => (
                <Link key={c.href} href={c.href} className="rounded-full border border-rule bg-paper px-3 py-1.5 text-ink-soft hover:border-brand hover:text-ink">
                  {c.label}
                </Link>
              ))}
            </div>

            <form action="/colleges" method="get" className="mt-7 max-w-2xl rounded-2xl border border-rule bg-paper/80 p-4 sm:p-5">
              <p className="text-[0.85rem] font-bold uppercase tracking-wide text-muted">Not sure what to type? Build it</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-[1.35rem] font-bold leading-[1.6] sm:text-[1.7rem]">
                <span>I want to study </span>
                <SentenceSelect
                  id="h-course"
                  name="course"
                  label="Course"
                  placeholder="any course"
                  defaultValue="mbbs"
                  groups={streams.map((s) => ({ label: s.name, options: s.courses.map((c) => ({ value: c.slug, label: c.short })) }))}
                />
                <span> in </span>
                <SentenceSelect id="h-state" name="state" label="State" placeholder="any state" options={options.states} />
              </p>
              <button type="submit" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-ink-2">
                Show colleges <ArrowUpRight size={17} aria-hidden="true" />
              </button>
            </form>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[440px] lg:block">
            <div className="absolute inset-x-6 bottom-0 top-10 rounded-[48%_52%_40%_60%/55%_45%_55%_45%] bg-brand/90" aria-hidden="true" />
            <div className="absolute -right-2 top-4 size-28 rounded-full bg-ink" aria-hidden="true" />
            <Image src="/images/galleryBg2.png" alt="Student holding books, smiling" width={1024} height={1024} priority sizes="440px" className="relative w-full" />
            <div className="card absolute -left-6 bottom-16 flex items-center gap-3 px-4 py-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-verified-bg text-verified">
                <CheckCircle2 size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold leading-tight">Free counselling</p>
                <p className="text-[0.85rem] text-muted">{CONTACT.branches.length} offices across Kerala</p>
              </div>
            </div>
          </div>
        </div>

        {stats.length ? (
          <div className="border-t border-rule bg-paper/70">
            <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 sm:px-6 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col md:border-l md:border-rule md:pl-6 md:first:border-0 md:first:pl-0">
                  <dt className="order-2 mt-1 text-[0.9rem] leading-snug text-muted">{s.label}</dt>
                  <dd className="order-1 tabular font-[family-name:var(--font-display)] text-[1.7rem] font-extrabold leading-none sm:text-[2rem]">{fmt(s.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </section>

      {/* Sources: the counts we actually hold from each official list, with links to check them. */}
      {coverage.sources.length ? (
        <section className="border-y border-rule bg-band" aria-labelledby="sources-title">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div>
                <h2 id="sources-title" className="flex items-center gap-2 text-[1.25rem] font-bold sm:text-[1.4rem]">
                  <FileCheck2 size={22} className="text-verified" aria-hidden="true" />
                  Built from official lists
                </h2>
                <p className="mt-1 max-w-[70ch] text-[0.95rem] text-ink-soft">
                  NIRF ranks are shown exactly as published, and colleges we work with carry a partner label. {checked ? `Lists last checked ${checked}.` : ""}
                </p>
              </div>
              <Link href="/how-we-check-data" className="flex items-center gap-1 rounded font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
                How we check data
              </Link>
            </div>
            <ul className={`${rowList} mt-5 sm:grid-cols-3`}>
              {coverage.sources.map((s) => (
                <li key={s.scheme} className="w-[46%] max-w-[220px] shrink-0 snap-start rounded-xl border border-rule bg-paper p-3.5 sm:w-auto sm:max-w-none">
                  <p className="flex items-baseline justify-between gap-2">
                    <abbr title={s.regulator} className="font-[family-name:var(--font-display)] text-[1.1rem] font-bold no-underline">
                      {s.short}
                    </abbr>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener" className="flex items-center gap-1 rounded text-[0.78rem] text-muted hover:text-ink" aria-label={`${s.regulator} official list (opens in a new tab)`}>
                        <span className="hidden min-[1200px]:inline">Official list</span> <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                  </p>
                  <p className="tabular mt-1 text-[1.35rem] font-extrabold leading-none">{s.institutions > 0 ? fmt(s.institutions) : "Not recorded"}</p>
                  <p className="mt-1 text-[0.82rem] leading-snug text-muted">{s.covers}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Study goals */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16" aria-labelledby="goals-title">
        <SectionHead id="goals-title" title="Choose your field" intro="Pick a field to see its colleges, courses and entrance exams." href="/courses" cta="All courses" />
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {streams.map((s) => (
            <li key={s.slug}>
              <Link href={`/colleges?stream=${s.slug}`} className="card card-link flex h-full items-center gap-2.5 p-3 sm:items-start sm:gap-3 sm:p-4">
                <FieldIcon slug={s.slug} className="size-8 shrink-0 sm:size-11" />
                <span className="min-w-0">
                  <span className="block text-[0.9rem] font-bold leading-snug [overflow-wrap:anywhere] sm:text-base sm:[overflow-wrap:normal]">{s.name}</span>
                  <span className="mt-0.5 block text-[0.82rem] text-muted sm:text-[0.85rem]">
                    {s.institutions > 0 ? `${fmt(s.institutions)} colleges` : `${s.courses.length} ${s.courses.length === 1 ? "course" : "courses"}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* States */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16" aria-labelledby="states-title">
        <SectionHead id="states-title" title="Colleges by state" intro="Where students from Kerala most often study. Counts are colleges we list in each state." href="/colleges" cta="Search all colleges" />
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {POPULAR_STATES.map((name) => {
            const slug = slugify(name);
            const count = stateCount.get(slug) ?? 0;
            return (
              <li key={slug}>
                <Link href={`/colleges?state=${slug}`} className="card card-link flex items-center gap-3 p-3 sm:p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e9edff] text-ink-2 sm:size-10">
                    <MapPin size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold leading-snug">{name}</span>
                    <span className="tabular block text-[0.82rem] text-muted sm:text-[0.85rem]">{count > 0 ? `${fmt(count)} colleges` : "Not recorded"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <details className="group mt-4 rounded-xl border border-rule">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 font-bold hover:bg-band">
            All {stateCounts.length} states and union territories
            <ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="grid grid-cols-1 gap-x-6 px-4 pb-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...stateCounts]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <li key={s.slug}>
                  <Link href={`/colleges?state=${s.slug}`} className="flex justify-between gap-3 border-b border-rule py-2 text-[0.93rem] hover:text-brand-hover">
                    <span>{s.name}</span>
                    <span className="tabular text-muted">{s.institutions > 0 ? fmt(s.institutions) : "Not recorded"}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </details>

        {comboLinks.length ? (
          <div className="mt-6">
            <h3 className="text-[1.1rem] font-bold">Popular course and state searches</h3>
            <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {COMBO_COURSES.map((slug) => {
                const row = comboLinks.filter((c) => c.courseSlug === slug);
                if (!row.length) return null;
                return (
                  <li key={slug} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-rule pb-3">
                    <span className="w-full text-[0.92rem] font-bold">{row[0].course} colleges</span>
                    {row.map((c) => (
                      <Link
                        key={c.stateSlug}
                        href={`/colleges/${c.courseSlug}/${c.stateSlug}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-rule bg-paper px-3 text-[0.88rem] text-ink-soft hover:border-brand hover:text-ink"
                      >
                        <span className="sr-only">{c.course} colleges in </span>
                        {c.state}
                        <span className="tabular text-[0.8rem] text-muted">{fmt(c.colleges)}</span>
                      </Link>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Popular courses */}
      <section className="mt-12 bg-band py-12 sm:mt-16 sm:py-16" aria-labelledby="courses-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead id="courses-title" title="Popular courses" intro="Duration as fixed by the regulator, the entrance exams that lead to each, and the colleges that offer it." href="/courses" cta="Browse all courses" />
          <ul className={`${rowList} sm:grid-cols-2 lg:grid-cols-4`}>
            {popular.map((c) => {
              const ex = examsByStream(c.streamName).slice(0, 3);
              return (
                <li key={c.slug} className={`card flex flex-col p-5 ${rowItem}`}>
                  <div className="flex items-center gap-3">
                    <FieldIcon slug={c.streamSlug} size={20} className="size-10" />
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold">{c.short}</h3>
                      <p className="text-[0.85rem] text-muted">
                        {c.streamName}, {LEVEL_LABEL[c.level] ?? c.level}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.92rem] leading-snug text-ink-soft">{c.name}</p>
                  <dl className="mt-3 space-y-1.5 text-[0.9rem]">
                    <div className="flex gap-2">
                      <Clock size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Duration</dt>
                      <dd className={c.duration ? "" : "text-muted"}>{c.duration ?? "Duration not recorded"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <Target size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Entrance exams</dt>
                      <dd>{ex.length ? ex.join(", ") : "Admission rules vary by college"}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link href={`/colleges?course=${c.slug}`} className="flex min-h-11 items-center justify-center rounded-lg bg-ink px-3 text-[0.9rem] font-bold text-white hover:bg-ink-2">
                      Colleges
                    </Link>
                    <Link href={`/course/${c.slug}`} className="flex min-h-11 items-center justify-center rounded-lg border border-rule px-3 text-[0.9rem] font-bold hover:bg-band">
                      Details
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {rankingLists.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16" aria-labelledby="rank-title">
          <SectionHead id="rank-title" title="Top ranked colleges" intro="The National Institutional Ranking Framework (NIRF), published each year by the Ministry of Education. Shown exactly as published." href="/rankings" cta="All rankings" />
          <div className="card p-4 sm:p-6">
            <RankingTabs lists={rankingLists} />
          </div>
        </section>
      ) : null}

      {/* Exams */}
      <section className="mt-12 bg-band py-12 sm:mt-16 sm:py-16" aria-labelledby="exams-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead id="exams-title" title="Entrance exams" intro="Dates appear only once the conducting body announces them. Until then, follow the official site." href="/exams" cta="All exams" />
          <ul className={`${rowList} sm:grid-cols-2 lg:grid-cols-3`}>
            {exams.map((e) => (
              <li key={e.slug} className={`card flex flex-col p-4 sm:p-5 ${rowItem}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold sm:text-xl">
                      <Link href={`/exam/${e.slug}`} className="rounded hover:underline">
                        {e.short}
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-[0.86rem] leading-snug text-muted">{e.name}</p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[0.78rem] font-bold ${e.level === "State" ? "bg-verified-bg text-verified" : "bg-[#e9edff] text-ink-2"}`}>
                    {e.level === "State" ? "State" : "National"}
                  </span>
                </div>
                <p className="mt-2 text-[0.88rem] text-ink-soft">{e.body}</p>
                <p className="mt-2 text-[0.85rem] text-muted">For {e.streams.slice(0, 4).map((s) => (s === s.toUpperCase() ? s : s.toLowerCase())).join(", ")}{e.streams.length > 4 ? ` and ${e.streams.length - 4} more` : ""}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[0.88rem]">
                  <Link href={`/exam/${e.slug}`} className="rounded font-bold text-brand-hover hover:underline">
                    Exam details
                  </Link>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener" className="flex min-w-0 items-center gap-1 rounded text-muted hover:text-ink">
                      <span className="truncate">{hostOf(e.url)}</span> <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-muted">Official site not recorded</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16" aria-labelledby="tools-title">
        <SectionHead id="tools-title" title="Plan your admission" />
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {[
            { icon: Compass, title: "Free counselling", text: "A counsellor helps you shortlist colleges and plan counselling rounds.", href: "/counselling" },
            { icon: BadgeIndianRupee, title: "Scholarships", text: "Government, university and trust scholarships you may be eligible for.", href: "/scholarships" },
            { icon: Target, title: "College predictor", text: "Colleges that match your NEET, KEAM or JEE rank, from official closing ranks.", href: null },
            { icon: GitCompareArrows, title: "Compare colleges", text: "Seats, rankings and approvals side by side.", href: "/colleges/compare" },
          ].map((t) => {
            const body = (
              <>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-hover sm:size-11">
                  <t.icon size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[1.05rem] font-bold sm:mt-4 sm:text-lg">{t.title}</h3>
                <p className="mt-1 hidden text-[0.92rem] text-muted sm:block">{t.text}</p>
                {t.href ? (
                  <span className="mt-2 inline-flex items-center gap-1 text-[0.92rem] font-bold text-brand-hover sm:mt-4">
                    Open <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                ) : (
                  <span className="mt-2 inline-block rounded bg-band px-2 py-0.5 text-[0.8rem] font-bold text-muted sm:mt-4">Coming soon</span>
                )}
              </>
            );
            return (
              <li key={t.title}>
                {t.href ? (
                  <Link href={t.href} className="card card-link block h-full p-4 sm:p-5">
                    {body}
                  </Link>
                ) : (
                  <div className="card h-full p-4 sm:p-5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Counselling */}
      <section id="counsel" className="mx-auto mt-12 max-w-7xl scroll-mt-24 px-4 sm:mt-16 sm:px-6" aria-labelledby="counsel-title">
        <div className="overflow-hidden rounded-3xl bg-ink text-white">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="relative p-6 sm:p-10">
              <h2 id="counsel-title" className="text-[1.8rem] font-bold sm:text-[2.4rem]">
                Get free admission counselling
              </h2>
              <p className="mt-3 max-w-[48ch] text-[#c9cbe6]">
                Our counsellors help you shortlist colleges for your rank and budget, explain counselling rounds, and check every fee with the college before you pay.
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  { icon: ShieldCheck, t: "Approved colleges only", d: "Approvals checked against the NMC, INC, AICTE and other council lists." },
                  { icon: Users, t: "Counsellors who know Kerala students", d: "Help with KEAM, NEET and state quotas outside Kerala." },
                  { icon: Phone, t: "Call, WhatsApp or visit", d: `${CONTACT.branches.length} offices from Thiruvalla to Kannur.` },
                ].map((p) => (
                  <li key={p.t} className="flex gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand">
                      <p.icon size={19} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-bold">{p.t}</span>
                      <span className="block text-[0.92rem] text-[#c9cbe6]">{p.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Image src="/images/students.png" alt="" width={1024} height={1024} sizes="340px" className="pointer-events-none mt-8 hidden w-[340px] max-w-full lg:block" />
            </div>
            <div className="bg-paper p-5 text-ink sm:p-10">
              <p className="text-xl font-bold">Request a call back</p>
              <p className="mb-5 mt-1 text-[0.95rem] text-muted">A counsellor will call you during office hours. Your details are not shared with colleges without your permission.</p>
              <CounsellingForm courses={options.courses} states={options.states} />
              <p className="mt-5 text-[0.92rem] text-muted">
                Prefer to call?{" "}
                <a href={CONTACT.phoneHref} className="tabular font-bold text-ink">
                  {CONTACT.phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
