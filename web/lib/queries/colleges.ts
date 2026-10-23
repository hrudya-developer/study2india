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

export const PAGE_SIZE = 20;

export type CollegeFilters = {
  stream?: string;
  course?: string;
  state?: string;
  ownership?: string;
  ranked?: boolean;
  q?: string;
  sort?: "relevance" | "rank" | "name";
  page?: number;
};

export type CollegeCard = {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  ownership: string | null;
  establishedYear: number | null;
  approvals: string[] | null;
  naacGrade: string | null;
  isPartner: boolean;
  streams: string[];
  rankings: { category: string; year: number; rank: number | null; rankBand: string | null }[];
  offering: {
    seats: number | null;
    fees: { quota: string | null; amount: string | null; basis: string | null }[];
  } | null;
};

export type CourseContext = { slug: string; short: string; streamSlug: string; streamName: string; offeringRows: number };

export async function getCourseContext(courseSlug: string): Promise<CourseContext | null> {
  const [r] = await rows<{ slug: string; short_name: string; stream_slug: string; stream_name: string; offering_rows: unknown }>(sql`
    select c.slug, c.short_name, s.slug as stream_slug, s.name as stream_name,
      (select count(*) from offerings o where o.course_id = c.id) as offering_rows
    from courses c join streams s on s.id = c.stream_id where c.slug = ${courseSlug}
  `);
  return r ? { slug: r.slug, short: r.short_name, streamSlug: r.stream_slug, streamName: r.stream_name, offeringRows: Number(r.offering_rows) } : null;
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
  if (f.state) where.push(sql`st.slug = ${f.state}`);
  if (f.ownership && OWNERSHIP_LABELS[f.ownership]) where.push(sql`i.ownership = ${f.ownership}`);
  if (f.ranked) where.push(sql`exists (select 1 from rankings r where r.institution_id = i.id)`);
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, "")}%`;
    where.push(sql`(i.name like ${like} or i.city like ${like} or i.district like ${like})`);
  }

  const whereSql = sql.join(where, sql` and `);
  const page = Math.max(1, f.page ?? 1);
  const bestRank = sql`(select min(r.rank) from rankings r where r.institution_id = i.id and r.rank is not null)`;
  const order =
    f.sort === "name"
      ? sql`i.name asc`
      : f.sort === "rank"
        ? sql`${bestRank} is null, ${bestRank} asc, i.name asc`
        : sql`i.is_partner desc, ${bestRank} is null, ${bestRank} asc, i.name asc`;

  const [total] = await rows<{ n: unknown }>(sql`
    select count(*) as n from institutions i left join states st on st.code = i.state_code where ${whereSql}
  `);

  const base = await rows<{
    id: number;
    slug: string;
    name: string;
    city: string | null;
    state: string | null;
    ownership: string | null;
    established_year: number | null;
    approvals: unknown;
    naac_grade: string | null;
    is_partner: number | boolean;
  }>(sql`
    select i.id, i.slug, i.name, coalesce(i.city, i.district) as city, st.name as state, i.ownership, i.established_year, i.approvals, i.naac_grade, i.is_partner
    from institutions i
    left join states st on st.code = i.state_code
    where ${whereSql}
    order by ${order}
    limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}
  `);

  const ids = base.map((b) => b.id);
  const idList = ids.length ? sql.join(ids.map((x) => sql`${x}`), sql`, `) : sql`0`;

  const [rankRows, streamRows, offeringRows] = await Promise.all([
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
    useOffering && course
      ? rows<{ institution_id: number; seats: number | null; quota: string | null; amount: string | null; basis: string | null }>(sql`
          select o.institution_id,
            coalesce(o.seats, (select sum(b.seats) from offering_branches b where b.offering_id = o.id)) as seats,
            fe.quota, fe.amount_inr as amount, fe.basis
          from offerings o
          join courses c on c.id = o.course_id
          left join offering_fees fe on fe.offering_id = o.id and fe.component = 'tuition'
          where o.institution_id in (${idList}) and c.slug = ${course.slug}
        `)
      : Promise.resolve([]),
  ]);

  const items: CollegeCard[] = base.map((r) => {
    const off = offeringRows.filter((o) => o.institution_id === r.id);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      city: r.city,
      state: r.state,
      ownership: r.ownership,
      establishedYear: r.established_year,
      approvals: parseJson<string[] | null>(r.approvals, null),
      naacGrade: r.naac_grade,
      isPartner: !!r.is_partner,
      streams: streamRows.filter((s) => s.institution_id === r.id).map((s) => s.name),
      rankings: rankRows
        .filter((k) => k.institution_id === r.id)
        .map((k) => ({ category: k.category, year: Number(k.year), rank: k.rank, rankBand: k.rank_band })),
      offering: off.length
        ? { seats: off[0].seats === null ? null : Number(off[0].seats), fees: off.filter((o) => o.amount !== null).map((o) => ({ quota: o.quota, amount: o.amount, basis: o.basis })) }
        : null,
    };
  });

  const count = Number(total?.n ?? 0);
  return { items, total: count, page, pageCount: Math.max(1, Math.ceil(count / PAGE_SIZE)), courseFallback: !!course && !useOffering };
}

export type FacetOption = { value: string; label: string; count: number };

export async function getCollegeFacets(): Promise<{ streams: FacetOption[]; states: FacetOption[]; ownership: FacetOption[] }> {
  const [streamList, stateList, ownershipList] = await Promise.all([
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
  ]);
  return {
    streams: streamList.map((s) => ({ value: s.slug, label: s.name, count: Number(s.n) })),
    states: stateList.map((s) => ({ value: s.slug, label: s.name, count: Number(s.n) })),
    ownership: Object.entries(OWNERSHIP_LABELS).map(([value, label]) => ({
      value,
      label,
      count: Number(ownershipList.find((o) => o.ownership === value)?.n ?? 0),
    })),
  };
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
