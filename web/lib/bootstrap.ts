import { createHash } from "node:crypto";
import { and, eq, sql, type SQL } from "drizzle-orm";
import type { MySqlDatabase } from "drizzle-orm/mysql-core";
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from "drizzle-orm/mysql2";
import { getDb, getPool, rows, schema } from "@/lib/db";
import { MIGRATIONS } from "@/lib/db/migrations.generated";
import { NIRF_FILES, NMC_FILES, NMC_LINKS, COUNCIL_FILES } from "@/lib/db/seed-data.generated";
import { STATES, STATE_ALIASES, STREAMS, EXAMS, NIRF_CATEGORY_STREAM } from "@/data/reference";
import { slugify } from "@/lib/slug";
import {
  DISTRICT_NORMALISER_VERSION,
  isOfficialDistrict,
  matchDistrict,
  normaliseDistrict,
  placeFromAddress,
  placeFromCollegeName,
  type DistrictMatch,
  type TextPlace,
  type TextPlaceMethod,
} from "@/lib/districts";
import { AMBIGUOUS_DISTRICTS, CITIES_SPANNING_DISTRICTS, DISTRICTS, DISTRICT_ALIASES, DISTRICT_TOWNS } from "@/data/districts";
import { seedReferenceExtras } from "@/lib/seed/reference-extras";
import { seedCutoffs } from "@/lib/seed/cutoffs";

const { states, streams, courses, exams, examStreams, sources, institutions, institutionIdentifiers, institutionStreams, rankings, offerings, offeringBranches, offeringCounsellingBranches } = schema;

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

/**
 * The first of base, base-2, base-3... that no institution uses and that is not an old slug kept
 * as a redirect, so a URL that once named one college never starts showing another.
 */
