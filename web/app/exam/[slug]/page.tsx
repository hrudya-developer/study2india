import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getExam } from "@/lib/queries/catalog";
import { getSearchOptions } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";
import { CounsellingForm } from "@/components/counselling-form";
import { SourceStamp } from "@/components/source-stamp";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const STATUS_LABEL: Record<string, string> = { announced: "Announced", tentative: "Tentative", not_announced: "Not announced" };

function formatDate(d: string | null) {
  return d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;
}

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

            <section className="card p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Important dates</h2>
              {e.dates.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-[0.95rem]">
                    <thead>
                      <tr className="text-[0.85rem] text-muted">
                        <th className="py-2 font-normal">Event</th>
                        <th className="py-2 font-normal">Date</th>
                        <th className="py-2 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.dates.map((d, i) => (
                        <tr key={i} className="border-t border-rule">
                          <td className="py-2.5">
                            {d.event} <span className="text-muted">({d.cycle})</span>
                          </td>
                          <td className="tabular py-2.5 font-bold">
                            {formatDate(d.startsOn) ? `${formatDate(d.startsOn)}${d.endsOn ? ` to ${formatDate(d.endsOn)}` : ""}` : <span className="font-normal italic text-muted">Not recorded</span>}
                          </td>
                          <td className="py-2.5">{STATUS_LABEL[d.status] ?? d.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {e.dates[0].sourceTitle && e.dates[0].retrievedOn ? (
                    <div className="mt-3">
                      <SourceStamp publisher={e.dates[0].sourceTitle} url={e.dates[0].sourceUrl} checked={e.dates[0].retrievedOn} />
                    </div>
                  ) : null}
                </div>
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
