import { and, eq, sql } from "drizzle-orm";
import { getDb, getPool, rows, schema } from "@/lib/db";
import { MIGRATIONS } from "@/lib/db/migrations.generated";
import { NIRF_FILES, NMC_FILES, NMC_LINKS, COUNCIL_FILES } from "@/lib/db/seed-data.generated";
import { STATES, STATE_ALIASES, STREAMS, EXAMS, NIRF_CATEGORY_STREAM } from "@/data/reference";
import { slugify } from "@/lib/slug";

const { states, streams, courses, exams, examStreams, sources, institutions, institutionIdentifiers, institutionStreams, rankings, offerings, offeringBranches } = schema;

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

type NmcSource = { publisher: string; title: string; url: string; retrieved: string };
type NmcManagement = "Government" | "Private" | "Trust";
type NmcCollege = { code: string; name: string; state: string; university: string | null; management: NmcManagement; established?: number | null };
type NmcUgRow = NmcCollege & { seats: number | null; lop_date: string | null };
/** One NMC course list: MBBS (one intake per college) or PG (intake per branch). */
type NmcUgFile = { source: NmcSource; course: string; academic_year: string; rows: NmcUgRow[] };
type NmcPgFile = {
  source: NmcSource;
  academic_year: string;
  /** [NMC course type, branch name as NMC publishes it] */
  courses: [string, string][];
  /** PG-only institutions that are not on the MBBS list. */
  institutions: NmcCollege[];
  /** b: [index into courses, approved seats] */
  rows: { code: string; b: [number, number][] }[];
};

/** NMC lists the management type; trust-run colleges are privately managed. */
const NMC_OWNERSHIP = { Government: "government", Private: "private", Trust: "private" } as const;
const NMC_LOADER_VERSION = 2;

/**
 * Which of our courses an NMC PG branch belongs to, by the type NMC gives it. A few branches
 * whose own name says they are diplomas are listed under DM or MD; the name decides those.
 */
