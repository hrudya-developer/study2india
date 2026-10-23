import { cache } from "react";
import { sql } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { rows } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { OWNERSHIP_LABELS } from "@/lib/queries/colleges";
import { own } from "@/lib/params";

/*
 * NIRF rankings exactly as the Ministry of Education publishes them. Nothing here reorders,
 * rescores or fills in a value: a rank band stays a band, a missing score stays null, and
 * seats are shown only when the regulator's figure for that college is complete.
 */

const AGENCY = "NIRF";

export type CategoryGroup = "general" | "subject";

type CategoryInfo = {
  /** What a student searching for the list calls its entries, for titles: "top engineering colleges". */
  noun: string;
  group: CategoryGroup;
  /** One plain sentence on what the list covers. */
  about: string;
  /** Courses whose approved intake is shown beside each college, in order of preference. */
  courses?: string[];
};

/** What each NIRF list covers, and the course a student usually means when they open it. */
const CATEGORY_INFO: Record<string, CategoryInfo> = {
  Overall: { noun: "top institutions", group: "general", about: "Universities, institutes and colleges of every kind, ranked together across all subjects." },
  University: { noun: "top universities", group: "general", about: "Universities ranked against each other, whatever subjects they teach." },
  College: { noun: "top colleges", group: "general", about: "Degree colleges, mostly in arts, science and commerce, ranked against each other." },
  Research: { noun: "top research institutions", group: "general", about: "Institutions ranked on the volume, quality and impact of their research." },
  Innovation: { noun: "top institutions for innovation", group: "general", about: "Institutions ranked on innovation, start-ups and entrepreneurship on campus." },
  SDG: { noun: "top institutions for sustainable development", group: "general", about: "Institutions ranked on their work towards the UN Sustainable Development Goals." },
  "State Public University": { noun: "top state public universities", group: "general", about: "Universities set up and run by state governments, ranked against each other." },
  "Open University": { noun: "top open universities", group: "general", about: "Open and distance learning universities." },
  "Skill University": { noun: "top skill universities", group: "general", about: "Universities set up for skill and vocational education." },
  Engineering: { noun: "top engineering colleges", group: "subject", about: "Engineering and technology institutions, from IITs and NITs to private colleges.", courses: ["btech"] },
  Management: { noun: "top MBA colleges", group: "subject", about: "Business schools, including IIMs and university management departments.", courses: ["mba", "pgdm"] },
  Medical: { noun: "top medical colleges", group: "subject", about: "Medical colleges and institutes, ranked on medical education and research.", courses: ["mbbs"] },
  Dental: { noun: "top dental colleges", group: "subject", about: "Dental colleges and institutes.", courses: ["bds"] },
  Pharmacy: { noun: "top pharmacy colleges", group: "subject", about: "Pharmacy colleges and institutes.", courses: ["b-pharm"] },
  Law: { noun: "top law colleges", group: "subject", about: "Law schools and university law departments.", courses: ["llb", "ba-llb"] },
  Architecture: { noun: "top architecture colleges", group: "subject", about: "Architecture and planning institutions.", courses: ["barch"] },
  Agriculture: { noun: "top agriculture colleges", group: "subject", about: "Agriculture and allied sector universities and institutes.", courses: ["bsc-agriculture"] },
};

/** Order the lists appear in: the broad lists first, then subjects students search for most. */
const CATEGORY_ORDER = [
  "Overall",
  "University",
  "College",
  "Research",
  "Innovation",
  "SDG",
  "State Public University",
  "Open University",
  "Skill University",
  "Engineering",
  "Management",
  "Medical",
  "Dental",
  "Pharmacy",
  "Law",
  "Architecture",
  "Agriculture",
];

export function categorySlug(category: string): string {
  return slugify(category);
}

export function categoryInfo(category: string): CategoryInfo {
  return own(CATEGORY_INFO, category) ?? { noun: "top institutions", group: "general", about: `Institutions in the NIRF ${category} list.` };
}

