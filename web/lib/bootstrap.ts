import { and, eq, sql } from "drizzle-orm";
import { getDb, getPool, rows, schema } from "@/lib/db";
import { MIGRATIONS } from "@/lib/db/migrations.generated";
import { NIRF_FILES } from "@/lib/db/seed-data.generated";
import { STATES, STATE_ALIASES, STREAMS, EXAMS, NIRF_CATEGORY_STREAM } from "@/data/reference";
import { slugify } from "@/lib/slug";

const { states, streams, courses, exams, examStreams, sources, institutions, institutionIdentifiers, institutionStreams, rankings } = schema;

/**
 * Applies the embedded migrations in order, once each, recorded in app_migrations.
 * A named lock stops two server processes starting at once from migrating together.
 */
export async function runMigrations(log: (m: string) => void = console.log) {
  const conn = await getPool().getConnection();
  try {
    await conn.query("create table if not exists app_migrations (tag varchar(120) primary key, applied_at timestamp not null default current_timestamp)");
    const [lockRows] = await conn.query("select get_lock('study2india_migrate', 60) as got");
    if (Number((lockRows as { got: number | null }[])[0]?.got) !== 1) throw new Error("Could not get the migration lock within 60 seconds");
    try {
      const [doneRows] = await conn.query("select tag from app_migrations");
      const done = new Set((doneRows as { tag: string }[]).map((r) => r.tag));
      for (const m of MIGRATIONS) {
        if (done.has(m.tag)) continue;
        for (const statement of m.statements) await conn.query(statement);
        await conn.query("insert into app_migrations (tag) values (?)", [m.tag]);
        log(`Applied migration ${m.tag}`);
      }
    } finally {
      await conn.query("select release_lock('study2india_migrate')");
    }
  } finally {
    conn.release();
  }
}

const stateByName = new Map<string, string>();
for (const s of STATES) stateByName.set(s.name.toLowerCase(), s.code);
for (const [alias, code] of Object.entries(STATE_ALIASES)) stateByName.set(alias, code);

export function stateCode(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  return stateByName.get(key) ?? stateByName.get(key.replace(/&/g, "and")) ?? null;
}

async function idBySlug(table: typeof streams | typeof exams, slug: string): Promise<number> {
  const [row] = await getDb().select({ id: table.id }).from(table).where(eq(table.slug, slug));
  return row.id;
}

/** States, fields of study, courses and exams. Safe to run on every start. */
export async function seedReference() {
  const db = getDb();
  for (const s of STATES) {
    await db
      .insert(states)
      .values({ code: s.code, slug: slugify(s.name), name: s.name, isUnionTerritory: !!s.ut })
      .onDuplicateKeyUpdate({ set: { name: s.name, slug: slugify(s.name), isUnionTerritory: !!s.ut } });
  }

  const streamIds = new Map<string, number>();
  for (const [i, st] of STREAMS.entries()) {
    await db
      .insert(streams)
      .values({ slug: st.slug, name: st.name, summary: st.summary, sortOrder: i })
      .onDuplicateKeyUpdate({ set: { name: st.name, summary: st.summary, sortOrder: i } });
    const sid = await idBySlug(streams, st.slug);
    streamIds.set(st.slug, sid);
    for (const [j, c] of st.courses.entries()) {
      const values = { name: c.name, shortName: c.short, streamId: sid, level: c.level, durationText: c.duration, sortOrder: j };
      await db.insert(courses).values({ slug: c.slug, ...values }).onDuplicateKeyUpdate({ set: values });
    }
  }

  for (const [i, e] of EXAMS.entries()) {
    const values = { name: e.name, shortName: e.short, conductingBody: e.body, level: e.level, officialUrl: e.url, sortOrder: i };
    await db.insert(exams).values({ slug: e.slug, ...values }).onDuplicateKeyUpdate({ set: values });
    const eid = await idBySlug(exams, e.slug);
    await db.delete(examStreams).where(eq(examStreams.examId, eid));
    for (const s of e.streams) {
      const sid = streamIds.get(s);
      if (sid) await db.insert(examStreams).values({ examId: eid, streamId: sid }).onDuplicateKeyUpdate({ set: { streamId: sid } });
    }
  }
  return streamIds;
}

type NirfRow = {
  institute_id?: string | null;
  name: string;
  city?: string | null;
  state?: string | null;
  score?: number | string | null;
  rank?: number | null;
  rank_band?: string | null;
};
type NirfFile = {
  source: { publisher: string; url: string | string[]; retrieved: string };
  year: number;
  category: string;
  rows: NirfRow[];
};

