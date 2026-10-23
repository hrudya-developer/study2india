import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";
import { EXAMS, examStateNames, type ExamField } from "@/data/reference";

export type HomeCounts = {
  institutions: number;
  rankingEntries: number;
  courses: number;
  exams: number;
  streams: number;
  lastChecked: string | null;
};

const n = (v: unknown) => Number(v ?? 0);

export async function getHomeCounts(): Promise<HomeCounts> {
  const [r] = await rows<Record<string, unknown>>(sql`
    select
      (select count(*) from institutions where status = 'published') as institutions,
      (select count(*) from rankings) as ranking_entries,
      (select count(*) from courses) as courses,
      (select count(*) from exams) as exams,
      (select count(*) from streams) as streams,
      (select max(retrieved_on) from sources) as last_checked
  `);
  return {
    institutions: n(r.institutions),
    rankingEntries: n(r.ranking_entries),
    courses: n(r.courses),
    exams: n(r.exams),
    streams: n(r.streams),
    lastChecked: (r.last_checked as string | null) ?? null,
  };
}

export type CourseLite = {
  slug: string;
  short: string;
  name: string;
  level: string;
  duration: string | null;
  streamSlug: string;
  streamName: string;
};

export type StreamSummary = {
  slug: string;
  name: string;
  summary: string | null;
  institutions: number;
  courses: CourseLite[];
};

export async function getAllCourses(): Promise<CourseLite[]> {
  const list = await rows<{ slug: string; short_name: string; name: string; level: string; duration_text: string | null; stream_slug: string; stream_name: string }>(sql`
    select c.slug, c.short_name, c.name, c.level, c.duration_text, s.slug as stream_slug, s.name as stream_name
    from courses c join streams s on s.id = c.stream_id
    order by s.sort_order, c.sort_order
  `);
  return list.map((c) => ({
    slug: c.slug,
    short: c.short_name,
    name: c.name,
    level: c.level,
    duration: c.duration_text,
    streamSlug: c.stream_slug,
    streamName: c.stream_name,
  }));
}

export async function getStreams(): Promise<StreamSummary[]> {
  const [list, courseList] = await Promise.all([
    rows<{ slug: string; name: string; summary: string | null; institutions: unknown }>(sql`
      select s.slug, s.name, s.summary,
        (select count(*) from institution_streams x join institutions i on i.id = x.institution_id
          where x.stream_id = s.id and i.status = 'published') as institutions
      from streams s order by s.sort_order
    `),
    getAllCourses(),
  ]);
  return list.map((s) => ({
    slug: s.slug,
    name: s.name,
    summary: s.summary,
    institutions: n(s.institutions),
    courses: courseList.filter((c) => c.streamSlug === s.slug),
  }));
}

export type RankingRow = {
  rank: number | null;
  rankBand: string | null;
  score: string | null;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
};

export type RankingList = {
  category: string;
  year: number;
  sourceUrl: string | null;
  retrievedOn: string;
  rows: RankingRow[];
};

const TAB_ORDER = ["Overall", "Medical", "Engineering", "Management", "Dental", "Pharmacy", "Law", "Architecture", "Agriculture", "University", "Universities", "College", "Colleges"];

export async function getTopRankings(limit = 10): Promise<RankingList[]> {
  const latest = await rows<{ category: string; year: number }>(sql`
    select category, max(year) as year from rankings where agency = 'NIRF' group by category
  `);
  const wanted = latest
    .filter((l) => TAB_ORDER.includes(l.category))
    .sort((a, b) => TAB_ORDER.indexOf(a.category) - TAB_ORDER.indexOf(b.category));

  const lists: RankingList[] = [];
  for (const { category, year } of wanted) {
    const list = await rows<{ rank: number | null; rank_band: string | null; score: string | null; slug: string; name: string; city: string | null; state: string | null; url: string | null; retrieved_on: string }>(sql`
      select r.rank, r.rank_band, r.score, i.slug, i.name, i.city, st.name as state, s.url, s.retrieved_on
      from rankings r
      join institutions i on i.id = r.institution_id
      left join states st on st.code = i.state_code
      join sources s on s.id = r.source_id
      where r.agency = 'NIRF' and r.category = ${category} and r.year = ${year} and r.rank is not null
      order by r.rank asc
      limit ${limit}
    `);
    if (!list.length) continue;
    lists.push({
      category,
      year: Number(year),
      sourceUrl: list[0].url?.split(" ")[0] ?? null,
      retrievedOn: list[0].retrieved_on,
      rows: list.map((r) => ({ rank: r.rank, rankBand: r.rank_band, score: r.score, slug: r.slug, name: r.name, city: r.city, state: r.state })),
    });
  }
  return lists;
}

export type StateCount = { slug: string; name: string; institutions: number };

export async function getStateCounts(): Promise<StateCount[]> {
  const list = await rows<{ slug: string; name: string; institutions: unknown }>(sql`
    select st.slug, st.name, count(i.id) as institutions
    from states st
    left join institutions i on i.state_code = st.code and i.status = 'published'
    group by st.slug, st.name
    order by institutions desc, st.name
  `);
  return list.map((s) => ({ slug: s.slug, name: s.name, institutions: n(s.institutions) }));
}

export type ExamSummary = {
  slug: string;
  short: string;
  name: string;
  body: string;
  level: string;
  url: string | null;
  streams: string[];
  /** From data/reference.ts: the field it is listed under, the states a state exam serves, and whether it is counselling only. */
  field: ExamField;
  states: string[];
  counsellingOnly: boolean;
};

const examSeeds = new Map(EXAMS.map((e) => [e.slug, e]));

export async function getExams(): Promise<ExamSummary[]> {
  const [list, links] = await Promise.all([
    rows<{ id: number; slug: string; short_name: string; name: string; conducting_body: string; level: string; official_url: string | null }>(sql`
      select id, slug, short_name, name, conducting_body, level, official_url from exams order by sort_order
    `),
    rows<{ exam_id: number; name: string }>(sql`
      select es.exam_id, s.name from exam_streams es join streams s on s.id = es.stream_id order by s.sort_order
    `),
  ]);
  return list.map((e) => ({
    slug: e.slug,
    short: e.short_name,
    name: e.name,
    body: e.conducting_body,
    level: e.level,
    url: e.official_url,
    streams: links.filter((l) => l.exam_id === e.id).map((l) => l.name),
    field: examSeeds.get(e.slug)?.field ?? "general",
    states: examStateNames(examSeeds.get(e.slug)),
    counsellingOnly: !!examSeeds.get(e.slug)?.counsellingOnly,
  }));
}

export type Option = { value: string; label: string };

export async function getSearchOptions(): Promise<{ courses: Option[]; states: Option[] }> {
  const [courseList, stateList] = await Promise.all([getAllCourses(), rows<{ slug: string; name: string }>(sql`select slug, name from states order by name`)]);
  return {
    courses: courseList.map((c) => ({ value: c.slug, label: c.short })),
    states: stateList.map((s) => ({ value: s.slug, label: s.name })),
  };
}
