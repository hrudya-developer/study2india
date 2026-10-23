import { sql, type SQL } from "drizzle-orm";
import { rows } from "@/lib/db";
import { one, own } from "@/lib/params";
import { slugify } from "@/lib/slug";
import { EXAMS } from "@/data/reference";
import { OWNERSHIP_LABELS } from "@/lib/queries/colleges";

/*
 * NEET UG college predictor, from the MCC All India counselling allotment lists in data/cutoffs/.
 * Every figure shown comes from those lists; nothing is estimated or turned into a probability.
 */

export const NEET_EXAM = "neet-ug";

/** MCC rounds in counselling order, as the allotment lists name them. */
export const ROUNDS = [
  { key: "Round 1", short: "R1", label: "Round 1" },
  { key: "Round 2", short: "R2", label: "Round 2" },
  { key: "Round 3", short: "R3", label: "Round 3" },
  { key: "Stray Vacancy Round", short: "Stray", label: "Stray vacancy" },
] as const;
export type RoundKey = (typeof ROUNDS)[number]["key"];

/**
 * Default quotas: the ones any candidate can be allotted without a separate eligibility rule. MCC
 * prints the AIIMS, JIPMER and BHU seats as "Open Seat Quota", so they sit beside All India.
 */
export const PREDICTOR_COURSES: Record<string, { label: string; defaults: string[] }> = {
  mbbs: { label: "MBBS", defaults: ["All India", "Open Seat Quota"] },
  bds: { label: "BDS", defaults: ["All India", "Open Seat Quota"] },
  "bsc-nursing": { label: "B.Sc Nursing", defaults: ["B.Sc Nursing All India"] },
};

/** Short notes on quotas, only where the lists themselves show who they cover. */
export const QUOTA_NOTES: Record<string, string> = {
  "Open Seat Quota": "AIIMS, JIPMER and BHU seats open to all candidates",
  "Self-Financed Merit Seat": "paid seats, mostly at deemed universities",
};

