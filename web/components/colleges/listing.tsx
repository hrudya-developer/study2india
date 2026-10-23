import Link from "next/link";
import { X } from "lucide-react";
import {
  APPROVAL_BODIES,
  LEVEL_LABELS,
  OWNERSHIP_LABELS,
  PAGE_SIZE,
  SORTS,
  collegesHref,
  formatNumber,
  type CollegeFacets,
  type CollegeFilters,
  type CollegeSearchResult,
  type CourseContext,
  type FacetOption,
  type SortKey,
} from "@/lib/queries/colleges";
import { CollegeCard } from "@/components/college-card";
import { FilterForm } from "@/components/colleges/filter-form";
import { FilterSheet } from "@/components/colleges/filter-sheet";
import { Pagination } from "@/components/colleges/pagination";
import { ShortlistLink } from "@/components/colleges/shortlist-button";
import { own } from "@/lib/params";

export type ListingCrumb = { label: string; href?: string };

type Props = {
  title: string;
  /** Home is added in front; the last crumb is the page itself and gets no link. */
  crumbs: ListingCrumb[];
  f: CollegeFilters;
  facets: CollegeFacets;
  course: CourseContext | null;
  state: FacetOption | undefined;
  cities: FacetOption[];
  result: CollegeSearchResult;
  /** The URL of a result page; landing pages keep their clean path, other listings use query URLs. */
  pageHref: (page: number) => string;
  /** A short factual introduction shown under the heading (landing pages). */
  intro?: React.ReactNode;
};

/** The college listing: heading, filters, chips, sort, results and pagination. Shared by /colleges and the landing pages. */
export function CollegeListing({ title, crumbs, f, facets, course, state, cities, result, pageHref, intro }: Props) {
  const without = (patch: Partial<CollegeFilters>) => collegesHref({ ...f, page: 1, ...patch });
  const chips: { label: string; href: string }[] = [];
  if (f.q) chips.push({ label: `"${f.q}"`, href: without({ q: undefined }) });
  if (f.stream) chips.push({ label: facets.streams.find((s) => s.value === f.stream)?.label ?? f.stream, href: without({ stream: undefined }) });
  if (f.course) chips.push({ label: course?.short ?? f.course, href: without({ course: undefined }) });
  const levelLabel = own(LEVEL_LABELS, f.level);
  if (levelLabel) chips.push({ label: levelLabel, href: without({ level: undefined }) });
  if (f.state) chips.push({ label: state?.label ?? f.state, href: without({ state: undefined, city: undefined }) });
  if (f.city) chips.push({ label: f.city, href: without({ city: undefined }) });
  for (const o of f.ownership) chips.push({ label: own(OWNERSHIP_LABELS, o) ?? o, href: without({ ownership: f.ownership.filter((x) => x !== o) }) });
  for (const a of f.approval) chips.push({ label: own(APPROVAL_BODIES, a)?.badge ?? a, href: without({ approval: f.approval.filter((x) => x !== a) }) });
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
          </Link>
          {crumbs.map((c) => (
            <span key={c.label}>
              {" / "}
              {c.href ? (
                <Link href={c.href} className="hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="text-[2rem] font-extrabold leading-tight sm:text-5xl">{title}</h1>
          <ShortlistLink className="hidden items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 py-2 text-[0.92rem] font-bold hover:border-ink lg:inline-flex" />
        </div>
        {intro ?? (
          <p className="mt-2 hidden max-w-3xl text-ink-soft sm:block">
            Approvals and seats from the regulators&apos; own lists, ranks from NIRF. No paid ratings, no made up figures: anything we have not verified says Not recorded.
          </p>
        )}

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
                <Pagination page={result.page} pageCount={result.pageCount} href={pageHref} />
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