async function findOrCreateInstitution(r: NirfRow, sourceId: number) {
  const db = getDb();
  const nirfId = r.institute_id?.trim() || null;
  if (nirfId) {
    const [hit] = await db
      .select({ id: institutionIdentifiers.institutionId })
      .from(institutionIdentifiers)
      .where(and(eq(institutionIdentifiers.scheme, "nirf"), eq(institutionIdentifiers.value, nirfId)));
    if (hit) return hit.id;
  }
  const code = stateCode(r.state);
  const name = r.name.trim().replace(/\s+/g, " ");
  // Same name, state and city: several institutions share a name ("Government Dental College"),
  // so the city is part of the match.
  const city = r.city?.trim() && !/^select city$/i.test(r.city.trim()) ? r.city.trim() : null;
  const [byName] = await db
    .select({ id: institutions.id })
    .from(institutions)
    .where(
      and(
        eq(institutions.name, name),
        code ? eq(institutions.stateCode, code) : sql`${institutions.stateCode} is null`,
        city ? eq(institutions.city, city) : sql`${institutions.city} is null`,
      ),
    );
  let id = byName?.id;
  if (!id) {
    const base = slugify(`${name} ${r.city ?? ""}`);
    let slug = base;
    for (let n = 2; (await db.select({ id: institutions.id }).from(institutions).where(eq(institutions.slug, slug)))[0]; n++) slug = `${base}-${n}`;
    const [res] = await db
      .insert(institutions)
      .values({ slug, name, city, stateCode: code, status: "published", sourceId })
      .$returningId();
    id = res.id;
  }
  if (nirfId) {
    await db
      .insert(institutionIdentifiers)
      .values({ institutionId: id, scheme: "nirf", value: nirfId })
      .onDuplicateKeyUpdate({ set: { institutionId: id } });
  }
  return id;
}

/** Bump when the loading logic changes, so every file is loaded again once. */
const LOADER_VERSION = 2;

/**
 * Loads the official NIRF files built into the app (see scripts/embed-migrations.mjs).
 * Each file is recorded in app_seeds with its content hash and skipped once loaded.
 */
export async function seedNirf(streamIds: Map<string, number>, log: (m: string) => void = console.log) {
  const db = getDb();
  await db.execute(sql`create table if not exists app_seeds (tag varchar(120) primary key, hash varchar(32) not null, loaded_at timestamp not null default current_timestamp)`);
  const done = new Map((await rows<{ tag: string; hash: string }>(sql`select tag, hash from app_seeds`)).map((r) => [r.tag, r.hash]));
  for (const file of NIRF_FILES) {
    const key = `${file.hash}-${LOADER_VERSION}`;
    if (done.get(file.tag) === key) continue;
    const data = file.data as NirfFile;
    const url = Array.isArray(data.source.url) ? data.source.url.join(" ") : data.source.url;
    const title = `NIRF India Rankings ${data.year}: ${data.category}`;
    const [existing] = await db.select({ id: sources.id }).from(sources).where(eq(sources.title, title));
    const sourceId =
      existing?.id ??
      (await db.insert(sources).values({ publisher: data.source.publisher, title, url, retrievedOn: data.source.retrieved }).$returningId())[0].id;
    if (existing) await db.update(sources).set({ url, retrievedOn: data.source.retrieved }).where(eq(sources.id, existing.id));
    const streamSlug = NIRF_CATEGORY_STREAM[data.category] ?? null;
    const streamId = streamSlug ? streamIds.get(streamSlug) : undefined;
    let count = 0;
    for (const r of data.rows) {
      if (!r.name) continue;
      const instId = await findOrCreateInstitution(r, sourceId);
      const score = r.score === null || r.score === undefined || r.score === "" ? null : String(r.score);
      const values = { rank: r.rank ?? null, rankBand: r.rank_band ?? null, score, sourceId };
      await db
        .insert(rankings)
        .values({ institutionId: instId, agency: "NIRF", year: data.year, category: data.category, ...values })
        .onDuplicateKeyUpdate({ set: values });
      if (streamId) {
        await db.insert(institutionStreams).values({ institutionId: instId, streamId }).onDuplicateKeyUpdate({ set: { streamId } });
      }
      count++;
    }
    await db.execute(sql`insert into app_seeds (tag, hash) values (${file.tag}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
    log(`NIRF ${data.year} ${data.category}: ${count} rows loaded`);
  }
}

/** Migrate, then load reference data and any official data files shipped with the app. */
export async function bootstrap(log: (m: string) => void = console.log) {
  await runMigrations(log);
  const streamIds = await seedReference();
  await seedNirf(streamIds, log);
  const [c] = await rows<{ n: number }>(sql`select count(*) as n from institutions`);
  log(`Database ready: ${STATES.length} states, ${STREAMS.length} fields, ${EXAMS.length} exams, ${c?.n ?? 0} institutions`);
}
