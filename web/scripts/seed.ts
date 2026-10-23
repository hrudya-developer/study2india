import "dotenv/config";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { STATES, STATE_ALIASES, STREAMS, EXAMS, NIRF_CATEGORY_STREAM } from "../data/reference";
import { slugify } from "../lib/slug";

const { states, streams, courses, exams, examStreams, sources, institutions, institutionIdentifiers, institutionStreams, rankings } = schema;

const stateByName = new Map<string, string>();
for (const s of STATES) stateByName.set(s.name.toLowerCase(), s.code);
for (const [alias, code] of Object.entries(STATE_ALIASES)) stateByName.set(alias, code);

function stateCode(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  return stateByName.get(key) ?? stateByName.get(key.replace(/&/g, "and")) ?? null;
}

async function seedReference() {
  for (const s of STATES) {
    await db
      .insert(states)
      .values({ code: s.code, slug: slugify(s.name), name: s.name, isUnionTerritory: !!s.ut })
      .onConflictDoUpdate({ target: states.code, set: { name: s.name, slug: slugify(s.name), isUnionTerritory: !!s.ut } });
  }

  const streamIds = new Map<string, number>();
  for (const [i, st] of STREAMS.entries()) {
    const [row] = await db
      .insert(streams)
      .values({ slug: st.slug, name: st.name, summary: st.summary, sortOrder: i })
      .onConflictDoUpdate({ target: streams.slug, set: { name: st.name, summary: st.summary, sortOrder: i } })
      .returning({ id: streams.id });
    streamIds.set(st.slug, row.id);
    for (const [j, c] of st.courses.entries()) {
      await db
        .insert(courses)
        .values({ slug: c.slug, name: c.name, shortName: c.short, streamId: row.id, level: c.level, durationText: c.duration, sortOrder: j })
        .onConflictDoUpdate({
          target: courses.slug,
          set: { name: c.name, shortName: c.short, streamId: row.id, level: c.level, durationText: c.duration, sortOrder: j },
        });
    }
  }

  for (const [i, e] of EXAMS.entries()) {
    const [row] = await db
      .insert(exams)
      .values({ slug: e.slug, name: e.name, shortName: e.short, conductingBody: e.body, level: e.level, officialUrl: e.url, sortOrder: i })
      .onConflictDoUpdate({
        target: exams.slug,
        set: { name: e.name, shortName: e.short, conductingBody: e.body, level: e.level, officialUrl: e.url, sortOrder: i },
      })
      .returning({ id: exams.id });
    await db.delete(examStreams).where(eq(examStreams.examId, row.id));
    for (const s of e.streams) {
      const sid = streamIds.get(s);
      if (sid) await db.insert(examStreams).values({ examId: row.id, streamId: sid }).onConflictDoNothing();
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

async function findOrCreateInstitution(r: NirfRow, sourceId: number, usedSlugs: Set<string>) {
  const nirfId = r.institute_id?.trim() || null;
  if (nirfId) {
    const hit = await db
      .select({ id: institutionIdentifiers.institutionId })
      .from(institutionIdentifiers)
      .where(and(eq(institutionIdentifiers.scheme, "nirf"), eq(institutionIdentifiers.value, nirfId)));
    if (hit[0]) return hit[0].id;
  }
  const code = stateCode(r.state);
  const name = r.name.trim().replace(/\s+/g, " ");
  const byName = await db
    .select({ id: institutions.id })
    .from(institutions)
    .where(and(sql`lower(${institutions.name}) = ${name.toLowerCase()}`, code ? eq(institutions.stateCode, code) : sql`true`));
  let id = byName[0]?.id;
  if (!id) {
    let base = slugify(`${name} ${r.city ?? ""}`);
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug) || (await db.select({ id: institutions.id }).from(institutions).where(eq(institutions.slug, slug)))[0]) {
      slug = `${base}-${n++}`;
    }
    usedSlugs.add(slug);
    const [row] = await db
      .insert(institutions)
      .values({ slug, name, city: r.city?.trim() || null, stateCode: code, status: "published", sourceId })
      .returning({ id: institutions.id });
    id = row.id;
  }
  if (nirfId) await db.insert(institutionIdentifiers).values({ institutionId: id, scheme: "nirf", value: nirfId }).onConflictDoNothing();
  return id;
}

async function seedNirf(streamIds: Map<string, number>) {
  const root = path.join(process.cwd(), "data", "nirf");
  if (!existsSync(root)) {
    console.log("No NIRF data folder yet, skipping rankings.");
    return;
  }
  const usedSlugs = new Set<string>();
  for (const year of readdirSync(root).filter((d) => statSync(path.join(root, d)).isDirectory())) {
    const dir = path.join(root, year);
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_"))) {
      const data = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as NirfFile;
      const url = Array.isArray(data.source.url) ? data.source.url.join(" ") : data.source.url;
      const title = `NIRF India Rankings ${data.year}: ${data.category}`;
      const existing = await db.select({ id: sources.id }).from(sources).where(eq(sources.title, title));
      const sourceId =
        existing[0]?.id ??
        (await db.insert(sources).values({ publisher: data.source.publisher, title, url, retrievedOn: data.source.retrieved }).returning({ id: sources.id }))[0].id;
      const streamSlug = NIRF_CATEGORY_STREAM[data.category] ?? null;
      const streamId = streamSlug ? streamIds.get(streamSlug) : undefined;
      let count = 0;
      for (const r of data.rows) {
        if (!r.name) continue;
        const instId = await findOrCreateInstitution(r, sourceId, usedSlugs);
        const score = r.score === null || r.score === undefined || r.score === "" ? null : String(r.score);
        await db
          .insert(rankings)
          .values({ institutionId: instId, agency: "NIRF", year: data.year, category: data.category, rank: r.rank ?? null, rankBand: r.rank_band ?? null, score, sourceId })
          .onConflictDoUpdate({
            target: [rankings.institutionId, rankings.agency, rankings.year, rankings.category],
            set: { rank: r.rank ?? null, rankBand: r.rank_band ?? null, score, sourceId },
          });
        if (streamId) await db.insert(institutionStreams).values({ institutionId: instId, streamId }).onConflictDoNothing();
        count++;
      }
      console.log(`NIRF ${data.year} ${data.category}: ${count} rows`);
    }
  }
}

async function main() {
  const streamIds = await seedReference();
  console.log(`Reference data: ${STATES.length} states, ${STREAMS.length} streams, ${EXAMS.length} exams`);
  await seedNirf(streamIds);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
