import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, Phone, Mail, Award, ShieldCheck, ExternalLink, Building, CalendarDays, GraduationCap } from "lucide-react";
import { getCollege, getSimilarColleges, type SourceRef } from "@/lib/queries/college";
import { getSearchOptions } from "@/lib/queries/home";
import { OWNERSHIP_LABELS, FEE_BASIS_LABELS, formatInr } from "@/lib/queries/colleges";
import { CounsellingForm } from "@/components/counselling-form";
import { SourceStamp } from "@/components/source-stamp";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCollege((await params).slug);
  if (!c) return { title: "College not found" };
  const place = [c.city, c.state].filter(Boolean).join(", ");
  return {
    title: `${c.name}${place ? `, ${place}` : ""}: courses, fees, rankings`,
    description: `${c.name}${place ? ` in ${place}` : ""}. Courses, fees, seats, rankings and admission details from official sources, with free admission counselling.`,
    alternates: { canonical: `/college/${c.slug}` },
  };
}

const LEVEL_LABEL: Record<string, string> = { ug: "Undergraduate", pg: "Postgraduate", diploma: "Diploma", doctorate: "Doctorate", certificate: "Certificate", integrated: "Integrated" };

function Value({ v }: { v: string | number | null | undefined }) {
  return v === null || v === undefined || v === "" ? <span className="italic text-muted">Not recorded</span> : <>{v}</>;
}

function Stamp({ s }: { s: SourceRef | null }) {
  return s ? <SourceStamp publisher={s.title ?? s.publisher} url={s.url?.split(" ")[0]} checked={s.retrievedOn} /> : null;
}

