// Converts the NEET UG allotment extract of the Medical Counselling Committee (MCC) into the cutoff
// file format read by lib/seed/cutoffs.ts: data/cutoffs/mcc-neet-ug-<year>.json.
//
// Source: the final allotment result PDFs MCC publishes for each round of UG counselling (All India
// Quota, deemed and central universities, AIIMS, JIPMER, ESIC and the other quotas MCC fills), listed
// under "Current Events" on https://mcc.nic.in/ug-medical-counselling/. The PDFs are read in a browser
// with pdf.js by scripts/cutoffs/mcc-extract.browser.js, which writes the extract this script reads.
//
// Extract (one folder):
//   institutes.tsv  index ¦ institute name as MCC prints it ¦ name and address as MCC prints it (tab separated)
//   groups.txt      one line per institute, course, round, quota and allotted category:
//                   institute_index course round quota_index category_index opening_rank closing_rank allotted
//                   course M = MBBS, B = BDS, N = B.Sc. Nursing; round 1, 2, 3 or S (Stray Vacancy Round)
//   meta.json       quota and category names (indexed by groups.txt) and the PDF of each round
//
// Which allotted candidates count: Round 1 and the Stray Vacancy Round list every allotted candidate.
// The Round 2 and Round 3 lists carry every candidate; a row counts when its remark for that round is
// "Fresh Allotted" or "Upgraded" (a seat allotted in that round). Rows marked Retained, Did not opt for
// Upgradation or Did not fill up fresh choices hold a seat from an earlier round and are left out.
// opening_rank and closing_rank are the lowest and highest NEET UG All India Rank among the candidates
// counted. The quota is the allotted quota and the category is the allotted (seat) category.
//
// Institute names are joined to our records by scripts/cutoffs/mcc-institutes-2026.json (checked by
// hand; see mcc-unmapped-review.md for the names with no record of ours).
//
// Usage: node scripts/cutoffs/mcc-convert.mjs <extract folder>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const YEAR = 2026;
const RETRIEVED = "2026-10-24";
const COURSES = { M: "mbbs", B: "bds", N: "bsc-nursing" };
const ROUNDS = { 1: "Round 1", 2: "Round 2", 3: "Round 3", S: "Stray Vacancy Round" };

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/cutoffs/mcc-convert.mjs <extract folder>");
  process.exit(1);
}

const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
const mapping = JSON.parse(readFileSync(path.join(root, "scripts/cutoffs/mcc-institutes-2026.json"), "utf8"));
// Joined on MCC's name and address with spaces removed: narrow PDF columns break words across lines.
const key = (s) => s.replace(/\s+/g, "").toLowerCase();
const byFull = new Map(mapping.institutes.map((e) => [key(e.mcc_full), e]));

const byIndex = new Map();
for (const line of readFileSync(path.join(dir, "institutes.tsv"), "utf8").split("\n").slice(1)) {
  if (!line.trim()) continue;
  const [index, , full] = line.split("\t");
  const entry = byFull.get(key(full));
  if (!entry) throw new Error(`Institute "${full}" is not in mcc-institutes-2026.json`);
  byIndex.set(Number(index), entry);
}

// Several MCC spellings can name one institution; their groups merge into one row.
const merged = new Map();
let skipped = 0;
let skippedAllotments = 0;
for (const line of readFileSync(path.join(dir, "groups.txt"), "utf8").split("\n")) {
  if (!line.trim()) continue;
  const [i, c, r, q, cat, open, close, n] = line.trim().split(/\s+/);
  const entry = byIndex.get(Number(i));
  if (!entry) throw new Error(`Institute index ${i} is not in institutes.tsv`);
  if (!entry.institution) {
    skipped++;
    skippedAllotments += Number(n);
    continue;
  }
  const course = COURSES[c];
  const round = ROUNDS[r];
  const quota = meta.quotas[Number(q)];
  const category = meta.categories[Number(cat)];
  if (!course || !round || quota === undefined || category === undefined) throw new Error(`Bad line: ${line}`);
  const key = [entry.institution.scheme, entry.institution.value, course, round, quota, category].join("|");
  const row = merged.get(key);
  if (row) {
    row.opening_rank = Math.min(row.opening_rank, Number(open));
    row.closing_rank = Math.max(row.closing_rank, Number(close));
  } else {
    merged.set(key, { institution: entry.institution, course, round, quota, category, opening_rank: Number(open), closing_rank: Number(close) });
  }
}

const roundOrder = Object.values(ROUNDS);
const rows = [...merged.values()].sort(
  (a, b) =>
    a.institution.scheme.localeCompare(b.institution.scheme) ||
    a.institution.value.localeCompare(b.institution.value) ||
    a.course.localeCompare(b.course) ||
    roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round) ||
    a.quota.localeCompare(b.quota) ||
    a.category.localeCompare(b.category),
);

const out = {
  exam: "neet-ug",
  year: YEAR,
  source: {
    publisher: "Medical Counselling Committee (MCC), Directorate General of Health Services",
    title: `MCC UG Medical Counselling ${YEAR}: final allotment results`,
    url: "https://mcc.nic.in/current-events-ug/",
    retrieved: RETRIEVED,
  },
  round_sources: Object.fromEntries(
    Object.entries(meta.sources).map(([round, s]) => [round, { title: `MCC: ${s.title}`, url: s.url }]),
  ),
  note: "Opening and closing ranks are the lowest and highest NEET UG All India Rank among candidates allotted a seat in that round (Round 2 and 3: fresh allotments and upgrades only). Quota and category are the allotted quota and seat category as MCC prints them.",
  rows,
};

// One row per line keeps the file readable in a diff.
const body = rows.map((r) => "    " + JSON.stringify(r)).join(",\n");
const head = JSON.stringify({ ...out, rows: [] }, null, 2).replace(/"rows": \[\]\n}$/, "");
writeFileSync(path.join(root, `data/cutoffs/mcc-neet-ug-${YEAR}.json`), `${head}"rows": [\n${body}\n  ]\n}\n`);
console.log(`${rows.length} rows written; ${skipped} groups (${skippedAllotments} allotments) skipped for institutes with no record of ours`);
