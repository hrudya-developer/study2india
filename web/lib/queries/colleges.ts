import { sql, type SQL } from "drizzle-orm";
import { rows } from "@/lib/db";

export const OWNERSHIP_LABELS: Record<string, string> = {
  government: "Government",
  private: "Private",
  deemed: "Deemed university",
  central: "Central",
  state_university: "State university",
  autonomous: "Autonomous",
  public_private: "Public private partnership",
  aided: "Government aided",
};

/** The regulators whose lists we load, with how each one's listing should be worded. */
export const APPROVAL_BODIES: Record<string, { label: string; badge: string; full: string }> = {
  AICTE: { label: "AICTE", badge: "AICTE approved", full: "All India Council for Technical Education" },
  NMC: { label: "NMC", badge: "NMC listed", full: "National Medical Commission" },
  INC: { label: "INC", badge: "INC listed", full: "Indian Nursing Council" },
  NCISM: { label: "NCISM", badge: "NCISM permitted", full: "National Commission for Indian System of Medicine" },
  NCH: { label: "NCH", badge: "NCH permitted", full: "National Commission for Homoeopathy" },
  PCI: { label: "PCI", badge: "PCI approved", full: "Pharmacy Council of India" },
  DCI: { label: "DCI", badge: "DCI recognised", full: "Dental Council of India" },
  COA: { label: "COA", badge: "COA approved", full: "Council of Architecture" },
  BCI: { label: "BCI", badge: "BCI approved", full: "Bar Council of India" },
  NCTE: { label: "NCTE", badge: "NCTE recognised", full: "National Council for Teacher Education" },
  VCI: { label: "VCI", badge: "VCI recognised", full: "Veterinary Council of India" },
};

export const LEVEL_LABELS: Record<string, string> = {
  ug: "Undergraduate",
  pg: "Postgraduate",
  diploma: "Diploma",
  doctorate: "Doctorate",
  certificate: "Certificate",
  integrated: "Integrated",
};

export const SORTS = {
  relevance: "Recommended",
  rank: "Best NIRF rank",
  seats: "Most seats",
  name: "Name, A to Z",
} as const;
export type SortKey = keyof typeof SORTS;

export const PAGE_SIZE = 20;

export type CollegeFilters = {
  stream?: string;
  course?: string;
  level?: string;
  state?: string;
  city?: string;
  ownership: string[];
  approval: string[];
  ranked?: boolean;
  q?: string;
  sort: SortKey;
  page: number;
};

export type CardCourse = { slug: string; short: string; level: string; seats: number | null; branches: number };

export type CollegeCard = {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  ownership: string | null;
  establishedYear: number | null;
  affiliatingUniversity: string | null;
  approvals: string[] | null;
  naacGrade: string | null;
  isPartner: boolean;
  streams: string[];
  rankings: { category: string; year: number; rank: number | null; rankBand: string | null }[];
  /** Current intake, latest academic year per course, largest first. */
  courses: CardCourse[];
  totalSeats: number | null;
  academicYear: string | null;
  source: { publisher: string; short: string } | null;
  /** The picked course's row, when the list is filtered by course. */
  offering: {
    seats: number | null;
    fees: { quota: string | null; amount: string | null; basis: string | null }[];
  } | null;
};

export type CourseContext = { slug: string; short: string; level: string; streamSlug: string; streamName: string; offeringRows: number };

export async function getCourseContext(courseSlug: string): Promise<CourseContext | null> {
  const [r] = await rows<{ slug: string; short_name: string; level: string; stream_slug: string; stream_name: string; offering_rows: unknown }>(sql`
    select c.slug, c.short_name, c.level, s.slug as stream_slug, s.name as stream_name,
      (select count(*) from offerings o where o.course_id = c.id) as offering_rows
    from courses c join streams s on s.id = c.stream_id where c.slug = ${courseSlug}
  `);
  return r
    ? { slug: r.slug, short: r.short_name, level: r.level, streamSlug: r.stream_slug, streamName: r.stream_name, offeringRows: Number(r.offering_rows) }
    : null;
}

function parseJson<T>(v: unknown, fallback: T): T {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return v as T;
}

