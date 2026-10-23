import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, ShieldCheck, Phone, Users, Target, GitCompareArrows, Compass, BadgeIndianRupee, Clock, ExternalLink, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { getHomeCounts, getStreams, getTopRankings, getStateCounts, getExams, getSearchOptions, getAllCourses } from "@/lib/queries/home";
import { CounsellingForm } from "@/components/counselling-form";
import { RankingTabs } from "@/components/ranking-tabs";
import { FieldIcon } from "@/components/field-icon";
import { SentenceSelect } from "@/components/sentence-select";
import { POPULAR_STATES } from "@/components/site-header";
import { CONTACT } from "@/data/reference";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const POPULAR_COURSES = ["mbbs", "bds", "bsc-nursing", "bams", "btech", "mba", "ba-llb", "b-pharm"];
const HERO_CHIPS = [
  { label: "MBBS in Karnataka", href: "/colleges?course=mbbs&state=karnataka" },
  { label: "BDS in Tamil Nadu", href: "/colleges?course=bds&state=tamil-nadu" },
  { label: "B.Sc Nursing", href: "/colleges?course=bsc-nursing" },
  { label: "B.Tech in Kerala", href: "/colleges?course=btech&state=kerala" },
  { label: "MBA colleges", href: "/colleges?stream=management" },
];
const LEVEL_LABEL: Record<string, string> = { ug: "Undergraduate", pg: "Postgraduate", diploma: "Diploma", doctorate: "Doctorate", certificate: "Certificate", integrated: "Integrated" };

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SectionHead({ id, title, intro, href, cta }: { id: string; title: string; intro?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-[1.85rem] font-bold sm:text-[2.1rem]">
          {title}
        </h2>
        {intro ? <p className="mt-1.5 max-w-[62ch] text-muted">{intro}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="flex items-center gap-1 font-bold text-brand-hover hover:underline">
          {cta} <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const [counts, streams, rankingLists, stateCounts, exams, options, courses] = await Promise.all([
    getHomeCounts(),
    getStreams(),
    getTopRankings(10),
    getStateCounts(),
    getExams(),
    getSearchOptions(),
    getAllCourses(),
  ]);

  const popular = POPULAR_COURSES.map((s) => courses.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);
  const stateCount = new Map(stateCounts.map((s) => [s.slug, s.institutions]));
  const examsByStream = (streamName: string) => exams.filter((e) => e.streams.includes(streamName)).map((e) => e.short);

  const stats = [
    { value: counts.streams, label: "Fields of study" },
    { value: counts.courses, label: "Courses" },
    { value: counts.exams, label: "Entrance exams" },
    counts.institutions > 0 ? { value: counts.institutions, label: "Colleges listed" } : { value: CONTACT.branches.length, label: "Offices in Kerala" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(115deg,#fff7ee_0%,#fff_45%,#eef1fb_100%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:pt-14">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[0.88rem] font-bold text-ink-soft shadow-[var(--shadow-card)]">
              <ShieldCheck size={16} className="text-verified" aria-hidden="true" />
              Every fee, seat and rank checked against official sources
            </p>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.02] sm:text-[3.6rem]">Find your college in India.</h1>
            <p className="mt-4 max-w-[54ch] text-[1.08rem] text-ink-soft">
              Colleges, courses, rankings and entrance exams for every field, with the source shown beside each figure.
            </p>

            <form action="/colleges" method="get" className="mt-8">
              <p className="font-[family-name:var(--font-display)] text-[1.8rem] font-bold leading-[1.55] sm:text-[2.5rem]">
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
              <button type="submit" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3.5 text-[1.05rem] font-bold text-white hover:bg-ink-2">
                <Search size={18} aria-hidden="true" /> Show colleges
              </button>
            </form>

            <form action="/search" method="get" role="search" className="mt-8 max-w-xl">
              <label htmlFor="h-name" className="text-[0.95rem] text-ink-soft">
                Know the college already? Search by name
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="h-name"
                  name="q"
                  type="search"
                  placeholder="For example, Government Medical College Thrissur"
                  className="min-w-0 flex-1 rounded-lg border border-rule bg-paper px-3 py-2.5 placeholder:text-muted focus:border-ink"
                />
                <button type="submit" className="rounded-lg border-2 border-ink bg-paper px-4 py-2 font-bold hover:bg-band">
                  Search
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-[0.9rem]">
              <span className="text-muted">Popular:</span>
              {HERO_CHIPS.map((c) => (
                <Link key={c.href} href={c.href} className="rounded-full border border-rule bg-paper px-3 py-1 text-ink-soft hover:border-brand hover:text-ink">
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[460px] lg:block">
            <div className="absolute inset-x-6 bottom-0 top-10 rounded-[48%_52%_40%_60%/55%_45%_55%_45%] bg-brand/90" aria-hidden="true" />
            <div className="absolute -right-2 top-4 size-28 rounded-full bg-ink" aria-hidden="true" />
            <Image src="/images/galleryBg2.png" alt="Student holding books, smiling" width={1024} height={1024} priority className="relative w-full" />
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

        <div className="border-t border-rule bg-paper/70">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-4 py-6 sm:px-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse md:border-l md:border-rule md:pl-6 md:first:border-0 md:first:pl-0">
                <dt className="mt-1 text-[0.92rem] text-muted">{s.label}</dt>
                <dd className="tabular font-[family-name:var(--font-display)] text-[2rem] font-extrabold leading-none">{s.value.toLocaleString("en-IN")}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Study goals */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="goals-title">
        <SectionHead id="goals-title" title="Select your study goal" intro="Every field from day one. Pick a field to see its colleges, courses and entrance exams." href="/courses" cta="All courses" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {streams.map((s) => (
            <li key={s.slug}>
              <Link href={`/colleges?stream=${s.slug}`} className="card card-link flex h-full items-start gap-3 p-4">
                <FieldIcon slug={s.slug} className="size-11" />
                <span className="min-w-0">
                  <span className="block font-bold leading-snug">{s.name}</span>
                  <span className="mt-0.5 block text-[0.85rem] text-muted">
                    {s.institutions > 0 ? `${s.institutions.toLocaleString("en-IN")} colleges, ` : ""}
                    {s.courses.length} {s.courses.length === 1 ? "course" : "courses"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Popular courses */}
      <section className="mt-16 bg-band py-16" aria-labelledby="courses-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead id="courses-title" title="Explore popular courses" intro="Duration as fixed by the regulator, the entrance exams that lead to each, and the colleges that offer it." href="/courses" cta="Browse all courses" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((c) => {
              const ex = examsByStream(c.streamName).slice(0, 3);
              return (
                <li key={c.slug} className="card flex flex-col p-5">
                  <div className="flex items-center gap-3">
                    <FieldIcon slug={c.streamSlug} size={20} className="size-10" />
                    <div>
                      <h3 className="text-xl font-bold">{c.short}</h3>
                      <p className="text-[0.85rem] text-muted">{c.streamName}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.92rem] leading-snug text-ink-soft">{c.name}</p>
                  <dl className="mt-4 space-y-2 text-[0.9rem]">
                    <div className="flex gap-2">
                      <Clock size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Duration</dt>
                      <dd className={c.duration ? "" : "italic text-muted"}>{c.duration ?? "Duration not recorded"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <Target size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Entrance exams</dt>
                      <dd>{ex.length ? ex.join(", ") : "Admission rules vary by college"}</dd>
                    </div>
                  </dl>
                  <span className="mt-3 inline-block self-start rounded bg-band px-2 py-0.5 text-[0.8rem] font-bold text-ink-soft">{LEVEL_LABEL[c.level] ?? c.level}</span>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link href={`/colleges?course=${c.slug}`} className="rounded-lg bg-ink px-3 py-2 text-center text-[0.9rem] font-bold text-white hover:bg-ink-2">
                      Colleges
                    </Link>
                    <Link href={`/course/${c.slug}`} className="rounded-lg border border-rule px-3 py-2 text-center text-[0.9rem] font-bold hover:bg-band">
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
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="rank-title">
          <SectionHead id="rank-title" title="Top ranked colleges" intro="The National Institutional Ranking Framework (NIRF), published each year by the Ministry of Education. Shown exactly as published." href="/rankings" cta="All rankings" />
          <div className="card p-4 sm:p-6">
            <RankingTabs lists={rankingLists} />
          </div>
        </section>
      ) : null}

      {/* Tools */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="tools-title">
        <SectionHead id="tools-title" title="Tools to plan your admission" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Target, title: "College predictor", text: "See which colleges match your NEET, KEAM or JEE rank, from past official closing ranks.", href: null },
            { icon: GitCompareArrows, title: "Compare colleges", text: "Fees, seats, rankings and approvals side by side, for up to four colleges.", href: null },
            { icon: BadgeIndianRupee, title: "Scholarships", text: "Government, university and trust scholarships you may be eligible for.", href: "/scholarships" },
            { icon: Compass, title: "Free counselling", text: "A counsellor helps you shortlist colleges and plan counselling rounds.", href: "/counselling" },
          ].map((t) => {
            const body = (
              <>
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-hover">
                  <t.icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{t.title}</h3>
                <p className="mt-1 text-[0.92rem] text-muted">{t.text}</p>
                {t.href ? (
                  <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-hover">
                    Open <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                ) : (
                  <span className="mt-4 inline-block rounded bg-band px-2 py-0.5 text-[0.8rem] font-bold text-muted">Coming soon</span>
                )}
              </>
            );
            return (
              <li key={t.title}>
                {t.href ? (
                  <Link href={t.href} className="card card-link block h-full p-5">
                    {body}
                  </Link>
                ) : (
                  <div className="card h-full p-5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Exams */}
      <section className="mt-16 bg-band py-16" aria-labelledby="exams-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead id="exams-title" title="Entrance exams" intro="Dates appear only once the conducting body announces them. Until then, follow the official site." href="/exams" cta="All exams" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((e) => (
              <li key={e.slug} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">
                      <Link href={`/exam/${e.slug}`} className="hover:underline">
                        {e.short}
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-[0.88rem] leading-snug text-muted">{e.name}</p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[0.78rem] font-bold ${e.level === "State" ? "bg-[#e9f7ec] text-verified" : "bg-[#e9edff] text-ink-2"}`}>
                    {e.level === "State" ? "State" : "National"}
                  </span>
                </div>
                <p className="mt-3 text-[0.9rem] text-ink-soft">Conducted by {e.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.streams.slice(0, 4).map((s) => (
                    <span key={s} className="rounded-full bg-band px-2.5 py-0.5 text-[0.8rem] text-ink-soft">
                      {s}
                    </span>
                  ))}
                  {e.streams.length > 4 ? <span className="rounded-full bg-band px-2.5 py-0.5 text-[0.8rem] text-ink-soft">+{e.streams.length - 4} more</span> : null}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[0.9rem]">
                  <Link href={`/exam/${e.slug}`} className="font-bold text-brand-hover hover:underline">
                    Exam details
                  </Link>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener" className="flex items-center gap-1 text-muted hover:text-ink">
                      {hostOf(e.url)} <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-muted">Official site changes yearly</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* States */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="states-title">
        <SectionHead id="states-title" title="Colleges by state" intro="Where students from Kerala most often study." href="/colleges" cta="All states" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {POPULAR_STATES.map((name) => {
            const slug = slugify(name);
            const count = stateCount.get(slug) ?? 0;
            return (
              <li key={slug}>
                <Link href={`/colleges?state=${slug}`} className="card card-link flex items-center gap-3 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e9edff] text-ink-2">
                    <MapPin size={19} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold">{name}</span>
                    <span className="block text-[0.85rem] text-muted">{count > 0 ? `${count.toLocaleString("en-IN")} colleges` : "View colleges"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Counselling */}
      <section id="counsel" className="mx-auto mt-16 max-w-7xl scroll-mt-28 px-4 sm:px-6" aria-labelledby="counsel-title">
        <div className="overflow-hidden rounded-3xl bg-ink text-white">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="relative p-7 sm:p-10">
              <h2 id="counsel-title" className="text-[2rem] font-bold sm:text-[2.4rem]">
                Get free admission counselling
              </h2>
              <p className="mt-3 max-w-[48ch] text-[#c9cbe6]">
                Our counsellors help you shortlist colleges for your rank and budget, explain counselling rounds, and check every fee before you pay.
              </p>
              <ul className="mt-7 space-y-4">
                {[
                  { icon: ShieldCheck, t: "Verified colleges only", d: "Approvals checked with NMC, DCI, INC and the other councils." },
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
              <Image src="/images/students.png" alt="" width={1024} height={1024} className="pointer-events-none mt-8 hidden w-[340px] max-w-full lg:block" />
            </div>
            <div className="bg-paper p-6 text-ink sm:p-10">
              <p className="text-xl font-bold">Request a call back</p>
              <p className="mb-5 mt-1 text-[0.95rem] text-muted">A counsellor will call you during office hours.</p>
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