/** Default quota slugs for a course that are present in the lists. */
export function defaultQuotas(course: string, meta: PredictorMeta | null): string[] {
  const available = meta?.quotas[course] ?? [];
  const wanted = (own(PREDICTOR_COURSES, course)?.defaults ?? []).map(slugify);
  const list = wanted.filter((q) => available.some((a) => a.value === q));
  return list.length ? list : available.slice(0, 1).map((a) => a.value);
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/**
 * Seat categories as MCC prints them, and the seat categories a candidate of each one can be
 * allotted: Open seats are open to every candidate, and a PwD candidate can also take the seats
 * of their category without the PwD reservation.
 */
export const CATEGORIES: Record<string, { label: string; mcc: string; eligible: string[] }> = {
  open: { label: "Open (General)", mcc: "Open", eligible: ["Open"] },
  ews: { label: "EWS", mcc: "EWS", eligible: ["EWS", "Open"] },
  obc: { label: "OBC (non-creamy layer)", mcc: "OBC", eligible: ["OBC", "Open"] },
  sc: { label: "SC", mcc: "SC", eligible: ["SC", "Open"] },
  st: { label: "ST", mcc: "ST", eligible: ["ST", "Open"] },
  "open-pwd": { label: "Open PwD", mcc: "Open PwD", eligible: ["Open PwD", "Open"] },
  "ews-pwd": { label: "EWS PwD", mcc: "EWS PwD", eligible: ["EWS PwD", "EWS", "Open PwD", "Open"] },
  "obc-pwd": { label: "OBC PwD", mcc: "OBC PwD", eligible: ["OBC PwD", "OBC", "Open PwD", "Open"] },
  "sc-pwd": { label: "SC PwD", mcc: "SC PwD", eligible: ["SC PwD", "SC", "Open PwD", "Open"] },
  "st-pwd": { label: "ST PwD", mcc: "ST PwD", eligible: ["ST PwD", "ST", "Open PwD", "Open"] },
};

/**
 * State quota counselling we can point to, from the state exam bodies already in data/reference.ts.
 * States not listed here get a general note, never a guessed link.
 */
const STATE_AUTHORITY_EXAM: Record<string, string> = { KL: "keam", KA: "kcet" };
export function stateAuthority(stateCode: string | null | undefined) {
  const slug = own(STATE_AUTHORITY_EXAM, stateCode);
  const exam = slug ? EXAMS.find((e) => e.slug === slug) : undefined;
  return exam?.url ? { body: exam.body, url: exam.url } : null;
}

export const RANK_MAX = 2_500_000;
/** "Reach" covers ranks up to this much beyond the highest closing rank (10%). */
export const REACH_MARGIN = 0.1;
export const RESULTS_PAGE_SIZE = 50;

export const BANDS = {
  likely: { label: "Likely", note: "Your rank is within the Round 1 closing rank." },
  possible: { label: "Possible", note: "Within a later round's closing rank, not Round 1's." },
  reach: { label: "Reach", note: "Up to 10% beyond the highest closing rank." },
} as const;
export type Band = keyof typeof BANDS;

type Option = { value: string; label: string };

export type PredictorMeta = {
  examId: number;
  year: number;
  /** The allotment list for each round, for the source links. */
  roundSources: Partial<Record<RoundKey, { title: string; url: string | null; retrievedOn: string }>>;
  mainSource: { title: string; url: string | null; publisher: string; retrievedOn: string } | null;
  /** Quotas present in the lists, per course slug, with their row counts. */
  quotas: Record<string, (Option & { mcc: string; rows: number })[]>;
  states: (Option & { code: string })[];
  ownership: Option[];
};

const META_TTL_MS = 10 * 60 * 1000;
const memo = globalThis as unknown as { predictorMeta?: { at: number; value: Promise<PredictorMeta | null> } };

async function loadMeta(): Promise<PredictorMeta | null> {
  const [head] = await rows<{ exam_id: number; year: number | null }>(sql`
    select e.id as exam_id, (select max(cu.year) from cutoffs cu where cu.exam_id = e.id) as year
    from exams e where e.slug = ${NEET_EXAM}
  `);
  if (!head?.year) return null;
  const examId = Number(head.exam_id);
  const year = Number(head.year);
  const [sourceList, quotaList, stateList, ownershipList] = await Promise.all([
    rows<{ round: string | null; title: string | null; url: string | null; publisher: string; retrieved_on: string }>(sql`
      select x.round, s.title, s.url, s.publisher, s.retrieved_on
      from (select distinct round, source_id from cutoffs where exam_id = ${examId} and year = ${year}) x
      join sources s on s.id = x.source_id
    `),
    rows<{ course: string; quota: string; n: unknown }>(sql`
      select c.slug as course, cu.quota, count(*) as n
      from cutoffs cu join offerings o on o.id = cu.offering_id join courses c on c.id = o.course_id
      where cu.exam_id = ${examId} and cu.year = ${year} and cu.quota is not null
      group by c.slug, cu.quota order by n desc, cu.quota
    `),
    rows<{ code: string; slug: string; name: string }>(sql`
      select distinct st.code, st.slug, st.name
      from cutoffs cu join offerings o on o.id = cu.offering_id join institutions i on i.id = o.institution_id join states st on st.code = i.state_code
      where cu.exam_id = ${examId} and cu.year = ${year} and i.status = 'published'
      order by st.name
    `),
    rows<{ ownership: string }>(sql`
      select distinct i.ownership
      from cutoffs cu join offerings o on o.id = cu.offering_id join institutions i on i.id = o.institution_id
      where cu.exam_id = ${examId} and cu.year = ${year} and i.status = 'published' and i.ownership is not null
    `),
  ]);

  const roundSources: PredictorMeta["roundSources"] = {};
  let mainSource: PredictorMeta["mainSource"] = null;
  for (const s of sourceList) {
    const round = ROUNDS.find((r) => r.key === s.round);
    if (round) roundSources[round.key] = { title: s.title ?? s.publisher, url: s.url, retrievedOn: s.retrieved_on };
    if (!mainSource) mainSource = { title: s.title ?? s.publisher, url: s.url, publisher: s.publisher, retrievedOn: s.retrieved_on };
  }

  const quotas: PredictorMeta["quotas"] = {};
  for (const q of quotaList) {
    if (!own(PREDICTOR_COURSES, q.course)) continue;
    (quotas[q.course] ??= []).push({ value: slugify(q.quota), label: q.quota, mcc: q.quota, rows: Number(q.n) });
  }
  return {
    examId,
    year,
    roundSources,
    mainSource,
    quotas,
    states: stateList.map((s) => ({ value: s.slug, label: s.name, code: s.code })),
    ownership: Object.entries(OWNERSHIP_LABELS)
      .filter(([value]) => ownershipList.some((o) => o.ownership === value))
      .map(([value, label]) => ({ value, label })),
  };
}

export function getPredictorMeta(): Promise<PredictorMeta | null> {
  const hit = memo.predictorMeta;
  if (hit && Date.now() - hit.at < META_TTL_MS) return hit.value;
  const value = loadMeta();
  memo.predictorMeta = { at: Date.now(), value };
  value.catch(() => {
    if (memo.predictorMeta?.value === value) memo.predictorMeta = undefined;
  });
  return value;
}

type RawParams = Record<string, string | string[] | undefined>;

function all(v: string | string[] | undefined): string[] {
  const list = Array.isArray(v) ? v : v === undefined ? [] : [v];
  return list
    .flatMap((x) => x.split(","))
    .map((x) => x.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 40);
}

export type PredictorInput = {
  /** What the student typed, kept to refill the form. */
  rankText: string;
  rank: number | null;
  rankError: string | null;
  course: string;
  category: string;
  /** Quota slugs, already checked against the quotas in the lists for this course. */
  quotas: string[];
  state: string | null;
  ownership: string[];
  band: Band | null;
  page: number;
  /** Any recognised parameter was given: the URL is a result or a variant of the bare page. */
  hasParams: boolean;
};

/** Reads and validates the URL parameters. Unknown values are dropped, never passed to SQL. */
export function readPredictorInput(p: RawParams, meta: PredictorMeta | null): PredictorInput {
  // Kept only to refill the form, so anything but digits, separators and letters is dropped.
  const rankText = (one(p.rank) ?? "").replace(/[^\p{L}\p{N} ,._-]/gu, "").slice(0, 20);
  let rank: number | null = null;
  let rankError: string | null = null;
  if (rankText) {
    const cleaned = rankText.replace(/[\s,_]/g, "");
    const n = /^\d{1,8}$/.test(cleaned) ? Number(cleaned) : NaN;
    if (!Number.isSafeInteger(n)) rankError = "Enter your All India Rank as a whole number, for example 45000.";
    else if (n < 1 || n > RANK_MAX) rankError = `Enter an All India Rank between 1 and ${RANK_MAX.toLocaleString("en-IN")}.`;
    else rank = n;
  }
  const courseRaw = one(p.course);
  const course = courseRaw && own(PREDICTOR_COURSES, courseRaw) ? courseRaw : "mbbs";
  const categoryRaw = one(p.category);
  const category = categoryRaw && own(CATEGORIES, categoryRaw) ? categoryRaw : "open";

  const available = meta?.quotas[course] ?? [];
  const picked = all(p.quota).filter((q) => available.some((a) => a.value === q));
  const quotas = picked.length ? [...new Set(picked)] : defaultQuotas(course, meta);

  const stateRaw = one(p.state);
  const state = stateRaw && meta?.states.some((s) => s.value === stateRaw) ? stateRaw : null;
  const ownership = [...new Set(all(p.ownership).filter((o) => meta?.ownership.some((x) => x.value === o)))];
  const bandRaw = one(p.band);
  const band = bandRaw && own(BANDS, bandRaw) ? (bandRaw as Band) : null;
  const pageN = Number(one(p.page));
  const page = Number.isInteger(pageN) && pageN > 0 && pageN < 1000 ? pageN : 1;
  const hasParams = ["rank", "course", "category", "quota", "state", "ownership", "band", "page"].some((k) => Object.hasOwn(p, k));
  return { rankText, rank, rankError, course, category, quotas, state, ownership, band, page, hasParams };
}

/** The URL for a set of inputs, leaving out defaults so shared links stay short. */
export function predictorHref(i: Partial<PredictorInput>, meta: PredictorMeta | null): string {
  const u = new URLSearchParams();
  if (i.rank) u.set("rank", String(i.rank));
  if (i.course && i.course !== "mbbs") u.set("course", i.course);
  if (i.category && i.category !== "open") u.set("category", i.category);
  if (i.quotas?.length && !sameSet(i.quotas, defaultQuotas(i.course ?? "mbbs", meta))) for (const q of i.quotas) u.append("quota", q);
  if (i.state) u.set("state", i.state);
  for (const o of i.ownership ?? []) u.append("ownership", o);
  if (i.band) u.set("band", i.band);
  if (i.page && i.page > 1) u.set("page", String(i.page));
  const s = u.toString();
  return s ? `/predictor/neet?${s}` : "/predictor/neet";
}

export type PredictorResult = {
  slug: string;
  name: string;
  place: string | null;
  stateName: string | null;
  ownership: string | null;
  quota: string;
  /** The seat category whose ranks decide the band, as MCC prints it. */
  category: string;
  closing: Partial<Record<RoundKey, number>>;
  /** Highest closing rank across the rounds. */
  finalRank: number;
  finalRound: RoundKey;
  band: Band;
  /** The closing rank the band was decided on, and which round's list it comes from. */
  decidingRank: number;
  decidingRound: RoundKey;
  seats: number | null;
  seatsYear: string | null;
};

type Row = {
  slug: string;
  name: string;
  place: string | null;
  state_name: string | null;
  ownership: string | null;
  offering_id: number;
  quota: string;
  category: string;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  seats: number | null;
  academic_year: string | null;
};

const BAND_ORDER: Record<Band, number> = { likely: 0, possible: 1, reach: 2 };

/** The WHERE conditions for the inputs, or null when no quota in the lists was chosen. Use with cu, c and i. */
function filters(input: PredictorInput, meta: PredictorMeta): SQL[] | null {
  const quotaNames = (meta.quotas[input.course] ?? []).filter((q) => input.quotas.includes(q.value)).map((q) => q.mcc);
  if (!quotaNames.length) return null;
  const categories = CATEGORIES[input.category].eligible;
  const where: SQL[] = [
    sql`cu.exam_id = ${meta.examId}`,
    sql`cu.year = ${meta.year}`,
    // Ranks on a preparatory rank list (JoSAA "P") are not comparable with ordinary ranks.
    sql`cu.preparatory is null`,
    sql`cu.category in (${sql.join(categories.map((c) => sql`${c}`), sql`, `)})`,
    sql`cu.quota in (${sql.join(quotaNames.map((q) => sql`${q}`), sql`, `)})`,
    sql`c.slug = ${input.course}`,
    sql`i.status = 'published'`,
  ];
  const stateCode = input.state ? meta.states.find((s) => s.value === input.state)?.code : undefined;
  if (stateCode) where.push(sql`i.state_code = ${stateCode}`);
  if (input.ownership.length) where.push(sql`i.ownership in (${sql.join(input.ownership.map((o) => sql`${o}`), sql`, `)})`);
  return where;
}

/** For the empty state only: the highest closing rank in the lists for the same choices. */
export async function highestClosingRank(input: PredictorInput, meta: PredictorMeta): Promise<number | null> {
  const where = filters(input, meta);
  if (!where) return null;
  const [r] = await rows<{ m: number | null }>(sql`
    select max(cu.closing_rank) as m
    from cutoffs cu join offerings o on o.id = cu.offering_id join courses c on c.id = o.course_id join institutions i on i.id = o.institution_id
    where ${sql.join(where, sql` and `)}
  `);
  return r?.m === null || r?.m === undefined ? null : Number(r.m);
}

/**
 * One query: every cutoff row for the course, the candidate's eligible seat categories and the
 * chosen quotas, pivoted to one row per college, quota and category with each round's closing
 * rank, keeping only those whose highest closing rank is within the Reach margin of the rank.
 * Bands are then decided in code, and for each college and quota the best band among the
 * categories the candidate can take is kept.
 */
export async function predictColleges(input: PredictorInput, meta: PredictorMeta): Promise<{ items: PredictorResult[]; counts: Record<Band, number> }> {
  const counts: Record<Band, number> = { likely: 0, possible: 0, reach: 0 };
  const where = filters(input, meta);
  if (!input.rank || !where) return { items: [], counts };
  const rank = input.rank;
  const [k1, k2, k3, k4] = ROUNDS.map((r) => r.key);
  // Integer form of "highest closing rank x (1 + margin) >= rank", so no float rounding decides a row.
  const marginTenths = Math.round(REACH_MARGIN * 10);
  const list = await rows<Row>(sql`
    select i.slug, i.name, coalesce(i.city, i.district) as place, st.name as state_name, i.ownership,
      g.offering_id, g.quota, g.category, g.r1, g.r2, g.r3, g.r4,
      coalesce(o.seats, (select sum(b.seats) from offering_branches b where b.offering_id = o.id)) as seats,
      o.academic_year
    from (
      select cu.offering_id, cu.quota, cu.category,
        max(case when cu.round = ${k1} then cu.closing_rank end) as r1,
        max(case when cu.round = ${k2} then cu.closing_rank end) as r2,
        max(case when cu.round = ${k3} then cu.closing_rank end) as r3,
        max(case when cu.round = ${k4} then cu.closing_rank end) as r4
      from cutoffs cu
      join offerings o on o.id = cu.offering_id
      join courses c on c.id = o.course_id
      join institutions i on i.id = o.institution_id
      where ${sql.join(where, sql` and `)}
      group by cu.offering_id, cu.quota, cu.category
      having max(cu.closing_rank) * ${10 + marginTenths} >= ${rank} * 10
    ) g
    join offerings o on o.id = g.offering_id
    join institutions i on i.id = o.institution_id
    left join states st on st.code = i.state_code
  `);

  const best = new Map<string, PredictorResult>();
  for (const r of list) {
    const closing: Partial<Record<RoundKey, number>> = {};
    [r.r1, r.r2, r.r3, r.r4].forEach((v, idx) => {
      if (v !== null && v !== undefined) closing[ROUNDS[idx].key] = Number(v);
    });
    const entries = ROUNDS.filter((x) => closing[x.key] !== undefined).map((x) => [x.key, closing[x.key]!] as const);
    if (!entries.length) continue;
    const [finalRound, finalRank] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    const r1 = closing["Round 1"];
    let band: Band;
    let decidingRank: number;
    let decidingRound: RoundKey;
    if (r1 !== undefined && rank <= r1) {
      band = "likely";
      decidingRank = r1;
      decidingRound = "Round 1";
    } else if (rank <= finalRank) {
      band = "possible";
      // The earliest later round whose closing rank covers the rank.
      const hit = entries.find(([k, v]) => k !== "Round 1" && rank <= v) ?? [finalRound, finalRank];
      decidingRound = hit[0];
      decidingRank = hit[1];
    } else if (rank <= finalRank * (1 + REACH_MARGIN)) {
      band = "reach";
      decidingRank = finalRank;
      decidingRound = finalRound;
    } else continue;

    const item: PredictorResult = {
      slug: r.slug,
      name: r.name,
      place: r.place,
      stateName: r.state_name,
      ownership: r.ownership ? own(OWNERSHIP_LABELS, r.ownership) ?? r.ownership : null,
      quota: r.quota,
      category: r.category,
      closing,
      finalRank,
      finalRound,
      band,
      decidingRank,
      decidingRound,
      seats: r.seats === null || r.seats === undefined ? null : Number(r.seats),
      seatsYear: r.academic_year,
    };
    const key = `${r.offering_id}|${r.quota}`;
    const cur = best.get(key);
    if (!cur || BAND_ORDER[item.band] < BAND_ORDER[cur.band] || (item.band === cur.band && item.decidingRank > cur.decidingRank)) best.set(key, item);
  }

  const items = [...best.values()].sort(
    (a, b) => BAND_ORDER[a.band] - BAND_ORDER[b.band] || a.decidingRank - b.decidingRank || a.name.localeCompare(b.name) || a.quota.localeCompare(b.quota),
  );
  for (const it of items) counts[it.band]++;
  return { items, counts };
}
