import { sql, type SQL } from "drizzle-orm";
import { rows } from "@/lib/db";
import { STATE_ALIASES, examLevelLabel } from "@/data/reference";
import { own } from "@/lib/params";
import { getLandingIndex, listingHref, type LandingIndex } from "@/lib/queries/landing";

/**
 * Site search shared by the header suggestions, the home page search and the /search page.
 *
 * A query is read the way a student types it: "mbbs kerala", "government nursing college kottayam",
 * "iit", "neet". Course, field and state words are recognised and turned into filters; the words
 * left over are matched against college names and places. Nothing here invents a result: every
 * row comes from the database, and counts are counted, not estimated.
 */

export type SuggestItem = { label: string; href: string; meta?: string };
export type SearchResult = {
  q: string;
  /** Course or field combined with a state, for example "MBBS colleges in Kerala". */
  quick: SuggestItem[];
  colleges: SuggestItem[];
  collegeTotal: number;
  courses: SuggestItem[];
  exams: SuggestItem[];
  states: SuggestItem[];
};

type CourseRef = { slug: string; short: string; name: string; streamSlug: string; streamName: string; offeringRows: number };
type StreamRef = { slug: string; name: string };
type StateRef = { slug: string; name: string; code: string };
type ExamRef = { slug: string; short: string; name: string; body: string; level: string };
type Catalog = { courses: CourseRef[]; streams: StreamRef[]; states: StateRef[]; exams: ExamRef[] };

const OWNERSHIP_LABEL: Record<string, string> = {
  government: "Government",
  private: "Private",
  deemed: "Deemed university",
  central: "Central",
  state_university: "State university",
  aided: "Aided",
};

/** Short forms students type, mapped to the words used in official names. */
const NAME_ABBREVIATIONS: Record<string, string> = {
  iit: "Indian Institute of Technology",
  iits: "Indian Institute of Technology",
  nit: "National Institute of Technology",
  nits: "National Institute of Technology",
  iiit: "Indian Institute of Information Technology",
  iim: "Indian Institute of Management",
  iims: "Indian Institute of Management",
  aiims: "All India Institute of Medical Sciences",
  iisc: "Indian Institute of Science",
  iiser: "Indian Institute of Science Education and Research",
  gmc: "Government Medical College",
  jipmer: "Jawaharlal Institute of Postgraduate Medical Education",
  govt: "Government",
};

/** Everyday words for a course or a field that differ from the official short name. */
const COURSE_WORDS: Record<string, string> = {
  be: "btech",
  engg: "btech",
  ayurveda: "bams",
  homoeopathy: "bhms",
  homeopathy: "bhms",
  unani: "bums",
  siddha: "bsms",
  naturopathy: "bnys",
  bpharmacy: "b-pharm",
  dpharmacy: "d-pharm",
  physiotherapy: "bpt",
  polytechnic: "diploma-engineering",
};
const STREAM_WORDS: Record<string, string> = {
  medical: "medical",
  medicine: "medical",
  dental: "dental",
  nursing: "nursing",
  ayush: "ayush",
  veterinary: "veterinary",
  pharmacy: "pharmacy",
  engineering: "engineering",
  management: "management",
  law: "law",
  architecture: "architecture",
  agriculture: "agriculture",
  science: "science",
  commerce: "commerce",
  arts: "arts",
  design: "design",
  education: "education",
};

/** Words that carry no meaning for matching names: "colleges in kerala" means Kerala. */
const STOPWORDS = new Set(["college", "colleges", "in", "of", "the", "and", "for", "at", "best", "top", "list", "near", "me", "course", "courses"]);

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
const fmt = (n: number) => n.toLocaleString("en-IN");

let catalogCache: { at: number; data: Catalog } | null = null;

