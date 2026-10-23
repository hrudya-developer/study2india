import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";
import { getAllCourses, getExams, type CourseLite, type ExamSummary } from "@/lib/queries/home";

export type CourseDetail = CourseLite & {
  eligibility: string | null;
  institutions: number;
  exams: ExamSummary[];
  related: CourseLite[];
};

export async function getCourse(slug: string): Promise<CourseDetail | null> {
  const [all, exams] = await Promise.all([getAllCourses(), getExams()]);
  const c = all.find((x) => x.slug === slug);
  if (!c) return null;
  const [extra] = await rows<{ eligibility_text: string | null; institutions: unknown }>(sql`
    select c.eligibility_text,
      (select count(*) from institution_streams x join institutions i on i.id = x.institution_id
        join streams s on s.id = x.stream_id where s.slug = ${c.streamSlug} and i.status = 'published') as institutions
    from courses c where c.slug = ${slug}
  `);
  return {
    ...c,
    eligibility: extra?.eligibility_text ?? null,
    institutions: Number(extra?.institutions ?? 0),
    exams: exams.filter((e) => e.streams.includes(c.streamName)),
    related: all.filter((x) => x.streamSlug === c.streamSlug && x.slug !== slug),
  };
}

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
