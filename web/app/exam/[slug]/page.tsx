import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getExam } from "@/lib/queries/catalog";
import { getSearchOptions } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";
import { CounsellingForm } from "@/components/counselling-form";
import { EXAM_COUNSELLING } from "@/data/exam-dates";
import { formatDate, formatRange, phaseOf, PHASE_LABEL, todayInIndia } from "@/lib/exam-timeline";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getExam((await params).slug);
  if (!e) return { title: "Exam not found" };
  return {
    title: `${e.short}: conducting body, dates, courses and colleges`,
    description: `${e.name} (${e.short}) conducted by ${e.body}. Official dates, the courses it leads to, and free counselling.`,
    alternates: { canonical: `/exam/${e.slug}` },
  };
}

export default async function ExamPage({ params }: Props) {
  const e = await getExam((await params).slug);
  if (!e) notFound();
  const options = await getSearchOptions();
  const today = todayInIndia();
  const dated = e.dates.filter((d) => d.startsOn);
  // Latest cycle first; within a cycle, in date order.
  const cycles = [...new Set(dated.map((d) => d.cycle))]
    .sort((a, b) => b.localeCompare(a))
    .map((c) => [c, dated.filter((d) => d.cycle === c).sort((a, b) => a.startsOn!.localeCompare(b.startsOn!))] as const);
  const next = dated
    .filter((d) => phaseOf(d.startsOn!, d.endsOn, today) !== "past")
    .sort((a, b) => a.startsOn!.localeCompare(b.startsOn!))[0];
  const checked = dated.map((d) => d.retrievedOn).filter((d): d is string => !!d).sort().at(-1) ?? null;
  const counselling = EXAM_COUNSELLING.filter((c) => c.exam === e.slug).sort((a, b) => b.cycle.localeCompare(a.cycle))[0];

  return (
    <>
      <PageHero crumbs={[{ href: "/exams", label: "Exams" }, { label: e.short }]} title={e.short} intro={e.name}>
        <div className="mt-6 flex flex-wrap gap-3">
          {e.url ? (
            <a href={e.url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 font-bold text-ink hover:bg-brand-hover">
              Official site <ExternalLink size={16} aria-hidden="true" />
            </a>
          ) : null}
          <a href="#apply" className="rounded-lg border border-white/30 px-5 py-2.5 font-bold hover:bg-white/10">
            Get counselling
          </a>
        </div>
      </PageHero>

      <div className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section className="card p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Highlights</h2>
              <dl className="mt-4">
                {[
                  { k: "Full name", v: e.name },
                  { k: "Conducted by", v: e.body },
                  { k: "Level", v: e.level === "State" ? "State level" : "National level" },
                  { k: "Leads to", v: e.streams.join(", ") },
                ].map((r) => (
                  <div key={r.k} className="flex gap-4 border-b border-rule py-3">
                    <dt className="w-36 shrink-0 text-muted">{r.k}</dt>
                    <dd className="font-bold">{r.v}</dd>
                  </div>
                ))}
                <div className="flex gap-4 border-b border-rule py-3">
                  <dt className="w-36 shrink-0 text-muted">Counselling</dt>
                  <dd className="font-bold">
                    {counselling ? (
                      counselling.url ? (
                        <a href={counselling.url} target="_blank" rel="noopener" className="underline">
                          {counselling.body}
                        </a>
                      ) : (
                        counselling.body
                      )
                    ) : (
                      <span className="font-normal italic text-muted">Not recorded</span>
                    )}
                  </dd>
                </div>
                <div className="flex gap-4 py-3">
                  <dt className="w-36 shrink-0 text-muted">Official site</dt>
                  <dd className="font-bold">
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noopener" className="underline">
                        {e.url.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="font-normal italic text-muted">Changes each year</span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="card p-5 sm:p-6" aria-labelledby="dates-heading">
              <h2 id="dates-heading" className="text-2xl font-bold">
                Important dates
              </h2>
              {cycles.length ? (
                <>
                  {next ? (
                    <p className="mt-3 rounded-lg bg-brand-soft px-4 py-3 text-[0.95rem]">
                      <span className="font-bold">Next:</span> {next.event}, <span className="tabular font-bold">{formatRange(next.startsOn!, next.endsOn)}</span>
                      {next.status === "tentative" ? <span className="text-muted"> (tentative)</span> : null}
                    </p>
                  ) : (
                    <p className="mt-3 text-[0.95rem] text-ink-soft">
                      Every date we have recorded for {e.short} has passed. The next cycle&apos;s dates will appear here once {e.body} announces them.
                    </p>
                  )}
                  {cycles.map(([cycle, list]) => (
                    <div key={cycle} className="mt-6">
                      <h3 className="text-lg font-bold">
                        {e.short} {cycle}
                      </h3>
                      <ol className="mt-3 border-l-2 border-rule">
                        {list.map((d, i) => {
                          const phase = phaseOf(d.startsOn!, d.endsOn, today);
                          const label = phase === "current" && !d.endsOn ? "Today" : PHASE_LABEL[phase];
                          return (
                            <li key={i} className="relative pb-4 pl-5 last:pb-0">
                              <span
                                aria-hidden="true"
                                className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 ${
                                  phase === "past" ? "border-rule bg-paper" : phase === "current" ? "border-verified bg-verified" : "border-brand bg-brand"
                                }`}
                              />
                              <div
                                className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg px-3 py-2 ${
                                  phase === "upcoming" ? "bg-brand-soft" : phase === "current" ? "bg-verified-bg" : ""
                                }`}
                              >
                                <span className={`min-w-0 flex-1 basis-56 ${phase === "past" ? "text-muted" : "font-bold"}`}>{d.event}</span>
                                <span className={`tabular whitespace-nowrap ${phase === "past" ? "text-muted line-through decoration-rule" : "font-bold"}`}>
                                  {formatRange(d.startsOn!, d.endsOn)}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[0.78rem] font-bold ${
                                    phase === "past" ? "bg-band text-muted" : phase === "current" ? "bg-verified text-white" : "bg-brand text-ink"
                                  }`}
                                >
                                  {label}
                                  {d.status === "tentative" ? ", tentative" : ""}
                                </span>
                                {d.sourceUrl ? (
                                  <a
                                    href={d.sourceUrl}
                                    target="_blank"
                                    rel="noopener"
                                    className="inline-flex items-center gap-1 whitespace-nowrap text-[0.85rem] text-muted underline underline-offset-2 hover:text-ink"
                                    title={d.sourceTitle ?? undefined}
                                  >
                                    Official notice <ExternalLink size={13} aria-hidden="true" />
                                  </a>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  ))}
                  {checked ? (
                    <p className="mt-5 text-[0.85rem] text-muted">
                      Every date above is taken from {e.body}&apos;s own notice or bulletin, linked beside it. Checked {formatDate(checked)}. The official site is always the final word.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-ink-soft">
                  {e.body} has not announced dates that we have recorded yet. Check the official site for the latest notice, or ask a counsellor to alert you.
                </p>
              )}
            </section>

            {e.courses.length ? (
              <section className="card p-5 sm:p-6">
                <h2 className="text-2xl font-bold">Courses through {e.short}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {e.courses.map((c) => (
                    <Link key={c.slug} href={`/course/${c.slug}`} className="rounded-full border border-rule px-3 py-1.5 hover:border-brand hover:bg-brand-soft">
                      {c.short}
                    </Link>
                  ))}
                </div>
                <p className="mt-3 text-[0.9rem] text-muted">Not every course in these fields uses {e.short}; it depends on the college and quota.</p>
              </section>
            ) : null}
          </div>

          <aside>
            <div id="apply" className="card scroll-mt-32 p-5 lg:sticky lg:top-[120px]">
              <h2 className="text-xl font-bold">Writing {e.short}?</h2>
              <p className="mb-4 mt-1 text-[0.92rem] text-muted">A counsellor can plan your college options around your rank, free.</p>
              <CounsellingForm courses={options.courses} states={options.states} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