async function getCatalog(): Promise<Catalog> {
  if (catalogCache && Date.now() - catalogCache.at < 5 * 60 * 1000) return catalogCache.data;
  const [courses, streams, states, exams] = await Promise.all([
    rows<{ slug: string; short_name: string; name: string; stream_slug: string; stream_name: string; offering_rows: unknown }>(sql`
      select c.slug, c.short_name, c.name, s.slug as stream_slug, s.name as stream_name,
        (select count(*) from offerings o where o.course_id = c.id) as offering_rows
      from courses c join streams s on s.id = c.stream_id order by s.sort_order, c.sort_order
    `),
    rows<{ slug: string; name: string }>(sql`select slug, name from streams order by sort_order`),
    rows<{ slug: string; name: string; code: string }>(sql`select slug, name, code from states order by name`),
    rows<{ slug: string; short_name: string; name: string; conducting_body: string; level: string }>(sql`
      select slug, short_name, name, conducting_body, level from exams order by sort_order
    `),
  ]);
  const data: Catalog = {
    courses: courses.map((c) => ({ slug: c.slug, short: c.short_name, name: c.name, streamSlug: c.stream_slug, streamName: c.stream_name, offeringRows: Number(c.offering_rows) })),
    streams,
    states,
    exams: exams.map((e) => ({ slug: e.slug, short: e.short_name, name: e.name, body: e.conducting_body, level: e.level })),
  };
  catalogCache = { at: Date.now(), data };
  return data;
}

/** Normalised spellings that identify each course: "btech", "be", "bscnursing", "mbbs". */
function courseKeys(c: CourseRef): string[] {
  const keys = new Set<string>([norm(c.short), c.slug.replace(/-/g, "")]);
  for (const part of c.short.split("/")) if (norm(part).length >= 2) keys.add(norm(part));
  return [...keys];
}

type Parsed = { course?: CourseRef; stream?: StreamRef; state?: StateRef; rest: string[] };

/** Pull course, field and state words out of the query; the remaining words match names. */
function parseQuery(q: string, cat: Catalog): Parsed {
  const words = q.toLowerCase().replace(/[^a-z0-9.&\s-]+/g, " ").split(/\s+/).filter(Boolean);
  const used = new Array(words.length).fill(false);
  const out: Parsed = { rest: [] };

  // States first, longest names first, so "tamil nadu" and "west bengal" are read as one place.
  const stateNames: { key: string; state: StateRef }[] = [];
  for (const s of cat.states) stateNames.push({ key: s.name.toLowerCase(), state: s });
  for (const [alias, code] of Object.entries(STATE_ALIASES)) {
    const s = cat.states.find((x) => x.code === code);
    if (s) stateNames.push({ key: alias, state: s });
  }
  stateNames.sort((a, b) => b.key.length - a.key.length);
  for (const { key, state } of stateNames) {
    const parts = key.split(/\s+/);
    for (let i = 0; i + parts.length <= words.length; i++) {
      if (parts.every((p, j) => !used[i + j] && words[i + j] === p)) {
        // "delhi" alone is also a city, which is fine: the state filter covers it.
        out.state = state;
        parts.forEach((_, j) => (used[i + j] = true));
        break;
      }
    }
    if (out.state) break;
  }

  // Courses: try runs of up to three words, so "b sc nursing" and "b.tech" both resolve.
  const keyToCourse = new Map<string, CourseRef>();
  for (const c of cat.courses) for (const k of courseKeys(c)) if (!keyToCourse.has(k)) keyToCourse.set(k, c);
  for (const [word, slug] of Object.entries(COURSE_WORDS)) {
    const c = cat.courses.find((x) => x.slug === slug);
    if (c) keyToCourse.set(word, c);
  }
  outer: for (let len = 3; len >= 1; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      if (used.slice(i, i + len).some(Boolean)) continue;
      const key = norm(words.slice(i, i + len).join(""));
      // "ma", "ba" and "bsc" are courses, but one or two letters on their own are too vague to filter on.
      if (key.length < 2) continue;
      const c = keyToCourse.get(key);
      if (c) {
        out.course = c;
        for (let j = i; j < i + len; j++) used[j] = true;
        break outer;
      }
    }
  }

  if (!out.course) {
    for (let i = 0; i < words.length; i++) {
      if (used[i]) continue;
      const slug = own(STREAM_WORDS, norm(words[i]));
      const s = slug ? cat.streams.find((x) => x.slug === slug) : undefined;
      if (s) {
        out.stream = s;
        used[i] = true;
        break;
      }
    }
  }

  out.rest = words.filter((w, i) => !used[i] && !STOPWORDS.has(w) && norm(w).length > 0);
  // A field word next to other name words is usually part of a name ("Indian Institute of Science",
  // "College of Engineering Trivandrum"), so it is matched as a word rather than used as a filter.
  if (out.stream && out.rest.length > 0) {
    const word = words.find((w) => own(STREAM_WORDS, norm(w)) === out.stream!.slug);
    if (word) out.rest.push(word);
    out.stream = undefined;
  }
  return out;
}

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "");
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** One SQL condition per leftover word: the word must appear in the name or the place. */
function nameConditions(rest: string[]): SQL[] {
  return rest.map((w) => {
    const abbr = own(NAME_ABBREVIATIONS, norm(w));
    // Names match from the start of a word, so "neet" does not find "Navaneetham".
    const word = `\\b${escapeRegex(w)}`;
    if (abbr) return sql`(i.name like ${`%${abbr}%`} or i.name regexp ${`${word}\\b`})`;
    const like = `${escapeLike(w)}%`;
    return sql`(i.name regexp ${word} or i.city like ${like} or i.district like ${like})`;
  });
}

