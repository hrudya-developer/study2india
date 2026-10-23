import { and, eq, sql } from "drizzle-orm";
import { getDb, getPool, rows, schema } from "@/lib/db";
import { MIGRATIONS } from "@/lib/db/migrations.generated";
import { NIRF_FILES, NMC_FILES, NMC_LINKS } from "@/lib/db/seed-data.generated";
import { STATES, STATE_ALIASES, STREAMS, EXAMS, NIRF_CATEGORY_STREAM } from "@/data/reference";
import { slugify } from "@/lib/slug";

const { states, streams, courses, exams, examStreams, sources, institutions, institutionIdentifiers, institutionStreams, rankings, offerings } = schema;

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
type NmcRow = {
  code: string;
  name: string;
  state: string;
  university: string | null;
  management: "Government" | "Private" | "Trust";
  established: number | null;
  seats: number | null;
  lop_date: string | null;
};
type NmcFile = { source: { publisher: string; title: string; url: string; retrieved: string }; course: string; academic_year: string; rows: NmcRow[] };

/** NMC lists the management type; trust-run colleges are privately managed. */
const NMC_OWNERSHIP = { Government: "government", Private: "private", Trust: "private" } as const;
const NMC_LOADER_VERSION = 1;

async function identifierOwner(scheme: string, value: string) {
  const [hit] = await getDb()
    .select({ id: institutionIdentifiers.institutionId })
    .from(institutionIdentifiers)
    .where(and(eq(institutionIdentifiers.scheme, scheme), eq(institutionIdentifiers.value, value)));
  return hit?.id;
}

/**
 * Loads the National Medical Commission college lists: one institution per NMC college code,
 * with its intake for the course as an offering. Colleges NIRF already ranks are joined to the
 * same record through the hand-checked links in data/nmc/links.json.
 */
export async function seedNmc(streamIds: Map<string, number>, log: (m: string) => void = console.log) {
  const db = getDb();
  const done = new Map((await rows<{ tag: string; hash: string }>(sql`select tag, hash from app_seeds`)).map((r) => [r.tag, r.hash]));
  const medical = streamIds.get("medical");
  for (const file of NMC_FILES) {
    const key = `${file.hash}-${NMC_LOADER_VERSION}`;
    if (done.get(file.tag) === key) continue;
    const data = file.data as NmcFile;
    const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, data.course));
    if (!course) {
      log(`NMC ${data.course}: course not found, skipped`);
      continue;
    }
    const [existing] = await db.select({ id: sources.id }).from(sources).where(eq(sources.title, data.source.title));
    const sourceId =
      existing?.id ??
      (await db.insert(sources).values({ publisher: data.source.publisher, title: data.source.title, url: data.source.url, retrievedOn: data.source.retrieved }).$returningId())[0].id;
    if (existing) await db.update(sources).set({ url: data.source.url, retrievedOn: data.source.retrieved }).where(eq(sources.id, existing.id));

    let created = 0;
    for (const r of data.rows) {
      const code = stateCode(r.state);
      const name = r.name.trim().replace(/\s+/g, " ");
      let id = await identifierOwner("nmc", r.code);
      if (!id && NMC_LINKS[r.code]) id = await identifierOwner("nirf", NMC_LINKS[r.code]);
      if (!id) {
        const base = slugify(name);
        let slug = base;
        for (let n = 2; (await db.select({ id: institutions.id }).from(institutions).where(eq(institutions.slug, slug)))[0]; n++) slug = `${base}-${n}`;
        const [res] = await db
          .insert(institutions)
          .values({
            slug,
            name,
            stateCode: code,
            ownership: NMC_OWNERSHIP[r.management] ?? null,
            establishedYear: r.established,
            affiliatingUniversity: r.university,
            status: "published",
            sourceId,
          })
          .$returningId();
        id = res.id;
        created++;
      } else {
        // Fill only what is still empty; never overwrite a value another source set.
        await db.execute(sql`update institutions set
          ownership = coalesce(ownership, ${NMC_OWNERSHIP[r.management] ?? null}),
          established_year = coalesce(established_year, ${r.established}),
          affiliating_university = coalesce(affiliating_university, ${r.university})
          where id = ${id}`);
      }
      // Being on the NMC list is the commission's permission to admit MBBS students.
      await db.execute(sql`update institutions set approvals = case
          when approvals is null then json_array('NMC')
          when json_contains(approvals, '"NMC"') then approvals
          else json_array_append(approvals, '$', 'NMC') end
        where id = ${id}`);
      await db.insert(institutionIdentifiers).values({ institutionId: id, scheme: "nmc", value: r.code }).onDuplicateKeyUpdate({ set: { institutionId: id } });
      if (medical) await db.insert(institutionStreams).values({ institutionId: id, streamId: medical }).onDuplicateKeyUpdate({ set: { streamId: medical } });
      await db
        .insert(offerings)
        .values({ institutionId: id, courseId: course.id, academicYear: data.academic_year, seats: r.seats, seatsSourceId: sourceId })
        .onDuplicateKeyUpdate({ set: { seats: r.seats, seatsSourceId: sourceId } });
    }
    await db.execute(sql`insert into app_seeds (tag, hash) values (${file.tag}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
    log(`NMC ${data.course} ${data.academic_year}: ${data.rows.length} colleges loaded (${created} new)`);
  }
}

export async function bootstrap(log: (m: string) => void = console.log) {
  await runMigrations(log);
  const streamIds = await seedReference();
  await seedNirf(streamIds, log);
  await seedNmc(streamIds, log);
  const [c] = await rows<{ n: number }>(sql`select count(*) as n from institutions`);
  log(`Database ready: ${STATES.length} states, ${STREAMS.length} fields, ${EXAMS.length} exams, ${c?.n ?? 0} institutions`);
}
