import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { PAGE_SIZE, collegesHref, getCityFacets, getCollegeFacets, getCourseContext, readCollegeFilters, searchColleges, formatNumber, type CollegeFilters } from "@/lib/queries/colleges";
import {
  districtLandingPath,
  districtsFor,
  getLandingIndex,
  getLandingStats,
  isDistrictLandingPair,
  landingIntro,
  landingMeta,
  landingPath,
  listingHref,
  pairColleges,
  resolveDistrictLanding,
  type LandingTarget,
} from "@/lib/queries/landing";
import { CollegeListing } from "@/components/colleges/listing";
import { absoluteUrl, breadcrumbList, jsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ course: string; state: string; district: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type DistrictTarget = LandingTarget & { district: { slug: string; name: string } };

/** One set of queries per request, shared by generateMetadata and the page. */
const load = cache(async (dim: string, stateSlug: string, districtSlug: string) => {
  const t = (await resolveDistrictLanding(dim, stateSlug, districtSlug)) as DistrictTarget | null;
  if (!t) return null;
  const [index, stats] = await Promise.all([getLandingIndex(), getLandingStats(t)]);
  // No college offers it in the district: a 404 rather than a page that says "0 colleges".
  if (!stats.colleges) return null;
  return {
    t,
    index,
    stats,
    indexable: isDistrictLandingPair(index, t.kind, t.slug, t.state.slug, t.district.slug),
  };
});

function filtersFor(t: DistrictTarget, page: number): CollegeFilters {
  return {
    course: t.kind === "course" ? t.slug : undefined,
    stream: t.kind === "stream" ? t.slug : undefined,
    state: t.state.slug,
    city: t.district.name,
    ownership: [],
    approval: [],
    sort: "relevance",
    page,
  };
}

/** The all-India listing for the course (or field). */
function indiaHref(t: LandingTarget) {
  return t.kind === "course" ? collegesHref({ course: t.slug }) : collegesHref({ stream: t.slug });
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { course, state, district } = await params;
  const data = await load(course, state, district);
  if (!data) return { title: "Page not found" };
  const { t } = data;
  const page = readCollegeFilters(await searchParams).page;
  const { title, description } = landingMeta(t, data.stats);
  // Each page is its own canonical. A thin district pair is noindex,follow, without a canonical
  // to another page, which alongside noindex would send search engines mixed signals.
  const canonical = districtLandingPath(t.slug, t.state.slug, t.district.slug, page);
  return {
    title: page > 1 ? `${title} (page ${page})` : title,
    description,
    alternates: { canonical },
    robots: data.indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: districtLandingPath(t.slug, t.state.slug, t.district.slug) },
  };
}

export default async function DistrictLandingPage({ params, searchParams }: Props) {
  const { course: dim, state: stateSlug, district: districtSlug } = await params;
  const data = await load(dim, stateSlug, districtSlug);
  if (!data) notFound();
  const { t, index, stats, indexable } = data;
  const requested = readCollegeFilters(await searchParams).page;

  const f = filtersFor(t, requested);
  const [facets, courseCtx, cities] = await Promise.all([getCollegeFacets(), t.kind === "course" ? getCourseContext(t.slug) : Promise.resolve(null), getCityFacets(t.state.slug)]);
  const result = await searchColleges(f, courseCtx);
  if (!result.total) notFound();
  // A page past the end (an old link after data changed) goes to the last page, which has its own canonical.
  if (result.page !== requested) redirect(districtLandingPath(t.slug, t.state.slug, t.district.slug, result.page));
  const fPage = { ...f, page: result.page };
  const state = facets.states.find((s) => s.value === t.state.slug);

  const title = `${t.label} colleges in ${t.district.name}`;
  const listName = t.district.name === t.state.name ? title : `${title}, ${t.state.name}`;
  const here = districtLandingPath(t.slug, t.state.slug, t.district.slug, result.page);
  const statePath = landingPath(t.slug, t.state.slug);
  const stateColleges = pairColleges(index, t.kind, t.slug, t.state.slug);
  const crumbs = [
    { label: "Colleges", href: "/colleges" },
    { label: `${t.label} colleges`, href: indiaHref(t) },
    { label: t.state.name, href: statePath },
    { label: t.district.name },
  ];

  // The same course in the state's other districts that have a page of their own, largest first.
  const otherDistricts = districtsFor(index, t.kind, t.slug, t.state.slug)
    .filter((d) => d.indexable && d.slug !== t.district.slug)
    .sort((a, b) => b.colleges - a.colleges || a.name.localeCompare(b.name, "en"))
    .slice(0, 24);

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
      name: result.page > 1 ? `${listName}, page ${result.page}` : listName,
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
        <Link href={statePath} className="font-bold underline underline-offset-4 hover:text-ink">
          All {formatNumber(stateColleges)} {t.label} colleges in {t.state.name}
        </Link>
        {t.kind === "course" ? (
          <Link href={`/course/${t.slug}`} className="font-bold underline underline-offset-4 hover:text-ink">
            About the {t.label} course
          </Link>
        ) : null}
        <Link href={indiaHref(t)} className="font-bold underline underline-offset-4 hover:text-ink">
          {t.label} colleges across India
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
        pageHref={(p) => districtLandingPath(t.slug, t.state.slug, t.district.slug, p)}
        listingHref={(x) => listingHref(x, index, t.state.name)}
        intro={intro}
      />
      <section aria-labelledby="other-districts" className="bg-band">
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <h2 id="other-districts" className="text-xl font-bold">
            {otherDistricts.length ? `${t.label} colleges in other districts of ${t.state.name}` : `More ${t.label} colleges in ${t.state.name}`}
          </h2>
          {otherDistricts.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {otherDistricts.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={districtLandingPath(t.slug, t.state.slug, d.slug)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-rule bg-paper px-3 text-[0.9rem] text-ink-soft hover:border-brand hover:text-ink"
                  >
                    {d.name}
                    <span className="tabular text-[0.8rem] text-muted">{formatNumber(d.colleges)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-[0.92rem]">
            <Link href={statePath} className="font-bold text-brand-hover hover:underline">
              See all {t.label} colleges in {t.state.name}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
