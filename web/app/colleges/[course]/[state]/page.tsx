import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { PAGE_SIZE, collegesHref, getCityFacets, getCollegeFacets, getCourseContext, readCollegeFilters, searchColleges, formatNumber, type CollegeFilters } from "@/lib/queries/colleges";
import {
  LANDING_MIN_COLLEGES,
  getLandingIndex,
  getLandingStats,
  isLandingPair,
  landingIntro,
  landingMeta,
  landingPath,
  resolveLanding,
  type LandingTarget,
} from "@/lib/queries/landing";
import { CollegeListing } from "@/components/colleges/listing";
import { absoluteUrl, breadcrumbList, jsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ course: string; state: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** One set of queries per request, shared by generateMetadata and the page. */
const load = cache(async (dim: string, stateSlug: string) => {
  const t = await resolveLanding(dim, stateSlug);
  if (!t) return null;
  const [index, stats] = await Promise.all([getLandingIndex(), getLandingStats(t)]);
  // No college offers it there: a 404 rather than a page that says "0 colleges".
  if (!stats.colleges) return null;
  return { t, index, stats, indexable: isLandingPair(index, t.kind, t.slug, t.state.slug) };
});

function filtersFor(t: LandingTarget, page: number): CollegeFilters {
  return {
    course: t.kind === "course" ? t.slug : undefined,
    stream: t.kind === "stream" ? t.slug : undefined,
    state: t.state.slug,
    ownership: [],
    approval: [],
    sort: "relevance",
    page,
  };
}

/** The one-filter listing a thin pair points to: all colleges for the course (or field) in India. */
function parentHref(t: LandingTarget) {
  return t.kind === "course" ? collegesHref({ course: t.slug }) : collegesHref({ stream: t.slug });
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { course, state } = await params;
  const data = await load(course, state);
  if (!data) return { title: "Page not found" };
  const page = readCollegeFilters(await searchParams).page;
  const { title, description } = landingMeta(data.t, data.stats);
  return {
    title: page > 1 ? `${title} (page ${page})` : title,
    description,
    // A landing page and each of its result pages are their own canonical; a pair below the
    // minimum is kept out of the index and points to the course's all-India listing.
    alternates: { canonical: data.indexable ? landingPath(data.t.slug, data.t.state.slug, page) : parentHref(data.t) },
    robots: data.indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: landingPath(data.t.slug, data.t.state.slug) },
  };
}

export default async function LandingPage({ params, searchParams }: Props) {
  const { course: dim, state: stateSlug } = await params;
  const data = await load(dim, stateSlug);
  if (!data) notFound();
  const { t, index, stats, indexable } = data;
  const requested = readCollegeFilters(await searchParams).page;

  const f = filtersFor(t, requested);
  const [facets, courseCtx, cities] = await Promise.all([getCollegeFacets(), t.kind === "course" ? getCourseContext(t.slug) : Promise.resolve(null), getCityFacets(t.state.slug)]);
  const result = await searchColleges(f, courseCtx);
  if (!result.total) notFound();
  // A page past the end (an old link after data changed) goes to the last page, which has its own canonical.
  if (result.page !== requested) redirect(landingPath(t.slug, t.state.slug, result.page));
  const fPage = { ...f, page: result.page };
  const state = facets.states.find((s) => s.value === t.state.slug);

  const title = `${t.label} colleges in ${t.state.name}`;
  const here = landingPath(t.slug, t.state.slug, result.page);
  const crumbs = [
    { label: "Colleges", href: "/colleges" },
    { label: `${t.label} colleges`, href: parentHref(t) },
    { label: t.state.name },
  ];

  // Other states with a landing page for the same course, largest first: the links crawlers follow between landing pages.
  const otherStates = [...index[t.kind].entries()]
    .filter(([k, v]) => k.startsWith(`${t.slug}|`) && v.colleges >= LANDING_MIN_COLLEGES && k !== `${t.slug}|${t.state.slug}`)
    .map(([k, v]) => ({ slug: k.split("|")[1], colleges: v.colleges }))
    .map((s) => ({ ...s, name: facets.states.find((x) => x.value === s.slug)?.label ?? s.slug }))
    .sort((a, b) => b.colleges - a.colleges || a.name.localeCompare(b.name))
    .slice(0, 12);

  const sentences = landingIntro(t, stats);
  const from = (result.page - 1) * PAGE_SIZE + 1;
  const graph = [
    breadcrumbList(
      [{ name: "Home", path: "/" }, ...crumbs.map((c) => ({ name: c.label, path: c.href }))],
      here,
    ),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: result.page > 1 ? `${title}, page ${result.page}` : title,
      url: absoluteUrl(here),
      numberOfItems: result.items.length,
      itemListOrder: "https://schema.org/ItemListUnordered",
      itemListElement: result.items.map((c, i) => ({
        "@type": "ListItem",
        position: from + i,
        url: absoluteUrl(`/college/${c.slug}`),
        name: c.name,
      })),
    },
  ];

  const intro = (
    <div className="mt-3 max-w-3xl space-y-3 text-ink-soft">
      {result.page === 1 ? <p className="text-[1.02rem] leading-relaxed">{sentences.join(" ")}</p> : <p>Page {formatNumber(result.page)} of the list. {sentences[0]}</p>}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[0.92rem]">
        {t.kind === "course" ? (
          <Link href={`/course/${t.slug}`} className="font-bold underline underline-offset-4 hover:text-ink">
            About the {t.label} course
          </Link>
        ) : null}
        <Link href={parentHref(t)} className="font-bold underline underline-offset-4 hover:text-ink">
          {t.label} colleges across India
        </Link>
        <Link href={collegesHref({ state: t.state.slug })} className="font-bold underline underline-offset-4 hover:text-ink">
          All colleges in {t.state.name}
        </Link>
      </p>
    </div>
  );

  return (
    <>
      {indexable ? graph.map((g, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(g) }} />) : null}
      <CollegeListing
        title={title}
        crumbs={crumbs}
        f={fPage}
        facets={facets}
        course={courseCtx}
        state={state}
        cities={cities}
        result={result}
        pageHref={(p) => landingPath(t.slug, t.state.slug, p)}
        intro={intro}
      />
      {otherStates.length ? (
        <section aria-labelledby="other-states" className="bg-band">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
            <h2 id="other-states" className="text-xl font-bold">
              {t.label} colleges in other states
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {otherStates.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={landingPath(t.slug, s.slug)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-rule bg-paper px-3 text-[0.9rem] text-ink-soft hover:border-brand hover:text-ink"
                  >
                    {s.name}
                    <span className="tabular text-[0.8rem] text-muted">{formatNumber(s.colleges)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
