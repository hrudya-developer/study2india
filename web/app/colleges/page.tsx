import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
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
import {
  cleanListingPath,
  districtLandingPath,
  getLandingIndex,
  isDistrictLandingPair,
  isLandingPair,
  landingPath,
  listingHref,
  type LandingIndex,
} from "@/lib/queries/landing";
import { districtSlug, normaliseDistrict } from "@/lib/districts";
import { CollegeListing } from "@/components/colleges/listing";
import { breadcrumbList, jsonLd } from "@/lib/seo";
import { own } from "@/lib/params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Resolves the filters against what exists. Unknown values from the URL (a course, field, state,
 * district or level we do not have) are dropped: they filter nothing, get no chip and stay out of the canonical.
 * A city from an older link ("Kochi", "Cochin", "ernakulam") is mapped to its official district first;
 * `cityMapped` says so, and the page then redirects to the URL with the official name.
 */
async function describe(raw: CollegeFilters) {
  const [facets, course] = await Promise.all([getCollegeFacets(), raw.course ? getCourseContext(raw.course) : Promise.resolve(null)]);
  const stream = facets.streams.find((s) => s.value === raw.stream);
  const state = facets.states.find((s) => s.value === raw.state);
  const cities = state ? await getCityFacets(state.value) : [];
  const known = (v: string | null | undefined) => (v && cities.some((c) => c.value === v) ? v : undefined);
  const city = state && raw.city ? (known(raw.city) ?? known(normaliseDistrict(state.label, raw.city, { asCity: true }))) : undefined;
  const level = own(LEVEL_LABELS, raw.level);
  const f: CollegeFilters = { ...raw, stream: stream?.value, course: course?.slug, state: state?.value, city, level: level ? raw.level : undefined };
  const what = course ? `${course.short} colleges` : stream ? `${stream.label} colleges` : level ? `${level} colleges` : "Colleges";
  const where = state ? `in ${city ? `${city}, ` : ""}${state.label}` : "in India";
  return { title: `${what} ${where}`, f, facets, course, stream, state, cities, cityMapped: !!city && city !== raw.city };
}

/**
 * Which listing URLs search engines should index. The indexable set is /colleges, the one-filter
 * listings (a course, a field or a state) and the course or field in a state (or district) landing
 * pages at /colleges/<course>/<state>[/<district>]; each paginates with a self-referencing
 * canonical. Everything else (more filters, a sort, a search, a district without a landing page)
 * is noindex,follow with the closest indexable page as canonical, so link equity flows to it
 * without duplicate listings in the index.
 */
function landingFor(f: CollegeFilters, index: LandingIndex): { kind: "course" | "stream"; dim: string; state: string } | null {
  if (!f.state) return null;
  if (f.course && isLandingPair(index, "course", f.course, f.state)) return { kind: "course", dim: f.course, state: f.state };
  if (!f.course && f.stream && isLandingPair(index, "stream", f.stream, f.state)) return { kind: "stream", dim: f.stream, state: f.state };
  return null;
}

/** The district landing page (/colleges/<course>/<state>/<district>) for the filters' course or field, state and district, when it is indexable. */
function districtLandingFor(f: CollegeFilters, index: LandingIndex, stateName: string | undefined): { dim: string; state: string; district: string } | null {
  const landing = landingFor(f, index);
  const district = f.city ? districtSlug(stateName, f.city) : null;
  if (!landing || !district) return null;
  return isDistrictLandingPair(index, landing.kind, landing.dim, landing.state, district) ? { dim: landing.dim, state: landing.state, district } : null;
}

function seoFor(f: CollegeFilters, index: LandingIndex, stateName: string | undefined) {
  const filtered = !!(f.ownership.length || f.approval.length || f.level || f.ranked || f.q || f.sort !== "relevance");
  const extra = filtered || !!f.city;
  const dims = [f.stream, f.course, f.state].filter(Boolean).length;
  const landing = landingFor(f, index);
  const districtLanding = districtLandingFor(f, index, stateName);
  // Exactly a course (or field) and a state, and at most a district, nothing else: this listing has a clean URL.
  const redirect = cleanListingPath(f, index, stateName);
  if (!extra && dims <= 1) {
    return { redirect, index: true, canonical: collegesHref({ stream: f.stream, course: f.course, state: f.state, page: f.page }) };
  }
  const closest = districtLanding
    ? districtLandingPath(districtLanding.dim, districtLanding.state, districtLanding.district)
    : landing
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
  const [{ title, f, state }, index] = await Promise.all([describe(readCollegeFilters(await searchParams)), getLandingIndex()]);
  const seo = seoFor(f, index, state?.label);
  const shown = f.page > 1 ? `${title} (page ${f.page})` : title;
  return {
    title: shown,
    description: `${title}: approvals, seats and NIRF ranks from official lists (AICTE, NMC, INC, NCISM, NCH, PCI, DCI, VCI and NIRF) and the JoSAA counselling seat matrix, with free admission counselling.`,
    alternates: { canonical: seo.redirect ?? seo.canonical },
    robots: seo.index || seo.redirect ? undefined : { index: false, follow: true },
  };
}

export default async function CollegesPage({ searchParams }: Props) {
  const [{ title, f, facets, course, stream, state, cities, cityMapped }, index] = await Promise.all([describe(readCollegeFilters(await searchParams)), getLandingIndex()]);
  const seo = seoFor(f, index, state?.label);
  if (seo.redirect) permanentRedirect(seo.redirect);
  // An older link naming a city or another spelling: the same listing at the official district name.
  if (cityMapped) permanentRedirect(collegesHref(f));
  const result = await searchColleges(f, course);
  // A page past the end (an old link after data changed) goes to the last page, which has its own canonical.
  if (result.page !== f.page) redirect(collegesHref({ ...f, page: result.page }));

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
        listingHref={(x) => listingHref(x, index, state?.label)}
      />
    </>
  );
}
