import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";
import { mostlyRecorded, NIRF_CATEGORY_BY_STREAM, NIRF_GENERAL_CATEGORIES } from "@/lib/queries/catalog";
import { getCollegeFacets, formatNumber } from "@/lib/queries/colleges";
import { districtFromSlug, districtSlug } from "@/lib/districts";
import { districtLandingPath, landingPath } from "@/lib/seo";

/**
 * "<course> colleges in <state>" (and "<field> colleges in <state>") landing pages, and the
 * "<course> colleges in <district>" pages under them.
 *
 * They live at /colleges/<course-or-field-slug>/<state-slug>[/<district-slug>]. A pair is a landing
 * page, indexed and listed in the sitemap, only when at least LANDING_MIN_COLLEGES published
 * colleges match; thinner pairs still render at the same path but are noindex. Course and field
 * slugs never collide (checked when the index is built), so one path segment serves both.
 *
 * District pages are built on institutions.district, which holds only official district names
 * (lib/districts.ts); colleges whose district could not be placed appear on the state page only.
 */
export const LANDING_MIN_COLLEGES = 3;

export type LandingKind = "course" | "stream";
export type PairInfo = { colleges: number; lastmod: string | null };
export type DistrictPairInfo = PairInfo & { district: string };
export type LandingIndex = {
  course: Map<string, PairInfo>;
  stream: Map<string, PairInfo>;
  /** Keyed "<dim>|<state slug>|<district slug>". */
  courseDistrict: Map<string, DistrictPairInfo>;
  streamDistrict: Map<string, DistrictPairInfo>;
  /** Keyed "<kind>|<dim>|<state slug>": colleges of the state pair whose district is recorded. */
  districtPlaced: Map<string, number>;
  /** Total state landing pages (pairs at or above the minimum). */
  pages: number;
  /** Total indexable district landing pages (see isDistrictLandingPair). */
  districtPages: number;
};

const key = (dim: string, state: string) => `${dim}|${state}`;
const districtKey = (dim: string, state: string, district: string) => `${dim}|${state}|${district}`;

export { districtLandingPath, landingPath };

// Pair counts change only when data is loaded; one memo serves the sitemap, the listing's
// canonical rules and the links on college and course pages.
const TTL_MS = 10 * 60 * 1000;
const memo = globalThis as unknown as { landingIndex?: { at: number; value: Promise<LandingIndex> } };

type DistrictRow = { dim: string; state: string; state_name: string; district: string; n: unknown; lastmod: string | null };

function districtMap(list: DistrictRow[], keep: (dim: string) => boolean): Map<string, DistrictPairInfo> {
  const out = new Map<string, DistrictPairInfo>();
  for (const r of list) {
    if (!keep(r.dim)) continue;
    // Only official names have a slug; anything else (a value written before normalisation) is skipped.
    const slug = districtSlug(r.state_name, r.district);
    if (slug) out.set(districtKey(r.dim, r.state, slug), { colleges: Number(r.n), lastmod: r.lastmod, district: r.district });
  }
  return out;
}