/** Short name for a source publisher, as students know it. */
export function publisherShort(publisher: string): string {
  const p = publisher.toLowerCase();
  if (p.startsWith("nirf")) return "NIRF";
  for (const [code, b] of Object.entries(APPROVAL_BODIES)) if (p.startsWith(b.full.toLowerCase())) return code;
  return publisher;
}

/**
 * Only the latest academic year of each course counts, so a course listed in two years
 * is not counted twice. Seats fall back to the sum of branch intakes when the regulator lists only those.
 */
const CURRENT_OFFERING = sql`not exists (select 1 from offerings o2 where o2.institution_id = o.institution_id and o2.course_id = o.course_id and o2.academic_year > o.academic_year)`;
const OFFERING_SEATS = sql`coalesce(o.seats, (select sum(b.seats) from offering_branches b where b.offering_id = o.id))`;

/**
 * When a course is asked for but no course-level offerings are loaded yet, we fall back to the
 * course's field of study and say so on the page, rather than claiming the course is offered.
 */
export async function searchColleges(f: CollegeFilters, course: CourseContext | null) {
  const where: SQL[] = [sql`i.status = 'published'`];
  const useOffering = !!course && course.offeringRows > 0;
  const streamSlug = f.stream || (course && !useOffering ? course.streamSlug : undefined);

  if (streamSlug) {
    where.push(sql`exists (select 1 from institution_streams x join streams s on s.id = x.stream_id where x.institution_id = i.id and s.slug = ${streamSlug})`);
  }
  if (useOffering && course) {
    where.push(sql`exists (select 1 from offerings o join courses c on c.id = o.course_id where o.institution_id = i.id and c.slug = ${course.slug})`);
  }
  if (f.level && LEVEL_LABELS[f.level]) {
    where.push(sql`exists (select 1 from offerings o join courses c on c.id = o.course_id where o.institution_id = i.id and c.level = ${f.level})`);
  }
  if (f.state) where.push(sql`st.slug = ${f.state}`);
  if (f.state && f.city) where.push(sql`coalesce(i.city, i.district) = ${f.city}`);
  const owners = f.ownership.filter((o) => OWNERSHIP_LABELS[o]);
  if (owners.length) where.push(sql`i.ownership in (${sql.join(owners.map((o) => sql`${o}`), sql`, `)})`);
  const bodies = f.approval.filter((a) => APPROVAL_BODIES[a]);
  if (bodies.length) {
    where.push(sql`(${sql.join(bodies.map((a) => sql`json_contains(i.approvals, json_quote(${a}))`), sql` or `)})`);
  }
  if (f.ranked) where.push(sql`exists (select 1 from rankings r where r.institution_id = i.id)`);
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, "")}%`;
    where.push(sql`(i.name like ${like} or i.city like ${like} or i.district like ${like})`);
  }

  const whereSql = sql.join(where, sql` and `);
  const page = Math.max(1, f.page);
  const bestRank = sql`(select min(r.rank) from rankings r where r.institution_id = i.id and r.rank is not null)`;
  const seats =
    useOffering && course
      ? sql`(select sum(${OFFERING_SEATS}) from offerings o join courses c on c.id = o.course_id where o.institution_id = i.id and c.slug = ${course.slug} and ${CURRENT_OFFERING})`
      : sql`(select sum(${OFFERING_SEATS}) from offerings o where o.institution_id = i.id and ${CURRENT_OFFERING})`;
  const order =
    f.sort === "name"
      ? sql`i.name asc`
      : f.sort === "rank"
        ? sql`${bestRank} is null, ${bestRank} asc, i.name asc`
        : f.sort === "seats"
          ? sql`${seats} is null, ${seats} desc, i.name asc`
          : sql`i.is_partner desc, ${bestRank} is null, ${bestRank} asc, ${seats} desc, i.name asc`;

  const [[total], base] = await Promise.all([
    rows<{ n: unknown }>(sql`
      select count(*) as n from institutions i left join states st on st.code = i.state_code where ${whereSql}
    `),
    rows<{
      id: number;
      slug: string;
      name: string;
      city: string | null;
      state: string | null;
      ownership: string | null;
      established_year: number | null;
      affiliating_university: string | null;
      approvals: unknown;
      naac_grade: string | null;
      is_partner: number | boolean;
      publisher: string | null;
    }>(sql`
      select i.id, i.slug, i.name, coalesce(i.city, i.district) as city, st.name as state, i.ownership, i.established_year,
        i.affiliating_university, i.approvals, i.naac_grade, i.is_partner, s.publisher
      from institutions i
      left join states st on st.code = i.state_code
      left join sources s on s.id = i.source_id
      where ${whereSql}
      order by ${order}
      limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}
    `),
  ]);

  const ids = base.map((b) => b.id);
  const idList = ids.length ? sql.join(ids.map((x) => sql`${x}`), sql`, `) : sql`0`;

  const [rankRows, streamRows, courseRows, offeringRows] = await Promise.all([
    rows<{ institution_id: number; category: string; year: number; rank: number | null; rank_band: string | null }>(sql`
      select r.institution_id, r.category, r.year, r.rank, r.rank_band
      from rankings r
      where r.institution_id in (${idList})
        and r.year = (select max(r2.year) from rankings r2 where r2.institution_id = r.institution_id)
      order by r.rank is null, r.rank
    `),
    rows<{ institution_id: number; name: string }>(sql`
      select x.institution_id, s.name from institution_streams x join streams s on s.id = x.stream_id
      where x.institution_id in (${idList}) order by s.sort_order
    `),
    rows<{ institution_id: number; slug: string; short_name: string; level: string; academic_year: string | null; seats: unknown; branches: unknown }>(sql`
      select o.institution_id, c.slug, c.short_name, c.level, o.academic_year, ${OFFERING_SEATS} as seats,
        (select count(*) from offering_branches b where b.offering_id = o.id) as branches
      from offerings o join courses c on c.id = o.course_id
      where o.institution_id in (${idList}) and ${CURRENT_OFFERING}
    `),
    useOffering && course
      ? rows<{ institution_id: number; seats: unknown; quota: string | null; amount: string | null; basis: string | null }>(sql`
          select o.institution_id, ${OFFERING_SEATS} as seats, fe.quota, fe.amount_inr as amount, fe.basis
          from offerings o
          join courses c on c.id = o.course_id
          left join offering_fees fe on fe.offering_id = o.id and fe.component = 'tuition'
          where o.institution_id in (${idList}) and c.slug = ${course.slug} and ${CURRENT_OFFERING}
        `)
      : Promise.resolve([]),
  ]);

  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

  const items: CollegeCard[] = base.map((r) => {
    const off = offeringRows.filter((o) => o.institution_id === r.id);
    const courses = courseRows
      .filter((c) => c.institution_id === r.id)
      .map((c) => ({ slug: c.slug, short: c.short_name, level: c.level, seats: num(c.seats), branches: Number(c.branches), year: c.academic_year }))
      .sort((a, b) => (b.seats ?? -1) - (a.seats ?? -1));
    const known = courses.filter((c) => c.seats !== null);
    const years = courses.map((c) => c.year).filter((y): y is string => !!y).sort();
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      city: r.city,
      state: r.state,
      ownership: r.ownership,
      establishedYear: r.established_year,
      affiliatingUniversity: r.affiliating_university,
      approvals: parseJson<string[] | null>(r.approvals, null),
      naacGrade: r.naac_grade,
      isPartner: !!r.is_partner,
      streams: streamRows.filter((s) => s.institution_id === r.id).map((s) => s.name),
      rankings: rankRows
        .filter((k) => k.institution_id === r.id)
        .map((k) => ({ category: k.category, year: Number(k.year), rank: k.rank, rankBand: k.rank_band })),
      courses: courses.map(({ slug, short, level, seats, branches }) => ({ slug, short, level, seats, branches })),
      totalSeats: known.length ? known.reduce((n, c) => n + (c.seats ?? 0), 0) : null,
      academicYear: years.length ? years[years.length - 1] : null,
      source: r.publisher ? { publisher: r.publisher, short: publisherShort(r.publisher) } : null,
      offering: off.length
        ? {
            // One current row per course; fee rows repeat it once per quota, so read the first.
            seats: num(off[0].seats),
            fees: off.filter((o) => o.amount !== null).map((o) => ({ quota: o.quota, amount: o.amount, basis: o.basis })),
          }
        : null,
    };
  });

  const count = Number(total?.n ?? 0);
  return { items, total: count, page, pageCount: Math.max(1, Math.ceil(count / PAGE_SIZE)), courseFallback: !!course && !useOffering };
}

type RawParams = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string | undefined {
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s.slice(0, 120) : undefined;
}

/** Every value of a repeatable parameter; also accepts comma separated values. */
function allParams(v: string | string[] | undefined): string[] {
  const list = (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(","));
  return [...new Set(list.map((x) => x.trim()).filter(Boolean))].slice(0, 10);
}

export function readCollegeFilters(p: RawParams): CollegeFilters {
  const sort = firstParam(p.sort);
  const pageNum = Number(firstParam(p.page));
  return {
    stream: firstParam(p.stream),
    course: firstParam(p.course),
    level: firstParam(p.level),
    state: firstParam(p.state),
    city: firstParam(p.city),
    ownership: allParams(p.ownership).filter((o) => OWNERSHIP_LABELS[o]),
    approval: allParams(p.approval)
      .map((a) => a.toUpperCase())
      .filter((a) => APPROVAL_BODIES[a]),
    ranked: firstParam(p.ranked) === "1",
    q: firstParam(p.q),
    sort: sort && sort in SORTS ? (sort as SortKey) : "relevance",
    page: Number.isInteger(pageNum) && pageNum > 0 && pageNum < 10000 ? pageNum : 1,
  };
}

/** The listing URL for a set of filters, with empty values dropped so links stay short and shareable. */
export function collegesHref(f: Partial<CollegeFilters>, path = "/colleges"): string {
  const u = new URLSearchParams();
  const one = (k: string, v: string | undefined | null) => {
    if (v) u.append(k, v);
  };
  one("q", f.q);
  one("stream", f.stream);
  one("course", f.course);
  one("level", f.level);
  one("state", f.state);
  if (f.state) one("city", f.city);
  for (const o of f.ownership ?? []) u.append("ownership", o);
  for (const a of f.approval ?? []) u.append("approval", a);
  if (f.ranked) u.set("ranked", "1");
  if (f.sort && f.sort !== "relevance") u.set("sort", f.sort);
  if (f.page && f.page > 1) u.set("page", String(f.page));
  const s = u.toString();
  return s ? `${path}?${s}` : path;
}

export type FacetOption = { value: string; label: string; count: number };
export type CourseFacet = FacetOption & { streamSlug: string; streamName: string; level: string };
export type CollegeFacets = {
  streams: FacetOption[];
  states: FacetOption[];
  ownership: FacetOption[];
  approvals: FacetOption[];
  levels: FacetOption[];
  courses: CourseFacet[];
};

// The facet counts change only when data is loaded, so a short in-process memo saves four
// aggregate queries on every listing request.
const FACET_TTL_MS = 10 * 60 * 1000;
const memo = globalThis as unknown as { collegeFacets?: { at: number; value: Promise<CollegeFacets> }; cityFacets?: Map<string, { at: number; value: Promise<FacetOption[]> }> };

async function loadFacets(): Promise<CollegeFacets> {
  const [streamList, stateList, ownershipList, approvalList, levelList, courseList] = await Promise.all([
    rows<{ slug: string; name: string; n: unknown }>(sql`
      select s.slug, s.name, count(i.id) as n
      from streams s
      left join institution_streams x on x.stream_id = s.id
      left join institutions i on i.id = x.institution_id and i.status = 'published'
      group by s.slug, s.name, s.sort_order order by s.sort_order
    `),
    rows<{ slug: string; name: string; n: unknown }>(sql`
      select st.slug, st.name, count(i.id) as n
      from states st left join institutions i on i.state_code = st.code and i.status = 'published'
      group by st.slug, st.name order by st.name
    `),
    rows<{ ownership: string; n: unknown }>(sql`
      select ownership, count(*) as n from institutions where status = 'published' and ownership is not null group by ownership
    `),
    rows<{ body: string; n: unknown }>(sql`
      select j.body, count(*) as n
      from institutions i, json_table(i.approvals, '$[*]' columns (body varchar(20) path '$')) j
      where i.status = 'published' group by j.body
    `),
    rows<{ level: string; n: unknown }>(sql`
      select c.level, count(distinct o.institution_id) as n
      from offerings o join courses c on c.id = o.course_id join institutions i on i.id = o.institution_id and i.status = 'published'
      group by c.level
    `),
    rows<{ slug: string; short_name: string; level: string; stream_slug: string; stream_name: string; n: unknown }>(sql`
      select c.slug, c.short_name, c.level, s.slug as stream_slug, s.name as stream_name,
        (select count(distinct o.institution_id) from offerings o join institutions i on i.id = o.institution_id and i.status = 'published' where o.course_id = c.id) as n
      from courses c join streams s on s.id = c.stream_id
      order by s.sort_order, c.sort_order
    `),
  ]);
  return {
    streams: streamList.map((s) => ({ value: s.slug, label: s.name, count: Number(s.n) })),
    states: stateList.map((s) => ({ value: s.slug, label: s.name, count: Number(s.n) })),
    ownership: Object.entries(OWNERSHIP_LABELS)
      .map(([value, label]) => ({ value, label, count: Number(ownershipList.find((o) => o.ownership === value)?.n ?? 0) }))
      .filter((o) => o.count > 0),
    approvals: Object.entries(APPROVAL_BODIES)
      .map(([value, b]) => ({ value, label: b.label, count: Number(approvalList.find((a) => a.body === value)?.n ?? 0) }))
      .filter((o) => o.count > 0),
    levels: Object.entries(LEVEL_LABELS)
      .map(([value, label]) => ({ value, label, count: Number(levelList.find((l) => l.level === value)?.n ?? 0) }))
      .filter((o) => o.count > 0),
    courses: courseList.map((c) => ({
      value: c.slug,
      label: c.short_name,
      count: Number(c.n),
      level: c.level,
      streamSlug: c.stream_slug,
      streamName: c.stream_name,
    })),
  };
}

export function getCollegeFacets(): Promise<CollegeFacets> {
  const hit = memo.collegeFacets;
  if (hit && Date.now() - hit.at < FACET_TTL_MS) return hit.value;
  const value = loadFacets();
  memo.collegeFacets = { at: Date.now(), value };
  value.catch(() => {
    if (memo.collegeFacets?.value === value) memo.collegeFacets = undefined;
  });
  return value;
}

/** Districts or cities within a state, as the regulators spell them. */
export function getCityFacets(stateSlug: string): Promise<FacetOption[]> {
  memo.cityFacets ??= new Map();
  const hit = memo.cityFacets.get(stateSlug);
  if (hit && Date.now() - hit.at < FACET_TTL_MS) return hit.value;
  const value = rows<{ city: string; n: unknown }>(sql`
    select coalesce(i.city, i.district) as city, count(*) as n
    from institutions i join states st on st.code = i.state_code
    where i.status = 'published' and st.slug = ${stateSlug} and coalesce(i.city, i.district) is not null
    group by city order by city
  `).then((list) => list.map((c) => ({ value: c.city, label: c.city, count: Number(c.n) })));
  memo.cityFacets.set(stateSlug, { at: Date.now(), value });
  value.catch(() => memo.cityFacets?.delete(stateSlug));
  return value;
}

/** A short name search for picking colleges to compare. */
export async function findCollegesByName(q: string, limit = 8) {
  const like = `%${q.replace(/[%_\\]/g, "").slice(0, 80)}%`;
  return rows<{ slug: string; name: string; city: string | null; state: string | null }>(sql`
    select i.slug, i.name, coalesce(i.city, i.district) as city, st.name as state
    from institutions i left join states st on st.code = i.state_code
    where i.status = 'published' and (i.name like ${like} or i.city like ${like} or i.district like ${like})
    order by (select min(r.rank) from rankings r where r.institution_id = i.id) is null,
      (select min(r.rank) from rankings r where r.institution_id = i.id), i.name
    limit ${limit}
  `);
}

export function formatInr(amount: string | number | null): string | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const v = Number(amount);
  if (!Number.isFinite(v)) return null;
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export const FEE_BASIS_LABELS: Record<string, string> = {
  per_year: "per year",
  whole_course: "for the whole course",
  per_semester: "per semester",
  one_time: "one time",
};

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}
