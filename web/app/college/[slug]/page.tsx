import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, Phone, Mail, Award, ShieldCheck, ExternalLink, Building, CalendarDays, GraduationCap, Trophy, Users, BookOpen, Navigation, Scale } from "lucide-react";
import { getCollege, getSimilarColleges, offeringSeats, type SourceRef } from "@/lib/queries/college";
import { getSearchOptions } from "@/lib/queries/home";
import { APPROVAL_BODIES, OWNERSHIP_LABELS, formatNumber, publisherShort } from "@/lib/queries/colleges";
import { CounsellingForm } from "@/components/counselling-form";
import { SourceStamp } from "@/components/source-stamp";
import { SectionNav } from "@/components/college/section-nav";
import { CoursesTable } from "@/components/college/courses-table";
import { ShortlistButton } from "@/components/colleges/shortlist-button";
import { initials } from "@/components/college-card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCollege((await params).slug);
  if (!c) return { title: "College not found" };
  const place = [c.city ?? c.district, c.state].filter(Boolean).join(", ");
  const seats = c.offerings.map(offeringSeats).filter((n): n is number => n !== null);
  const facts = [
    c.approvals.length ? c.approvals.map((a) => APPROVAL_BODIES[a]?.badge ?? a).join(", ") : null,
    seats.length ? `${formatNumber(seats.reduce((a, b) => a + b, 0))} seats across ${c.offerings.length} courses` : null,
    c.rankings[0] ? `NIRF ${c.rankings[0].year} ${c.rankings[0].category} ${c.rankings[0].rank ? `rank ${c.rankings[0].rank}` : c.rankings[0].rankBand}` : null,
  ].filter(Boolean);
  return {
    title: `${c.name}${place ? `, ${place}` : ""}: courses, seats, rankings`,
    description: `${c.name}${place ? ` in ${place}` : ""}. ${facts.join(". ")}${facts.length ? ". " : ""}Official sources only, with free admission counselling.`,
    alternates: { canonical: `/college/${c.slug}` },
  };
}

function Value({ v }: { v: string | number | null | undefined }) {
  return v === null || v === undefined || v === "" ? <span className="font-normal italic text-muted">Not recorded</span> : <>{v}</>;
}

function Stamp({ s }: { s: SourceRef | null }) {
  return s ? <SourceStamp publisher={s.title ?? s.publisher} url={s.url?.split(" ")[0]} checked={s.retrievedOn} /> : null;
}

function formatDate(d: string) {
  const t = new Date(d.slice(0, 10) + "T00:00:00");
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses and seats" },
  { id: "rankings", label: "Rankings" },
  { id: "admission", label: "Admission and exams" },
  { id: "contact", label: "Location and contact" },
  { id: "sources", label: "Sources" },
];

