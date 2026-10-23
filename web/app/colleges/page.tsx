import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import {
  APPROVAL_BODIES,
  LEVEL_LABELS,
  OWNERSHIP_LABELS,
  PAGE_SIZE,
  SORTS,
  collegesHref,
  getCityFacets,
  getCollegeFacets,
  getCourseContext,
  readCollegeFilters,
  searchColleges,
  formatNumber,
  type CollegeFilters,
  type SortKey,
} from "@/lib/queries/colleges";
import { CollegeCard } from "@/components/college-card";
import { FilterForm } from "@/components/colleges/filter-form";
import { FilterSheet } from "@/components/colleges/filter-sheet";
import { Pagination } from "@/components/colleges/pagination";
import { ShortlistLink } from "@/components/colleges/shortlist-button";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function describe(f: CollegeFilters) {
  const [facets, course, cities] = await Promise.all([
    getCollegeFacets(),
    f.course ? getCourseContext(f.course) : Promise.resolve(null),
    f.state ? getCityFacets(f.state) : Promise.resolve([]),
  ]);
  const stream = facets.streams.find((s) => s.value === f.stream);
  const state = facets.states.find((s) => s.value === f.state);
  const city = f.city && cities.find((c) => c.value === f.city) ? f.city : undefined;
  const level = f.level ? LEVEL_LABELS[f.level] : undefined;
  const what = course ? `${course.short} colleges` : stream ? `${stream.label} colleges` : level ? `${level} colleges` : "Colleges";
  const where = state ? `in ${city ? `${city}, ` : ""}${state.label}` : "in India";
  return { title: `${what} ${where}`, facets, course, stream, state, city, cities };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = readCollegeFilters(await searchParams);
  const { title } = await describe(f);
  const filtered = !!(f.ownership.length || f.approval.length || f.level || f.city || f.ranked || f.q || f.page > 1 || f.sort !== "relevance");
  return {
    title,
    description: `${title}: approvals, seats and NIRF ranks from official lists (AICTE, NMC, INC, NCISM, NCH, NIRF), with free admission counselling.`,
    alternates: { canonical: collegesHref({ stream: f.stream, course: f.course, state: f.state }) },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CollegesPage({ searchParams }: Props) {
  const raw = readCollegeFilters(await searchParams);
  const { title, facets, course, state, city, cities } = await describe(raw);
  // Ignore a district that does not belong to the chosen state.
  const f: CollegeFilters = { ...raw, city };
  const result = await searchColleges(f, course);

  const without = (patch: Partial<CollegeFilters>) => collegesHref({ ...f, page: 1, ...patch });
  const chips: { label: string; href: string }[] = [];
  if (f.q) chips.push({ label: `"${f.q}"`, href: without({ q: undefined }) });
  if (f.stream) chips.push({ label: facets.streams.find((s) => s.value === f.stream)?.label ?? f.stream, href: without({ stream: undefined }) });
  if (f.course) chips.push({ label: course?.short ?? f.course, href: without({ course: undefined }) });
  if (f.level && LEVEL_LABELS[f.level]) chips.push({ label: LEVEL_LABELS[f.level], href: without({ level: undefined }) });
  if (f.state) chips.push({ label: state?.label ?? f.state, href: without({ state: undefined, city: undefined }) });
  if (f.city) chips.push({ label: f.city, href: without({ city: undefined }) });
  for (const o of f.ownership) chips.push({ label: OWNERSHIP_LABELS[o], href: without({ ownership: f.ownership.filter((x) => x !== o) }) });
  for (const a of f.approval) chips.push({ label: APPROVAL_BODIES[a].badge, href: without({ approval: f.approval.filter((x) => x !== a) }) });
  if (f.ranked) chips.push({ label: "NIRF ranked", href: without({ ranked: false }) });
  const clearAll = collegesHref({ sort: f.sort });

  const from = (result.page - 1) * PAGE_SIZE + 1;
  const to = from + result.items.length - 1;

  const formProps = { facets, cities, filters: f };
  const formKey = collegesHref(f);

  return (
    <div className="bg-band">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="text-[0.92rem] text-muted">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          /{" "}
          {state ? (
            <>
              <Link href="/colleges" className="hover:underline">
                Colleges
              </Link>{" "}
              / {state.label}
            </>
          ) : (
            "Colleges"
          )}
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="text-[2rem] font-extrabold leading-tight sm:text-5xl">{title}</h1>
          <ShortlistLink className="hidden items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 py-2 text-[0.92rem] font-bold hover:border-ink lg:inline-flex" />
        </div>
        <p className="mt-2 hidden max-w-3xl text-ink-soft sm:block">
          Approvals and seats from the regulators&apos; own lists, ranks from NIRF. No paid ratings, no made up figures: anything we have not verified says Not recorded.
        </p>

        {result.courseFallback && course ? (
          <p role="note" className="mt-5 max-w-3xl rounded-lg border-l-4 border-brand bg-[#fff4e8] px-4 py-3">
            Course-level data for {course.short} is still being loaded from official sources, so this list shows institutions in the {course.streamName} field.
            Check the college page for whether it offers {course.short}.
          </p>
        ) : null}

        <div className="mt-6 grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside aria-label="Filters" className="hidden lg:block">
            <div className="card sticky top-[116px] max-h-[calc(100dvh-132px)] overflow-y-auto p-5">
              <h2 className="mb-4 text-lg font-bold">Filter colleges</h2>
              <FilterForm key={formKey} {...formProps} idPrefix="d" autoApply />
            </div>
          </aside>

          <section aria-labelledby="results-heading" className="min-w-0">
            <h2 id="results-heading" className="sr-only">
              Results
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <FilterSheet key={formKey} {...formProps} activeCount={chips.length} />
              <ShortlistLink className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 py-2.5 text-[0.92rem] font-bold hover:border-ink sm:order-last lg:hidden" />
              <p className="tabular basis-full text-[0.95rem] text-ink-soft sm:basis-auto" aria-live="polite">
                {result.total ? (
                  <>
                    Showing <b className="text-ink">{formatNumber(from)}</b> to <b className="text-ink">{formatNumber(to)}</b> of{" "}
                    <b className="text-ink">{formatNumber(result.total)}</b> {result.total === 1 ? "college" : "colleges"}
                  </>
                ) : (
                  "No colleges found"
                )}
              </p>
            </div>

            {chips.length ? (
              <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Applied filters">
                {chips.map((c) => (
                  <li key={c.label + c.href}>
                    <Link
                      href={c.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-paper py-1 pl-3 pr-2 text-[0.88rem] font-bold hover:border-ink"
                      aria-label={`Remove filter: ${c.label}`}
                    >
                      {c.label}
                      <X size={14} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={clearAll} className="px-1 text-[0.88rem] font-bold text-ink-soft underline underline-offset-4 hover:text-ink">
                    Clear all
                  </Link>
                </li>
              </ul>
            ) : null}

            <div className="scroll-row -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Sort results">
              <span className="shrink-0 text-[0.9rem] text-muted">Sort</span>
              {(Object.keys(SORTS) as SortKey[]).map((s) => (
                <Link
                  key={s}
                  href={collegesHref({ ...f, sort: s, page: 1 })}
                  aria-current={f.sort === s ? "true" : undefined}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.88rem] font-bold ${
                    f.sort === s ? "border-ink bg-ink text-white" : "border-rule bg-paper text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {SORTS[s]}
                </Link>
              ))}
            </div>

            {result.items.length ? (
              <>
                <ol className="mt-4 space-y-4">
                  {result.items.map((c, i) => (
                    <li key={c.id} className="space-y-4">
                      <CollegeCard c={c} courseSlug={course && !result.courseFallback ? course.slug : undefined} courseShort={course?.short} />
                      {i === 4 && result.items.length > 6 ? (
                        <aside
                          aria-label="Free counselling"
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand/40 bg-brand-soft px-5 py-4"
                        >
                          <p>
                            <span className="font-bold">Not sure which of these fits your rank and budget?</span>{" "}
                            <span className="text-ink-soft">A counsellor can shortlist with you, free.</span>
                          </p>
                          <Link href="/counselling" className="rounded-lg bg-brand px-4 py-2 font-bold text-ink hover:bg-brand-hover">
                            Talk to a counsellor
                          </Link>
                        </aside>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <Pagination page={result.page} pageCount={result.pageCount} href={(p) => collegesHref({ ...f, page: p })} />
                {result.pageCount > 1 ? (
                  <p className="tabular mt-3 text-center text-[0.88rem] text-muted">
                    Page {formatNumber(result.page)} of {formatNumber(result.pageCount)}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="card mt-4 p-6">
                <h2 className="text-2xl font-bold">No colleges match all of these filters</h2>
                <p className="mt-2 max-w-[60ch] text-ink-soft">
                  We list only colleges that appear in an official list, so some combinations are empty. Remove one filter to widen the search:
                </p>
                {chips.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <li key={c.label + c.href}>
                        <Link href={c.href} className="inline-flex items-center gap-1.5 rounded-lg border border-rule px-3 py-2 text-[0.92rem] font-bold hover:border-ink">
                          Without {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  {chips.length ? (
                    <Link href={clearAll} className="rounded-lg border-2 border-ink px-4 py-2 font-bold hover:bg-band">
                      Clear all filters
                    </Link>
                  ) : null}
                  <Link href="/counselling" className="rounded-lg bg-brand px-4 py-2.5 font-bold text-ink hover:bg-brand-hover">
                    Ask a counsellor
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
