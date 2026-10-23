import { createHash } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, rows, schema } from "@/lib/db";
import { CUTOFF_FILES } from "@/lib/db/seed-data.generated";

const { courses, exams, sources, offerings, cutoffs } = schema;

type SourceRef = { publisher: string; title: string; url: string; retrieved: string };
type CutoffRow = {
  /** The institution by one of its identifiers, e.g. { scheme: "nmc", value: "MH/002/G/1" }. */
  institution: { scheme: string; value: string };
  /** Exam slug when the file mixes exams (JoSAA: jee-advanced for IITs and IISc, jee-main for the rest); else the file's `exam`. */
  exam?: string;
  /** Course slug from data/reference.ts. */
  course: string;
  /** As the counselling body prints them. */
  round?: string | null;
  quota?: string | null;
  category?: string | null;
  /** Programme or branch (JoSAA); absent or null when the course has none. */
  branch?: string | null;
  /** Seat pool (JoSAA gender pools); absent or null when there is none. */
  seat_pool?: string | null;
  opening_rank: number | null;
  closing_rank: number | null;
  /** True when a rank is on JoSAA's preparatory rank list (printed with a "P"), not comparable with ordinary ranks. */
  preparatory?: boolean;
  /** Which rank is on the preparatory list when only one of the two is; absent when both are. */
  preparatory_rank?: "opening" | "closing";
};
/** One file in data/cutoffs/: the opening and closing ranks one counselling published for one year. */
type CutoffFile = {
  /** Exam slug for every row that does not name its own. */
  exam?: string;
  /** Admission year; the matching academic year is "<year>-<year + 1>", e.g. 2026 -> "2026-27". */
  year: number;
  source: SourceRef;
  /** Optional: the document for each round, cited instead of `source` on that round's rows. */
  round_sources?: Record<string, { title: string; url: string }>;
  rows: CutoffRow[];
};

/** Bump when the loading logic changes, so every file is loaded again once. */
const CUTOFF_LOADER_VERSION = 2;

/** Rows per insert statement. */
const BATCH = 1000;

/** The cutoffs.preparatory value: null for ordinary ranks, else which rank is on the preparatory list. */
function preparatoryOf(r: CutoffRow): string | null {
  return r.preparatory ? (r.preparatory_rank ?? "both") : null;
}

