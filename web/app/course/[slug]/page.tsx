import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, GraduationCap, Target, Building2, ExternalLink } from "lucide-react";
import { getCourse } from "@/lib/queries/catalog";
import { getSearchOptions } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";
import { CounsellingForm } from "@/components/counselling-form";
import { POPULAR_STATES } from "@/components/site-header";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const LEVEL_LABEL: Record<string, string> = { ug: "Undergraduate", pg: "Postgraduate", diploma: "Diploma", doctorate: "Doctorate", certificate: "Certificate", integrated: "Integrated" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCourse((await params).slug);
  if (!c) return { title: "Course not found" };
  return {
    title: `${c.short}: duration, entrance exams and colleges`,
    description: `${c.name} (${c.short}): course duration, entrance exams and colleges offering it in India.`,
    alternates: { canonical: `/course/${c.slug}` },
  };
}

export default async function CoursePage({ params }: Props) {
  const c = await getCourse((await params).slug);
  if (!c) notFound();
  const options = await getSearchOptions();

  const facts = [
    { icon: GraduationCap, k: "Level", v: LEVEL_LABEL[c.level] ?? c.level },
    { icon: Clock, k: "Duration", v: c.duration },
    { icon: Target, k: "Entrance exams", v: c.exams.length ? c.exams.map((e) => e.short).join(", ") : null },
    c.offeredBy
      ? { icon: Building2, k: `Colleges offering ${c.short}`, v: c.offeredBy.toLocaleString("en-IN") }
      : { icon: Building2, k: `${c.streamName} colleges listed`, v: c.institutions ? c.institutions.toLocaleString("en-IN") : null },
  ];

  return (
    <>
      <PageHero crumbs={[{ href: "/courses", label: "Courses" }, { href: `/courses#${c.streamSlug}`, label: c.streamName }, { label: c.short }]} title={c.short} intro={c.name}>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/colleges?course=${c.slug}`} className="rounded-lg bg-brand px-5 py-2.5 font-bold text-ink hover:bg-brand-hover">
            {c.short} colleges
          </Link>
          <a href="#apply" className="rounded-lg border border-white/30 px-5 py-2.5 font-bold hover:bg-white/10">
            Get counselling
          </a>
        </div>
      </PageHero>

      <div className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section className="card p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Course at a glance</h2>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {facts.map((f) => (
                  <div key={f.k} className="flex gap-3 border-b border-rule py-3">
                    <f.icon size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <dt className="w-36 shrink-0 text-muted">{f.k}</dt>
                    <dd className="font-bold">{f.v ?? <span className="font-normal italic text-muted">Not recorded</span>}</dd>
                  </div>
                ))}
              </dl>
              {c.eligibility ? (
                <div className="mt-5">
                  <h3 className="text-lg font-bold">Eligibility</h3>
                  <p className="mt-1 text-ink-soft">{c.eligibility}</p>
                </div>
              ) : null}
            </section>

            {c.exams.length ? (
              <section className="card p-5 sm:p-6">
                <h2 className="text-2xl font-bold">Entrance exams for {c.short}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {c.exams.map((e) => (
                    <li key={e.slug} className="rounded-xl border border-rule p-4">
                      <Link href={`/exam/${e.slug}`} className="text-lg font-bold hover:text-brand-hover">
                        {e.short}
                      </Link>
                      <p className="text-[0.9rem] text-muted">{e.body}</p>
                      {e.url ? (
                        <a href={e.url} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-[0.9rem] text-ink-soft hover:text-ink">
                          Official site <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[0.9rem] text-muted">Which exam applies depends on the college and the quota. A counsellor can check this for your case.</p>
              </section>
            ) : null}

            <section className="card p-5 sm:p-6">
              <h2 className="text-2xl font-bold">{c.short} colleges by state</h2>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {POPULAR_STATES.map((s) => (
                  <li key={s}>
                    <Link href={`/colleges?course=${c.slug}&state=${slugify(s)}`} className="block rounded-lg border border-rule px-3 py-2 text-[0.92rem] hover:border-brand hover:bg-brand-soft">
                      {c.short} in {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {c.related.length ? (
              <section className="card p-5 sm:p-6">
                <h2 className="text-2xl font-bold">Other {c.streamName.toLowerCase()} courses</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.related.map((r) => (
                    <Link key={r.slug} href={`/course/${r.slug}`} className="rounded-full border border-rule px-3 py-1.5 hover:border-brand hover:bg-brand-soft">
                      {r.short}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside>
            <div id="apply" className="card scroll-mt-32 p-5 lg:sticky lg:top-[120px]">
              <h2 className="text-xl font-bold">Planning to study {c.short}?</h2>
              <p className="mb-4 mt-1 text-[0.92rem] text-muted">A counsellor will help you shortlist colleges, free.</p>
              <CounsellingForm courses={options.courses} states={options.states} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
