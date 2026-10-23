import type { Metadata } from "next";
import Link from "next/link";
import { getCollegeFacets, getCourseContext, searchColleges, OWNERSHIP_LABELS, type CollegeFilters } from "@/lib/queries/colleges";
import { getStreams } from "@/lib/queries/home";
import { CollegeCard } from "@/components/college-card";
import { one, pageNumber, qs, type SearchParams } from "@/lib/params";

type Props = { searchParams: SearchParams };

async function readFilters(searchParams: SearchParams): Promise<CollegeFilters> {
  const p = await searchParams;
  const sort = one(p.sort);
  return {
    stream: one(p.stream),
    course: one(p.course),
    state: one(p.state),
    ownership: one(p.ownership),
    ranked: one(p.ranked) === "1",
    q: one(p.q),
    sort: sort === "rank" || sort === "name" ? sort : "relevance",
    page: pageNumber(p.page),
  };
}

async function describe(f: CollegeFilters) {
  const facets = await getCollegeFacets();
  const course = f.course ? await getCourseContext(f.course) : null;
  const stream = facets.streams.find((s) => s.value === f.stream);
  const state = facets.states.find((s) => s.value === f.state);
  const what = course ? `${course.short} colleges` : stream ? `${stream.label} colleges` : "Colleges";
  const where = state ? `in ${state.label}` : "in India";
  return { title: `${what} ${where}`, facets, course, stream, state };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = await readFilters(searchParams);
  const { title } = await describe(f);
  const filtered = !!(f.ownership || f.ranked || f.q || (f.page && f.page > 1) || f.sort !== "relevance");
  return {
    title,
    description: `${title}: rankings, approvals, fees and seats from official sources, with free admission counselling.`,
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

const selectClass = "w-full rounded-lg border border-rule bg-paper px-3 py-2.5 focus:border-ink";

export default async function CollegesPage({ searchParams }: Props) {
  const f = await readFilters(searchParams);
  const [{ title, facets, course, state }, streams] = await Promise.all([describe(f), getStreams()]);
  const result = await searchColleges(f, course);
  const base = { stream: f.stream, course: f.course, state: f.state, ownership: f.ownership, ranked: f.ranked, q: f.q };
  const activeCount = Object.values(base).filter(Boolean).length;

  const filtersForm = (
    <form action="/colleges" method="get" className="space-y-5">
      <div>
        <label htmlFor="f-q" className="mb-1 block font-bold">
          Name or city
        </label>
        <input id="f-q" name="q" type="search" defaultValue={f.q} className={selectClass} />
      </div>
      <div>
        <label htmlFor="f-stream" className="mb-1 block font-bold">
          Field of study
        </label>
        <select id="f-stream" name="stream" defaultValue={f.stream ?? ""} className={selectClass}>
          <option value="">All fields</option>
          {facets.streams.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
              {s.count ? ` (${s.count})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-course" className="mb-1 block font-bold">
          Course
        </label>
        <select id="f-course" name="course" defaultValue={f.course ?? ""} className={selectClass}>
          <option value="">Any course</option>
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
      </div>
      <div>
        <label htmlFor="f-state" className="mb-1 block font-bold">
          State
        </label>
        <select id="f-state" name="state" defaultValue={f.state ?? ""} className={selectClass}>
          <option value="">All states</option>
          {facets.states.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
              {s.count ? ` (${s.count})` : ""}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="mb-1 font-bold">Ownership</legend>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <input type="radio" name="ownership" value="" defaultChecked={!f.ownership} className="accent-[#0d0f36]" /> Any
          </label>
          {facets.ownership.map((o) => (
            <label key={o.value} className="flex items-center gap-2">
              <input type="radio" name="ownership" value={o.value} defaultChecked={f.ownership === o.value} className="accent-[#0d0f36]" />
              {o.label}
              {o.count ? <span className="tabular text-muted">({o.count})</span> : null}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="ranked" value="1" defaultChecked={f.ranked} className="size-4 accent-[#0d0f36]" />
        Only NIRF ranked
      </label>
      <input type="hidden" name="sort" value={f.sort === "relevance" ? "" : f.sort} />
      <div className="flex gap-3">
        <button type="submit" className="rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-[#1c1f55]">
          Apply filters
        </button>
        {activeCount ? (
          <Link href="/colleges" className="px-2 py-2.5 text-ink-soft underline underline-offset-4">
            Clear all
          </Link>
        ) : null}
      </div>
    </form>
  );

  const sortLink = (s: "relevance" | "rank" | "name", label: string) => (
    <Link
      href={`/colleges${qs({ ...base, sort: s === "relevance" ? undefined : s })}`}
      aria-current={f.sort === s ? "true" : undefined}
      className={f.sort === s ? "font-bold text-ink underline decoration-brand decoration-2 underline-offset-4" : "text-ink-soft hover:text-ink"}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-[0.92rem] text-muted">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        / Colleges
      </nav>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h1>
      <p className="tabular mt-3 text-ink-soft">
        {result.total.toLocaleString("en-IN")} {result.total === 1 ? "institution" : "institutions"} found
        {state ? ` in ${state.label}` : ""}
      </p>

      {result.courseFallback && course ? (
        <p role="note" className="mt-5 max-w-3xl rounded-lg border-l-4 border-brand bg-[#fff4e8] px-4 py-3">
          Course-level data for {course.short} is still being loaded from official sources, so this list shows institutions in the{" "}
          {course.streamName} field. Check the college page for whether it offers {course.short}.
        </p>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside aria-label="Filters">
          <details className="rounded-xl border border-rule p-4 lg:hidden" open={false}>
            <summary className="cursor-pointer font-bold">Filters{activeCount ? ` (${activeCount})` : ""}</summary>
            <div className="mt-4">{filtersForm}</div>
          </details>
          <div className="hidden lg:block">{filtersForm}</div>
        </aside>

        <section aria-label="Results">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-3 text-[0.95rem]">
            <span className="text-muted">Sort by</span>
            {sortLink("relevance", "Recommended")}
            {sortLink("rank", "Best NIRF rank")}
            {sortLink("name", "Name")}
          </div>

          {result.items.length ? (
            <>
              {result.items.map((c, i) => (
                <div key={c.id}>
                  <CollegeCard c={c} courseShort={course?.short} />
                  {i === 4 ? (
                    <div className="my-2 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-mist px-5 py-4">
                      <p>
                        <span className="font-bold">Not sure which of these fits your rank and budget?</span>{" "}
                        <span className="text-ink-soft">A counsellor can shortlist with you, free.</span>
                      </p>
                      <Link href="/counselling" className="rounded-lg bg-brand px-4 py-2 font-bold text-ink hover:bg-[#ff9a33]">
                        Talk to a counsellor
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
              {result.pageCount > 1 ? (
                <nav aria-label="Pages" className="mt-8 flex items-center justify-between border-t border-rule pt-6">
                  {result.page > 1 ? (
                    <Link href={`/colleges${qs({ ...base, sort: f.sort === "relevance" ? undefined : f.sort, page: result.page - 1 })}`} className="font-bold underline underline-offset-4">
                      Previous
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="tabular text-muted">
                    Page {result.page} of {result.pageCount}
                  </span>
                  {result.page < result.pageCount ? (
                    <Link href={`/colleges${qs({ ...base, sort: f.sort === "relevance" ? undefined : f.sort, page: result.page + 1 })}`} className="font-bold underline underline-offset-4">
                      Next
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="border-t border-rule py-10">
              <h2 className="text-2xl font-bold">No colleges listed here yet</h2>
              <p className="mt-2 max-w-[60ch] text-ink-soft">
                We add colleges only from official lists, field by field, so some searches are still empty.
                {activeCount ? " Try removing a filter, or" : ""} Ask a counsellor and we will check the options for you.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/counselling" className="rounded-lg bg-brand px-4 py-2.5 font-bold text-ink hover:bg-[#ff9a33]">
                  Talk to a counsellor
                </Link>
                {activeCount ? (
                  <Link href="/colleges" className="rounded-lg border-2 border-ink px-4 py-2 font-bold hover:bg-mist">
                    Clear filters
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export { OWNERSHIP_LABELS };
