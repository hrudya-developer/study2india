import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";

/** One course on the /courses index, with what we have recorded about who offers it. */
export type CourseIndexItem = {
  slug: string;
  short: string;
  name: string;
  level: string;
  duration: string | null;
  streamSlug: string;
  streamName: string;
  /** Published institutions with a recorded offering of this course. */
  colleges: number;
  /** Of those, how many have an approved intake figure. */
  collegesWithSeats: number;
  /** Sum of approved seats where recorded, null when no institution has a figure. */
  seats: number | null;
  /** Latest academic year among the offerings, null when there are none. */
  latestYear: string | null;
};

export type CourseIndexStream = {
  slug: string;
  name: string;
  summary: string | null;
};

export type CourseIndexSummary = {
  courses: number;
  fields: number;
  /** Distinct published institutions with at least one recorded course offering. */
  colleges: number;
};

const n = (v: unknown) => Number(v ?? 0);

/**
 * Every course with offering counts, aggregated in one grouped query.
 * Only the latest academic year per institution and course is counted, so a
 * college listed for two years is not double counted in colleges or seats.
 */
export async function getCourseIndex(): Promise<CourseIndexItem[]> {
  const list = await rows<{
    slug: string;
    short_name: string;
    name: string;
    level: string;
    duration_text: string | null;
    stream_slug: string;
    stream_name: string;
    colleges: unknown;
    with_seats: unknown;
    seats: unknown;
    latest_year: string | null;
  }>(sql`
    select c.slug, c.short_name, c.name, c.level, c.duration_text,
      s.slug as stream_slug, s.name as stream_name,
      count(o.institution_id) as colleges,
      count(o.seats) as with_seats,
      sum(o.seats) as seats,
      max(o.academic_year) as latest_year
    from courses c
    join streams s on s.id = c.stream_id
    left join (
      select o.institution_id, o.course_id, o.seats, o.academic_year
      from offerings o
      join institutions i on i.id = o.institution_id and i.status = 'published'
      where not exists (
        select 1 from offerings o2
        where o2.institution_id = o.institution_id and o2.course_id = o.course_id
          and o2.academic_year > o.academic_year
      )
    ) o on o.course_id = c.id
    group by c.id, c.slug, c.short_name, c.name, c.level, c.duration_text, s.slug, s.name, s.sort_order, c.sort_order
    order by s.sort_order, c.sort_order, c.name
  `);
  return list.map((c) => {
    const withSeats = n(c.with_seats);
    return {
      slug: c.slug,
      short: c.short_name,
      name: c.name,
      level: c.level,
      duration: c.duration_text,
      streamSlug: c.stream_slug,
      streamName: c.stream_name,
      colleges: n(c.colleges),
      collegesWithSeats: withSeats,
      seats: withSeats > 0 ? n(c.seats) : null,
      latestYear: c.latest_year,
    };
  });
}

/** Fields of study in display order. */
export async function getCourseIndexStreams(): Promise<CourseIndexStream[]> {
  return rows<CourseIndexStream>(sql`select slug, name, summary from streams order by sort_order, name`);
}

/** Headline counts for the top of the page. */
export async function getCourseIndexSummary(): Promise<CourseIndexSummary> {
  const [r] = await rows<Record<string, unknown>>(sql`
    select
      (select count(*) from courses) as courses,
      (select count(*) from streams) as fields,
      (select count(distinct o.institution_id) from offerings o
        join institutions i on i.id = o.institution_id and i.status = 'published') as colleges
  `);
  return { courses: n(r?.courses), fields: n(r?.fields), colleges: n(r?.colleges) };
}
