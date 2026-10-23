import { cache } from "react";
import { sql, type SQL } from "drizzle-orm";
import { rows } from "@/lib/db";
import { CURRENT_OFFERING, publisherShort } from "@/lib/queries/colleges";

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

export type CollegeExam = { slug: string; short: string; name: string; body: string; level: string; forLevel: string; streams: string[] };

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
  /** The latest academic year of each course only. */
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
    /** Branches with their own intake (MD General Medicine...), as the regulator lists them. */
    branches: { name: string; seats: number | null }[];
    fees: { quota: string | null; component: string; amount: string | null; basis: string | null; source: SourceRef | null }[];
  }[];
  cutoffs: { offeringId: number; exam: string; year: number; round: string | null; quota: string | null; category: string | null; openingRank: number | null; closingRank: number | null; source: SourceRef }[];
  /** National (and the home state's) entrance exams for the fields and levels this college teaches. */
  exams: CollegeExam[];
  /** Every official document behind the figures on the page. */
  sources: (SourceRef & { usedFor: string[] })[];
};

type SrcRow = { s_publisher: string | null; s_title: string | null; s_url: string | null; s_retrieved: string | null };
const src = (r: SrcRow): SourceRef | null => (r.s_publisher ? { publisher: r.s_publisher, title: r.s_title, url: r.s_url, retrievedOn: r.s_retrieved ?? "" } : null);

/**
 * Which exams to show for which colleges. State exams only for colleges in that state, JEE Advanced
 * only for the IITs; the rest when the college teaches the exam's field at the matching level.
 * The page says these are the exams for the field, not that this college uses them.
 */
const EXAM_RULES: Record<string, { levels: string[]; state?: string; namePattern?: RegExp }> = {
  "neet-ug": { levels: ["ug", "integrated"] },
  "neet-pg": { levels: ["pg"] },
  "neet-mds": { levels: ["pg"] },
  "jee-main": { levels: ["ug", "integrated"] },
  "jee-advanced": { levels: ["ug", "integrated"], namePattern: /Indian Institute of Technology/i },
  gate: { levels: ["pg", "doctorate"] },
  keam: { levels: ["ug", "integrated"], state: "KL" },
  kcet: { levels: ["ug", "integrated"], state: "KA" },
  "cuet-ug": { levels: ["ug", "integrated"] },
  cat: { levels: ["pg"] },
  clat: { levels: ["ug", "integrated", "pg"] },
  nata: { levels: ["ug"] },
  uceed: { levels: ["ug"] },
  "nchm-jee": { levels: ["ug"] },
  gpat: { levels: ["pg"] },
};

/** One database read per request: generateMetadata and the page both ask for the same college. */
export const getCollege = cache(loadCollege);

async function loadCollege(slug: string): Promise<CollegeDetail | null> {
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

  const [streamRows, rankRows, offeringRows, feeRows, cutoffRows, branchRows, examRows] = await Promise.all([
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
        and ${CURRENT_OFFERING}
      order by field(c.level, 'ug', 'integrated', 'pg', 'diploma', 'doctorate', 'certificate'), c.sort_order
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
    rows<{ offering_id: number; name: string; seats: number | null } & SrcRow>(sql`
      select b.offering_id, b.name, b.seats,
        s.publisher as s_publisher, s.title as s_title, s.url as s_url, s.retrieved_on as s_retrieved
      from offering_branches b join offerings o on o.id = b.offering_id
      left join sources s on s.id = b.source_id
      where o.institution_id = ${id}
      order by b.seats is null, b.seats desc, b.name
    `),
    rows<{ slug: string; short_name: string; name: string; conducting_body: string; level: string; streams: string | null }>(sql`
      select e.slug, e.short_name, e.name, e.conducting_body, e.level,
        group_concat(distinct s.name order by s.sort_order separator '|') as streams
      from exams e
      join exam_streams es on es.exam_id = e.id
      join streams s on s.id = es.stream_id
      join institution_streams x on x.stream_id = s.id and x.institution_id = ${id}
      group by e.id, e.slug, e.short_name, e.name, e.conducting_body, e.level, e.sort_order
      order by e.sort_order
    `),
  ]);

  const name = String(c.name);
  const stateCode = (c.state_code as string | null) ?? null;
  const levels = new Set(offeringRows.map((o) => o.level));
  const exams: CollegeExam[] = examRows
    .filter((e) => {
      const rule = EXAM_RULES[e.slug];
      if (!rule) return e.level === "National";
      if (rule.state && rule.state !== stateCode) return false;
      if (rule.namePattern && !rule.namePattern.test(name)) return false;
      // With no course list loaded we cannot tell UG from PG, so keep the exam.
      return !levels.size || rule.levels.some((l) => levels.has(l));
    })
    .map((e) => {
      const rule = EXAM_RULES[e.slug];
      const ug = !rule || rule.levels.includes("ug");
      const pg = !!rule && rule.levels.includes("pg");
      return {
        slug: e.slug,
        short: e.short_name,
        name: e.name,
        body: e.conducting_body,
        level: e.level,
        forLevel: ug && pg ? "UG and PG" : pg ? "Postgraduate" : "Undergraduate",
        streams: (e.streams ?? "").split("|").filter(Boolean),
      };
    });

  const sourceMap = new Map<string, SourceRef & { usedFor: string[] }>();
  const addSource = (s: SourceRef | null, use: string) => {
    if (!s) return;
    const key = `${s.publisher}|${s.title ?? ""}`;
    const hit = sourceMap.get(key) ?? { ...s, usedFor: [] };
    if (!hit.usedFor.includes(use)) hit.usedFor.push(use);
    sourceMap.set(key, hit);
  };
  addSource(src(c), "Name, location and approval");
  offeringRows.forEach((o) => addSource(src(o), "Courses and seats"));
  branchRows.filter((b) => offeringRows.some((o) => o.id === b.offering_id)).forEach((b) => addSource(src(b), "Branch seats"));
  rankRows.forEach((r) => addSource(src(r), `NIRF ${r.year} ${r.category}`));
  feeRows.forEach((f) => addSource(src(f), "Fees"));
  cutoffRows.forEach((x) => addSource(src(x), "Cutoffs"));

  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

  return {
    id,
    slug: String(c.slug),
    name,
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
      rank: num(r.rank),
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
      seats: num(o.seats),
      seatsSource: src(o),
      branches: branchRows.filter((b) => b.offering_id === o.id).map((b) => ({ name: b.name, seats: num(b.seats) })),
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
      openingRank: num(x.opening_rank),
      closingRank: num(x.closing_rank),
      source: src(x)!,
    })),
    exams,
    sources: [...sourceMap.values()],
  };
}