function orderOf(category: string) {
  const i = CATEGORY_ORDER.indexOf(category);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Where an entry sorts: its rank, else the first number of its band; withdrawn ranks go last. */
export function sortKey(rank: number | null, band: string | null): number {
  if (rank !== null) return rank;
  const start = band ? Number.parseInt(band, 10) : Number.NaN;
  return Number.isFinite(start) ? start : Number.MAX_SAFE_INTEGER;
}

export type RankingSource = { title: string | null; urls: string[]; retrievedOn: string };

export type RankingCategory = {
  category: string;
  slug: string;
  year: number;
  group: CategoryGroup;
  about: string;
  entries: number;
  /** Entries with an exact rank; the rest are in bands. */
  exact: number;
  top: { rank: number | null; rankBand: string | null; name: string; slug: string }[];
  source: RankingSource | null;
};

/** Every NIRF year loaded, newest first. */
export const getRankingYears = cache(async function getRankingYears(): Promise<number[]> {
  const list = await rows<{ year: unknown }>(sql`select distinct year from rankings where agency = ${AGENCY} order by year desc`);
  return list.map((r) => Number(r.year));
});

function splitUrls(url: string | null): string[] {
  return (url ?? "").split(/\s+/).filter((u) => /^https?:\/\//.test(u));
}

/** The lists published for one year, each with its size, its top three and its source. */
export const getRankingCategories = cache(async function getRankingCategories(year: number): Promise<RankingCategory[]> {
  const [summary, tops] = await Promise.all([
    rows<{ category: string; entries: unknown; exact: unknown; title: string | null; url: string | null; retrieved_on: string }>(sql`
      select r.category, count(*) as entries, sum(r.rank is not null) as exact,
        max(s.title) as title, max(s.url) as url, max(s.retrieved_on) as retrieved_on
      from rankings r join sources s on s.id = r.source_id
      where r.agency = ${AGENCY} and r.year = ${year}
      group by r.category
    `),
    rows<{ category: string; rank: number | null; rank_band: string | null; name: string; slug: string }>(sql`
      select r.category, r.rank, r.rank_band, i.name, i.slug
      from rankings r join institutions i on i.id = r.institution_id
      where r.agency = ${AGENCY} and r.year = ${year} and r.rank is not null and r.rank <= 3 and i.status = 'published'
      order by r.category, r.rank, i.name
    `),
  ]);
  return summary
    .map((s) => {
      const info = categoryInfo(s.category);
      return {
        category: s.category,
        slug: categorySlug(s.category),
        year,
        group: info.group,
        about: info.about,
        entries: Number(s.entries),
        exact: Number(s.exact ?? 0),
        top: tops
          .filter((t) => t.category === s.category)
          .slice(0, 3)
          .map((t) => ({ rank: t.rank, rankBand: t.rank_band, name: t.name, slug: t.slug })),
        source: s.retrieved_on ? { title: s.title, urls: splitUrls(s.url), retrievedOn: s.retrieved_on } : null,
      };
    })
    .sort((a, b) => orderOf(a.category) - orderOf(b.category) || a.category.localeCompare(b.category));
});

/** Every category name, with the years it is loaded for (newest first). */
export const getCategoryYears = cache(async function getCategoryYears(): Promise<Map<string, number[]>> {
  const list = await rows<{ category: string; year: unknown }>(sql`
    select distinct category, year from rankings where agency = ${AGENCY} order by year desc
  `);
  const out = new Map<string, number[]>();
  for (const r of list) out.set(r.category, [...(out.get(r.category) ?? []), Number(r.year)]);
  return out;
});

/** Find a category from its URL slug. */
export async function findCategory(slug: string): Promise<{ category: string; years: number[] } | null> {
  const all = await getCategoryYears();
  for (const [category, years] of all) if (categorySlug(category) === slug) return { category, years };
  return null;
}

export type RankingSeats = {
  /** Course short name, e.g. "MBBS". */
  course: string;
  /** Approved intake; null when the regulator's figure is missing or only partly published. */
  seats: number | null;
  academicYear: string | null;
  publisher: string | null;
};

export type PreviousRank = { rank: number | null; rankBand: string | null } | null;

export type RankingRow = {
  rank: number | null;
  rankBand: string | null;
  score: string | null;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  stateSlug: string | null;
  ownership: string | null;
  ownershipLabel: string | null;
  /** The college's entry in the previous year's list; undefined when no earlier year is loaded. */
  previous?: PreviousRank;
  /** Approved intake for the list's main course; undefined when the list has no main course. */
  seats?: RankingSeats | null;
};

export type SeatCoverage = {
  courses: string[];
  /** Colleges in the list with a complete seat figure. */
  recorded: number;
  publishers: { publisher: string; title: string | null; academicYear: string | null; url: string | null; retrievedOn: string }[];
};

export type RankingTable = {
  category: string;
  slug: string;
  year: number;
  /** The year compared against, when an earlier list for this category is loaded. */
  previousYear: number | null;
  years: number[];
  about: string;
  noun: string;
  source: RankingSource | null;
  rows: RankingRow[];
  /** Null when the list has no single main course (Overall, University and so on). */
  seats: SeatCoverage | null;
};

type RawRow = {
  institution_id: number;
  rank: number | null;
  rank_band: string | null;
  score: string | null;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  state_slug: string | null;
  ownership: string | null;
};

async function listRows(category: string, year: number) {
  return rows<RawRow>(sql`
    select r.institution_id, r.rank, r.rank_band, r.score, i.slug, i.name, coalesce(i.city, i.district) as city,
      st.name as state, st.slug as state_slug, i.ownership
    from rankings r join institutions i on i.id = r.institution_id
    left join states st on st.code = i.state_code
    where r.agency = ${AGENCY} and r.category = ${category} and r.year = ${year} and i.status = 'published'
  `);
}

/**
 * Approved intake for the list's main course at each ranked college, from the latest academic
 * year listed. A figure published only branch by branch counts only when every branch has one;
 * otherwise the sum would be a partial total, so it stays null and shows as "Not recorded".
 */
async function seatRows(category: string, year: number, courseSlugs: string[]) {
  return rows<{
    institution_id: number;
    course_slug: string;
    short_name: string;
    academic_year: string | null;
    seats: unknown;
    publisher: string | null;
    title: string | null;
    url: string | null;
    retrieved_on: string | null;
  }>(sql`
    with off as (
      select o.id, o.institution_id, o.academic_year, o.seats_source_id, c.slug as course_slug, c.short_name,
        case
          when o.seats is not null then o.seats
          when exists (select 1 from offering_branches b where b.offering_id = o.id)
            and not exists (select 1 from offering_branches b where b.offering_id = o.id and b.seats is null)
          then (select sum(b.seats) from offering_branches b where b.offering_id = o.id)
          else null
        end as seats,
        row_number() over (partition by o.institution_id, o.course_id order by o.academic_year is null, o.academic_year desc, o.id desc) as rn
      from offerings o join courses c on c.id = o.course_id
      where c.slug in (${sql.join(courseSlugs.map((c) => sql`${c}`), sql`, `)})
        and o.institution_id in (select institution_id from rankings where agency = ${AGENCY} and category = ${category} and year = ${year})
    )
    select off.institution_id, off.course_slug, off.short_name, off.academic_year, off.seats,
      s.publisher, s.title, s.url, s.retrieved_on
    from off left join sources s on s.id = off.seats_source_id
    where off.rn = 1
  `);
}

/** One NIRF list in full, with last year's entry and the main course's seats where we have them. */
export const getRankingTable = cache(async function getRankingTable(category: string, year: number): Promise<RankingTable | null> {
  const years = (await getCategoryYears()).get(category) ?? [];
  if (!years.includes(year)) return null;
  const previousYear = years.find((y) => y < year) ?? null;
  const courseSlugs = categoryInfo(category).courses ?? [];

  const [list, previous, [src], seats, courseNames] = await Promise.all([
    listRows(category, year),
    previousYear !== null
      ? rows<{ institution_id: number; rank: number | null; rank_band: string | null }>(sql`
          select institution_id, rank, rank_band from rankings where agency = ${AGENCY} and category = ${category} and year = ${previousYear}
        `)
      : Promise.resolve([]),
    rows<{ title: string | null; url: string | null; retrieved_on: string }>(sql`
      select s.title, s.url, s.retrieved_on from sources s
      where s.id = (select max(source_id) from rankings where agency = ${AGENCY} and category = ${category} and year = ${year})
    `),
    courseSlugs.length ? seatRows(category, year, courseSlugs) : Promise.resolve([]),
    courseSlugs.length
      ? rows<{ slug: string; short_name: string }>(sql`select slug, short_name from courses where slug in (${sql.join(courseSlugs.map((c) => sql`${c}`), sql`, `)})`)
      : Promise.resolve([]),
  ]);

  const prevBy = new Map(previous.map((p) => [p.institution_id, { rank: p.rank, rankBand: p.rank_band }]));
  // Per college, the first course in order of preference that has a complete figure, else the first offered.
  const seatBy = new Map<number, (typeof seats)[number]>();
  for (const slug of courseSlugs) {
    for (const s of seats) {
      if (s.course_slug !== slug) continue;
      const have = seatBy.get(s.institution_id);
      if (!have || (have.seats === null && s.seats !== null)) seatBy.set(s.institution_id, s);
    }
  }
  const hasSeatColumn = seats.length > 0;

  const out: RankingRow[] = list
    .map((r) => {
      const seat = seatBy.get(r.institution_id);
      const row: RankingRow = {
        rank: r.rank,
        rankBand: r.rank_band,
        score: r.score,
        slug: r.slug,
        name: r.name,
        city: r.city,
        state: r.state,
        stateSlug: r.state_slug,
        ownership: r.ownership,
        ownershipLabel: r.ownership ? own(OWNERSHIP_LABELS, r.ownership) ?? null : null,
      };
      if (previousYear !== null) row.previous = prevBy.get(r.institution_id) ?? null;
      if (hasSeatColumn) {
        row.seats = seat
          ? { course: seat.short_name, seats: num(seat.seats), academicYear: seat.academic_year, publisher: seat.publisher }
          : null;
      }
      return row;
    })
    .sort((a, b) => sortKey(a.rank, a.rankBand) - sortKey(b.rank, b.rankBand) || a.name.localeCompare(b.name));

  let seatCoverage: SeatCoverage | null = null;
  if (courseSlugs.length) {
    const used = [...seatBy.values()].filter((s) => num(s.seats) !== null);
    const pubs = new Map<string, SeatCoverage["publishers"][number]>();
    for (const s of used) {
      if (!s.publisher || !s.retrieved_on) continue;
      const key = `${s.publisher}|${s.title}|${s.academic_year}`;
      if (!pubs.has(key)) pubs.set(key, { publisher: s.publisher, title: s.title, academicYear: s.academic_year, url: s.url?.split(/\s+/)[0] ?? null, retrievedOn: s.retrieved_on });
    }
    seatCoverage = {
      courses: courseSlugs.map((c) => courseNames.find((n) => n.slug === c)?.short_name ?? c),
      recorded: used.length,
      publishers: [...pubs.values()],
    };
  }

  return {
    category,
    slug: categorySlug(category),
    year,
    previousYear,
    years,
    about: categoryInfo(category).about,
    noun: categoryInfo(category).noun,
    source: src ? { title: src.title, urls: splitUrls(src.url), retrievedOn: src.retrieved_on } : null,
    rows: out,
    seats: seatCoverage,
  };
});

export type RankingFilters = { state?: string; ownership?: string; q?: string };

/** Apply the page's filters. Unknown values filter nothing, so a stale link still shows the list. */
export function filterRows(list: RankingRow[], f: RankingFilters): RankingRow[] {
  const q = f.q?.toLowerCase();
  // "IIT", "NIT", "IIM" or "AIIMS" find institutions whose initials start that way.
  const short = q && /^[a-z]{2,8}$/.test(q) ? q : null;
  return list.filter(
    (r) =>
      (!f.state || r.stateSlug === f.state) &&
      (!f.ownership || r.ownership === f.ownership) &&
      (!q || r.name.toLowerCase().includes(q) || (r.city ?? "").toLowerCase().includes(q) || (short !== null && initialsOf(r.name).startsWith(short))),
  );
}

const MINOR_WORDS = new Set(["of", "and", "the", "for", "&"]);

function initialsOf(name: string): string {
  return name
    .toLowerCase()
    .split(/[^a-z&]+/)
    .filter((w) => w && !MINOR_WORDS.has(w))
    .map((w) => w[0])
    .join("");
}

export type FacetOption = { value: string; label: string; count: number };

/** States and ownership types present in a list, with how many entries each has. */
export function rankingFacets(list: RankingRow[]): { states: FacetOption[]; ownership: FacetOption[]; ownershipRecorded: number } {
  const states = new Map<string, FacetOption>();
  const owners = new Map<string, FacetOption>();
  for (const r of list) {
    if (r.stateSlug && r.state) {
      const s = states.get(r.stateSlug) ?? { value: r.stateSlug, label: r.state, count: 0 };
      s.count++;
      states.set(r.stateSlug, s);
    }
    if (r.ownership && r.ownershipLabel) {
      const o = owners.get(r.ownership) ?? { value: r.ownership, label: r.ownershipLabel, count: 0 };
      o.count++;
      owners.set(r.ownership, o);
    }
  }
  const ownershipRecorded = [...owners.values()].reduce((a, o) => a + o.count, 0);
  return {
    states: [...states.values()].sort((a, b) => a.label.localeCompare(b.label)),
    ownership: [...owners.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    ownershipRecorded,
  };
}

/** Path of a category page; the latest year has no year in its URL. */
export function rankingHref(slug: string, year?: number | null, latest?: number | null): string {
  return year && year !== latest ? `/rankings/${slug}?year=${year}` : `/rankings/${slug}`;
}

/**
 * Sitemap entries for every NIRF category page, one per loaded year (the latest year at its plain
 * URL). Call from app/sitemap.ts as `...(await rankingSitemapEntries(base))`.
 */
export async function rankingSitemapEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const root = base.replace(/\/$/, "");
  const list = await rows<{ category: string; year: unknown; retrieved_on: string | null }>(sql`
    select r.category, r.year, max(s.retrieved_on) as retrieved_on
    from rankings r join sources s on s.id = r.source_id
    where r.agency = ${AGENCY}
    group by r.category, r.year
  `);
  const latest = new Map<string, number>();
  for (const r of list) latest.set(r.category, Math.max(latest.get(r.category) ?? 0, Number(r.year)));
  return list
    .sort((a, b) => orderOf(a.category) - orderOf(b.category) || Number(b.year) - Number(a.year))
    .map((r) => {
      const year = Number(r.year);
      const isLatest = year === latest.get(r.category);
      return {
        url: `${root}${rankingHref(categorySlug(r.category), year, latest.get(r.category))}`,
        lastModified: r.retrieved_on ? new Date(`${r.retrieved_on}T00:00:00Z`) : undefined,
        changeFrequency: "monthly" as const,
        priority: isLatest ? 0.7 : 0.4,
      };
    });
}
