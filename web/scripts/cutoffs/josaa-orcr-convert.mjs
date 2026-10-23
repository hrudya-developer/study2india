// Converts JoSAA 2026 opening and closing ranks into data/cutoffs/josaa-2026.json.
//
// Source: JoSAA "Opening and Closing Ranks" (current year), an ASP.NET page read in a browser on 2026-10-24:
//   https://josaa.admissions.nic.in/Applicant/SeatAllotmentResult/currentorcr.aspx (linked from https://josaa.nic.in/or-cr/),
//   Round 1 to Round 5 (the JoSAA 2026 schedule has five rounds; round 5 is the last one), Institute Type ALL,
//   Institute ALL, Academic Program ALL, Seat Type ALL. Grid rows per round: 13292, 13047, 12989, 12968, 12936.
//
// The grid was read in the browser and written out as text chunks, saved verbatim into one raw directory:
//   dict.txt        "@dict hash H ..." then "[institutes]" lines "code¦institute name" and "[programs]" lines
//                   "program code¦Academic Program Name" (the names exactly as the grid prints them).
//   rR-i.txt        "@round R chunk i/n hash H rows N mode full|delta" then the body.
// H is the FNV-1a 32-bit hash (hex) of the body: everything after the first line, without a trailing new line.
// Body lines:
//   #inst,prog      starts the rows of one institute code and program code
//   KEY,open,close  one grid row; KEY is three letters: quota, seat type, gender (see QUOTA, SEAT_TYPE, GENDER)
// Round 1 is written in full. Rounds 2 to 5 are written against the previous round's row with the same
// institute, program and KEY: "KEY" alone keeps both ranks, "KEY,,close" keeps the opening rank,
// "KEY,open," keeps the closing rank, and "KEY,open,close" gives both. A row with no match in the previous
// round is always written in full. Ranks are kept exactly as printed ("123", "45P", "1062087.0").
//
// Usage: node scripts/cutoffs/josaa-orcr-convert.mjs <raw dir>
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const YEAR = 2026;
const RETRIEVED = "2026-10-24";
const SOURCE_URL = "https://josaa.admissions.nic.in/Applicant/SeatAllotmentResult/currentorcr.aspx";
const ROUNDS = [1, 2, 3, 4, 5];
// Grid row counts read from the page for each round.
const GRID_ROWS = { 1: 13292, 2: 13047, 3: 12989, 4: 12968, 5: 12936 };
// FNV-1a of the round's grid rows as the browser held them ("inst,prog|KEY|open|close", sorted, joined by new lines),
// computed in the page before the tab was closed. The decoded chunks must give the same hash.
const GRID_HASH = { 1: "faefe361", 2: "e6801b6c", 3: "1f32270c", 4: "f40fae80", 5: "e77ba80b" };

const QUOTA = { A: "AI", H: "HS", O: "OS", G: "GO", J: "JK", L: "LA" };
const SEAT_TYPE = {
  O: "OPEN", o: "OPEN (PwD)", E: "EWS", e: "EWS (PwD)", B: "OBC-NCL", b: "OBC-NCL (PwD)",
  S: "SC", s: "SC (PwD)", T: "ST", t: "ST (PwD)",
};
const GENDER = { N: "Gender-Neutral", F: "Female-only (including Supernumerary)" };