function filterConditions(p: Parsed): SQL[] {
  const where: SQL[] = [];
  if (p.state) where.push(sql`i.state_code = ${p.state.code}`);
  if (p.course) {
    if (p.course.offeringRows > 0) {
      where.push(sql`exists (select 1 from offerings o join courses c on c.id = o.course_id where o.institution_id = i.id and c.slug = ${p.course.slug})`);
    } else {
      where.push(sql`exists (select 1 from institution_streams x join streams s on s.id = x.stream_id where x.institution_id = i.id and s.slug = ${p.course.streamSlug})`);
    }
  }
  if (p.stream) where.push(sql`exists (select 1 from institution_streams x join streams s on s.id = x.stream_id where x.institution_id = i.id and s.slug = ${p.stream.slug})`);
  return where;
}

async function countColleges(where: SQL[]): Promise<number> {
  const [r] = await rows<{ n: unknown }>(sql`select count(*) as n from institutions i where i.status = 'published' and ${sql.join(where, sql` and `)}`);
  return Number(r?.n ?? 0);
}

function collegeHref(slug: string) {
  return `/college/${slug}`;
}

/** The listing for a parsed query: a course or field and a state with a landing page link to it directly, not through the /colleges redirect. */
function listHref(p: Parsed, index: LandingIndex, q?: string) {
  return listingHref({ course: p.course?.slug, stream: p.course ? undefined : p.stream?.slug, state: p.state?.slug, q }, index, p.state?.name);
}

