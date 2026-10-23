import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";

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

export type SourceRef = { publisher: string; title: string | null; url: string | null; retrievedOn: string };

export type CollegeDetail = {
  id: number;
  slug: string;
  name: string;
  aliases: string[];
  ownership: string | null;
  establishedYear: number | null;
  affiliatingUniversity: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  stateSlug: string | null;
  pin: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  approvals: string[];
  naacGrade: string | null;
  isPartner: boolean;
  updatedAt: string;
  source: SourceRef | null;
  streams: { slug: string; name: string }[];
  rankings: { agency: string; year: number; category: string; rank: number | null; rankBand: string | null; score: string | null; source: SourceRef }[];
  offerings: {
    id: number;
    courseSlug: string;
    courseShort: string;
    courseName: string;
    level: string;
    duration: string | null;
    academicYear: string | null;
    seats: number | null;
    seatsSource: SourceRef | null;
    fees: { quota: string | null; component: string; amount: string | null; basis: string | null; source: SourceRef | null }[];
  }[];
  cutoffs: { offeringId: number; exam: string; year: number; round: string | null; quota: string | null; category: string | null; openingRank: number | null; closingRank: number | null; source: SourceRef }[];
};

type SrcRow = { s_publisher: string | null; s_title: string | null; s_url: string | null; s_retrieved: string | null };
const src = (r: SrcRow): SourceRef | null => (r.s_publisher ? { publisher: r.s_publisher, title: r.s_title, url: r.s_url, retrievedOn: r.s_retrieved ?? "" } : null);

export async function getCollege(slug: string): Promise<CollegeDetail | null> {
  const [c] = await rows<Record<string, unknown> & SrcRow>(sql`
    select i.*, st.name as state_name, st.slug as state_slug,
      s.publisher as s_publisher, s.title as s_title, s.url as s_url, s.retrieved_on as s_retrieved
    from institutions i
    left join states st on st.code = i.state_code
    left join sources s on s.id = i.source_id
    where i.slug = ${slug} and i.status = 'published'
  `);
  if (!c) return null;
  const id = Number(c.id);

  const [streamRows, rankRows, offeringRows, feeRows, cutoffRows] = await Promise.all([
    rows<{ slug: string; name: string }>(sql`
      select s.slug, s.name from institution_streams x join streams s on s.id = x.stream_id where x.institution_id = ${id} order by s.sort_order
    `),
    rows<{ agency: string; year: number; category: string; rank: number | null; rank_band: string | null; score: string | null } & SrcRow>(sql`
      select r.agency, r.year, r.category, r.rank, r.rank_band, r.score,
        s.publisher as s_publisher, s.title as s_title, s.url as s_url, s.retrieved_on as s_retrieved
      from rankings r join sources s on s.id = r.source_id
      where r.institution_id = ${id}
      order by r.year desc, r.rank is null, r.rank
    `),
    rows<{ id: number; slug: string; short_name: string; name: string; level: string; duration_text: string | null; academic_year: string | null; seats: number | null } & SrcRow>(sql`
      select o.id, c.slug, c.short_name, c.name, c.level, c.duration_text, o.academic_year, o.seats,
        s.publisher as s_publisher, s.title as s_title, s.url as s_url, s.retrieved_on as s_retrieved
      from offerings o join courses c on c.id = o.course_id
      left join sources s on s.id = o.seats_source_id
      where o.institution_id = ${id}
      order by c.level, c.sort_order
    `),
    rows<{ offering_id: number; quota: string | null; component: string; amount_inr: string | null; basis: string | null } & SrcRow>(sql`
      select fe.offering_id, fe.quota, fe.component, fe.amount_inr, fe.basis,
        s.publisher as s_publisher, s.title as s_title, s.url as s_url, s.retrieved_on as s_retrieved
      from offering_fees fe join offerings o on o.id = fe.offering_id
      left join sources s on s.id = fe.source_id
      where o.institution_id = ${id}
    `),
    rows<{ offering_id: number; exam: string; year: number; round: string | null; quota: string | null; category: string | null; opening_rank: number | null; closing_rank: number | null } & SrcRow>(sql`
      select cu.offering_id, e.short_name as exam, cu.year, cu.round, cu.quota, cu.category, cu.opening_rank, cu.closing_rank,
        s.publisher as s_publisher, s.title as s_title, s.url as s_url, s.retrieved_on as s_retrieved
      from cutoffs cu join offerings o on o.id = cu.offering_id join exams e on e.id = cu.exam_id
      join sources s on s.id = cu.source_id
      where o.institution_id = ${id}
      order by cu.year desc, cu.round
    `),
  ]);

  return {
    id,
    slug: String(c.slug),
    name: String(c.name),
    aliases: parseJson<string[]>(c.aliases, []),
    ownership: (c.ownership as string | null) ?? null,
    establishedYear: (c.established_year as number | null) ?? null,
    affiliatingUniversity: (c.affiliating_university as string | null) ?? null,
    address: (c.address as string | null) ?? null,
    city: (c.city as string | null) ?? null,
    district: (c.district as string | null) ?? null,
    state: (c.state_name as string | null) ?? null,
    stateSlug: (c.state_slug as string | null) ?? null,
    pin: (c.pin as string | null) ?? null,
    website: (c.website as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    email: (c.email as string | null) ?? null,
    approvals: parseJson<string[]>(c.approvals, []),
    naacGrade: (c.naac_grade as string | null) ?? null,
    isPartner: !!c.is_partner,
    updatedAt: String(c.updated_at),
    source: src(c),
    streams: streamRows,
    rankings: rankRows.map((r) => ({
      agency: r.agency,
      year: Number(r.year),
      category: r.category,
      rank: r.rank,
      rankBand: r.rank_band,
      score: r.score,
      source: src(r)!,
    })),
    offerings: offeringRows.map((o) => ({
      id: o.id,
      courseSlug: o.slug,
      courseShort: o.short_name,
      courseName: o.name,
      level: o.level,
      duration: o.duration_text,
      academicYear: o.academic_year,
      seats: o.seats,
      seatsSource: src(o),
      fees: feeRows
        .filter((f) => f.offering_id === o.id)
        .map((f) => ({ quota: f.quota, component: f.component, amount: f.amount_inr, basis: f.basis, source: src(f) })),
    })),
    cutoffs: cutoffRows.map((x) => ({
      offeringId: x.offering_id,
      exam: x.exam,
      year: Number(x.year),
      round: x.round,
      quota: x.quota,
      category: x.category,
      openingRank: x.opening_rank,
      closingRank: x.closing_rank,
      source: src(x)!,
    })),
  };
}

export async function getSimilarColleges(c: CollegeDetail, limit = 5) {
  const streamSlugs = c.streams.map((s) => s.slug);
  const streamFilter = streamSlugs.length
    ? sql`and exists (select 1 from institution_streams x join streams s on s.id = x.stream_id where x.institution_id = i.id and s.slug in (${sql.join(streamSlugs.map((s) => sql`${s}`), sql`, `)}))`
    : sql``;
  return rows<{ slug: string; name: string; city: string | null; state: string | null }>(sql`
    select i.slug, i.name, i.city, st.name as state
    from institutions i left join states st on st.code = i.state_code
    where i.status = 'published' and i.id <> ${c.id} ${streamFilter}
    order by (st.slug = ${c.stateSlug ?? ""}) desc,
      (select min(r.rank) from rankings r where r.institution_id = i.id) is null,
      (select min(r.rank) from rankings r where r.institution_id = i.id)
    limit ${limit}
  `);
}
