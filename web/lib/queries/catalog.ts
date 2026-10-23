import { cache } from "react";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";
import { getAllCourses, getExams, type CourseLite, type ExamSummary } from "@/lib/queries/home";
import { OWNERSHIP_LABELS } from "@/lib/queries/colleges";
import { EXAMS } from "@/data/reference";

/** Exams that admit to a course: the exam's own course list when it has one, otherwise its fields. */
function examsForCourse(exams: ExamSummary[], c: CourseLite) {
  const bySlug = new Map(EXAMS.map((e) => [e.slug, e]));
  return exams.filter((e) => {
    const seed = bySlug.get(e.slug);
    return seed?.courses ? seed.courses.includes(c.slug) : e.streams.includes(c.streamName);
  });
}

export type CourseStateRow = { slug: string; name: string; colleges: number; seats: number | null };
export type CourseOwnershipRow = { key: string; label: string; colleges: number };
export type CourseSeatSource = { publisher: string; title: string | null; url: string | null; retrievedOn: string };

export type CourseStats = {
  /** Published colleges with a recorded offering of this course. */
  colleges: number;
  /** Colleges whose offering has an approved intake figure (on the offering or summed from its branches). */
  collegesWithSeats: number;
  /** Sum of approved intake where recorded; null when no college has a figure. */
  seats: number | null;
  states: number;
  /** Colleges with no state recorded, so they are missing from the state table. */
  collegesWithoutState: number;
  /** Academic years the counted offerings come from, most recent first. */
  years: { year: string | null; colleges: number }[];
  byState: CourseStateRow[];
  ownership: { government: number; private: number; others: CourseOwnershipRow[]; notRecorded: number };
  sources: CourseSeatSource[];
};

export type CourseBranch = { name: string; colleges: number; seats: number | null };

export type CourseRankedCollege = {
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  rank: number | null;
  rankBand: string | null;
  seats: number | null;
};

export type CourseRanked = {
  year: number;
  category: string;
  /** Colleges offering the course that appear in this ranking list. */
  total: number;
  items: CourseRankedCollege[];
};

export type CourseDetail = CourseLite & {
  eligibility: string | null;
  institutions: number;
  /** Institutions with a recorded offering of this course. */
  offeredBy: number;
  exams: ExamSummary[];
  related: CourseLite[];
  stats: CourseStats;
  branches: { total: number; top: CourseBranch[] };
  /** Latest NIRF year in the database, if any ranking is loaded. */
  nirfYear: number | null;
  /** NIRF lists checked for this course, in order of preference. */
  nirfLists: string[];
  ranked: CourseRanked | null;
};

/** NIRF list that fits each field of study; fields without their own list fall back to the general lists. */
const NIRF_CATEGORY_BY_STREAM: Record<string, string> = {
  engineering: "Engineering",
  medical: "Medical",
  dental: "Dental",
  management: "Management",
  pharmacy: "Pharmacy",
  law: "Law",
  architecture: "Architecture",
  agriculture: "Agriculture",
};
const NIRF_GENERAL_CATEGORIES = ["Overall", "University", "College"];

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/**
 * One offering per college: a college listed in more than one academic year counts once, from
 * the most recent list it appears in. Seats fall back to the sum of branch seats, as on the
 * colleges listing, when the offering itself has no total.
 */
function latestOfferings(courseSlug: string) {
  return sql`
    with off as (
      select o.id, o.institution_id, o.academic_year, o.seats_source_id, i.state_code, i.ownership,
        coalesce(o.seats, (select sum(b.seats) from offering_branches b where b.offering_id = o.id)) as seats,
        row_number() over (partition by o.institution_id order by o.academic_year is null, o.academic_year desc, o.id desc) as rn
      from offerings o join institutions i on i.id = o.institution_id
      where o.course_id = (select id from courses where slug = ${courseSlug}) and i.status = 'published'
    )`;
}