async function loadIndex(): Promise<LandingIndex> {
  const [coursePairs, streamPairs, courseDistricts, streamDistricts] = await Promise.all([
    rows<{ dim: string; state: string; n: unknown; lastmod: string | null }>(sql`
      select c.slug as dim, st.slug as state, count(distinct o.institution_id) as n, max(i.updated_at) as lastmod
      from offerings o
      join courses c on c.id = o.course_id
      join institutions i on i.id = o.institution_id and i.status = 'published'
      join states st on st.code = i.state_code
      group by c.slug, st.slug
    `),
    rows<{ dim: string; state: string; n: unknown; lastmod: string | null }>(sql`
      select s.slug as dim, st.slug as state, count(distinct i.id) as n, max(i.updated_at) as lastmod
      from institution_streams x
      join streams s on s.id = x.stream_id
      join institutions i on i.id = x.institution_id and i.status = 'published'
      join states st on st.code = i.state_code
      group by s.slug, st.slug
    `),
    rows<DistrictRow>(sql`
      select c.slug as dim, st.slug as state, st.name as state_name, i.district, count(distinct o.institution_id) as n, max(i.updated_at) as lastmod
      from offerings o
      join courses c on c.id = o.course_id
      join institutions i on i.id = o.institution_id and i.status = 'published' and i.district is not null
      join states st on st.code = i.state_code
      group by c.slug, st.slug, st.name, i.district
    `),
    rows<DistrictRow>(sql`
      select s.slug as dim, st.slug as state, st.name as state_name, i.district, count(distinct i.id) as n, max(i.updated_at) as lastmod
      from institution_streams x
      join streams s on s.id = x.stream_id
      join institutions i on i.id = x.institution_id and i.status = 'published' and i.district is not null
      join states st on st.code = i.state_code
      group by s.slug, st.slug, st.name, i.district
    `),
  ]);
  const course = new Map(coursePairs.map((r) => [key(r.dim, r.state), { colleges: Number(r.n), lastmod: r.lastmod }]));
  const courseSlugs = new Set(coursePairs.map((r) => r.dim));
  // A field slug that is also a course slug would make /colleges/<slug>/<state> ambiguous; the course wins.
  const stream = new Map(streamPairs.filter((r) => !courseSlugs.has(r.dim)).map((r) => [key(r.dim, r.state), { colleges: Number(r.n), lastmod: r.lastmod }]));
  const courseDistrict = districtMap(courseDistricts, () => true);
  const streamDistrict = districtMap(streamDistricts, (dim) => !courseSlugs.has(dim));
  const districtPlaced = new Map<string, number>();
  for (const kind of ["course", "stream"] as const) {
    for (const [k, v] of kind === "course" ? courseDistrict : streamDistrict) {
      const [dim, state] = k.split("|");
      const pk = `${kind}|${dim}|${state}`;
      districtPlaced.set(pk, (districtPlaced.get(pk) ?? 0) + v.colleges);
    }
  }
  const index: LandingIndex = { course, stream, courseDistrict, streamDistrict, districtPlaced, pages: 0, districtPages: 0 };
  for (const m of [course, stream]) for (const v of m.values()) if (v.colleges >= LANDING_MIN_COLLEGES) index.pages++;
  for (const kind of ["course", "stream"] as const) {
    for (const k of index[`${kind}District`].keys()) {
      const [dim, state, district] = k.split("|");
      if (isDistrictLandingPair(index, kind, dim, state, district)) index.districtPages++;
    }
  }
  return index;
}

export function getLandingIndex(): Promise<LandingIndex> {
  const hit = memo.landingIndex;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = loadIndex();
  memo.landingIndex = { at: Date.now(), value };
  value.catch(() => {
    if (memo.landingIndex?.value === value) memo.landingIndex = undefined;
  });
  return value;
}

/** Published colleges for a course or field in a state, from the memoised index (0 when none). */
export function pairColleges(index: LandingIndex, kind: LandingKind, dim: string, state: string): number {
  return index[kind].get(key(dim, state))?.colleges ?? 0;
}

export function isLandingPair(index: LandingIndex, kind: LandingKind, dim: string, state: string): boolean {
  return pairColleges(index, kind, dim, state) >= LANDING_MIN_COLLEGES;
}