// The same degree table as scripts/councils/josaa-convert.mjs, so branch names match data/councils/josaa.json.
const DEGREES = {
  "4 Years, Bachelor of Technology": "btech",
  "4 Years, B. Tech / B. Tech (Hons.)": "btech",
  "5 Years, Bachelor and Master of Technology (Dual Degree)": "btech",
  "5 Years, B.Tech. + M.Tech./MS (Dual Degree)": "btech",
  "5 Years, Bachelor of Technology and MBA (Dual Degree)": "btech",
  "5 Years, Integrated Master of Technology": "btech",
  "5 Years, Integrated Masters in Technology": "btech",
  "5 Years, Integrated B. Tech. and M. Tech.": "btech",
  "5 Years, Integrated B. Tech. and MBA": "btech",
  "5 Years, Bachelor of Architecture": "barch",
  "4 Years, Bachelor of Planning": "bplan",
  "4 Years, Bachelor of Science": null,
  "4 Years, Bachelor of Design": null,
  "5 Years, Bachelor of Science and Master of Science (Dual Degree)": null,
  "5 Years, Integrated Bachelor of Science-Master of Science": null,
  "5 Years, Integrated Master of Science": null,
  "5 Years, Bachelor of Science and MBA (Dual Degree)": null,
};
const PLAIN = new Set(["4 Years, Bachelor of Technology", "5 Years, Bachelor of Architecture", "4 Years, Bachelor of Planning"]);
const degreeOf = (name) => {
  const i = name.search(/\(\d+ Years?, (?!.*\(\d+ Years?, )/);
  if (i < 0) return null;
  return { subject: name.slice(0, i).trim(), degree: name.slice(i + 1, -1) };
};
const tidy = (s) => s.replace(/\s+/g, " ").replace(/\s+([,.)])/g, "$1").replace(/\(\s+/g, "(").trim();

const fnv = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/cutoffs/josaa-orcr-convert.mjs <raw dir>");
  process.exit(1);
}
const fail = (msg) => {
  throw new Error(msg);
};

// Reads one chunk file, checks its hash, and returns its header fields and body lines.
const readChunk = (file) => {
  const text = readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n").replace(/\n$/, "");
  const cut = text.indexOf("\n");
  const head = text.slice(0, cut);
  const body = text.slice(cut + 1);
  const want = head.match(/ hash ([0-9a-f]{8})/)?.[1];
  if (!want) fail(`${file}: no hash in header: ${head}`);
  if (fnv(body) !== want) fail(`${file}: hash ${fnv(body)} does not match header ${want}`);
  return { head, lines: body.split("\n") };
};

// Dictionary of institute names and program names.
const dict = readChunk("dict.txt");
const instNames = new Map();
const progNames = new Map();
{
  let part = null;
  for (const l of dict.lines) {
    if (l === "[institutes]" || l === "[programs]") {
      part = l;
      continue;
    }
    const [k, v] = l.split("¦");
    if (v === undefined) fail(`dict.txt: bad line: ${l}`);
    (part === "[institutes]" ? instNames : progNames).set(k, v);
  }
}

// Decodes each round, in order, from its chunks.
const files = readdirSync(dir);
const decoded = new Map(); // round -> Map("inst,prog|KEY" -> [open, close]) in grid order
for (const r of ROUNDS) {
  const chunks = files
    .map((f) => f.match(new RegExp(`^r${r}-(\\d+)\\.txt$`)))
    .filter(Boolean)
    .map((m) => ({ file: m[0], i: Number(m[1]) }))
    .sort((a, b) => a.i - b.i);
  if (!chunks.length) fail(`Round ${r}: no chunks`);
  const prev = decoded.get(r - 1);
  const rows = new Map();
  let headerRows = 0;
  let total = null;
  let mode = null;
  for (const [n, { file, i }] of chunks.entries()) {
    const { head, lines } = readChunk(file);
    const m = head.match(/^@round (\d+) chunk (\d+)\/(\d+) hash [0-9a-f]{8} rows (\d+) mode (full|delta)$/);
    if (!m || Number(m[1]) !== r || Number(m[2]) !== i || i !== n + 1) fail(`${file}: unexpected header: ${head}`);
    if (total !== null && total !== Number(m[3])) fail(`${file}: chunk total changed`);
    total = Number(m[3]);
    mode = m[5];
    if ((r === 1) !== (mode === "full")) fail(`${file}: round ${r} in ${mode} mode`);
    headerRows += Number(m[4]);
    let cur = null;
    let count = 0;
    for (const l of lines) {
      if (l.startsWith("#")) {
        cur = l.slice(1);
        if (!/^\d{3},[0-9A-Z]{4}$/.test(cur)) fail(`${file}: bad program line: ${l}`);
        continue;
      }
      if (!cur) fail(`${file}: row before any program line: ${l}`);
      const [key, open, close, extra] = l.split(",");
      if (extra !== undefined || !/^[AHOGJL][OoEeBbSsTt][NF]$/.test(key)) fail(`${file}: bad row: ${l}`);
      const id = `${cur}|${key}`;
      if (rows.has(id)) fail(`${file}: row repeated in round ${r}: ${id}`);
      let value;
      if (open === undefined) {
        // Both ranks unchanged since the previous round.
        if (mode !== "delta" || !prev?.has(id)) fail(`${file}: no previous row for ${id}`);
        value = prev.get(id);
      } else {
        const p = prev?.get(id);
        if ((open === "" || close === "") && (mode !== "delta" || !p)) fail(`${file}: no previous row for ${id}`);
        value = [open === "" ? p[0] : open, close === "" ? p[1] : close];
      }
      rows.set(id, value);
      count++;
    }
    if (count !== Number(m[4])) fail(`${file}: ${count} rows, header says ${m[4]}`);
  }
  if (chunks.length !== total) fail(`Round ${r}: ${chunks.length} chunks of ${total}`);
  if (rows.size !== headerRows || rows.size !== GRID_ROWS[r]) fail(`Round ${r}: ${rows.size} rows decoded, grid has ${GRID_ROWS[r]}`);
  const canon = [...rows].map(([id, [o, c]]) => `${id}|${o}|${c}`).sort().join("\n");
  if (fnv(canon) !== GRID_HASH[r]) fail(`Round ${r}: decoded rows hash ${fnv(canon)}, grid hash ${GRID_HASH[r]}`);
  decoded.set(r, rows);
}

// Institutes and branches of the JoSAA council file.
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const council = JSON.parse(readFileSync(path.join(root, "data", "councils", "josaa.json"), "utf8"));
if (council.scheme !== "josaa") fail("data/councils/josaa.json is not the josaa scheme");
const branchesOf = new Map(); // "code|course" -> Set of branch names
for (const row of council.rows) {
  for (const o of row.offerings) branchesOf.set(`${row.code}|${o.course}`, new Set(o.branches.map((b) => b.name)));
}
const councilCodes = new Set(council.rows.map((r) => r.code));

// Parses one printed rank: digits, an optional ".0" (as printed for a few ranks), an optional "P" (preparatory rank list).
const parseRank = (s) => {
  const m = s.match(/^(\d+)(?:\.0+)?(P?)$/);
  if (!m) return null;
  return { n: Number(m[1]), p: m[2] === "P", decimal: s.includes(".") };
};

const out = [];
const skipped = new Map(); // reason -> Map(label -> rows)
const skip = (reason, label) => {
  if (!skipped.has(reason)) skipped.set(reason, new Map());
  const m = skipped.get(reason);
  m.set(label, (m.get(label) ?? 0) + 1);
};
const notes = { decimal: [], mixed: [], inverted: [] };
for (const r of ROUNDS) {
  for (const [id, [openRaw, closeRaw]] of decoded.get(r)) {
    const [instProg, key] = id.split("|");
    const [code, prog] = instProg.split(",");
    const progName = progNames.get(prog);
    if (!instNames.has(code)) fail(`Institute code ${code} not in dict.txt`);
    if (!progName) fail(`Program code ${prog} not in dict.txt`);
    const label = `${code} ${instNames.get(code)}: ${progName}`;
    if (!councilCodes.has(code)) {
      skip("Institute code not in data/councils/josaa.json", label);
      continue;
    }
    const d = degreeOf(progName);
    if (!d || !(d.degree in DEGREES)) {
      skip("Degree not in the degree table", label);
      continue;
    }
    const course = DEGREES[d.degree];
    if (!course) {
      skip(`No course for degree "${d.degree}"`, label);
      continue;
    }
    if (/^Abu Dhabi Campus/.test(d.subject)) {
      skip("IIT Delhi Abu Dhabi campus (outside India)", label);
      continue;
    }
    const branch = tidy(PLAIN.has(d.degree) ? d.subject : `${d.subject} (${d.degree})`);
    if (!branchesOf.get(`${code}|${course}`)?.has(branch)) {
      skip(`Branch not in data/councils/josaa.json for that institute and course`, `${label} -> ${course} "${branch}"`);
      continue;
    }
    const open = parseRank(openRaw);
    const close = parseRank(closeRaw);
    if (!open || !close) fail(`Round ${r} ${id}: rank not understood: ${openRaw}, ${closeRaw}`);
    const row = {
      institution: { scheme: "josaa", value: code },
      exam: code.startsWith("1") ? "jee-advanced" : "jee-main",
      course,
      branch,
      seat_pool: GENDER[key[2]],
      quota: QUOTA[key[0]],
      category: SEAT_TYPE[key[1]],
      round: `Round ${r}`,
      opening_rank: open.n,
      closing_rank: close.n,
    };
    const where = `Round ${r}, ${code} ${branch}, ${row.quota} ${row.category} ${row.seat_pool}: ${openRaw} to ${closeRaw}`;
    if (open.p || close.p) {
      row.preparatory = true;
      // One rank on the preparatory list and the other on the main list: name the preparatory one.
      if (open.p !== close.p) {
        row.preparatory_rank = open.p ? "opening" : "closing";
        notes.mixed.push(where);
      }
    }
    if (open.decimal || close.decimal) notes.decimal.push(where);
    if (open.p === close.p && open.n > close.n) notes.inverted.push(where);
    out.push(row);
  }
}

const file = {
  year: YEAR,
  source: {
    publisher: "Joint Seat Allocation Authority",
    title: "JoSAA 2026 Opening and Closing Ranks, Rounds 1 to 5 (IITs, IISc, NITs, IIEST, IIITs and other GFTIs)",
    url: SOURCE_URL,
    retrieved: RETRIEVED,
  },
  rows: out,
};
mkdirSync(path.join(root, "data", "cutoffs"), { recursive: true });
const outPath = path.join(root, "data", "cutoffs", `josaa-${YEAR}.json`);
// One row per line keeps the file diffable without the size of a fully indented file.
const body = out.map((row) => "  " + JSON.stringify(row)).join(",\n");
writeFileSync(
  outPath,
  `{\n "year": ${YEAR},\n "source": ${JSON.stringify(file.source)},\n "rows": [\n${body}\n ]\n}\n`,
);

// Report.
const gridTotal = ROUNDS.reduce((a, r) => a + decoded.get(r).size, 0);
console.log(`${gridTotal} grid rows decoded and checked (${ROUNDS.map((r) => `round ${r}: ${decoded.get(r).size}`).join(", ")})`);
console.log(`${out.length} rows written to ${outPath}`);
const count = (f) => {
  const m = new Map();
  for (const row of out) m.set(f(row), (m.get(f(row)) ?? 0) + 1);
  return [...m].map(([k, v]) => `${k} ${v}`).join(", ");
};
console.log(`By round: ${count((x) => x.round)}`);
console.log(`By exam: ${count((x) => x.exam)}`);
console.log(`By course: ${count((x) => x.course)}`);
console.log(`Preparatory rows: ${out.filter((x) => x.preparatory).length} (mixed lists: ${notes.mixed.length})`);
console.log(`Ranks printed with ".0": ${notes.decimal.length}`);
console.log(`Opening above closing on the same list, as printed: ${notes.inverted.length}`);
for (const [reason, m] of skipped) {
  console.log(`Skipped, ${reason}: ${[...m.values()].reduce((a, b) => a + b, 0)} rows, ${m.size} programs`);
}
const reportPath = process.argv[3];
if (reportPath) writeFileSync(reportPath, JSON.stringify({ skipped: Object.fromEntries([...skipped].map(([k, m]) => [k, Object.fromEntries(m)])), notes }, null, 1));