async function getCourseStats(slug: string): Promise<CourseStats> {
  const [groups, sources] = await Promise.all([
    rows<{ state_slug: string | null; state_name: string | null; academic_year: string | null; ownership: string | null; colleges: unknown; seats: unknown; with_seats: unknown }>(sql`
      ${latestOfferings(slug)}
      select st.slug as state_slug, st.name as state_name, off.academic_year, off.ownership,
        count(*) as colleges, sum(off.seats) as seats, count(off.seats) as with_seats
      from off left join states st on st.code = off.state_code
      where off.rn = 1
      group by st.slug, st.name, off.academic_year, off.ownership
    `),
    rows<{ publisher: string; title: string | null; url: string | null; retrieved_on: string }>(sql`
      ${latestOfferings(slug)}
      select s.publisher, s.title, s.url, s.retrieved_on
      from sources s where s.id in (select off.seats_source_id from off where off.rn = 1)
      order by s.retrieved_on desc, s.id
    `),
  ]);

  let colleges = 0;
  let collegesWithSeats = 0;
  let seats = 0;
  let collegesWithoutState = 0;
  const states = new Map<string, CourseStateRow & { withSeats: number }>();
  const years = new Map<string | null, number>();
  const owners = new Map<string | null, number>();

  for (const g of groups) {
    const n = Number(g.colleges);
    const withSeats = Number(g.with_seats);
    const s = Number(g.seats ?? 0);
    colleges += n;
    collegesWithSeats += withSeats;
    seats += s;
    years.set(g.academic_year, (years.get(g.academic_year) ?? 0) + n);
    owners.set(g.ownership, (owners.get(g.ownership) ?? 0) + n);
    if (!g.state_slug || !g.state_name) {
      collegesWithoutState += n;
      continue;
    }
    const row = states.get(g.state_slug) ?? { slug: g.state_slug, name: g.state_name, colleges: 0, seats: 0, withSeats: 0 };
    row.colleges += n;
    row.seats = (row.seats ?? 0) + s;
    row.withSeats += withSeats;
    states.set(g.state_slug, row);
  }

  const byState = [...states.values()]
    .map(({ withSeats, ...r }) => ({ ...r, seats: withSeats ? r.seats : null }))
    .sort((a, b) => (b.seats ?? -1) - (a.seats ?? -1) || b.colleges - a.colleges || a.name.localeCompare(b.name));

  const others = [...owners.entries()]
    .filter(([k]) => k && k !== "government" && k !== "private")
    .map(([k, v]) => ({ key: k as string, label: OWNERSHIP_LABELS[k as string] ?? (k as string), colleges: v }))
    .sort((a, b) => b.colleges - a.colleges);

  return {
    colleges,
    collegesWithSeats,
    seats: collegesWithSeats ? seats : null,
    states: byState.length,
    collegesWithoutState,
    years: [...years.entries()]
      .map(([year, n]) => ({ year, colleges: n }))
      .sort((a, b) => (b.year ?? "").localeCompare(a.year ?? "")),
    byState,
    ownership: {
      government: owners.get("government") ?? 0,
      private: owners.get("private") ?? 0,
      others,
      notRecorded: owners.get(null) ?? 0,
    },
    sources: sources.map((s) => ({ publisher: s.publisher, title: s.title, url: s.url, retrievedOn: s.retrieved_on })),
  };
}

async function getCourseBranches(slug: string) {
  const list = await rows<{ name: string; colleges: unknown; seats: unknown; total_names: unknown }>(sql`
    ${latestOfferings(slug)}
    select b.name, count(distinct off.institution_id) as colleges, sum(b.seats) as seats, count(*) over () as total_names
    from off join offering_branches b on b.offering_id = off.id
    where off.rn = 1
    group by b.name
    order by sum(b.seats) is null, sum(b.seats) desc, colleges desc, b.name
    limit 12
  `);
  return {
    total: Number(list[0]?.total_names ?? 0),
    top: list.map((b) => ({ name: b.name, colleges: Number(b.colleges), seats: num(b.seats) })),
  };
}

async function getCourseRanked(slug: string, streamSlug: string): Promise<{ year: number | null; lists: string[]; ranked: CourseRanked | null }> {
  const own = NIRF_CATEGORY_BY_STREAM[streamSlug];
  const categories = own ? [own, ...NIRF_GENERAL_CATEGORIES] : NIRF_GENERAL_CATEGORIES;
  const [[latest], list] = await Promise.all([
    rows<{ y: unknown }>(sql`select max(year) as y from rankings where agency = 'NIRF'`),
    rows<{ category: string; rank: number | null; rank_band: string | null; slug: string; name: string; city: string | null; state: string | null; seats: unknown }>(sql`
      ${latestOfferings(slug)}
      select r.category, r.rank, r.rank_band, i.slug, i.name, coalesce(i.city, i.district) as city, st.name as state, off.seats
      from off
      join rankings r on r.institution_id = off.institution_id and r.agency = 'NIRF'
        and r.year = (select max(year) from rankings where agency = 'NIRF')
      join institutions i on i.id = off.institution_id
      left join states st on st.code = i.state_code
      where off.rn = 1 and r.category in (${sql.join(categories.map((c) => sql`${c}`), sql`, `)})
      order by r.rank is null, r.rank, r.rank_band, i.name
    `),
  ]);
  const year = num(latest?.y);
  const category = categories.find((c) => list.some((r) => r.category === c));
  if (!category || year === null) return { year, lists: categories, ranked: null };
  const inCategory = list.filter((r) => r.category === category);
  return {
    year,
    lists: categories,
    ranked: {
      year,
      category,
      total: inCategory.length,
      items: inCategory.slice(0, 10).map((r) => ({
        slug: r.slug,
        name: r.name,
        city: r.city,
        state: r.state,
        rank: r.rank,
        rankBand: r.rank_band,
        seats: num(r.seats),
      })),
    },
  };
}