export async function searchSite(rawQ: string, opts: { colleges?: number; courses?: number; exams?: number; states?: number } = {}): Promise<SearchResult> {
  const q = rawQ.trim().slice(0, 80);
  const empty: SearchResult = { q, quick: [], colleges: [], collegeTotal: 0, courses: [], exams: [], states: [] };
  if (norm(q).length < 2) return empty;

  const limits = { colleges: 6, courses: 4, exams: 3, states: 3, ...opts };
  const cat = await getCatalog();
  const p = parseQuery(q, cat);
  const qn = norm(q);
  const qLower = q.toLowerCase();

  // Courses: by short name, full name or field. A field word ("nursing kottayam") suggests that field's courses.
  const fieldWords = new Set(q.toLowerCase().split(/\s+/).map((w) => own(STREAM_WORDS, norm(w))).filter(Boolean));
  const courses = cat.courses
    .map((c) => {
      const keys = courseKeys(c);
      let score = 0;
      if (p.course?.slug === c.slug) score = 100;
      else if (keys.some((k) => k === qn)) score = 90;
      else if (keys.some((k) => k.startsWith(qn))) score = 70;
      else if (c.name.toLowerCase().includes(qLower)) score = 50;
      else if (!p.course && fieldWords.has(c.streamSlug)) score = 30;
      else if (c.streamName.toLowerCase().startsWith(qLower)) score = 20;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limits.courses)
    .map(({ c }) => ({ label: c.short, href: `/course/${c.slug}`, meta: `${c.name}, ${c.streamName}` }));

  // Exams: short name with or without spaces ("neetug", "neet ug"), full name or conducting body.
  const exams = cat.exams
    .filter((e) => {
      const sn = norm(e.short);
      return sn.startsWith(qn) || (qn.length >= 3 && sn.includes(qn)) || e.name.toLowerCase().includes(qLower) || (qLower.length >= 4 && e.body.toLowerCase().includes(qLower));
    })
    .slice(0, limits.exams)
    .map((e) => ({ label: e.short, href: `/exam/${e.slug}`, meta: `${examLevelLabel(e.level)}, ${e.body}` }));

  // States, when the query names one and nothing else.
  const states = cat.states
    .filter((s) => (p.state?.slug === s.slug && !p.course && !p.stream && p.rest.length === 0) || (!p.state && s.name.toLowerCase().startsWith(qLower)))
    .slice(0, limits.states)
    .map((s) => ({ label: `Colleges in ${s.name}`, href: `/colleges?state=${s.slug}` }));

  const filters = filterConditions(p);
  const names = nameConditions(p.rest);
  const quick: SuggestItem[] = [];
  const tasks: Promise<unknown>[] = [];

  // A course or field together with a state is the most common search, so it gets its own answer.
  if ((p.course || p.stream) && p.state) {
    const what = p.course ? p.course.short : `${p.stream!.name}`;
    tasks.push(
      Promise.all([countColleges(filters), getLandingIndex()]).then(([n, index]) => {
        quick.push({ label: `${what} colleges in ${p.state!.name}`, href: listHref(p, index), meta: n > 0 ? `${fmt(n)} ${n === 1 ? "college" : "colleges"}` : "No college recorded yet" });
      }),
    );
  } else if (p.course && p.rest.length === 0) {
    tasks.push(
      Promise.all([countColleges(filters), getLandingIndex()]).then(([n, index]) => {
        if (n > 0) quick.push({ label: `Colleges offering ${p.course!.short}`, href: listHref(p, index), meta: `${fmt(n)} colleges` });
      }),
    );
  } else if (p.stream && p.rest.length === 0) {
    tasks.push(
      Promise.all([countColleges(filters), getLandingIndex()]).then(([n, index]) => {
        if (n > 0) quick.push({ label: `${p.stream!.name} colleges`, href: listHref(p, index), meta: `${fmt(n)} colleges` });
      }),
    );
  }

  // Colleges: a filter-only query lists colleges under those filters; otherwise the words must match.
  let colleges: SuggestItem[] = [];
  let collegeTotal = 0;
  const where = [...filters, ...names];
  if (where.length) {
    // Rank: the whole query as a phrase, then names starting with the first word, then NIRF ranked,
    // then shorter names (the main campus before its departments), then alphabetical.
    const first = p.rest[0] ? `${escapeLike(own(NAME_ABBREVIATIONS, norm(p.rest[0])) ?? p.rest[0])}%` : null;
    const phrase = `%${escapeLike(q.replace(/\s+/g, " "))}%`;
    const order = first
      ? sql`(i.name like ${phrase}) desc, (i.name like ${first}) desc, nirf desc, char_length(i.name), i.name`
      : sql`nirf desc, i.name`;
    const whereSql = sql.join(where, sql` and `);
    tasks.push(
      (async () => {
        const [list, total] = await Promise.all([
          rows<{ slug: string; name: string; city: string | null; state: string | null; ownership: string | null; nirf: unknown }>(sql`
            select i.slug, i.name, coalesce(i.city, i.district) as city, st.name as state, i.ownership,
              exists (select 1 from institution_identifiers ii where ii.institution_id = i.id and ii.scheme = 'nirf') as nirf
            from institutions i left join states st on st.code = i.state_code
            where i.status = 'published' and ${whereSql}
            order by ${order}
            limit ${limits.colleges}
          `),
          countColleges(where),
        ]);
        collegeTotal = total;
        colleges = list.map((c) => ({
          label: c.name,
          href: collegeHref(c.slug),
          meta: [[c.city, c.state].filter(Boolean).join(", "), c.ownership ? own(OWNERSHIP_LABEL, c.ownership) : null, Number(c.nirf) ? "NIRF ranked" : null].filter(Boolean).join(" · "),
        }));
      })(),
    );
  }

  await Promise.all(tasks);
  return { q, quick, colleges, collegeTotal, courses, exams, states };
}

/**
 * The college list page with the same course, field and state filters, when that page can show
 * the same colleges. It matches one phrase, so several name words or a short form cannot carry over.
 */
export async function collegeListHref(rawQ: string): Promise<string | null> {
  const cat = await getCatalog();
  const p = parseQuery(rawQ, cat);
  if (p.rest.length > 1 || (p.rest[0] && own(NAME_ABBREVIATIONS, norm(p.rest[0])))) return null;
  return listHref(p, await getLandingIndex(), p.rest[0]);
}