export default async function CollegePage({ params }: Props) {
  const { slug } = await params;
  const c = await getCollege(slug);
  if (!c) notFound();
  const [similar, options] = await Promise.all([getSimilarColleges(c), getSearchOptions()]);

  const place = [c.city, c.district && c.district !== c.city ? c.district : null, c.state].filter(Boolean).join(", ");
  const latestRank = c.rankings[0];
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "courses", label: "Courses & fees" },
    { id: "rankings", label: "Rankings" },
    { id: "cutoffs", label: "Cutoffs" },
    { id: "admission", label: "Admission" },
    { id: "contact", label: "Contact" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: c.name,
    url: c.website ?? undefined,
    address: { "@type": "PostalAddress", addressLocality: c.city ?? undefined, addressRegion: c.state ?? undefined, postalCode: c.pin ?? undefined, addressCountry: "IN" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-[linear-gradient(115deg,#0d0f36_0%,#1c2063_100%)] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-[0.9rem] text-[#b9bce0]">
            <Link href="/" className="hover:text-white">Home</Link> / <Link href="/colleges" className="hover:text-white">Colleges</Link>
            {c.stateSlug ? (
              <>
                {" "}/ <Link href={`/colleges?state=${c.stateSlug}`} className="hover:text-white">{c.state}</Link>
              </>
            ) : null}
          </nav>
          <div className="mt-5 flex flex-wrap items-start gap-5">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white font-[family-name:var(--font-display)] text-2xl font-extrabold text-ink-2" aria-hidden="true">
              {c.name
                .split(/\s+/)
                .filter((w) => w.length > 2)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[1.9rem] font-extrabold leading-tight sm:text-[2.4rem]">{c.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-[#c9cbe6]">
                <MapPin size={16} aria-hidden="true" /> {place || "Location not recorded"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[0.85rem]">
                {c.isPartner ? <span className="rounded bg-verified px-2 py-0.5 font-bold text-white">Study2India partner</span> : null}
                {c.ownership ? <span className="rounded bg-white/10 px-2 py-0.5">{OWNERSHIP_LABELS[c.ownership] ?? c.ownership}</span> : null}
                {c.establishedYear ? <span className="rounded bg-white/10 px-2 py-0.5">Est. {c.establishedYear}</span> : null}
                {c.approvals.map((a) => (
                  <span key={a} className="rounded bg-white/10 px-2 py-0.5">{a} approved</span>
                ))}
                {c.naacGrade ? <span className="rounded bg-white/10 px-2 py-0.5">NAAC {c.naacGrade}</span> : null}
                {latestRank ? (
                  <span className="rounded bg-brand px-2 py-0.5 font-bold text-ink">
                    {latestRank.agency} {latestRank.year} {latestRank.category} {latestRank.rank ? `#${latestRank.rank}` : latestRank.rankBand}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
              <a href="#apply" className="rounded-lg bg-brand px-5 py-2.5 text-center font-bold text-ink hover:bg-brand-hover">Get admission help</a>
              {c.website ? (
                <a href={c.website} target="_blank" rel="noopener" className="flex items-center justify-center gap-1.5 rounded-lg border border-white/30 px-5 py-2.5 font-bold hover:bg-white/10">
                  Official website <ExternalLink size={15} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="College sections" className="sticky top-[100px] z-30 border-b border-rule bg-paper">
        <ul className="scroll-row mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map((t) => (
            <li key={t.id}>
              <a href={`#${t.id}`} className="block whitespace-nowrap border-b-[3px] border-transparent px-3 py-3 text-[0.95rem] font-bold text-ink-soft hover:border-brand hover:text-ink">
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section id="overview" className="card scroll-mt-40 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Highlights</h2>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {[
                  { icon: Building, k: "Ownership", v: c.ownership ? OWNERSHIP_LABELS[c.ownership] ?? c.ownership : null },
                  { icon: CalendarDays, k: "Established", v: c.establishedYear },
                  { icon: GraduationCap, k: "Affiliated to", v: c.affiliatingUniversity },
                  { icon: ShieldCheck, k: "Approved by", v: c.approvals.length ? c.approvals.join(", ") : null },
                  { icon: Award, k: "NAAC grade", v: c.naacGrade },
                  { icon: MapPin, k: "Location", v: place || null },
                ].map((r) => (
                  <div key={r.k} className="flex gap-3 border-b border-rule py-3">
                    <r.icon size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <dt className="w-32 shrink-0 text-muted">{r.k}</dt>
                    <dd className="font-bold"><Value v={r.v} /></dd>
                  </div>
                ))}
              </dl>
              {c.streams.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.streams.map((s) => (
                    <Link key={s.slug} href={`/colleges?stream=${s.slug}`} className="rounded-full bg-band px-3 py-1 text-[0.88rem] hover:bg-rule">
                      {s.name}
                    </Link>
                  ))}
                </div>
              ) : null}
              <div className="mt-4"><Stamp s={c.source} /></div>
            </section>

            <section id="courses" className="card scroll-mt-40 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Courses and fees</h2>
              {c.offerings.length ? (
                <div className="mt-4 space-y-4">
                  {c.offerings.map((o) => (
                    <div key={o.id} className="rounded-xl border border-rule p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold">
                            <Link href={`/course/${o.courseSlug}`} className="hover:text-brand-hover">{o.courseShort}</Link>
                          </h3>
                          <p className="text-[0.9rem] text-muted">{o.courseName}</p>
                        </div>
                        <span className="rounded bg-band px-2 py-0.5 text-[0.8rem] font-bold">{LEVEL_LABEL[o.level] ?? o.level}</span>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-[0.92rem] sm:grid-cols-3">
                        <div><dt className="text-muted">Duration</dt><dd className="font-bold"><Value v={o.duration} /></dd></div>
                        <div><dt className="text-muted">Seats{o.academicYear ? ` (${o.academicYear})` : ""}</dt><dd className="tabular font-bold"><Value v={o.seats} /></dd></div>
                      </dl>
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[420px] text-left text-[0.92rem]">
                          <thead><tr className="text-muted"><th className="py-1.5 font-normal">Quota</th><th className="py-1.5 font-normal">Fee</th><th className="py-1.5 font-normal">Basis</th></tr></thead>
                          <tbody>
                            {o.fees.length ? (
                              o.fees.map((f, i) => (
                                <tr key={i} className="border-t border-rule">
                                  <td className="py-2">{f.quota ?? "All"}{f.component !== "tuition" ? ` (${f.component})` : ""}</td>
                                  <td className="tabular py-2 font-bold">{formatInr(f.amount) ?? <span className="italic text-muted font-normal">Not recorded</span>}</td>
                                  <td className="py-2">{f.basis ? FEE_BASIS_LABELS[f.basis] : <span className="italic text-muted">Not recorded</span>}</td>
                                </tr>
                              ))
                            ) : (
                              <tr className="border-t border-rule"><td className="py-2" colSpan={3}><span className="italic text-muted">Fees not recorded yet</span></td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {o.seatsSource ? <div className="mt-3"><Stamp s={o.seatsSource} /></div> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-ink-soft">
                  Course-wise seats and fees for this college are being added from official sources. Ask a counsellor for the current fee structure.
                </p>
              )}
            </section>

            <section id="rankings" className="card scroll-mt-40 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Rankings</h2>
              {c.rankings.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-[0.95rem]">
                    <thead><tr className="text-[0.85rem] text-muted"><th className="py-2 font-normal">Ranking</th><th className="py-2 font-normal">Year</th><th className="py-2 font-normal">Category</th><th className="py-2 text-right font-normal">Rank</th><th className="py-2 text-right font-normal">Score</th></tr></thead>
                    <tbody>
                      {c.rankings.map((r, i) => (
                        <tr key={i} className="border-t border-rule">
                          <td className="py-2.5 font-bold">{r.agency}</td>
                          <td className="tabular py-2.5">{r.year}</td>
                          <td className="py-2.5">{r.category}</td>
                          <td className="tabular py-2.5 text-right font-bold">{r.rank ?? r.rankBand}</td>
                          <td className="tabular py-2.5 text-right"><Value v={r.score} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3"><Stamp s={c.rankings[0].source} /></div>
                </div>
              ) : (
                <p className="mt-3 text-ink-soft">This college does not appear in the official NIRF rankings we have loaded.</p>
              )}
            </section>

            <section id="cutoffs" className="card scroll-mt-40 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Cutoffs</h2>
              {c.cutoffs.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[0.92rem]">
                    <thead><tr className="text-muted"><th className="py-2 font-normal">Course</th><th className="py-2 font-normal">Exam</th><th className="py-2 font-normal">Year, round</th><th className="py-2 font-normal">Quota, category</th><th className="py-2 text-right font-normal">Opening</th><th className="py-2 text-right font-normal">Closing</th></tr></thead>
                    <tbody>
                      {c.cutoffs.map((x, i) => (
                        <tr key={i} className="border-t border-rule">
                          <td className="py-2">{c.offerings.find((o) => o.id === x.offeringId)?.courseShort}</td>
                          <td className="py-2">{x.exam}</td>
                          <td className="py-2">{x.year}{x.round ? `, ${x.round}` : ""}</td>
                          <td className="py-2">{[x.quota, x.category].filter(Boolean).join(", ")}</td>
                          <td className="tabular py-2 text-right"><Value v={x.openingRank} /></td>
                          <td className="tabular py-2 text-right font-bold"><Value v={x.closingRank} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3"><Stamp s={c.cutoffs[0].source} /></div>
                </div>
              ) : (
                <p className="mt-3 text-ink-soft">Official closing ranks for this college are not loaded yet.</p>
              )}
            </section>

            <section id="admission" className="card scroll-mt-40 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Admission</h2>
              <p className="mt-3 text-ink-soft">
                Admission depends on the course and quota: most seats are filled through the national or state counselling for the relevant entrance exam, and the rest by the college under the rules its state sets. A counsellor can tell you which route applies to you.
              </p>
              <a href="#apply" className="mt-4 inline-block rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-ink-2">Ask about admission</a>
            </section>

            <section id="contact" className="card scroll-mt-40 p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Contact and location</h2>
              <dl className="mt-4 space-y-3">
                <div className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" /><dt className="sr-only">Address</dt><dd><Value v={[c.address, c.city, c.state, c.pin].filter(Boolean).join(", ") || null} /></dd></div>
                <div className="flex gap-3"><Globe size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" /><dt className="sr-only">Website</dt><dd>{c.website ? <a href={c.website} target="_blank" rel="noopener" className="font-bold underline">{c.website.replace(/^https?:\/\//, "")}</a> : <Value v={null} />}</dd></div>
                <div className="flex gap-3"><Phone size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" /><dt className="sr-only">Phone</dt><dd><Value v={c.phone} /></dd></div>
                <div className="flex gap-3"><Mail size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" /><dt className="sr-only">Email</dt><dd><Value v={c.email} /></dd></div>
              </dl>
            </section>
          </div>

          <aside className="space-y-6">
            <div id="apply" className="card scroll-mt-40 p-5 lg:sticky lg:top-[160px]">
              <h2 className="text-xl font-bold">Interested in this college?</h2>
              <p className="mb-4 mt-1 text-[0.92rem] text-muted">A counsellor will call you about admission here, free.</p>
              <CounsellingForm courses={options.courses} states={options.states} />
            </div>
            {similar.length ? (
              <div className="card p-5">
                <h2 className="text-lg font-bold">Similar colleges</h2>
                <ul className="mt-3 divide-y divide-rule">
                  {similar.map((s) => (
                    <li key={s.slug} className="py-2.5">
                      <Link href={`/college/${s.slug}`} className="font-bold leading-snug hover:text-brand-hover">{s.name}</Link>
                      <p className="text-[0.85rem] text-muted">{[s.city, s.state].filter(Boolean).join(", ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}
