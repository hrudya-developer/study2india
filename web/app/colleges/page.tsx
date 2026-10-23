import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import {
  LEVEL_LABELS,
  collegesHref,
  getCityFacets,
  getCollegeFacets,
  getCourseContext,
  readCollegeFilters,
  searchColleges,
  type CollegeFilters,
} from "@/lib/queries/colleges";
import { getLandingIndex, isLandingPair, landingPath, type LandingIndex } from "@/lib/queries/landing";
import { CollegeListing } from "@/components/colleges/listing";
import { breadcrumbList, jsonLd } from "@/lib/seo";
import { own } from "@/lib/params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Resolves the filters against what exists. Unknown values from the URL (a course, field, state,
 * district or level we do not have) are dropped: they filter nothing, get no chip and stay out of the canonical.
 */
async function describe(raw: CollegeFilters) {
  const [facets, course] = await Promise.all([getCollegeFacets(), raw.course ? getCourseContext(raw.course) : Promise.resolve(null)]);
  const stream = facets.streams.find((s) => s.value === raw.stream);
  const state = facets.states.find((s) => s.value === raw.state);
  const cities = state ? await getCityFacets(state.value) : [];
  const city = raw.city && cities.find((c) => c.value === raw.city) ? raw.city : undefined;
  const level = own(LEVEL_LABELS, raw.level);
  const f: CollegeFilters = { ...raw, stream: stream?.value, course: course?.slug, state: state?.value, city, level: level ? raw.level : undefined };
  const what = course ? `${course.short} colleges` : stream ? `${stream.label} colleges` : level ? `${level} colleges` : "Colleges";
  const where = state ? `in ${city ? `${city}, ` : ""}${state.label}` : "in India";
  return { title: `${what} ${where}`, f, facets, course, stream, state, cities };
}

/**
 * Which listing URLs search engines should index. The indexable set is /colleges, the one-filter
 * listings (a course, a field or a state) and the course or field in a state landing pages at
 * /colleges/<course>/<state>; each paginates with a self-referencing canonical. Everything else
 * (more filters, a sort, a search, a district) is noindex,follow with the closest indexable page
 * as canonical, so link equity flows to it without duplicate listings in the index.
 */
function landingFor(f: CollegeFilters, index: LandingIndex): { kind: "course" | "stream"; dim: string; state: string } | null {
  if (!f.state) return null;
  if (f.course && isLandingPair(index, "course", f.course, f.state)) return { kind: "course", dim: f.course, state: f.state };
  if (!f.course && f.stream && isLandingPair(index, "stream", f.stream, f.state)) return { kind: "stream", dim: f.stream, state: f.state };
  return null;
}

function seoFor(f: CollegeFilters, index: LandingIndex) {
  const extra = !!(f.ownership.length || f.approval.length || f.level || f.city || f.ranked || f.q || f.sort !== "relevance");
  const dims = [f.stream, f.course, f.state].filter(Boolean).length;
  const landing = landingFor(f, index);
  // Exactly a course (or field) and a state, nothing else: this listing has a clean URL.
  const redirect = !extra && landing && dims === 2 ? landingPath(landing.dim, landing.state, f.page) : null;
  if (!extra && dims <= 1) {
    return { redirect, index: true, canonical: collegesHref({ stream: f.stream, course: f.course, state: f.state, page: f.page }) };
  }
  const closest = landing
    ? landingPath(landing.dim, landing.state)
    : f.course
      ? collegesHref({ course: f.course })
      : f.stream
        ? collegesHref({ stream: f.stream })
        : f.state
          ? collegesHref({ state: f.state })
          : "/colleges";
  return { redirect, index: false, canonical: closest };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ title, f }, index] = await Promise.all([describe(readCollegeFilters(await searchParams)), getLandingIndex()]);
  const seo = seoFor(f, index);
  const shown = f.page > 1 ? `${title} (page ${f.page})` : title;
  return {
    title: shown,
    description: `${title}: approvals, seats and NIRF ranks from official lists (AICTE, NMC, INC, NCISM, NCH, PCI, DCI, VCI and NIRF), with free admission counselling.`,
    alternates: { canonical: seo.redirect ?? seo.canonical },
    robots: seo.index || seo.redirect ? undefined : { index: false, follow: true },
  };
}

export default async function CollegesPage({ searchParams }: Props) {
  const [{ title, f, facets, course, stream, state, cities }, index] = await Promise.all([describe(readCollegeFilters(await searchParams)), getLandingIndex()]);
  const seo = seoFor(f, index);
  if (seo.redirect) permanentRedirect(seo.redirect);
  const result = await searchColleges(f, course);

  // Home / Colleges / <course or field> colleges / <state>, as far as the filters go.
  const dimension = course ? { label: `${course.short} colleges`, href: collegesHref({ course: course.slug }) } : stream ? { label: `${stream.label} colleges`, href: collegesHref({ stream: stream.value }) } : null;
  const crumbs: { label: string; href?: string }[] = [{ label: "Colleges", href: "/colleges" }];
  if (dimension) crumbs.push(state ? dimension : { label: dimension.label });
  if (state) crumbs.push({ label: state.label });
  if (crumbs.length === 1) crumbs[0] = { label: "Colleges" };
  const crumbLd = breadcrumbList(
    [{ name: "Home", path: "/" }, ...crumbs.map((c) => ({ name: c.label, path: c.href }))],
    collegesHref({ ...f, page: result.page }),
  );

  return (
    <>
      {seo.index ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbLd) }} /> : null}
      <CollegeListing
        title={title}
        crumbs={crumbs}
        f={f}
        facets={facets}
        course={course}
        state={state}
        cities={cities}
        result={result}
        pageHref={(p) => collegesHref({ ...f, page: p })}
      />
    </>
  );
}