/** Every landing page, for the sitemap. */
export function landingPages(index: LandingIndex): { path: string; lastmod: string | null }[] {
  const out: { path: string; lastmod: string | null }[] = [];
  for (const m of [index.course, index.stream]) {
    for (const [k, v] of m) {
      if (v.colleges < LANDING_MIN_COLLEGES) continue;
      const [dim, state] = k.split("|");
      out.push({ path: landingPath(dim, state), lastmod: v.lastmod });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** Published colleges for a course or field in a district (by slug), from the memoised index (0 when none). */
export function districtPairColleges(index: LandingIndex, kind: LandingKind, dim: string, state: string, district: string): number {
  return index[`${kind}District`].get(districtKey(dim, state, district))?.colleges ?? 0;
}

/**
 * A district pair is indexed when:
 * - it has at least LANDING_MIN_COLLEGES colleges;
 * - it is not the whole state pair over again (a state or territory with one district, such as
 *   Chandigarh, would duplicate the state page);
 * - the district is recorded for at least half of the state pair's colleges (the coverage rule in
 *   lib/coverage.ts). Below that a district count would mostly reflect what is missing; MBBS, for
 *   one, comes from the NMC list, which gives no district.
 */
export function isDistrictLandingPair(index: LandingIndex, kind: LandingKind, dim: string, state: string, district: string): boolean {
  const n = districtPairColleges(index, kind, dim, state, district);
  const stateTotal = pairColleges(index, kind, dim, state);
  return n >= LANDING_MIN_COLLEGES && n < stateTotal && mostlyRecorded(index.districtPlaced.get(`${kind}|${dim}|${state}`) ?? 0, stateTotal);
}

export type DistrictLink = { slug: string; name: string; colleges: number; indexable: boolean; lastmod: string | null };

/** Every district with at least one college for a course or field in a state, alphabetical. */
export function districtsFor(index: LandingIndex, kind: LandingKind, dim: string, state: string): DistrictLink[] {
  const prefix = `${dim}|${state}|`;
  const out: DistrictLink[] = [];
  for (const [k, v] of index[`${kind}District`]) {
    if (!k.startsWith(prefix)) continue;
    const slug = k.slice(prefix.length);
    out.push({ slug, name: v.district, colleges: v.colleges, indexable: isDistrictLandingPair(index, kind, dim, state, slug), lastmod: v.lastmod });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** Every indexable district landing page, for the sitemap. */
export function districtLandingPages(index: LandingIndex): { path: string; lastmod: string | null }[] {
  const out: { path: string; lastmod: string | null }[] = [];
  for (const kind of ["course", "stream"] as const) {
    for (const [k, v] of index[`${kind}District`]) {
      const [dim, state, district] = k.split("|");
      if (isDistrictLandingPair(index, kind, dim, state, district)) out.push({ path: districtLandingPath(dim, state, district), lastmod: v.lastmod });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export type LandingTarget = {
  kind: LandingKind;
  slug: string;
  /** "B.Tech" for a course, "Engineering" for a field. */
  label: string;
  /** The field a course belongs to, for the NIRF list that fits it. */
  streamSlug: string;
  streamName: string;
  state: { slug: string; name: string };
  /** Set on a district page: the district's slug and official name. */
  district?: { slug: string; name: string };
};

/** "Ernakulam district, Kerala" on a district page ("Chandigarh district" where the names match), "Kerala" on a state page. */
export function landingPlace(t: LandingTarget): string {
  if (!t.district) return t.state.name;
  return t.district.name === t.state.name ? `${t.district.name} district` : `${t.district.name} district, ${t.state.name}`;
}

/** "Ernakulam, Kerala" for titles ("Chandigarh" where the names match), "Kerala" on a state page. */
function titlePlace(t: LandingTarget): string {
  if (!t.district) return t.state.name;
  return t.district.name === t.state.name ? t.district.name : `${t.district.name}, ${t.state.name}`;
}

/** Resolves the two path segments against our courses, fields and states; null for anything unknown. */
export async function resolveLanding(dim: string, stateSlug: string): Promise<LandingTarget | null> {
  const facets = await getCollegeFacets();
  const state = facets.states.find((s) => s.value === stateSlug);
  if (!state) return null;
  const course = facets.courses.find((c) => c.value === dim);
  if (course) {
    return { kind: "course", slug: course.value, label: course.label, streamSlug: course.streamSlug, streamName: course.streamName, state: { slug: state.value, name: state.label } };
  }
  const stream = facets.streams.find((s) => s.value === dim);
  if (stream) {
    return { kind: "stream", slug: stream.value, label: stream.label, streamSlug: stream.value, streamName: stream.label, state: { slug: state.value, name: state.label } };
  }
  return null;
}

/** Resolves the three path segments of a district page; null when any of them is unknown. */
export async function resolveDistrictLanding(dim: string, stateSlug: string, slug: string): Promise<LandingTarget | null> {
  const t = await resolveLanding(dim, stateSlug);
  if (!t) return null;
  const name = districtFromSlug(t.state.name, slug);
  return name ? { ...t, district: { slug, name } } : null;
}

export type LandingRanked = { slug: string; name: string; rank: number | null; rankBand: string | null };

export type LandingStats = {
  colleges: number;
  /** Seats are counted for course pages only; a field spans courses with different intakes. */
  seats: { recorded: number; total: number | null; years: string[] } | null;
  ownership: { government: number; private: number; other: number; recorded: number };
  ranked: { year: number; category: string; total: number; top: LandingRanked[] } | null;
  /** District pages only: colleges for the course (or field) in the whole state, and how many of them have a recorded district. */
  placement: { stateColleges: number; placed: number } | null;
};

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/**
 * The facts behind a landing page's intro, title and description, all counted from the same
 * colleges the listing shows. Seat totals follow the coverage rule (mostlyRecorded): withheld
 * when fewer than half of the colleges have a figure.
 */
export async function getLandingStats(t: LandingTarget): Promise<LandingStats> {
  const inSet =
    t.kind === "course"
      ? sql`exists (select 1 from offerings o join courses c on c.id = o.course_id where o.institution_id = i.id and c.slug = ${t.slug})`
      : sql`exists (select 1 from institution_streams x join streams s on s.id = x.stream_id where x.institution_id = i.id and s.slug = ${t.slug})`;
  const own = NIRF_CATEGORY_BY_STREAM[t.streamSlug];
  const categories = own ? [own, ...NIRF_GENERAL_CATEGORIES] : NIRF_GENERAL_CATEGORIES;
  // The state, and on a district page the district too (stored as its official name).
  const place = t.district ? sql`st.slug = ${t.state.slug} and i.district = ${t.district.name}` : sql`st.slug = ${t.state.slug}`;

  const [[counts], seatRows, ranked, [placed]] = await Promise.all([
    rows<{ colleges: unknown; gov: unknown; priv: unknown; with_owner: unknown }>(sql`
      select count(*) as colleges, sum(i.ownership = 'government') as gov, sum(i.ownership = 'private') as priv, count(i.ownership) as with_owner
      from institutions i join states st on st.code = i.state_code
      where i.status = 'published' and ${place} and ${inSet}
    `),
    t.kind === "course"
      ? rows<{ academic_year: string | null; colleges: unknown; with_seats: unknown; seats: unknown }>(sql`
          with off as (
            select o.academic_year,
              coalesce(o.seats, (select sum(b.seats) from offering_branches b where b.offering_id = o.id)) as seats,
              row_number() over (partition by o.institution_id order by o.academic_year is null, o.academic_year desc, o.id desc) as rn
            from offerings o
            join institutions i on i.id = o.institution_id and i.status = 'published'
            join states st on st.code = i.state_code
            where o.course_id = (select id from courses where slug = ${t.slug}) and ${place}
          )
          select academic_year, count(*) as colleges, count(seats) as with_seats, sum(seats) as seats from off where rn = 1 group by academic_year
        `)
      : Promise.resolve([]),
    rows<{ category: string; year: unknown; rank: number | null; rank_band: string | null; slug: string; name: string }>(sql`
      select r.category, r.year, r.rank, r.rank_band, i.slug, i.name
      from rankings r
      join institutions i on i.id = r.institution_id and i.status = 'published'
      join states st on st.code = i.state_code
      where r.agency = 'NIRF' and r.year = (select max(year) from rankings where agency = 'NIRF')
        and ${place} and ${inSet}
        and r.category in (${sql.join(categories.map((c) => sql`${c}`), sql`, `)})
      order by r.rank is null, r.rank, r.rank_band, i.name
    `),
    t.district
      ? rows<{ colleges: unknown; placed: unknown }>(sql`
          select count(*) as colleges, count(i.district) as placed
          from institutions i join states st on st.code = i.state_code
          where i.status = 'published' and st.slug = ${t.state.slug} and ${inSet}
        `)
      : Promise.resolve([]),
  ]);

  const colleges = num(counts?.colleges);
  const government = num(counts?.gov);
  const priv = num(counts?.priv);
  const recorded = num(counts?.with_owner);

  let seats: LandingStats["seats"] = null;
  if (t.kind === "course") {
    const withSeats = seatRows.reduce((n, r) => n + num(r.with_seats), 0);
    const sum = seatRows.reduce((n, r) => n + num(r.seats), 0);
    const years = seatRows
      .filter((r) => r.academic_year && num(r.with_seats) > 0)
      .map((r) => r.academic_year as string)
      .sort()
      .reverse();
    seats = { recorded: withSeats, total: withSeats > 0 && mostlyRecorded(withSeats, colleges) ? sum : null, years };
  }

  const category = categories.find((c) => ranked.some((r) => r.category === c));
  const list = category ? ranked.filter((r) => r.category === category) : [];
  return {
    colleges,
    seats,
    ownership: { government, private: priv, other: recorded - government - priv, recorded },
    ranked: category
      ? {
          year: num(list[0].year),
          category,
          total: list.length,
          top: list.slice(0, 3).map((r) => ({ slug: r.slug, name: r.name, rank: r.rank, rankBand: r.rank_band })),
        }
      : null,
    placement: t.district ? { stateColleges: num(placed?.colleges), placed: num(placed?.placed) } : null,
  };
}

const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** "in 33 of 35 colleges (2 not recorded)" when the total does not cover every college. */
function seatQualifier(s: NonNullable<LandingStats["seats"]>, colleges: number): string {
  return s.recorded < colleges ? ` in ${formatNumber(s.recorded)} of ${plural(colleges, "college", "colleges")} (${formatNumber(colleges - s.recorded)} not recorded)` : "";
}

function rankText(r: LandingRanked): string {
  return r.rank ? `#${r.rank}` : r.rankBand ? `band ${r.rankBand}` : "ranked";
}

/**
 * The intro paragraph, one sentence per fact, written only from recorded figures. Counts that
 * fail the coverage rule are left out or described as not recorded rather than estimated.
 */
export function landingIntro(t: LandingTarget, s: LandingStats): string[] {
  const what = t.kind === "course" ? `offering ${t.label}` : `in the ${t.label.toLowerCase()} field`;
  const out: string[] = [`We list ${plural(s.colleges, "college", "colleges")} ${what} in ${landingPlace(t)}.`];

  if (s.seats) {
    const year = s.seats.years.length === 1 ? ` in the ${s.seats.years[0]} list` : s.seats.years.length > 1 ? ` in the ${s.seats.years.at(-1)} to ${s.seats.years[0]} lists` : "";
    const seats = s.seats.total !== null ? plural(s.seats.total, "approved seat", "approved seats") : "";
    if (s.seats.total !== null && s.seats.recorded === s.colleges) {
      out.push(`${s.colleges === 1 ? "It has" : "Together they have"} ${seats}${year}.`);
    } else if (s.seats.total !== null) {
      // A partial sum says which colleges it covers, so it is never read as the full intake.
      out.push(
        `The ${formatNumber(s.seats.recorded)} of them with a seat figure have ${seats}${year}; the figure is not recorded for the other ${formatNumber(s.colleges - s.seats.recorded)}.`,
      );
    } else if (s.seats.recorded > 0) {
      out.push(`Approved seats are recorded for only ${formatNumber(s.seats.recorded)} of these colleges, so no total is shown.`);
    }
  }

  const o = s.ownership;
  if (mostlyRecorded(o.recorded, s.colleges)) {
    const parts = [
      o.government ? `${formatNumber(o.government)} government` : null,
      o.private ? `${formatNumber(o.private)} private` : null,
      o.other ? `${formatNumber(o.other)} with another ownership type (aided, deemed, central or university)` : null,
    ].filter((x): x is string => !!x);
    const missing = s.colleges - o.recorded;
    if (parts.length) {
      const joined = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
      out.push(`By ownership as the regulators record it: ${joined}${missing ? `, with ownership not recorded for ${formatNumber(missing)}` : ""}.`);
    }
  } else if (o.recorded > 0) {
    out.push(`Ownership is recorded for only ${formatNumber(o.recorded)} of these colleges, so no government and private split is shown.`);
  }

  if (s.ranked) {
    const names = s.ranked.top.map((r) => `${r.name} (${rankText(r)})`);
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
    out.push(
      `${plural(s.ranked.total, "is", "are")} ranked in the NIRF ${s.ranked.year} ${s.ranked.category} list${s.ranked.total > 1 ? `; the highest ranked ${s.ranked.top.length > 1 ? "are" : "is"} ${list}` : `: ${list}`}.`,
    );
  } else {
    out.push(`${s.colleges === 1 ? "It does not appear" : "None of them appears"} in the latest NIRF lists we have loaded for this field.`);
  }

  const p = s.placement;
  if (p && p.placed < p.stateColleges) {
    // A district list covers only colleges whose district is recorded; say how many that is.
    const rest = p.stateColleges - p.placed;
    out.push(
      mostlyRecorded(p.placed, p.stateColleges)
        ? `The district is recorded for ${formatNumber(p.placed)} of the ${plural(p.stateColleges, "college", "colleges")} ${what} in ${t.state.name}; the other ${rest === 1 ? "one is" : `${formatNumber(rest)} are`} listed on the ${t.state.name} page only.`
        : `The district is recorded for only ${formatNumber(p.placed)} of the ${plural(p.stateColleges, "college", "colleges")} ${what} in ${t.state.name}, so this list is incomplete; the ${t.state.name} page lists all of them.`,
    );
  }
  return out;
}

/** Title and meta description templated from the counted figures. */
export function landingMeta(t: LandingTarget, s: LandingStats): { title: string; description: string } {
  const head = `${t.label} colleges in ${titlePlace(t)}`;
  // A seat total goes in the title only when every college has a figure; a partial sum needs its qualifier.
  const fullSeats = s.seats && s.seats.total !== null && s.seats.recorded === s.colleges ? s.seats.total : null;
  const title = `${head}: ${plural(s.colleges, "college", "colleges")}${fullSeats !== null ? `, ${plural(fullSeats, "seat", "seats")}` : ""}`;
  const o = s.ownership;
  const facts = [
    s.seats && s.seats.total !== null ? `${plural(s.seats.total, "approved seat", "approved seats")}${seatQualifier(s.seats, s.colleges)}` : null,
    mostlyRecorded(o.recorded, s.colleges) && o.government ? `${formatNumber(o.government)} government` : null,
    mostlyRecorded(o.recorded, s.colleges) && o.private ? `${formatNumber(o.private)} private` : null,
    s.ranked ? `${formatNumber(s.ranked.total)} NIRF ${s.ranked.year} ranked` : null,
  ].filter(Boolean);
  const description = `${plural(s.colleges, "college", "colleges")} ${t.kind === "course" ? `offering ${t.label}` : `for ${t.label.toLowerCase()}`} in ${landingPlace(t)}${facts.length ? `: ${facts.join(", ")}` : ""}. Approvals, seats and NIRF ranks from official lists, with free admission counselling.`;
  return { title, description };
}
