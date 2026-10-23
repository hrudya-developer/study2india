import type { Metadata } from "next";
import Link from "next/link";
import { searchEverything } from "@/lib/queries/catalog";
import { PageHero } from "@/components/page-hero";
import { one, type SearchParams } from "@/lib/params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = one((await searchParams).q) ?? "";
  const res = q.length >= 2 ? await searchEverything(q) : { colleges: [], courses: [], exams: [] };
  const total = res.colleges.length + res.courses.length + res.exams.length;

  return (
    <>
      <PageHero crumbs={[{ label: "Search" }]} title={q ? `Results for "${q}"` : "Search"}>
        <form action="/search" method="get" role="search" className="mt-6 flex max-w-2xl gap-2">
          <label htmlFor="s-q" className="sr-only">Search colleges, courses and exams</label>
          <input id="s-q" name="q" type="search" defaultValue={q} placeholder="College, course or exam" className="min-w-0 flex-1 rounded-lg border-0 px-4 py-3 text-ink" />
          <button type="submit" className="rounded-lg bg-brand px-5 py-3 font-bold text-ink hover:bg-brand-hover">Search</button>
        </form>
      </PageHero>
      <div className="bg-band">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
          {q.length < 2 ? (
            <p className="text-ink-soft">Type at least two letters.</p>
          ) : total === 0 ? (
            <div className="card p-8">
              <h2 className="text-2xl font-bold">Nothing matched &quot;{q}&quot;</h2>
              <p className="mt-2 text-ink-soft">Check the spelling, try a shorter word, or browse <Link href="/colleges" className="font-bold underline">all colleges</Link>. We are still adding colleges from official lists.</p>
            </div>
          ) : (
            <>
              {res.colleges.length ? (
                <section className="card p-5 sm:p-6">
                  <h2 className="text-xl font-bold">Colleges ({res.colleges.length})</h2>
                  <ul className="mt-3 divide-y divide-rule">
                    {res.colleges.map((c) => (
                      <li key={c.slug} className="py-2.5">
                        <Link href={`/college/${c.slug}`} className="font-bold hover:text-brand-hover">{c.name}</Link>
                        <span className="block text-[0.9rem] text-muted">{[c.city, c.state].filter(Boolean).join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {res.courses.length ? (
                <section className="card p-5 sm:p-6">
                  <h2 className="text-xl font-bold">Courses ({res.courses.length})</h2>
                  <ul className="mt-3 divide-y divide-rule">
                    {res.courses.map((c) => (
                      <li key={c.slug} className="py-2.5">
                        <Link href={`/course/${c.slug}`} className="font-bold hover:text-brand-hover">{c.short_name}</Link>
                        <span className="block text-[0.9rem] text-muted">{c.name}, {c.stream}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {res.exams.length ? (
                <section className="card p-5 sm:p-6">
                  <h2 className="text-xl font-bold">Exams ({res.exams.length})</h2>
                  <ul className="mt-3 divide-y divide-rule">
                    {res.exams.map((e) => (
                      <li key={e.slug} className="py-2.5">
                        <Link href={`/exam/${e.slug}`} className="font-bold hover:text-brand-hover">{e.short_name}</Link>
                        <span className="block text-[0.9rem] text-muted">{e.name}, {e.conducting_body}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