/** Cached per request, so the page and its metadata share one set of queries. */
export const getCourse = cache(async function getCourse(slug: string): Promise<CourseDetail | null> {
  const [all, exams] = await Promise.all([getAllCourses(), getExams()]);
  const c = all.find((x) => x.slug === slug);
  if (!c) return null;
  const [[extra], stats, branches, ranking] = await Promise.all([
    rows<{ eligibility_text: string | null; institutions: unknown; offered_by: unknown }>(sql`
      select c.eligibility_text,
        (select count(distinct o.institution_id) from offerings o join institutions i on i.id = o.institution_id
          where o.course_id = c.id and i.status = 'published') as offered_by,
        (select count(*) from institution_streams x join institutions i on i.id = x.institution_id
          join streams s on s.id = x.stream_id where s.slug = ${c.streamSlug} and i.status = 'published') as institutions
      from courses c where c.slug = ${slug}
    `),
    getCourseStats(slug),
    getCourseBranches(slug),
    getCourseRanked(slug, c.streamSlug),
  ]);
  return {
    ...c,
    eligibility: extra?.eligibility_text ?? null,
    institutions: Number(extra?.institutions ?? 0),
    offeredBy: Number(extra?.offered_by ?? 0),
    exams: examsForCourse(exams, c),
    related: all.filter((x) => x.streamSlug === c.streamSlug && x.slug !== slug),
    stats,
    branches,
    nirfYear: ranking.year,
    nirfLists: ranking.lists,
    ranked: ranking.ranked,
  };
});

export type ExamDate = { cycle: string; event: string; startsOn: string | null; endsOn: string | null; status: string; sourceTitle: string | null; sourceUrl: string | null; retrievedOn: string | null };

export async function getExam(slug: string) {
  const exams = await getExams();
  const e = exams.find((x) => x.slug === slug);
  if (!e) return null;
  const [dates, courses] = await Promise.all([
    rows<{ cycle: string; event: string; starts_on: string | null; ends_on: string | null; status: string; title: string | null; url: string | null; retrieved_on: string | null }>(sql`
      select d.cycle, d.event, d.starts_on, d.ends_on, d.status, s.title, s.url, s.retrieved_on
      from exam_dates d join exams e on e.id = d.exam_id left join sources s on s.id = d.source_id
      where e.slug = ${slug} order by d.cycle desc, d.starts_on is null, d.starts_on
    `),
    getAllCourses(),
  ]);
  return {
    ...e,
    dates: dates.map<ExamDate>((d) => ({
      cycle: d.cycle,
      event: d.event,
      startsOn: d.starts_on,
      endsOn: d.ends_on,
      status: d.status,
      sourceTitle: d.title,
      sourceUrl: d.url,
      retrievedOn: d.retrieved_on,
    })),
    courses: courses.filter((c) => e.streams.includes(c.streamName)),
  };
}

export async function getRankingCategories() {
  return rows<{ category: string; year: number; entries: unknown }>(sql`
    select category, max(year) as year, count(*) as entries from rankings where agency = 'NIRF' group by category order by category
  `);
}

export async function getRankingList(category: string, year: number) {
  return rows<{ rank: number | null; rank_band: string | null; score: string | null; slug: string; name: string; city: string | null; state: string | null; url: string | null; retrieved_on: string }>(sql`
    select r.rank, r.rank_band, r.score, i.slug, i.name, i.city, st.name as state, s.url, s.retrieved_on
    from rankings r join institutions i on i.id = r.institution_id
    left join states st on st.code = i.state_code join sources s on s.id = r.source_id
    where r.agency = 'NIRF' and r.category = ${category} and r.year = ${year}
    order by r.rank is null, r.rank, r.rank_band, i.name
  `);
}

export async function getScholarships() {
  return rows<{ slug: string; name: string; provider: string; provider_type: string | null; eligibility_text: string | null; amount_text: string | null; deadline: string | null; official_url: string | null }>(sql`
    select slug, name, provider, provider_type, eligibility_text, amount_text, deadline, official_url
    from scholarships where status = 'published' order by deadline is null, deadline, name
  `);
}

export async function searchEverything(q: string) {
  const like = `%${q.replace(/[%_\\]/g, "")}%`;
  const [colleges, courses, exams] = await Promise.all([
    rows<{ slug: string; name: string; city: string | null; state: string | null }>(sql`
      select i.slug, i.name, i.city, st.name as state from institutions i left join states st on st.code = i.state_code
      where i.status = 'published' and (i.name like ${like} or i.city like ${like}) order by i.name limit 30
    `),
    rows<{ slug: string; short_name: string; name: string; stream: string }>(sql`
      select c.slug, c.short_name, c.name, s.name as stream from courses c join streams s on s.id = c.stream_id
      where c.name like ${like} or c.short_name like ${like} or s.name like ${like} order by s.sort_order, c.sort_order limit 20
    `),
    rows<{ slug: string; short_name: string; name: string; conducting_body: string }>(sql`
      select slug, short_name, name, conducting_body from exams
      where name like ${like} or short_name like ${like} or conducting_body like ${like} order by sort_order limit 20
    `),
  ]);
  return { colleges, courses, exams };
}