async function freeSlug(base: string, db: Exec = getDb()) {
  let slug = base;
  const taken = async (s: string) =>
    ((await db.execute(sql`select 1 from institutions where slug = ${s} union all select 1 from slug_redirects where old_slug = ${s} limit 1`)) as unknown as [unknown[]])[0].length > 0;
  for (let n = 2; await taken(slug); n++) {
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Identifier scheme for NIRF rows published without an institute id (the rank-band rows, 101-150 and below). */
export const NIRF_NAME_SCHEME = "nirf-name";

const cleanName = (name: string) => name.trim().replace(/\s+/g, " ");
const cleanCity = (city: string | null | undefined) => (city?.trim() && !/^select city$/i.test(city.trim()) ? city.trim() : null);

/**
 * A stable identifier for a NIRF row that has no institute id: the slug of its name, city and state as
 * NIRF prints them, e.g. "national-institute-of-technology-goa-cuncolim-goa". Other lists link to such a
 * record with same_as { scheme: "nirf-name", value }. A key longer than the column keeps 111 characters
 * of the slug and adds a hash of the whole, so two long names cannot share one.
 */
export function nirfNameKey(r: Pick<NirfRow, "name" | "city" | "state">): string {
  const code = stateCode(r.state);
  const state = STATES.find((s) => s.code === code)?.name ?? r.state ?? "";
  const full = slugify(`${cleanName(r.name)} ${cleanCity(r.city) ?? ""} ${state}`, 1000);
  return full.length <= 120 ? full : `${full.slice(0, 111)}-${createHash("sha256").update(full).digest("hex").slice(0, 8)}`;
}

async function findOrCreateInstitution(r: NirfRow, sourceId: number) {
  const db = getDb();
  const nirfId = r.institute_id?.trim() || null;
  // Rows without a NIRF id get a synthetic one, so other lists can link to them and a reload finds them.
  const ident = nirfId ? { scheme: "nirf", value: nirfId } : { scheme: NIRF_NAME_SCHEME, value: nirfNameKey(r) };
  const known = await identifierOwner(ident.scheme, ident.value);
  if (known) return known;
  const code = stateCode(r.state);
  const name = cleanName(r.name);
  // Same name, state and city: several institutions share a name ("Government Dental College"),
  // so the city is part of the match.
  const city = cleanCity(r.city);
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
    const slug = await freeSlug(base);
    const [res] = await db
      .insert(institutions)
      .values({ slug, name, city, district: normaliseDistrict(code, city, { asCity: true }), stateCode: code, status: "published", sourceId })
      .$returningId();
    id = res.id;
  }
  await db
    .insert(institutionIdentifiers)
    .values({ institutionId: id, ...ident })
    .onDuplicateKeyUpdate({ set: { institutionId: id } });
  return id;
}

/** Bump when the loading logic changes, so every file is loaded again once. 3: nirf-name identifiers. */
const LOADER_VERSION = 3;

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

/** The database, or a transaction on it: the loaders' helpers run inside either. */
type Exec = MySqlDatabase<MySql2QueryResultHKT, MySql2PreparedQueryHKT, typeof schema>;

async function identifierOwner(scheme: string, value: string, db: Exec = getDb()) {
  const [hit] = await db
    .select({ id: institutionIdentifiers.institutionId })
    .from(institutionIdentifiers)
    .where(and(eq(institutionIdentifiers.scheme, scheme), eq(institutionIdentifiers.value, value)));
  return hit?.id;
}

async function upsertSource(s: NmcSource, db: Exec = getDb()) {
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
  // NMC's lists have no address column; the town is read from the college's name ("Government
  // Medical College, Ernakulam") and placed through the district normaliser.
  const place = placeFromCollegeName(stateCode(r.state), r.name);
  if (!id) {
    const name = r.name.trim().replace(/\s+/g, " ");
    const base = slugify(name);
    const slug = await freeSlug(base);
    const [res] = await db
      .insert(institutions)
      .values({
        slug,
        name,
        city: place.city,
        district: place.district,
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
      affiliating_university = coalesce(affiliating_university, ${r.university}),
      district = coalesce(district, ${place.district}),
      city = coalesce(nullif(city, ''), ${place.city})
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
  /** Town and 6-digit PIN, when the council prints them. */
  city?: string | null;
  pin?: string | null;
  state: string;
  /** The council's own wording for the management type. */
  management: string | null;
  ownership: (typeof schema.institutions.$inferInsert)["ownership"] | null;
  offerings: { course: string; seats: number | null; branches?: { name: string; seats: number | null }[] }[];
  /** Affiliating university as the council lists it. */
  university?: string | null;
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
  /**
   * "regulator" (the default): the list is a regulator's approval, and its seats are the approved intake
   * (offerings.seats, offering_branches). "counselling": a counselling body's seat matrix (JoSAA), whose
   * seats are only the share filled through that counselling; they go to offerings.counselling_seats and
   * offering_counselling_branches, never over a regulator's figure, and the body is not an approval.
   */
  kind?: "regulator" | "counselling";
  /** Field for every college in the file; null when each course's own field applies. */
  stream: string | null;
  academic_year: string;
  /** One source per list; prefix picks the source for a college code. */
  sources: (NmcSource & { prefix: string })[];
  rows: CouncilRow[];
};
/** 5: counselling lists, nirf-name links, merges that keep everything, one transaction per file. */
const COUNCIL_LOADER_VERSION = 5;

/** Fills a field of the kept record only when it is empty; never overwrites a value it already has. */
const MERGE_FIELDS = ["ownership", "established_year", "affiliating_university", "address", "city", "district", "state_code", "pin", "website", "phone", "email", "naac_grade"] as const;

/**
 * Lists whose rows carry an address but neither a district nor a town column, so the town and
 * district are read from the address line. NCH only: the other lists give a district or city
 * column, and PCI's free-text addresses have not been audited for this.
 */
const ADDRESS_PLACE_COUNCILS = new Set(["NCH"]);

function addressPlace(council: string, r: CouncilRow): TextPlace | null {
  if (!ADDRESS_PLACE_COUNCILS.has(council) || r.district?.trim() || r.city?.trim() || !r.address?.trim()) return null;
  return placeFromAddress(stateCode(r.state), r.address, r.name);
}

/**
 * Moves everything recorded against one institution onto another and removes the first. Used when
 * a hand-checked link shows two records are the same institution. Empty fields of the kept record
 * are filled from the other, approvals are joined, and an offering of the same course and year on
 * both is merged into one: its branches, counselling branches, fees and cutoffs move across and an
 * empty seat figure is filled from the other. Rows already on the kept record (a ranking, a stream,
 * a branch of the same name) stay as they are.
 */
async function mergeInstitution(fromId: number, intoId: number, db: Exec) {
  // The removed record's slug, and any old slugs that already led to it, now lead to the record it
  // was merged into, so published links answer with a redirect instead of a 404. Re-pointing first
  // means a redirect always names a live record and chains never form.
  await db.execute(sql`update slug_redirects set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`insert into slug_redirects (old_slug, institution_id)
    select slug, ${intoId} from institutions where id = ${fromId}
    on duplicate key update institution_id = values(institution_id)`);
  const fill = MERGE_FIELDS.map((f) => sql`i.${sql.raw(f)} = coalesce(i.${sql.raw(f)}, f.${sql.raw(f)})`);
  await db.execute(sql`update institutions i join institutions f on f.id = ${fromId} set ${sql.join(fill, sql`, `)} where i.id = ${intoId}`);
  const [appr] = (await db.execute(sql`select approvals from institutions where id = ${fromId}`)) as unknown as [{ approvals: unknown }[]];
  const raw = appr[0]?.approvals;
  const fromApprovals: string[] = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? (raw as string[]) : [];
  for (const a of fromApprovals) {
    await db.execute(sql`update institutions set approvals = case
        when approvals is null then json_array(${a})
        when json_contains(approvals, json_quote(${a})) then approvals
        else json_array_append(approvals, '$', ${a}) end
      where id = ${intoId}`);
  }

  // Offerings of the same course and year on both records become one.
  const pairs = (await db.execute(sql`
    select f.id as from_id, t.id as into_id,
      f.seats as f_seats, f.seats_source_id as f_seats_source, t.seats as t_seats,
      f.counselling_seats as f_cs, f.counselling_seats_source_id as f_cs_source, t.counselling_seats as t_cs
    from offerings f join offerings t on t.institution_id = ${intoId} and t.course_id = f.course_id and t.academic_year <=> f.academic_year
    where f.institution_id = ${fromId}`)) as unknown as [
    { from_id: number; into_id: number; f_seats: number | null; f_seats_source: number | null; t_seats: number | null; f_cs: number | null; f_cs_source: number | null; t_cs: number | null }[],
  ];
  for (const p of pairs[0]) {
    if (p.t_seats === null && p.f_seats !== null) {
      await db.execute(sql`update offerings set seats = ${p.f_seats}, seats_source_id = ${p.f_seats_source} where id = ${p.into_id}`);
    } else {
      await db.execute(sql`update offerings set seats_source_id = coalesce(seats_source_id, ${p.f_seats_source}) where id = ${p.into_id}`);
    }
    if (p.t_cs === null && p.f_cs !== null) {
      await db.execute(sql`update offerings set counselling_seats = ${p.f_cs}, counselling_seats_source_id = ${p.f_cs_source} where id = ${p.into_id}`);
    }
    await db.execute(sql`update ignore offering_branches set offering_id = ${p.into_id} where offering_id = ${p.from_id}`);
    await db.execute(sql`update ignore offering_counselling_branches set offering_id = ${p.into_id} where offering_id = ${p.from_id}`);
    await db.execute(sql`update offering_fees set offering_id = ${p.into_id} where offering_id = ${p.from_id}`);
    await db.execute(sql`update ignore cutoffs set offering_id = ${p.into_id} where offering_id = ${p.from_id}`);
    await db.execute(sql`delete from offerings where id = ${p.from_id}`);
  }

  await db.execute(sql`update ignore institution_identifiers set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`update ignore institution_streams set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`update ignore rankings set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`update offerings set institution_id = ${intoId} where institution_id = ${fromId}`);
  await db.execute(sql`delete from institutions where id = ${fromId}`);
}

/**
 * Loads college lists published by other regulators (NCISM, and others in the same format):
 * one institution per council code, with the intake for each course as an offering. A counselling
 * body's seat matrix (kind "counselling", JoSAA) loads the same way, but its seats are kept apart
 * from the approved intake (see CouncilFile.kind). Each file loads in one transaction, so a failure
 * leaves nothing half written, and loading the same file again changes nothing.
 */
export async function seedCouncils(streamIds: Map<string, number>, log: (m: string) => void = console.log) {
  const done = new Map((await rows<{ tag: string; hash: string }>(sql`select tag, hash from app_seeds`)).map((r) => [r.tag, r.hash]));
  const courseStreamRows = await getDb().select({ id: courses.id, slug: courses.slug, streamId: courses.streamId }).from(courses);
  // Regulators first, counselling lists last: a counselling list then only fills what no regulator gave,
  // whichever lists a database had loaded before.
  const files = [...COUNCIL_FILES].sort((a, b) => Number(a.data.kind === "counselling") - Number(b.data.kind === "counselling"));
  let loaded = 0;
  for (const file of files) {
    const key = `${file.hash}-${COUNCIL_LOADER_VERSION}`;
    if (done.get(file.tag) === key) continue;
    loaded++;
    const data = file.data as CouncilFile;
    const counselling = data.kind === "counselling";
    const streamId = data.stream ? streamIds.get(data.stream) : undefined;
    const courseStreams = new Map<number, number>();
    if (!data.stream) for (const c of courseStreamRows) courseStreams.set(c.id, c.streamId);
    const courseIds = new Map<string, number | undefined>(courseStreamRows.map((c) => [c.slug, c.id]));
    const counts = await getDb().transaction(async (db) => {
      const sourceIds = new Map<string, number>();
      for (const s of data.sources) sourceIds.set(s.prefix, await upsertSource(s, db));
      const fileSources = sql.join([...new Set(sourceIds.values())].map((x) => sql`${x}`), sql`, `);
      if (counselling) {
        // A counselling body is not an approval, and its seats are never the approved intake: undo what an
        // earlier loader wrote that way, then clear this list's counselling seats so the reload below is the
        // whole of them (rows dropped from the list do not linger).
        await db.execute(sql`update institutions set approvals = json_remove(approvals, json_unquote(json_search(approvals, 'one', ${data.council})))
          where json_contains(approvals, json_quote(${data.council}))`);
        await db.execute(sql`delete from offering_branches where source_id in (${fileSources})`);
        await db.execute(sql`update offerings set seats = null, seats_source_id = null where seats_source_id in (${fileSources})`);
        await db.execute(sql`delete from offering_counselling_branches where source_id in (${fileSources})`);
        await db.execute(sql`update offerings set counselling_seats = null, counselling_seats_source_id = null where counselling_seats_source_id in (${fileSources})`);
      }
      let created = 0;
      let offeringsLoaded = 0;
      const unlinked: string[] = [];
      for (const r of data.rows) {
        const sourceId = sourceIds.get(r.source ?? data.sources.find((s) => r.code.startsWith(s.prefix))?.prefix ?? data.sources[0].prefix)!;
        const year = r.academic_year ?? data.academic_year;
        const code = stateCode(r.state);
        // Every district written goes through the normaliser: the official name, or null when the
        // council's value cannot be placed in one district (the raw text stays in data/councils).
        // A list that prints only an address (NCH) gives its town and district from the address.
        const fromAddress = addressPlace(data.council, r);
        const district = normaliseDistrict(code, r.district) ?? normaliseDistrict(code, r.city, { asCity: true }) ?? fromAddress?.district ?? null;
        const city = r.city ?? fromAddress?.city ?? null;
        let id = await identifierOwner(data.scheme, r.code, db);
        if (r.same_as) {
          const target = await identifierOwner(r.same_as.scheme, r.same_as.value, db);
          if (!target) unlinked.push(`${r.code} -> ${r.same_as.scheme} ${r.same_as.value}`);
          if (target && id && target !== id) {
            await mergeInstitution(id, target, db);
            id = target;
          } else if (target && !id) {
            id = target;
            await db.insert(institutionIdentifiers).values({ institutionId: id, scheme: data.scheme, value: r.code });
          }
        }
        if (!id) {
          const name = r.name.trim().replace(/\s+/g, " ");
          // Many council colleges share a name ("Govt. Ayurved Mahavidhalaya"); the district tells them apart.
          // The slug keeps the council's own spelling, so slugs match those of databases loaded earlier.
          const own = slugify(name);
          const base = r.district && !own.endsWith(slugify(r.district)) ? slugify(`${name} ${r.district}`) : own;
          const slug = await freeSlug(base, db);
          const [res] = await db
            .insert(institutions)
            .values({ slug, name, address: r.address, district, city, pin: r.pin && /^\d{6}$/.test(r.pin) ? r.pin : null, stateCode: code, ownership: r.ownership ?? null, affiliatingUniversity: r.university ?? null, status: "published", sourceId })
            .$returningId();
          id = res.id;
          created++;
          await db.insert(institutionIdentifiers).values({ institutionId: id, scheme: data.scheme, value: r.code });
        } else {
          await db.execute(sql`update institutions set
            ownership = coalesce(ownership, ${r.ownership ?? null}),
            address = coalesce(address, ${r.address}),
            district = coalesce(district, ${district}),
            city = coalesce(nullif(city, ''), ${city}),
            pin = coalesce(pin, ${r.pin && /^\d{6}$/.test(r.pin) ? r.pin : null}),
            affiliating_university = coalesce(affiliating_university, ${r.university ?? null})
            where id = ${id}`);
        }
        if (!counselling) {
          await db.execute(sql`update institutions set approvals = case
              when approvals is null then json_array(${data.council})
              when json_contains(approvals, json_quote(${data.council})) then approvals
              else json_array_append(approvals, '$', ${data.council}) end
            where id = ${id}`);
        }
        if (streamId) await db.insert(institutionStreams).values({ institutionId: id, streamId }).onDuplicateKeyUpdate({ set: { streamId } });
        for (const o of r.offerings) {
          const courseId = courseIds.get(o.course);
          if (!courseId) continue;
          const cs = courseStreams.get(courseId);
          if (cs) await db.insert(institutionStreams).values({ institutionId: id, streamId: cs }).onDuplicateKeyUpdate({ set: { streamId: cs } });
          if (counselling) {
            // Only the counselling columns: the approved intake (seats) another list gave stays as it is.
            await db
              .insert(offerings)
              .values({ institutionId: id, courseId, academicYear: year, seats: null, counsellingSeats: o.seats, counsellingSeatsSourceId: sourceId })
              .onDuplicateKeyUpdate({ set: { counsellingSeats: o.seats, counsellingSeatsSourceId: sourceId } });
          } else {
            await db
              .insert(offerings)
              .values({ institutionId: id, courseId, academicYear: year, seats: o.seats, seatsSourceId: sourceId })
              .onDuplicateKeyUpdate({ set: { seats: o.seats, seatsSourceId: sourceId } });
          }
          if (o.branches?.length) {
            const [off] = await db
              .select({ id: offerings.id })
              .from(offerings)
              .where(and(eq(offerings.institutionId, id), eq(offerings.courseId, courseId), eq(offerings.academicYear, year)));
            const table = counselling ? offeringCounsellingBranches : offeringBranches;
            await db.delete(table).where(and(eq(table.offeringId, off.id), eq(table.sourceId, sourceId)));
            // A branch of the same name another list already gave this offering keeps that list's figure.
            await db
              .insert(table)
              .values(o.branches.map((b) => ({ offeringId: off.id, name: b.name, seats: b.seats, sourceId })))
              .onDuplicateKeyUpdate({ set: { name: sql`name` } });
          }
          offeringsLoaded++;
        }
      }
      await db.execute(sql`insert into app_seeds (tag, hash) values (${file.tag}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
      return { created, offeringsLoaded, unlinked };
    });
    log(
      `${data.council} ${data.academic_year}: ${data.rows.length} colleges, ${counts.offeringsLoaded} course ${counselling ? "seat matrices" : "intakes"} loaded (${counts.created} new)` +
        (counts.unlinked.length ? `; same_as not found, loaded as their own record: ${counts.unlinked.join(", ")}` : ""),
    );
  }
  if (loaded) await sortApprovals(files);
}

/**
 * Puts every institution's approvals in one order (NMC, then the council lists in load order), so the
 * order does not depend on which lists a database had loaded before.
 */
async function sortApprovals(files: typeof COUNCIL_FILES) {
  const order = ["NMC", ...files.filter((f) => f.data.kind !== "counselling").map((f) => (f.data as CouncilFile).council)];
  const rank = (a: string) => (order.indexOf(a) < 0 ? order.length : order.indexOf(a));
  const list = await rows<{ id: number; approvals: unknown }>(sql`select id, approvals from institutions where json_length(approvals) > 1`);
  for (const r of list) {
    const current: string[] = typeof r.approvals === "string" ? JSON.parse(r.approvals) : (r.approvals as string[]);
    const sorted = [...current].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    if (sorted.join("\u0000") !== current.join("\u0000")) {
      await getDb().execute(sql`update institutions set approvals = json_array(${sql.join(sorted.map((a) => sql`${a}`), sql`, `)}) where id = ${r.id}`);
    }
  }
}

/** Where a raw value came from: a council's district or city column, an address line, or a college name. */
export type DistrictField = "district" | "city" | "address" | "name";

/** One institution's district as the normaliser would set it, and the raw value it came from. */
export type DistrictPlan = {
  id: number;
  stateCode: string | null;
  current: string | null;
  next: string | null;
  /** The raw value that decided `next`, or the first one tried when none matched. */
  raw: string | null;
  field: DistrictField | "kept" | null;
  match: DistrictMatch | "conflict" | "kept" | null;
  /** The institution's city now, and the town to fill it with when it is empty. */
  currentCity: string | null;
  nextCity: string | null;
  /** Every raw value for the institution, in order, with its result (for the audit reports). */
  tried: {
    raw: string;
    field: DistrictField;
    district: string | null;
    match: DistrictMatch | "conflict" | null;
    /** For an address or a name: how the place was read, the town found and the text that decided it. */
    method?: TextPlaceMethod | null;
    town?: string | null;
    part?: string | null;
  }[];
};

/**
 * Works out every institution's district from the raw values: each council list's district for
 * it (the embedded files keep the council's own text), then the institution's city, then the
 * councils' city values, then the town read from an address-only list's address (NCH), then the
 * town read from the college's name on the NMC lists, which have no address column. The first
 * value the normaliser can place wins. Without one, a district that is already an official name is
 * kept and anything else is cleared. An empty city is filled with the town the address or name gave.
 */
export async function planDistricts(): Promise<DistrictPlan[]> {
  const schemes = [...new Set(COUNCIL_FILES.map((f) => (f.data as CouncilFile).scheme)), "nmc"];
  const owner = new Map<string, number>();
  const ids = await rows<{ scheme: string; value: string; institution_id: number }>(
    sql`select scheme, value, institution_id from institution_identifiers where scheme in (${sql.join(schemes.map((s) => sql`${s}`), sql`, `)})`,
  );
  for (const r of ids) owner.set(`${r.scheme}\u0000${r.value}`, Number(r.institution_id));
  const push = <T>(m: Map<number, T[]>, id: number, v: T) => (m.get(id) ?? m.set(id, []).get(id)!).push(v);
  const councilDistricts = new Map<number, string[]>();
  const councilCities = new Map<number, string[]>();
  const addresses = new Map<number, { raw: string; place: TextPlace }[]>();
  for (const file of COUNCIL_FILES) {
    const data = file.data as CouncilFile;
    for (const r of data.rows) {
      const id = owner.get(`${data.scheme}\u0000${r.code}`);
      if (!id) continue;
      if (r.district?.trim()) push(councilDistricts, id, r.district);
      if (r.city?.trim()) push(councilCities, id, r.city);
      const place = addressPlace(data.council, r);
      if (place) push(addresses, id, { raw: r.address!, place });
    }
  }
  const names = new Map<number, { raw: string; place: TextPlace }[]>();
  for (const file of NMC_FILES) {
    const list: NmcCollege[] = "course" in file.data ? (file.data as NmcUgFile).rows : (file.data as NmcPgFile).institutions;
    for (const r of list) {
      const id = owner.get(`nmc\u0000${r.code}`);
      if (id) push(names, id, { raw: r.name, place: placeFromCollegeName(stateCode(r.state), r.name) });
    }
  }
  const list = await rows<{ id: number; state_code: string | null; district: string | null; city: string | null }>(
    sql`select id, state_code, district, city from institutions order by id`,
  );
  return list.map((i) => {
    const id = Number(i.id);
    const tried: DistrictPlan["tried"] = [];
    const seen = new Set<string>();
    const add = (t: DistrictPlan["tried"][number]) => {
      const k = `${t.field}\u0000${t.raw}`;
      if (seen.has(k)) return;
      seen.add(k);
      tried.push(t);
    };
    for (const raw of councilDistricts.get(id) ?? []) add({ raw, field: "district", ...matchDistrict(i.state_code, raw) });
    if (i.city?.trim()) add({ raw: i.city, field: "city", ...matchDistrict(i.state_code, i.city, { asCity: true }) });
    for (const raw of councilCities.get(id) ?? []) add({ raw, field: "city", ...matchDistrict(i.state_code, raw, { asCity: true }) });
    for (const [field, m] of [["address", addresses], ["name", names]] as const) {
      for (const { raw, place } of m.get(id) ?? []) {
        add({ raw, field, district: place.district, match: place.match, method: place.method, town: place.city, part: place.raw });
      }
    }
    const hit = tried.find((t) => t.district);
    // The town an address or name gave, for an institution with no city yet: the deciding one first.
    const towns = [hit, ...tried].filter((t) => t && (t.field === "address" || t.field === "name") && t.town);
    const nextCity = i.city?.trim() ? i.city : (towns[0]?.town ?? null);
    const base = { id, stateCode: i.state_code, current: i.district, currentCity: i.city, nextCity, tried };
    if (hit) return { ...base, next: hit.district, raw: hit.raw, field: hit.field, match: hit.match };
    if (i.district && isOfficialDistrict(i.state_code, i.district)) {
      return { ...base, next: i.district, raw: i.district, field: "kept", match: "kept" };
    }
    const first = tried[0];
    return { ...base, next: null, raw: first?.raw ?? null, field: first?.field ?? null, match: first?.match ?? null };
  });
}

/**
 * Rewrites institutions.district through the normaliser, and fills an empty city with the town an
 * address or college name gave, once per normaliser version, district data and set of embedded
 * lists (recorded in app_seeds), so databases loaded before the normaliser existed, or with an
 * older alias list, are corrected on the next start.
 */
export async function normaliseInstitutionDistricts(log: (m: string) => void = console.log) {
  const tag = "district-normaliser";
  const digest = createHash("sha256")
    .update(JSON.stringify({ DISTRICTS, DISTRICT_ALIASES, DISTRICT_TOWNS, AMBIGUOUS_DISTRICTS, CITIES_SPANNING_DISTRICTS }))
    .update([...NIRF_FILES, ...NMC_FILES, ...COUNCIL_FILES].map((f) => `${f.tag}:${f.hash}`).join(","))
    .digest("hex");
  const key = `v${DISTRICT_NORMALISER_VERSION}-${digest.slice(0, 24)}`;
  const [done] = await rows<{ hash: string }>(sql`select hash from app_seeds where tag = ${tag}`);
  if (done?.hash === key) return;
  const plan = await planDistricts();
  const changes = new Map<string | null, number[]>();
  const cityChanges = new Map<string, number[]>();
  for (const p of plan) {
    if (p.next !== p.current) (changes.get(p.next) ?? changes.set(p.next, []).get(p.next)!).push(p.id);
    if (p.nextCity && !p.currentCity?.trim()) (cityChanges.get(p.nextCity) ?? cityChanges.set(p.nextCity, []).get(p.nextCity)!).push(p.id);
  }
  const apply = async (set: (ids: SQL) => SQL, ids: number[]) => {
    for (let i = 0; i < ids.length; i += 500) {
      await getDb().execute(set(sql.join(ids.slice(i, i + 500).map((x) => sql`${x}`), sql`, `)));
    }
    return ids.length;
  };
  let updated = 0;
  for (const [district, ids] of changes) updated += await apply((list) => sql`update institutions set district = ${district} where id in (${list})`, ids);
  let cities = 0;
  for (const [city, ids] of cityChanges) {
    cities += await apply((list) => sql`update institutions set city = ${city} where (city is null or city = '') and id in (${list})`, ids);
  }
  await getDb().execute(sql`insert into app_seeds (tag, hash) values (${tag}, ${key}) on duplicate key update hash = values(hash), loaded_at = current_timestamp`);
  const withDistrict = plan.filter((p) => p.next).length;
  log(`Districts normalised (v${DISTRICT_NORMALISER_VERSION}): ${updated} institutions updated, ${cities} cities filled, ${withDistrict} of ${plan.length} have an official district`);
}

/** Migrate, then load reference data and any official data files shipped with the app. */
export async function bootstrap(log: (m: string) => void = console.log) {
  await runMigrations(log);
  const streamIds = await seedReference();
  await seedNirf(streamIds, log);
  await seedNmc(streamIds, log);
  await seedCouncils(streamIds, log);
  await seedCutoffs(log);
  await seedReferenceExtras(log);
  await normaliseInstitutionDistricts(log);
  const [c] = await rows<{ n: number }>(sql`select count(*) as n from institutions`);
  log(`Database ready: ${STATES.length} states, ${STREAMS.length} fields, ${EXAMS.length} exams, ${c?.n ?? 0} institutions`);
}
