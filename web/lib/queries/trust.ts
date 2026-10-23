import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";

/**
 * What the site actually holds, by official source. Every number here is counted from the database
 * at request time, so the home page never claims more than we have.
 */

export type SourceCoverage = {
  scheme: string;
  regulator: string;
  short: string;
  /** What the list covers, in a student's words. */
  covers: string;
  institutions: number;
  lists: number;
  url: string | null;
  checkedOn: string | null;
};

export type Coverage = {
  institutions: number;
  withSeats: number;
  seats: number;
  sources: SourceCoverage[];
  lastChecked: string | null;
};

const SCHEMES: { scheme: string; publisher: string; short: string; regulator: string; covers: string }[] = [
  { scheme: "aicte", publisher: "All India Council for Technical Education", short: "AICTE", regulator: "All India Council for Technical Education", covers: "engineering, management, pharmacy and other technical institutes" },
  { scheme: "nmc", publisher: "National Medical Commission", short: "NMC", regulator: "National Medical Commission", covers: "medical colleges teaching MBBS and PG courses" },
  { scheme: "inc", publisher: "Indian Nursing Council", short: "INC", regulator: "Indian Nursing Council", covers: "nursing institutions found suitable by the council" },
  { scheme: "ncism", publisher: "National Commission for Indian System of Medicine", short: "NCISM", regulator: "National Commission for Indian System of Medicine", covers: "Ayurveda, Unani and Siddha colleges" },
  { scheme: "nch", publisher: "National Commission for Homoeopathy", short: "NCH", regulator: "National Commission for Homoeopathy", covers: "homoeopathy colleges" },
  { scheme: "nirf", publisher: "NIRF, Ministry of Education", short: "NIRF", regulator: "National Institutional Ranking Framework", covers: "institutions ranked by the Ministry of Education" },
];

export async function getCoverage(): Promise<Coverage> {
  const [ids, srcs, totals] = await Promise.all([
    rows<{ scheme: string; n: unknown }>(sql`
      select ii.scheme, count(distinct ii.institution_id) as n
      from institution_identifiers ii join institutions i on i.id = ii.institution_id
      where i.status = 'published' group by ii.scheme
    `),
    rows<{ publisher: string; lists: unknown; url: string | null; checked_on: string | null }>(sql`
      select publisher, count(*) as lists, min(url) as url, max(retrieved_on) as checked_on from sources group by publisher
    `),
    rows<{ institutions: unknown; with_seats: unknown; seats: unknown; last_checked: string | null }>(sql`
      select
        (select count(*) from institutions where status = 'published') as institutions,
        (select count(distinct o.institution_id) from offerings o join institutions i on i.id = o.institution_id
          where i.status = 'published' and o.seats is not null) as with_seats,
        (select coalesce(sum(o.seats), 0) from offerings o join institutions i on i.id = o.institution_id
          where i.status = 'published') as seats,
        (select max(retrieved_on) from sources) as last_checked
    `),
  ]);
  const idCount = new Map(ids.map((r) => [r.scheme, Number(r.n)]));
  const src = new Map(srcs.map((r) => [r.publisher, r]));
  const t = totals[0];
  return {
    institutions: Number(t?.institutions ?? 0),
    withSeats: Number(t?.with_seats ?? 0),
    seats: Number(t?.seats ?? 0),
    lastChecked: t?.last_checked ?? null,
    sources: SCHEMES.map((s) => {
      const r = src.get(s.publisher);
      return {
        scheme: s.scheme,
        regulator: s.regulator,
        short: s.short,
        covers: s.covers,
        institutions: idCount.get(s.scheme) ?? 0,
        lists: Number(r?.lists ?? 0),
        url: r?.url?.split(" ")[0] ?? null,
        checkedOn: r?.checked_on ?? null,
      };
    }).filter((s) => s.institutions > 0 || s.lists > 0),
  };
}

export type StateCombo = { course: string; courseSlug: string; state: string; stateSlug: string; colleges: number };

/** The most common course and state pairs we hold, counted from recorded offerings. */
export async function getPopularCombos(courseSlugs: string[], stateSlugs: string[]): Promise<StateCombo[]> {
  if (!courseSlugs.length || !stateSlugs.length) return [];
  const list = await rows<{ course: string; course_slug: string; state: string; state_slug: string; n: unknown }>(sql`
    select c.short_name as course, c.slug as course_slug, st.name as state, st.slug as state_slug, count(distinct o.institution_id) as n
    from offerings o
    join courses c on c.id = o.course_id
    join institutions i on i.id = o.institution_id and i.status = 'published'
    join states st on st.code = i.state_code
    where c.slug in (${sql.join(courseSlugs.map((s) => sql`${s}`), sql`, `)})
      and st.slug in (${sql.join(stateSlugs.map((s) => sql`${s}`), sql`, `)})
    group by c.short_name, c.slug, st.name, st.slug
    having n > 0
  `);
  return list.map((r) => ({ course: r.course, courseSlug: r.course_slug, state: r.state, stateSlug: r.state_slug, colleges: Number(r.n) }));
}
