import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb, rows, schema } from "@/lib/db";
import { EXAM_DATES, type ExamSource } from "@/data/exam-dates";
import { SCHOLARSHIPS, SCHOLARSHIP_DEADLINE_SOURCE } from "@/data/scholarships";

const { exams, examDates, sources, scholarships } = schema;

/** Bump when the loading logic changes, so the data is loaded again once. */
const LOADER_VERSION = 1;
const TAG = "reference-extras";

type Source = Pick<ExamSource, "publisher" | "title" | "url" | "retrieved">;

/** One sources row per document title; the URL and checked date follow the data file. */
async function upsertSource(s: Source, cache: Map<string, number>) {
  const hit = cache.get(s.title);
  if (hit) return hit;
  const db = getDb();
  const [existing] = await db.select({ id: sources.id }).from(sources).where(eq(sources.title, s.title));
  let id: number;
  if (existing) {
    await db.update(sources).set({ publisher: s.publisher, url: s.url, retrievedOn: s.retrieved }).where(eq(sources.id, existing.id));
    id = existing.id;
  } else {
    id = (await db.insert(sources).values({ publisher: s.publisher, title: s.title, url: s.url, retrievedOn: s.retrieved }).$returningId())[0].id;
  }
  cache.set(s.title, id);
  return id;
}

/**
 * Loads the official exam schedules (data/exam-dates.ts) and scholarships (data/scholarships.ts).
 * Exam dates are upserted by exam, cycle and event; rows for an exam and cycle that are no longer
 * in the file are removed. Scholarships are upserted by slug. Recorded in app_seeds and skipped
 * while the data and loader version are unchanged.
 */
export async function seedReferenceExtras(log: (m: string) => void = console.log) {
  const db = getDb();
  await db.execute(sql`create table if not exists app_seeds (tag varchar(120) primary key, hash varchar(32) not null, loaded_at timestamp not null default current_timestamp)`);
  const key = `${createHash("sha256").update(JSON.stringify({ EXAM_DATES, SCHOLARSHIPS, SCHOLARSHIP_DEADLINE_SOURCE })).digest("hex").slice(0, 16)}-${LOADER_VERSION}`;
  const [done] = await rows<{ hash: string }>(sql`select hash from app_seeds where tag = ${TAG}`);
  if (done?.hash === key) return;

  const sourceIds = new Map<string, number>();
  const examIds = new Map((await db.select({ id: exams.id, slug: exams.slug }).from(exams)).map((e) => [e.slug, e.id]));

  let dateRows = 0;
  const kept = new Map<string, Set<string>>();
  for (const r of EXAM_DATES) {
    const examId = examIds.get(r.exam);
    if (!examId) {
      log(`Exam dates: exam ${r.exam} not found, row skipped`);
      continue;
    }
    const sourceId = await upsertSource(r.source, sourceIds);
    const values = { startsOn: r.startsOn, endsOn: r.endsOn ?? null, status: r.tentative ? ("tentative" as const) : ("announced" as const), sourceId };
    const [existing] = await db
      .select({ id: examDates.id })
      .from(examDates)
      .where(and(eq(examDates.examId, examId), eq(examDates.cycle, r.cycle), eq(examDates.event, r.event)));
    if (existing) await db.update(examDates).set(values).where(eq(examDates.id, existing.id));
    else await db.insert(examDates).values({ examId, cycle: r.cycle, event: r.event, ...values });
    const k = `${examId}|${r.cycle}`;
    if (!kept.has(k)) kept.set(k, new Set());
    kept.get(k)!.add(r.event);
    dateRows++;
  }
  // An event renamed or dropped in the file leaves no stale row behind for that exam and cycle.
  let removed = 0;
  for (const [k, events] of kept) {
    const [examId, cycle] = k.split("|");
    const current = await db
      .select({ id: examDates.id, event: examDates.event })
      .from(examDates)
      .where(and(eq(examDates.examId, Number(examId)), eq(examDates.cycle, cycle)));
    for (const c of current) {
      if (events.has(c.event)) continue;
      await db.delete(examDates).where(eq(examDates.id, c.id));
      removed++;
    }
  }

  await upsertSource(SCHOLARSHIP_DEADLINE_SOURCE, sourceIds);
  for (const s of SCHOLARSHIPS) {
    const sourceId = await upsertSource(s.source, sourceIds);
    const values = {
      name: s.name,
      provider: s.provider,
      providerType: s.state ? `${s.providerType}: ${s.state}` : s.providerType,
      eligibilityText: s.eligibility,
      amountText: s.amount,
      deadline: s.deadline,
      officialUrl: s.officialUrl,
      sourceId,
      status: "published" as const,
    };
    await db.insert(scholarships).values({ slug: s.slug, ...values }).onDuplicateKeyUpdate({ set: values });
  }

  await db.execute(sql`insert into app_seeds (tag, hash) values (${TAG}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
  log(`Exam dates: ${dateRows} rows loaded${removed ? `, ${removed} stale row${removed === 1 ? "" : "s"} removed` : ""}; scholarships: ${SCHOLARSHIPS.length} loaded`);
}