/** Seats for an offering: its own figure, or the sum of its branch intakes when only those are listed. */
export function offeringSeats(o: CollegeDetail["offerings"][number]): number | null {
  if (o.seats !== null) return o.seats;
  const known = o.branches.filter((b) => b.seats !== null);
  return known.length ? known.reduce((n, b) => n + (b.seats ?? 0), 0) : null;
}

/**
 * The academic year each regulator's list gives for this college: the latest year among the
 * offerings whose seats come from that regulator. A regulator with no offerings here gets no year.
 */
export function approvalYears(c: CollegeDetail): Record<string, string> {
  const years: Record<string, string> = Object.create(null);
  for (const o of c.offerings) {
    if (!o.academicYear || !o.seatsSource) continue;
    const code = publisherShort(o.seatsSource.publisher);
    if (!years[code] || o.academicYear > years[code]) years[code] = o.academicYear;
  }
  return years;
}

/** Fewer same-state matches than this and the list falls back to colleges anywhere in India. */
const MIN_SIMILAR_IN_STATE = 3;

/**
 * Colleges in the same fields, from the same state when there are enough of them (inState true);
 * otherwise from anywhere, nearest state first, and the heading should not name the state.
 */
export async function getSimilarColleges(c: CollegeDetail, limit = 5) {
  const streamSlugs = c.streams.map((s) => s.slug);
  const streamFilter = streamSlugs.length
    ? sql`and exists (select 1 from institution_streams x join streams s on s.id = x.stream_id where x.institution_id = i.id and s.slug in (${sql.join(streamSlugs.map((s) => sql`${s}`), sql`, `)}))`
    : sql``;
  const query = (stateFilter: SQL) =>
    rows<{ slug: string; name: string; city: string | null; state: string | null; best_rank: number | null }>(sql`
      select i.slug, i.name, coalesce(i.city, i.district) as city, st.name as state,
        (select min(r.rank) from rankings r where r.institution_id = i.id) as best_rank
      from institutions i left join states st on st.code = i.state_code
      where i.status = 'published' and i.id <> ${c.id} ${streamFilter} ${stateFilter}
      order by (st.slug = ${c.stateSlug ?? ""}) desc,
        (coalesce(i.city, i.district) = ${c.city ?? c.district ?? ""}) desc,
        (select min(r.rank) from rankings r where r.institution_id = i.id) is null,
        (select min(r.rank) from rankings r where r.institution_id = i.id),
        i.name
      limit ${limit}
    `);
  if (c.stateSlug) {
    const inState = await query(sql`and st.slug = ${c.stateSlug}`);
    if (inState.length >= Math.min(limit, MIN_SIMILAR_IN_STATE)) return { items: inState, inState: true };
  }
  return { items: await query(sql``), inState: false };
}
