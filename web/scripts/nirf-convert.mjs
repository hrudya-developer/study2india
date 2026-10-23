// Converts a raw NIRF extract (rows as [id, name, city, state, score, rank, band]) into the
// seed file format read by lib/bootstrap.ts. Usage: node scripts/nirf-convert.mjs <raw.json> <year> <category> <out-slug>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const [rawPath, year, category, slug] = process.argv.slice(2);
const raw = JSON.parse(readFileSync(rawPath, "utf8"));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = path.join(root, "data", "nirf", year);
mkdirSync(outDir, { recursive: true });

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// NIRF prints "Rank Withdrawn*" in the score column for some rows: keep the row, drop the rank.
const rows = raw.rows.map(([id, name, city, state, score, rank, band]) => {
  const withdrawn = /withdrawn/i.test(String(score ?? ""));
  return {
    // IR-D-U-0500 and IR-N-U-0500 are the same institution in two categories; keep the shared part.
    institute_id: id ? id.split("-").slice(2).join("-") : null,
    name,
    city: city && !/^select city$/i.test(city) ? city : null,
    state: state || null,
    score: withdrawn ? null : num(score),
    rank: withdrawn ? null : num(rank),
    rank_band: withdrawn ? "Rank withdrawn" : band || null,
  };
});

const file = {
  source: { publisher: "NIRF, Ministry of Education", url: raw.urls, retrieved: new Date().toISOString().slice(0, 10) },
  year: Number(year),
  category,
  rows,
};
writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(file, null, 1));
console.log(`${category}: ${rows.length} rows (${rows.filter((r) => r.rank).length} ranked, ${rows.filter((r) => r.rank_band).length} in bands)`);