/** Same text as the row_key column computes in the database (its concat_ws skips a NULL preparatory). */
function rowKey(offeringId: number, examId: number, year: number, r: CutoffRow, preparatory: string | null) {
  const parts: (string | number)[] = [offeringId, examId, year, r.round ?? "", r.quota ?? "", r.category ?? "", r.branch ?? "", r.seat_pool ?? ""];
  if (preparatory !== null) parts.push(preparatory);
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

async function upsertSource(s: SourceRef) {
  const db = getDb();
  const [existing] = await db.select({ id: sources.id }).from(sources).where(eq(sources.title, s.title));
  if (existing) {
    await db.update(sources).set({ publisher: s.publisher, url: s.url, retrievedOn: s.retrieved }).where(eq(sources.id, existing.id));
    return existing.id;
  }
  return (await db.insert(sources).values({ publisher: s.publisher, title: s.title, url: s.url, retrievedOn: s.retrieved }).$returningId())[0].id;
}

/**
 * Loads the cutoff files built into the app (data/cutoffs/, embedded by scripts/embed-migrations.mjs).
 * Each row's exam is its own `exam` or else the file's. Each row is matched to an offering: the
 * institution's offering of that course for the admission year, else its latest one; an institution
 * with no offering of the course gets one for that year, since an official allotment to the course is
 * evidence that it admits students to it. Rows are upserted on (offering, exam, year, round, quota,
 * category, branch, seat pool, preparatory list), in one transaction per file; rows an earlier version
 * of the same file wrote that are no longer in it are removed; and each file is recorded in app_seeds
 * with its content hash so an unchanged file is skipped (and not even decompressed) on the next start.
 */
export async function seedCutoffs(log: (m: string) => void = console.log) {
  const db = getDb();
  await db.execute(sql`create table if not exists app_seeds (tag varchar(120) primary key, hash varchar(32) not null, loaded_at timestamp not null default current_timestamp)`);
  const done = new Map((await rows<{ tag: string; hash: string }>(sql`select tag, hash from app_seeds`)).map((r) => [r.tag, r.hash]));
  for (const file of CUTOFF_FILES) {
    const key = `${file.hash}-${CUTOFF_LOADER_VERSION}`;
    if (done.get(file.tag) === key) continue;
    const started = Date.now();
    const data = file.data as CutoffFile;

    const examIds = new Map((await db.select({ id: exams.id, slug: exams.slug }).from(exams)).map((e) => [e.slug, e.id]));
    const unknownExams = new Map<string, number>();
    for (const r of data.rows) {
      const slug = r.exam ?? data.exam ?? "(none)";
      if (!examIds.has(slug)) unknownExams.set(slug, (unknownExams.get(slug) ?? 0) + 1);
    }
    for (const [slug, n] of unknownExams) log(`Cutoffs ${file.tag}: exam ${slug} not found, ${n} rows skipped`);

    const mainSourceId = await upsertSource(data.source);
    const roundSourceIds = new Map<string, number>();
    for (const [round, s] of Object.entries(data.round_sources ?? {})) {
      roundSourceIds.set(round, await upsertSource({ publisher: data.source.publisher, title: s.title, url: s.url, retrieved: data.source.retrieved }));
    }
    const fileSourceIds = [mainSourceId, ...roundSourceIds.values()];

    // Institutions by identifier, for the schemes this file uses.
    const schemes = [...new Set(data.rows.map((r) => r.institution.scheme))];
    const institutionIds = new Map<string, number>();
    for (const r of await rows<{ scheme: string; value: string; institution_id: number }>(
      sql`select scheme, value, institution_id from institution_identifiers where scheme in (${sql.join(schemes.map((s) => sql`${s}`), sql`, `)})`,
    )) {
      institutionIds.set(`${r.scheme}:${r.value}`, r.institution_id);
    }
    const courseIds = new Map((await db.select({ id: courses.id, slug: courses.slug }).from(courses)).map((c) => [c.slug, c.id]));

    // The offering for each institution and course: the admission year's, else the latest.
    const academicYear = `${data.year}-${String((data.year + 1) % 100).padStart(2, "0")}`;
    const wanted = new Map<string, { institutionId: number; courseId: number }>();
    let unknownInstitution = 0;
    let unknownCourse = 0;
    for (const r of data.rows) {
      if (!examIds.has(r.exam ?? data.exam ?? "")) continue;
      const institutionId = institutionIds.get(`${r.institution.scheme}:${r.institution.value}`);
      const courseId = courseIds.get(r.course);
      if (!institutionId) unknownInstitution++;
      else if (!courseId) unknownCourse++;
      else wanted.set(`${institutionId}:${courseId}`, { institutionId, courseId });
    }
    const offeringIds = new Map<string, number>();
    const institutionList = [...new Set([...wanted.values()].map((w) => w.institutionId))];
    for (let i = 0; i < institutionList.length; i += 500) {
      const found = await db
        .select({ id: offerings.id, institutionId: offerings.institutionId, courseId: offerings.courseId, academicYear: offerings.academicYear })
        .from(offerings)
        .where(inArray(offerings.institutionId, institutionList.slice(i, i + 500)));
      const best = new Map<string, { id: number; academicYear: string | null }>();
      for (const o of found) {
        const k = `${o.institutionId}:${o.courseId}`;
        if (!wanted.has(k)) continue;
        const cur = best.get(k);
        const better =
          !cur ||
          (o.academicYear === academicYear && cur.academicYear !== academicYear) ||
          (cur.academicYear !== academicYear && (o.academicYear ?? "") > (cur.academicYear ?? ""));
        if (better) best.set(k, { id: o.id, academicYear: o.academicYear });
      }
      for (const [k, o] of best) offeringIds.set(k, o.id);
    }
    let createdOfferings = 0;
    for (const [k, w] of wanted) {
      if (offeringIds.has(k)) continue;
      await db.insert(offerings).values({ institutionId: w.institutionId, courseId: w.courseId, academicYear, seats: null }).onDuplicateKeyUpdate({ set: { courseId: w.courseId } });
      const [o] = await db
        .select({ id: offerings.id })
        .from(offerings)
        .where(and(eq(offerings.institutionId, w.institutionId), eq(offerings.courseId, w.courseId), eq(offerings.academicYear, academicYear)));
      offeringIds.set(k, o.id);
      createdOfferings++;
    }

    const values: (typeof cutoffs.$inferInsert)[] = [];
    const keys = new Set<string>();
    const perExam = new Map<string, number>();
    let preparatoryRows = 0;
    for (const r of data.rows) {
      const examSlug = r.exam ?? data.exam ?? "";
      const examId = examIds.get(examSlug);
      const institutionId = institutionIds.get(`${r.institution.scheme}:${r.institution.value}`);
      const courseId = courseIds.get(r.course);
      if (!examId || !institutionId || !courseId) continue;
      const offeringId = offeringIds.get(`${institutionId}:${courseId}`)!;
      const preparatory = preparatoryOf(r);
      keys.add(rowKey(offeringId, examId, data.year, r, preparatory));
      perExam.set(examSlug, (perExam.get(examSlug) ?? 0) + 1);
      if (preparatory) preparatoryRows++;
      values.push({
        offeringId,
        examId,
        year: data.year,
        round: r.round ?? null,
        quota: r.quota ?? null,
        category: r.category ?? null,
        branch: r.branch ?? null,
        seatPool: r.seat_pool ?? null,
        openingRank: r.opening_rank,
        closingRank: r.closing_rank,
        preparatory,
        sourceId: (r.round && roundSourceIds.get(r.round)) || mainSourceId,
      });
    }

    let removed = 0;
    await db.transaction(async (tx) => {
      for (let i = 0; i < values.length; i += BATCH) {
        await tx
          .insert(cutoffs)
          .values(values.slice(i, i + BATCH))
          .onDuplicateKeyUpdate({
            set: { openingRank: sql.raw("values(opening_rank)"), closingRank: sql.raw("values(closing_rank)"), sourceId: sql.raw("values(source_id)") },
          });
      }
      // Rows an earlier version of this file wrote (its sources, its year) that it no longer has.
      const existing = await tx
        .select({ id: cutoffs.id, rowKey: cutoffs.rowKey })
        .from(cutoffs)
        .where(and(eq(cutoffs.year, data.year), inArray(cutoffs.sourceId, fileSourceIds)));
      const stale = existing.filter((e) => !e.rowKey || !keys.has(e.rowKey)).map((e) => e.id);
      for (let i = 0; i < stale.length; i += BATCH) await tx.delete(cutoffs).where(inArray(cutoffs.id, stale.slice(i, i + BATCH)));
      removed = stale.length;
    });

    await db.execute(sql`insert into app_seeds (tag, hash) values (${file.tag}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
    const notes = [
      perExam.size > 1 ? [...perExam].map(([slug, n]) => `${slug} ${n}`).join(", ") : "",
      preparatoryRows ? `${preparatoryRows} on the preparatory rank list` : "",
      createdOfferings ? `${createdOfferings} offerings added` : "",
      removed ? `${removed} old rows removed` : "",
      unknownInstitution ? `${unknownInstitution} rows with no matching institution` : "",
      unknownCourse ? `${unknownCourse} rows with an unknown course` : "",
    ].filter(Boolean);
    log(`Cutoffs ${file.tag} (${data.year}): ${values.length} rows loaded in ${((Date.now() - started) / 1000).toFixed(1)}s${notes.length ? ` (${notes.join("; ")})` : ""}`);
  }
}
