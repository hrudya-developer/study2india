import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type HomeCounts = {
  institutions: number;
  rankingEntries: number;
  courses: number;
  exams: number;
  lastChecked: string | null;
};

export async function getHomeCounts(): Promise<HomeCounts> {
  const rows = await db.execute<{
    institutions: number;
    ranking_entries: number;
    courses: number;
    exams: number;
    last_checked: string | null;
  }>(sql`
    select
      (select count(*)::int from institutions where status = 'published') as institutions,
      (select count(*)::int from rankings) as ranking_entries,
      (select count(*)::int from courses) as courses,
      (select count(*)::int from exams) as exams,
      (select max(retrieved_on)::text from sources) as last_checked
  `);
  const r = rows[0];
  return {
    institutions: r.institutions,
    rankingEntries: r.ranking_entries,
    courses: r.courses,
    exams: r.exams,
    lastChecked: r.last_checked,
  };
}

export type StreamSummary = {
  slug: string;
  name: string;
  summary: string | null;
  institutions: number;
  courses: { slug: string; short: string }[];
};

export async function getStreams(): Promise<StreamSummary[]> {
  const rows = await db.execute<{
    slug: string;
    name: string;
    summary: string | null;
    institutions: number;
    courses: { slug: string; short: string }[] | null;
  }>(sql`
    select s.slug, s.name, s.summary,
      (select count(*)::int from institution_streams i join institutions x on x.id = i.institution_id
        where i.stream_id = s.id and x.status = 'published') as institutions,
      (select json_agg(json_build_object('slug', c.slug, 'short', c.short_name) order by c.sort_order)
        from courses c where c.stream_id = s.id) as courses
    from streams s
    order by s.sort_order
  `);
  return rows.map((r) => ({ ...r, courses: r.courses ?? [] }));
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

/** Order the home page tabs: the streams students ask about most come first. */
const TAB_ORDER = ["Overall", "Medical", "Engineering", "Management", "Dental", "Pharmacy", "Law", "Architecture", "Agriculture", "University", "Universities", "College", "Colleges"];

export async function getTopRankings(limit = 10): Promise<RankingList[]> {
  const latest = await db.execute<{ category: string; year: number }>(sql`
    select category, max(year)::int as year from rankings where agency = 'NIRF' group by category
  `);
  const wanted = latest
    .filter((l) => TAB_ORDER.includes(l.category))
    .sort((a, b) => TAB_ORDER.indexOf(a.category) - TAB_ORDER.indexOf(b.category));

  const lists: RankingList[] = [];
  for (const { category, year } of wanted) {
    const rows = await db.execute<{
      rank: number | null;
      rank_band: string | null;
      score: string | null;
      slug: string;
      name: string;
      city: string | null;
      state: string | null;
      url: string | null;
      retrieved_on: string;
    }>(sql`
      select r.rank, r.rank_band, r.score::text as score, i.slug, i.name, i.city, st.name as state,
        s.url, s.retrieved_on::text as retrieved_on
      from rankings r
      join institutions i on i.id = r.institution_id
      left join states st on st.code = i.state_code
      join sources s on s.id = r.source_id
      where r.agency = 'NIRF' and r.category = ${category} and r.year = ${year} and r.rank is not null
      order by r.rank asc
      limit ${limit}
    `);
    if (!rows.length) continue;
    lists.push({
      category,
      year,
      sourceUrl: rows[0].url?.split(" ")[0] ?? null,
      retrievedOn: rows[0].retrieved_on,
      rows: rows.map((r) => ({ rank: r.rank, rankBand: r.rank_band, score: r.score, slug: r.slug, name: r.name, city: r.city, state: r.state })),
    });
  }
  return lists;
}

export type StateCount = { slug: string; name: string; institutions: number };

export async function getStateCounts(): Promise<StateCount[]> {
  return db.execute<StateCount>(sql`
    select st.slug, st.name, count(i.id)::int as institutions
    from states st
    join institutions i on i.state_code = st.code and i.status = 'published'
    group by st.slug, st.name
    order by institutions desc, st.name
  `) as unknown as Promise<StateCount[]>;
}

export type ExamSummary = {
  slug: string;
  short: string;
  name: string;
  body: string;
  level: string;
  url: string | null;
  streams: string[];
};

export async function getExams(): Promise<ExamSummary[]> {
  const rows = await db.execute<{
    slug: string;
    short_name: string;
    name: string;
    conducting_body: string;
    level: string;
    official_url: string | null;
    streams: string[] | null;
  }>(sql`
    select e.slug, e.short_name, e.name, e.conducting_body, e.level, e.official_url,
      (select array_agg(s.name order by s.sort_order) from exam_streams es join streams s on s.id = es.stream_id where es.exam_id = e.id) as streams
    from exams e order by e.sort_order
  `);
  return rows.map((r) => ({
    slug: r.slug,
    short: r.short_name,
    name: r.name,
    body: r.conducting_body,
    level: r.level,
    url: r.official_url,
    streams: r.streams ?? [],
  }));
}

export type Option = { value: string; label: string };

export async function getSearchOptions(): Promise<{ courses: Option[]; states: Option[] }> {
  const courses = await db.execute<{ slug: string; short_name: string }>(sql`
    select c.slug, c.short_name from courses c join streams s on s.id = c.stream_id order by s.sort_order, c.sort_order
  `);
  const states = await db.execute<{ slug: string; name: string }>(sql`select slug, name from states order by name`);
  return {
    courses: courses.map((c) => ({ value: c.slug, label: c.short_name })),
    states: states.map((s) => ({ value: s.slug, label: s.name })),
  };
}