export default async function CollegePage({ params }: Props) {
  const { slug } = await params;
  const c = await getCollege(slug);
  if (!c) notFound();
  const [similar, options] = await Promise.all([getSimilarColleges(c), getSearchOptions()]);

  const town = c.city ?? c.district;
  const place = [c.city, c.district && c.district !== c.city ? c.district : null, c.state].filter(Boolean).join(", ");
  const shortPlace = [town, c.state].filter(Boolean).join(", ");
  const ownership = c.ownership ? OWNERSHIP_LABELS[c.ownership] ?? c.ownership : null;
  const latestYear = c.rankings[0]?.year;
  const latestRanks = c.rankings.filter((r) => r.year === latestYear);
  // The Overall rank is the one students compare across colleges; otherwise the best category rank.
  const best = latestRanks.find((r) => r.category === "Overall") ?? [...latestRanks].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))[0];
  const seatList = c.offerings.map(offeringSeats).filter((n): n is number => n !== null);
  const totalSeats = seatList.length ? seatList.reduce((a, b) => a + b, 0) : null;
  const academicYear = c.offerings.map((o) => o.academicYear).filter(Boolean).sort().at(-1) ?? null;
  const listYear = academicYear ? `, ${academicYear}` : "";
  const levels = new Set(c.offerings.map((o) => o.level));
  const mapsQuery = encodeURIComponent([c.name, c.address ?? place].filter(Boolean).join(", "));

  // A plain summary written only from the recorded facts.
  const kind = ownership
    ? /university/i.test(ownership)
      ? ownership.toLowerCase()
      : `${ownership.toLowerCase()} institution`
    : "institution";
  const summary = [
    `${c.name} is ${/^[aeiou]/i.test(kind) ? "an" : "a"} ${kind}${shortPlace ? ` in ${shortPlace}` : ""}${c.establishedYear ? `, established in ${c.establishedYear}` : ""}.`,
    c.approvals.length
      ? `It appears in the ${c.approvals.join(" and ")} list${c.approvals.length > 1 ? "s" : ""}${academicYear ? ` for ${academicYear}` : ""}${totalSeats !== null ? "," : ""}${totalSeats !== null ? ` with ${formatNumber(totalSeats)} approved seats across ${c.offerings.length} ${c.offerings.length === 1 ? "course" : "courses"}` : ""}.`
      : totalSeats !== null
        ? `It has ${formatNumber(totalSeats)} recorded seats across ${c.offerings.length} courses.`
        : null,
    best ? `It is ranked ${best.rank ? best.rank : best.rankBand} in the NIRF ${best.year} ${best.category} ranking.` : null,
    c.affiliatingUniversity ? `It is affiliated to ${c.affiliatingUniversity}.` : null,
  ].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: c.name,
    alternateName: c.aliases.length ? c.aliases : undefined,
    url: c.website ?? undefined,
    foundingDate: c.establishedYear ? String(c.establishedYear) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.address ?? undefined,
      addressLocality: town ?? undefined,
      addressRegion: c.state ?? undefined,
      postalCode: c.pin ?? undefined,
      addressCountry: "IN",
    },
  };

  const stats = [
    { icon: Trophy, label: best ? `NIRF ${best.year} ${best.category}` : "NIRF rank", value: best ? (best.rank ? `#${best.rank}` : best.rankBand) : null, empty: "Not ranked" },
    { icon: Users, label: `Total seats${listYear}`, value: totalSeats !== null ? formatNumber(totalSeats) : null, empty: "Not recorded" },
    { icon: BookOpen, label: "Courses listed", value: c.offerings.length ? String(c.offerings.length) : null, empty: "Not recorded" },
    { icon: CalendarDays, label: "Established", value: c.establishedYear ? String(c.establishedYear) : null, empty: "Not recorded" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="bg-[linear-gradient(115deg,#0d0f36_0%,#1c2063_100%)] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-7 pt-5 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-[0.9rem] text-[#b9bce0]">
            <Link href="/" className="hover:text-white">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/colleges" className="hover:text-white">
              Colleges
            </Link>
            {c.stateSlug ? (
              <>
                {" "}
                /{" "}
                <Link href={`/colleges?state=${c.stateSlug}`} className="hover:text-white">
                  {c.state}
                </Link>
              </>
            ) : null}
          </nav>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
            <div className="flex min-w-0 flex-1 gap-4">
              <div
                className="hidden size-[72px] shrink-0 items-center justify-center rounded-2xl bg-white font-[family-name:var(--font-display)] text-2xl font-extrabold text-ink-2 sm:flex"
                aria-hidden="true"
              >
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[1.75rem] font-extrabold leading-tight sm:text-[2.3rem]">{c.name}</h1>
                {c.aliases.length ? <p className="mt-1 text-[0.92rem] text-[#c9cbe6]">Also listed as {c.aliases.slice(0, 2).join(", ")}</p> : null}
                <p className="mt-2 flex items-start gap-1.5 text-[#dcdef2]">
                  <MapPin size={16} className="mt-1 shrink-0" aria-hidden="true" /> {place || "Location not recorded"}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2 text-[0.85rem]" aria-label="Status">
                  {c.isPartner ? <li className="rounded bg-verified px-2 py-0.5 font-bold text-white">Study2India partner</li> : null}
                  {ownership ? <li className="rounded bg-white px-2 py-0.5 font-bold text-ink">{ownership}</li> : null}
                  {c.approvals.map((a) => (
                    <li key={a} className="inline-flex items-center gap-1 rounded bg-[#1f7a4d] px-2 py-0.5 font-bold text-white" title={APPROVAL_BODIES[a]?.full}>
                      <ShieldCheck size={14} aria-hidden="true" />
                      {APPROVAL_BODIES[a]?.badge ?? `${a} approved`}
                      {academicYear ? <span className="font-normal opacity-90">{academicYear}</span> : null}
                    </li>
                  ))}
                  {c.naacGrade ? <li className="rounded bg-white/10 px-2 py-0.5">NAAC {c.naacGrade}</li> : null}
                </ul>
              </div>
            </div>
            <div className="grid gap-2 md:w-64 md:shrink-0">
              <a href="#apply" className="rounded-lg bg-brand px-4 py-2.5 text-center font-bold text-ink hover:bg-brand-hover">
                Get admission help
              </a>
              <div className="grid grid-cols-2 gap-2 [&>span>button]:w-full">
                <ShortlistButton variant="hero" item={{ slug: c.slug, name: c.name, place: shortPlace }} />
                <Link
                  href={`/colleges/compare?c=${c.slug}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/30 px-3 py-2.5 font-bold hover:bg-white/10"
                >
                  <Scale size={16} aria-hidden="true" />
                  Compare
                </Link>
              </div>
              {c.website ? (
                <a href={c.website} target="_blank" rel="noopener" className="flex items-center justify-center gap-1.5 rounded-lg border border-white/30 px-4 py-2.5 font-bold hover:bg-white/10">
                  Official website <ExternalLink size={15} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-white/15 bg-white/5 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`px-4 py-3 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""} border-white/15`}>
                <dt className="flex items-center gap-1.5 text-[0.8rem] text-[#b9bce0]">
                  <s.icon size={14} aria-hidden="true" />
                  {s.label}
                </dt>
                <dd className={`tabular mt-0.5 ${s.value ? "text-[1.35rem] font-extrabold" : "text-[1rem] italic text-[#c9cbe6]"}`}>{s.value ?? s.empty}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <SectionNav sections={SECTIONS} />

      <div className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section id="overview" aria-labelledby="h-overview" className="card scroll-mt-[160px] p-5 sm:p-6">
              <h2 id="h-overview" className="text-2xl font-bold">
                Overview
              </h2>
              <p className="mt-3 max-w-[70ch] text-[1.02rem] leading-relaxed text-ink-soft">{summary.join(" ")}</p>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {[
                  { icon: Building, k: "Ownership", v: ownership },
                  { icon: CalendarDays, k: "Established", v: c.establishedYear },
                  { icon: GraduationCap, k: "Affiliated to", v: c.affiliatingUniversity },
                  { icon: ShieldCheck, k: "Approved or listed by", v: c.approvals.length ? c.approvals.map((a) => APPROVAL_BODIES[a]?.full ?? a).join(", ") : null },
                  { icon: Award, k: "NAAC grade", v: c.naacGrade },
                  { icon: MapPin, k: "Location", v: place || null },
                ].map((r) => (
                  <div key={r.k} className="flex gap-3 border-b border-rule py-3">
                    <r.icon size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <dt className="w-28 shrink-0 text-muted sm:w-32">{r.k}</dt>
                    <dd className="min-w-0 font-bold">
                      <Value v={r.v} />
                    </dd>
                  </div>
                ))}
              </dl>
              {c.streams.length ? (
                <div className="mt-4">
                  <p className="text-[0.85rem] text-muted">Fields of study</p>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {c.streams.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/colleges?stream=${s.slug}${c.stateSlug ? `&state=${c.stateSlug}` : ""}`}
                          className="inline-block rounded-full bg-band px-3 py-1 text-[0.88rem] hover:bg-rule"
                          title={`More ${s.name} colleges${c.state ? ` in ${c.state}` : ""}`}
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-4">
                <Stamp s={c.source} />
              </div>
            </section>

            <section id="courses" aria-labelledby="h-courses" className="card scroll-mt-[160px] p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="h-courses" className="text-2xl font-bold">
                  Courses and seats
                </h2>
                {totalSeats !== null ? (
                  <p className="tabular text-ink-soft">
                    <b className="text-ink">{formatNumber(totalSeats)}</b> seats{listYear ? ` in ${academicYear}` : ""}
                  </p>
                ) : null}
              </div>
              {c.offerings.length ? (
                <>
                  <p className="mt-1 text-[0.92rem] text-muted">
                    Approved intake as published by the regulator. A seat figure is the sanctioned intake, not the number of seats still open.
                  </p>
                  <CoursesTable offerings={c.offerings} />
                </>
              ) : (
                <p className="mt-3 text-ink-soft">
                  Course-wise seats for this college are not in the official lists we have loaded yet. Ask a counsellor for its current courses and intake.
                </p>
              )}
            </section>

            <section id="rankings" aria-labelledby="h-rankings" className="card scroll-mt-[160px] p-5 sm:p-6">
              <h2 id="h-rankings" className="text-2xl font-bold">
                Rankings
              </h2>
              {c.rankings.length ? (
                <>
                  <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {latestRanks.slice(0, 6).map((r) => (
                      <li key={r.category} className="rounded-xl border border-rule bg-[#f6f7ff] px-4 py-3">
                        <p className="tabular text-[1.6rem] font-extrabold leading-none text-ink-2">{r.rank ? `#${r.rank}` : r.rankBand}</p>
                        <p className="mt-1 text-[0.88rem] text-ink-soft">
                          NIRF {r.year}, {r.category}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-[0.95rem]">
                      <thead>
                        <tr className="text-[0.8rem] uppercase tracking-wide text-muted">
                          <th scope="col" className="py-2 font-bold">Category</th>
                          <th scope="col" className="py-2 font-bold">Year</th>
                          <th scope="col" className="py-2 text-right font-bold">Rank</th>
                          <th scope="col" className="py-2 text-right font-bold">Score</th>
                          <th scope="col" className="py-2 pl-4 font-bold">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.rankings.map((r, i) => (
                          <tr key={i} className="border-t border-rule">
                            <th scope="row" className="py-2.5 font-bold">
                              {r.agency} {r.category}
                            </th>
                            <td className="tabular py-2.5">{r.year}</td>
                            <td className="tabular py-2.5 text-right font-bold">{r.rank ?? r.rankBand}</td>
                            <td className="tabular py-2.5 text-right">
                              <Value v={r.score} />
                            </td>
                            <td className="py-2.5 pl-4 text-[0.88rem]">
                              {r.source.url ? (
                                <a href={r.source.url.split(" ")[0]} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-verified underline underline-offset-2">
                                  {publisherShort(r.source.publisher)} {r.year} <ExternalLink size={12} aria-hidden="true" />
                                </a>
                              ) : (
                                publisherShort(r.source.publisher)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[0.85rem] text-muted">
                    NIRF is the Ministry of Education&apos;s national ranking. A rank band (such as 101-150) means NIRF published the band, not an exact rank.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-ink-soft">
                  Not ranked in the NIRF rankings we have loaded. Most colleges in India are not ranked; this says nothing bad about the college on its own.
                </p>
              )}
            </section>

            <section id="admission" aria-labelledby="h-admission" className="card scroll-mt-[160px] p-5 sm:p-6">
              <h2 id="h-admission" className="text-2xl font-bold">
                Admission and exams
              </h2>
              <p className="mt-3 max-w-[70ch] text-ink-soft">
                Which exam and counselling apply depends on the course, the quota and the state. Most seats are filled through national or state counselling for the
                relevant entrance exam, and the rest by the college under its state&apos;s rules. Always confirm in the college&apos;s own admission notice.
              </p>
              {levels.has("diploma") ? (
                <p className="mt-3 max-w-[70ch] rounded-lg bg-band px-4 py-3 text-[0.95rem] text-ink-soft">
                  <b className="text-ink">Diploma courses:</b> admission is usually through the state&apos;s own process, run by its technical education or
                  nursing board, often on Class 10 or 12 marks.
                </p>
              ) : null}
              {c.exams.length ? (
                <>
                  <h3 className="mt-5 text-lg font-bold">Entrance exams for these fields</h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {c.exams.map((e) => (
                      <li key={e.slug} className="rounded-xl border border-rule p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/exam/${e.slug}`} className="text-[1.05rem] font-bold hover:text-brand-hover hover:underline">
                            {e.short}
                          </Link>
                          <span className="shrink-0 rounded bg-band px-2 py-0.5 text-[0.75rem] font-bold text-ink-soft">
                            {e.level}, {e.forLevel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[0.88rem] text-ink-soft">{e.name}</p>
                        <p className="mt-1 text-[0.82rem] text-muted">
                          By {e.body}. For {e.streams.join(", ")}.
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[0.85rem] text-muted">These are the main exams for the fields this college teaches, not a list of exams it has confirmed.</p>
                </>
              ) : null}
              <h3 className="mt-6 text-lg font-bold">Cutoffs</h3>
              {c.cutoffs.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[0.92rem]">
                    <thead>
                      <tr className="text-[0.8rem] uppercase tracking-wide text-muted">
                        <th scope="col" className="py-2 font-bold">Course</th>
                        <th scope="col" className="py-2 font-bold">Exam</th>
                        <th scope="col" className="py-2 font-bold">Year, round</th>
                        <th scope="col" className="py-2 font-bold">Quota, category</th>
                        <th scope="col" className="py-2 text-right font-bold">Opening</th>
                        <th scope="col" className="py-2 text-right font-bold">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.cutoffs.map((x, i) => (
                        <tr key={i} className="border-t border-rule">
                          <td className="py-2">{c.offerings.find((o) => o.id === x.offeringId)?.courseShort ?? <Value v={null} />}</td>
                          <td className="py-2">{x.exam}</td>
                          <td className="py-2">
                            {x.year}
                            {x.round ? `, ${x.round}` : ""}
                          </td>
                          <td className="py-2">{[x.quota, x.category].filter(Boolean).join(", ") || <Value v={null} />}</td>
                          <td className="tabular py-2 text-right">
                            <Value v={x.openingRank} />
                          </td>
                          <td className="tabular py-2 text-right font-bold">
                            <Value v={x.closingRank} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3">
                    <Stamp s={c.cutoffs[0].source} />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-ink-soft">Not recorded. Official closing ranks for this college are not loaded yet; we do not publish estimated cutoffs.</p>
              )}
              <a href="#apply" className="mt-5 inline-block rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-ink-2">
                Ask about admission here
              </a>
            </section>

            <section id="contact" aria-labelledby="h-contact" className="card scroll-mt-[160px] p-5 sm:p-6">
              <h2 id="h-contact" className="text-2xl font-bold">
                Location and contact
              </h2>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {[
                  { icon: MapPin, k: "Address", v: c.address },
                  { icon: Navigation, k: "District", v: c.district ?? c.city },
                  { icon: MapPin, k: "State", v: c.state },
                  { icon: MapPin, k: "PIN code", v: c.pin },
                ].map((r) => (
                  <div key={r.k} className="flex gap-3 border-b border-rule py-3">
                    <r.icon size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <dt className="w-24 shrink-0 text-muted">{r.k}</dt>
                    <dd className="min-w-0 font-bold">
                      <Value v={r.v} />
                    </dd>
                  </div>
                ))}
                <div className="flex gap-3 border-b border-rule py-3">
                  <Globe size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-muted">Website</dt>
                  <dd className="min-w-0 break-words font-bold">
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noopener" className="underline">
                        {c.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <Value v={null} />
                    )}
                  </dd>
                </div>
                <div className="flex gap-3 border-b border-rule py-3">
                  <Phone size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-muted">Phone</dt>
                  <dd className="font-bold">{c.phone ? <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="underline">{c.phone}</a> : <Value v={null} />}</dd>
                </div>
                <div className="flex gap-3 border-b border-rule py-3">
                  <Mail size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-muted">Email</dt>
                  <dd className="min-w-0 break-words font-bold">{c.email ? <a href={`mailto:${c.email}`} className="underline">{c.email}</a> : <Value v={null} />}</dd>
                </div>
              </dl>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rule px-4 py-2 font-bold hover:border-ink"
              >
                <Navigation size={16} aria-hidden="true" />
                Search on Google Maps <ExternalLink size={14} aria-hidden="true" />
              </a>
            </section>

            <section id="sources" aria-labelledby="h-sources" className="card scroll-mt-[160px] p-5 sm:p-6">
              <h2 id="h-sources" className="text-2xl font-bold">
                Sources
              </h2>
              <p className="mt-2 max-w-[70ch] text-ink-soft">
                Every figure on this page comes from one of these official documents. If something looks wrong, the document is the final word;{" "}
                <Link href="/how-we-check-data" className="font-bold underline underline-offset-2">
                  how we check data
                </Link>
                .
              </p>
              {c.sources.length ? (
                <ul className="mt-4 divide-y divide-rule">
                  {c.sources.map((s) => (
                    <li key={s.publisher + s.title} className="py-3">
                      <p className="font-bold">
                        {s.url ? (
                          <a href={s.url.split(" ")[0]} target="_blank" rel="noopener" className="inline-flex items-baseline gap-1 hover:underline">
                            {s.title ?? s.publisher} <ExternalLink size={13} className="shrink-0 self-center" aria-hidden="true" />
                          </a>
                        ) : (
                          (s.title ?? s.publisher)
                        )}
                      </p>
                      <p className="text-[0.88rem] text-muted">
                        {s.publisher}
                        {s.retrievedOn ? `, checked ${formatDate(s.retrievedOn)}` : ""}. Used for: {s.usedFor.join(", ")}.
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-ink-soft">Not recorded.</p>
              )}
              <p className="mt-3 text-[0.85rem] text-muted">Page last updated {formatDate(c.updatedAt)}.</p>
            </section>
          </div>

          <aside className="space-y-6" aria-label="Admission help and similar colleges">
            <div id="apply" className="card scroll-mt-[160px] p-5 lg:sticky lg:top-[164px]">
              <h2 className="text-xl font-bold">Interested in this college?</h2>
              <p className="mb-4 mt-1 text-[0.92rem] text-muted">A counsellor will call you about admission here, free. Optional; nothing on this page is locked behind it.</p>
              <CounsellingForm courses={options.courses} states={options.states} />
            </div>
            {similar.length ? (
              <div className="card p-5">
                <h2 className="text-lg font-bold">Similar colleges{c.state ? ` in ${c.state}` : ""}</h2>
                <ul className="mt-3 divide-y divide-rule">
                  {similar.map((s) => (
                    <li key={s.slug} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link href={`/college/${s.slug}`} className="font-bold leading-snug hover:text-brand-hover">
                          {s.name}
                        </Link>
                        <p className="text-[0.85rem] text-muted">{[s.city, s.state].filter(Boolean).join(", ")}</p>
                      </div>
                      {s.best_rank ? <span className="tabular shrink-0 rounded bg-[#e9edff] px-1.5 py-0.5 text-[0.78rem] font-bold text-ink-2">NIRF #{s.best_rank}</span> : null}
                    </li>
                  ))}
                </ul>
                {c.stateSlug && c.streams[0] ? (
                  <Link href={`/colleges?stream=${c.streams[0].slug}&state=${c.stateSlug}`} className="mt-2 inline-block text-[0.92rem] font-bold text-brand-hover hover:underline">
                    See all {c.streams[0].name} colleges in {c.state}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}