function nmcPgCourse(type: string, name: string): string {
  if (/diploma|\(D\.|Dip\./i.test(name)) return "pg-diploma-medical";
  if (type === "DM" || type === "M.Ch.") return "dm-mch";
  if (type === "MD" || type === "MS") return "md-ms";
  return "pg-diploma-medical";
}

async function identifierOwner(scheme: string, value: string) {
  const [hit] = await getDb()
    .select({ id: institutionIdentifiers.institutionId })
    .from(institutionIdentifiers)
    .where(and(eq(institutionIdentifiers.scheme, scheme), eq(institutionIdentifiers.value, value)));
  return hit?.id;
}

async function upsertSource(s: NmcSource) {
  const db = getDb();
  const [existing] = await db.select({ id: sources.id }).from(sources).where(eq(sources.title, s.title));
  if (existing) {
    await db.update(sources).set({ url: s.url, retrievedOn: s.retrieved }).where(eq(sources.id, existing.id));
    return existing.id;
  }
  return (await db.insert(sources).values({ publisher: s.publisher, title: s.title, url: s.url, retrievedOn: s.retrieved }).$returningId())[0].id;
}

/**
 * Finds the institution for an NMC college code, or creates it from the NMC details. Colleges
 * NIRF already ranks are joined to the same record through the hand-checked links in
 * data/nmc/links.json. Returns the id and whether it was created.
 */
async function nmcInstitution(r: NmcCollege, sourceId: number, medical: number | undefined) {
  const db = getDb();
  let id = await identifierOwner("nmc", r.code);
  if (!id && NMC_LINKS[r.code]) id = await identifierOwner("nirf", NMC_LINKS[r.code]);
  let created = false;
  if (!id) {
    const name = r.name.trim().replace(/\s+/g, " ");
    const base = slugify(name);
    let slug = base;
    for (let n = 2; (await db.select({ id: institutions.id }).from(institutions).where(eq(institutions.slug, slug)))[0]; n++) slug = `${base}-${n}`;
    const [res] = await db
      .insert(institutions)
      .values({
        slug,
        name,
        stateCode: stateCode(r.state),
        ownership: NMC_OWNERSHIP[r.management] ?? null,
        establishedYear: r.established ?? null,
        affiliatingUniversity: r.university,
        status: "published",
        sourceId,
      })
      .$returningId();
    id = res.id;
    created = true;
  } else {
    // Fill only what is still empty; never overwrite a value another source set.
    await db.execute(sql`update institutions set
      ownership = coalesce(ownership, ${NMC_OWNERSHIP[r.management] ?? null}),
      established_year = coalesce(established_year, ${r.established ?? null}),
      affiliating_university = coalesce(affiliating_university, ${r.university})
      where id = ${id}`);
  }
  // Being on an NMC list is the commission's permission to admit students to those courses.
  await db.execute(sql`update institutions set approvals = case
      when approvals is null then json_array('NMC')
      when json_contains(approvals, '"NMC"') then approvals
      else json_array_append(approvals, '$', 'NMC') end
    where id = ${id}`);
  await db.insert(institutionIdentifiers).values({ institutionId: id, scheme: "nmc", value: r.code }).onDuplicateKeyUpdate({ set: { institutionId: id } });
  if (medical) await db.insert(institutionStreams).values({ institutionId: id, streamId: medical }).onDuplicateKeyUpdate({ set: { streamId: medical } });
  return { id, created };
}

async function courseIdBySlug(slug: string) {
  const [c] = await getDb().select({ id: courses.id }).from(courses).where(eq(courses.slug, slug));
  return c?.id;
}

/** Loads the National Medical Commission lists of colleges teaching MBBS and PG courses. */
export async function seedNmc(streamIds: Map<string, number>, log: (m: string) => void = console.log) {
  const db = getDb();
  const done = new Map((await rows<{ tag: string; hash: string }>(sql`select tag, hash from app_seeds`)).map((r) => [r.tag, r.hash]));
  const medical = streamIds.get("medical");
  // MBBS first: the PG list refers to most colleges by the codes the MBBS list creates.
  const files = [...NMC_FILES].sort((a, b) => Number("courses" in a.data) - Number("courses" in b.data));
  for (const file of files) {
    const key = `${file.hash}-${NMC_LOADER_VERSION}`;
    if (done.get(file.tag) === key) continue;
    const sourceId = await upsertSource(file.data.source);

    if ("course" in file.data) {
      const data = file.data as NmcUgFile;
      const courseId = await courseIdBySlug(data.course);
      if (!courseId) {
        log(`NMC ${data.course}: course not found, skipped`);
        continue;
      }
      let created = 0;
      for (const r of data.rows) {
        const inst = await nmcInstitution(r, sourceId, medical);
        if (inst.created) created++;
        await db
          .insert(offerings)
          .values({ institutionId: inst.id, courseId, academicYear: data.academic_year, seats: r.seats, seatsSourceId: sourceId })
          .onDuplicateKeyUpdate({ set: { seats: r.seats, seatsSourceId: sourceId } });
      }
      log(`NMC ${data.course} ${data.academic_year}: ${data.rows.length} colleges loaded (${created} new)`);
    } else {
      const data = file.data as NmcPgFile;
      const extra = new Map(data.institutions.map((x) => [x.code, x]));
      const courseIds = new Map<string, number>();
      for (const slug of ["md-ms", "dm-mch", "pg-diploma-medical"]) {
        const cid = await courseIdBySlug(slug);
        if (cid) courseIds.set(slug, cid);
      }
      let created = 0;
      let skipped = 0;
      let branches = 0;
      for (const r of data.rows) {
        let id = await identifierOwner("nmc", r.code);
        if (!id) {
          const info = extra.get(r.code);
          if (!info) {
            skipped++;
            continue;
          }
          const inst = await nmcInstitution(info, sourceId, medical);
          id = inst.id;
          if (inst.created) created++;
        } else if (extra.has(r.code)) {
          await nmcInstitution(extra.get(r.code)!, sourceId, medical);
        }
        const byCourse = new Map<string, { name: string; seats: number }[]>();
        for (const [ci, seats] of r.b) {
          const [type, name] = data.courses[ci];
          const slug = nmcPgCourse(type, name);
          if (!byCourse.has(slug)) byCourse.set(slug, []);
          byCourse.get(slug)!.push({ name, seats });
        }
        for (const [slug, list] of byCourse) {
          const courseId = courseIds.get(slug);
          if (!courseId) continue;
          // Seats stay empty on the offering: NMC publishes the intake per branch only.
          await db
            .insert(offerings)
            .values({ institutionId: id, courseId, academicYear: data.academic_year, seats: null, seatsSourceId: sourceId })
            .onDuplicateKeyUpdate({ set: { seatsSourceId: sourceId } });
          const [off] = await db
            .select({ id: offerings.id })
            .from(offerings)
            .where(and(eq(offerings.institutionId, id), eq(offerings.courseId, courseId), eq(offerings.academicYear, data.academic_year)));
          await db.delete(offeringBranches).where(and(eq(offeringBranches.offeringId, off.id), eq(offeringBranches.sourceId, sourceId)));
          await db.insert(offeringBranches).values(list.map((b) => ({ offeringId: off.id, name: b.name, seats: b.seats, sourceId })));
          branches += list.length;
        }
      }
      log(`NMC PG ${data.academic_year}: ${data.rows.length - skipped} institutions, ${branches} branches loaded (${created} new institutions${skipped ? `, ${skipped} not matched` : ""})`);
    }
    await db.execute(sql`insert into app_seeds (tag, hash) values (${file.tag}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
  }
}

type CouncilRow = {
  code: string;
  name: string;
  address: string | null;
  district: string | null;
  state: string;
  /** The council's own wording for the management type. */
  management: string | null;
  ownership: (typeof schema.institutions.$inferInsert)["ownership"] | null;
  offerings: { course: string; seats: number | null; branches?: { name: string; seats: number | null }[] }[];
  /** For a file that carries more than one year's list: this row's year and source prefix. */
  academic_year?: string;
  source?: string;
  /** The same institution under another list's code, checked by hand; loaded onto that record. */
  same_as?: { scheme: string; value: string };
};
type CouncilFile = {
  council: string;
  /** Identifier scheme for the council's college codes. */
  scheme: string;
  stream: string;
  academic_year: string;
  /** One source per list; prefix picks the source for a college code. */
  sources: (NmcSource & { prefix: string })[];
  rows: CouncilRow[];
};
const COUNCIL_LOADER_VERSION = 3;

/**
 * Moves everything recorded against one institution onto another and removes the first. Used when
 * a hand-checked link shows two records are the same institution.
 */
async function mergeInstitution(fromId: number, intoId: number) {
  const db = getDb();
  await db.execute(sql`update ignore institution_identifiers set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`update ignore institution_streams set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`update ignore rankings set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`update ignore offerings set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`delete from institutions where id = ${fromId}`);
}

/**
 * Loads college lists published by other regulators (NCISM, and others in the same format):
 * one institution per council code, with the intake for each course as an offering.
 */
export async function seedCouncils(streamIds: Map<string, number>, log: (m: string) => void = console.log) {
  const db = getDb();
  const done = new Map((await rows<{ tag: string; hash: string }>(sql`select tag, hash from app_seeds`)).map((r) => [r.tag, r.hash]));
  for (const file of COUNCIL_FILES) {
    const key = `${file.hash}-${COUNCIL_LOADER_VERSION}`;
    if (done.get(file.tag) === key) continue;
    const data = file.data as CouncilFile;
    const streamId = streamIds.get(data.stream);
    const sourceIds = new Map<string, number>();
    for (const s of data.sources) sourceIds.set(s.prefix, await upsertSource(s));
    const courseIds = new Map<string, number | undefined>();
    let created = 0;
    let offeringsLoaded = 0;
    for (const r of data.rows) {
      const sourceId = sourceIds.get(r.source ?? data.sources.find((s) => r.code.startsWith(s.prefix))?.prefix ?? data.sources[0].prefix)!;
      const year = r.academic_year ?? data.academic_year;
      let id = await identifierOwner(data.scheme, r.code);
      if (r.same_as) {
        const target = await identifierOwner(r.same_as.scheme, r.same_as.value);
        if (target && id && target !== id) {
          await mergeInstitution(id, target);
          id = target;
        } else if (target && !id) {
          id = target;
          await db.insert(institutionIdentifiers).values({ institutionId: id, scheme: data.scheme, value: r.code });
        }
      }
      if (!id) {
        const name = r.name.trim().replace(/\s+/g, " ");
        // Many council colleges share a name ("Govt. Ayurved Mahavidhalaya"); the district tells them apart.
        const own = slugify(name);
        const base = r.district && !own.endsWith(slugify(r.district)) ? slugify(`${name} ${r.district}`) : own;
        let slug = base;
        for (let n = 2; (await db.select({ id: institutions.id }).from(institutions).where(eq(institutions.slug, slug)))[0]; n++) slug = `${base}-${n}`;
        const [res] = await db
          .insert(institutions)
          .values({ slug, name, address: r.address, district: r.district, stateCode: stateCode(r.state), ownership: r.ownership ?? null, status: "published", sourceId })
          .$returningId();
        id = res.id;
        created++;
        await db.insert(institutionIdentifiers).values({ institutionId: id, scheme: data.scheme, value: r.code });
      } else {
        await db.execute(sql`update institutions set
          ownership = coalesce(ownership, ${r.ownership ?? null}),
          address = coalesce(address, ${r.address}),
          district = coalesce(district, ${r.district})
          where id = ${id}`);
      }
      await db.execute(sql`update institutions set approvals = case
          when approvals is null then json_array(${data.council})
          when json_contains(approvals, json_quote(${data.council})) then approvals
          else json_array_append(approvals, '$', ${data.council}) end
        where id = ${id}`);
      if (streamId) await db.insert(institutionStreams).values({ institutionId: id, streamId }).onDuplicateKeyUpdate({ set: { streamId } });
      for (const o of r.offerings) {
        if (!courseIds.has(o.course)) courseIds.set(o.course, await courseIdBySlug(o.course));
        const courseId = courseIds.get(o.course);
        if (!courseId) continue;
        await db
          .insert(offerings)
          .values({ institutionId: id, courseId, academicYear: year, seats: o.seats, seatsSourceId: sourceId })
          .onDuplicateKeyUpdate({ set: { seats: o.seats, seatsSourceId: sourceId } });
        if (o.branches?.length) {
          const [off] = await db
            .select({ id: offerings.id })
            .from(offerings)
            .where(and(eq(offerings.institutionId, id), eq(offerings.courseId, courseId), eq(offerings.academicYear, year)));
          await db.delete(offeringBranches).where(and(eq(offeringBranches.offeringId, off.id), eq(offeringBranches.sourceId, sourceId)));
          await db.insert(offeringBranches).values(o.branches.map((b) => ({ offeringId: off.id, name: b.name, seats: b.seats, sourceId })));
        }
        offeringsLoaded++;
      }
    }
    await db.execute(sql`insert into app_seeds (tag, hash) values (${file.tag}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
    log(`${data.council} ${data.academic_year}: ${data.rows.length} colleges, ${offeringsLoaded} course intakes loaded (${created} new)`);
  }
}

/** Migrate, then load reference data and any official data files shipped with the app. */
export async function bootstrap(log: (m: string) => void = console.log) {
  await runMigrations(log);
  const streamIds = await seedReference();
  await seedNirf(streamIds, log);
  await seedNmc(streamIds, log);
  await seedCouncils(streamIds, log);
  const [c] = await rows<{ n: number }>(sql`select count(*) as n from institutions`);
  log(`Database ready: ${STATES.length} states, ${STREAMS.length} fields, ${EXAMS.length} exams, ${c?.n ?? 0} institutions`);
}
