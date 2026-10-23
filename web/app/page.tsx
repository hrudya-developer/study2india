import Link from "next/link";
import { getHomeCounts, getStreams, getTopRankings, getStateCounts, getExams, getSearchOptions } from "@/lib/queries/home";
import { CounsellingForm } from "@/components/counselling-form";
import { RankingTabs } from "@/components/ranking-tabs";
import { CONTACT } from "@/data/reference";

export const dynamic = "force-dynamic";

function formatCount(n: number) {
  return n.toLocaleString("en-IN");
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function HomePage() {
  const [counts, streams, rankingLists, stateCounts, exams, options] = await Promise.all([
    getHomeCounts(),
    getStreams(),
    getTopRankings(10),
    getStateCounts(),
    getExams(),
    getSearchOptions(),
  ]);

  const ledger = [
    { value: counts.institutions, label: "institutions" },
    { value: counts.rankingEntries, label: "official ranking entries" },
    { value: streams.length, label: "fields of study" },
    { value: counts.courses, label: "courses" },
    { value: counts.exams, label: "entrance exams" },
  ].filter((x) => x.value > 0);

  const maxState = stateCounts[0]?.institutions ?? 0;

  return (
    <>
      {/* Hero: the search is a sentence the student completes. */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)] lg:pt-16">
          <div className="min-w-0">
            <h1 className="max-w-[16ch] text-[2.6rem] font-extrabold sm:text-6xl">Find your college in India.</h1>
            <p className="mt-4 max-w-[52ch] text-lg text-ink-soft">
              Colleges, courses, rankings and entrance exams for every field, with the source shown beside each figure.
            </p>

            <form action="/colleges" method="get" className="mt-10">
              <p className="font-[family-name:var(--font-display)] text-[1.85rem] font-bold leading-[1.5] sm:text-[2.6rem]">
                <span>I want to study </span>
                <label htmlFor="q-course" className="sr-only">
                  Course
                </label>
                <select id="q-course" name="course" className="sentence-select" defaultValue="mbbs">
                  <option value="">any course</option>
                  {streams.map((s) => (
                    <optgroup key={s.slug} label={s.name}>
                      {s.courses.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.short}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span> in </span>
                <label htmlFor="q-state" className="sr-only">
                  State
                </label>
                <select id="q-state" name="state" className="sentence-select" defaultValue="">
                  <option value="">any state</option>
                  {options.states.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </p>
              <button type="submit" className="mt-6 rounded-lg bg-ink px-6 py-3.5 text-lg font-bold text-white hover:bg-[#1c1f55]">
                Show colleges
              </button>
            </form>

            <form action="/search" method="get" role="search" className="mt-8 max-w-xl">
              <label htmlFor="q-name" className="text-[0.95rem] text-ink-soft">
                Know the college already? Search by name
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="q-name"
                  name="q"
                  type="search"
                  placeholder="For example, Government Medical College Thrissur"
                  className="min-w-0 flex-1 rounded-lg border border-rule px-3 py-2.5 placeholder:text-[#9a9db0] focus:border-ink"
                />
                <button type="submit" className="rounded-lg border-2 border-ink px-4 py-2 font-bold hover:bg-mist">
                  Search
                </button>
              </div>
            </form>

            {ledger.length ? (
              <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-rule pt-6">
                {ledger.map((x) => (
                  <div key={x.label}>
                    <dt className="sr-only">{x.label}</dt>
                    <dd className="text-ink-soft">
                      <span className="tabular font-[family-name:var(--font-display)] text-2xl font-bold text-ink">{formatCount(x.value)}</span> {x.label}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <aside id="counsel" aria-labelledby="counsel-title" className="self-start rounded-2xl bg-mist p-6 sm:p-8">
            <h2 id="counsel-title" className="text-[1.7rem] font-bold">
              Talk to a counsellor
            </h2>
            <p className="mb-6 mt-2 text-ink-soft">Free. Someone from our Kerala team calls you back to help shortlist colleges.</p>
            <CounsellingForm courses={options.courses} states={options.states} />
            <p className="mt-5 text-[0.95rem] text-ink-soft">
              Or call{" "}
              <a href={CONTACT.phoneHref} className="tabular font-bold text-ink">
                {CONTACT.phone}
              </a>{" "}
              or{" "}
              <a href={CONTACT.whatsappHref} className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-2" rel="noopener">
                message on WhatsApp
              </a>
            </p>
          </aside>
        </div>
      </section>

      {/* Fields of study: an index, not a card grid. */}
      <section aria-labelledby="fields-title" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <h2 id="fields-title" className="text-4xl font-bold">
          Choose a field
        </h2>
        <p className="mt-3 max-w-[60ch] text-ink-soft">Every field from day one. Pick one to see its colleges, or jump straight to a course.</p>
        <ul className="mt-10 grid grid-cols-2 gap-x-6 sm:gap-x-10 lg:grid-cols-4">
          {streams.map((s) => (
            <li key={s.slug} className="border-t border-rule py-5">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/colleges?stream=${s.slug}`} className="font-[family-name:var(--font-display)] text-xl font-bold hover:text-brand-deep">
                  {s.name}
                </Link>
                {s.institutions > 0 ? (
                  <span className="tabular shrink-0 text-[0.9rem] text-muted">{formatCount(s.institutions)} listed</span>
                ) : null}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.95rem]">
                {s.courses.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/course/${c.slug}`} className="text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-brand">
                      {c.short}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {rankingLists.length ? (
        <section aria-labelledby="rank-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 id="rank-title" className="text-4xl font-bold">
                Top ranked, by the government&apos;s own list
              </h2>
              <p className="mt-4 max-w-[46ch] text-ink-soft">
                The National Institutional Ranking Framework is published every year by the Ministry of Education. We show it as published, and never place partner colleges above it.
              </p>
            </div>
            <RankingTabs lists={rankingLists} />
          </div>
        </section>
      ) : null}

      {stateCounts.length ? (
        <section aria-labelledby="states-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
          <h2 id="states-title" className="text-4xl font-bold">
            Colleges by state
          </h2>
          <ul className="mt-8 grid gap-x-10 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {stateCounts.map((s) => (
              <li key={s.slug}>
                <Link href={`/colleges?state=${s.slug}`} className="group grid grid-cols-[1fr_auto] items-center gap-x-3 py-2">
                  <span className="group-hover:underline">{s.name}</span>
                  <span className="tabular text-[0.92rem] text-muted">{formatCount(s.institutions)}</span>
                  <span aria-hidden="true" className="col-span-2 mt-1 h-1.5 rounded-full bg-mist">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.max(4, (s.institutions / maxState) * 100)}%` }} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="exams-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="exams-title" className="text-4xl font-bold">
            Entrance exams
          </h2>
          <Link href="/exams" className="font-bold underline decoration-brand decoration-2 underline-offset-4">
            All exams
          </Link>
        </div>
        <p className="mt-3 max-w-[62ch] text-ink-soft">
          Dates appear here only once the conducting body announces them. Until then, check the official site linked against each exam.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="text-[0.85rem] text-muted">
                <th scope="col" className="py-2 pr-4 font-normal">Exam</th>
                <th scope="col" className="py-2 pr-4 font-normal">Conducted by</th>
                <th scope="col" className="py-2 pr-4 font-normal">Leads to</th>
                <th scope="col" className="py-2 font-normal">Official site</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.slug} className="border-t border-rule align-top">
                  <td className="py-3.5 pr-4">
                    <Link href={`/exam/${e.slug}`} className="font-bold hover:underline">
                      {e.short}
                    </Link>
                    <span className="block text-[0.9rem] text-muted">{e.level === "State" ? "State level" : "National level"}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-soft">{e.body}</td>
                  <td className="py-3.5 pr-4 text-ink-soft">{e.streams.join(", ")}</td>
                  <td className="py-3.5">
                    {e.url ? (
                      <a href={e.url} rel="noopener" target="_blank" className="underline decoration-rule underline-offset-4 hover:decoration-brand">
                        {hostOf(e.url)}
                      </a>
                    ) : (
                      <span className="text-muted">Changes each year</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="trust-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="grid gap-10 rounded-2xl border border-rule p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 id="trust-title" className="text-4xl font-bold">
              How we check what you read here
            </h2>
            <p className="mt-4 text-ink-soft">
              Fees, seats and cutoffs decide where a student can afford to study, so we treat every figure as something a parent will act on.
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            <li>
              <h3 className="text-xl font-bold">Every figure names its source</h3>
              <p className="mt-1 text-ink-soft">
                Rankings, seat counts, fees and cutoffs come from the bodies that publish them: NIRF, the National Medical Commission, the councils and the counselling authorities.
              </p>
            </li>
            <li>
              <h3 className="text-xl font-bold">If we don&apos;t know, we say so</h3>
              <p className="mt-1 text-ink-soft">
                A figure we have not verified shows as <span className="font-bold text-ink">Not recorded</span>. Fees are shown exactly as published, per year or for the whole course, never converted.
              </p>
            </li>
            <li>
              <h3 className="text-xl font-bold">Partners are labelled</h3>
              <p className="mt-1 text-ink-soft">Colleges we work with carry a clear partner label. It never changes their place in a ranking or a search result.</p>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
