// Checks data/cutoffs/josaa-<year>.json against data/councils/josaa.json.
//
// Errors (exit code 1):
//   - the file shape: year, source fields, and every row's fields and allowed values
//   - every institution is a josaa code that exists in data/councils/josaa.json
//   - every branch exists for that institute under that course in data/councils/josaa.json
//   - exam is jee-advanced for IITs and IISc (codes 1xx) and jee-main otherwise
//   - opening_rank and closing_rank are positive integers
//   - opening_rank <= closing_rank when both ranks are on the same list (both preparatory or both not)
//   - no two rows share institute, course, branch, seat pool, quota, category and round
// Reported, not errors: rows whose opening and closing ranks are on different lists (preparatory_rank set),
// and council branches with no cutoff row in a round.
//
// Usage: node scripts/cutoffs/josaa-orcr-validate.mjs [year]
import { readFileSync } from "node:fs";
import path from "node:path";

const year = process.argv[2] ?? "2026";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const data = JSON.parse(readFileSync(path.join(root, "data", "cutoffs", `josaa-${year}.json`), "utf8"));
const council = JSON.parse(readFileSync(path.join(root, "data", "councils", "josaa.json"), "utf8"));

const errors = [];
const err = (m) => errors.push(m);

const SEAT_POOLS = new Set(["Gender-Neutral", "Female-only (including Supernumerary)"]);
const QUOTAS = new Set(["AI", "HS", "OS", "GO", "JK", "LA"]);
const CATEGORIES = new Set(["OPEN", "OPEN (PwD)", "EWS", "EWS (PwD)", "OBC-NCL", "OBC-NCL (PwD)", "SC", "SC (PwD)", "ST", "ST (PwD)"]);
const COURSES = new Set(["btech", "barch", "bplan"]);
const ROUNDS = new Set(["Round 1", "Round 2", "Round 3", "Round 4", "Round 5", "Round 6"]);
const KEYS = new Set([
  "institution", "exam", "course", "branch", "seat_pool", "quota", "category", "round",
  "opening_rank", "closing_rank", "preparatory", "preparatory_rank",
]);

if (data.year !== Number(year)) err(`year is ${data.year}, expected ${year}`);
const s = data.source ?? {};
for (const k of ["publisher", "title", "url", "retrieved"]) if (typeof s[k] !== "string" || !s[k]) err(`source.${k} missing`);
if (s.title && s.title.length >= 200) err("source.title is 200 characters or more");
if (s.url && !/^https:\/\//.test(s.url)) err("source.url is not https");
if (s.retrieved && !/^\d{4}-\d{2}-\d{2}$/.test(s.retrieved)) err("source.retrieved is not a date");
if (!Array.isArray(data.rows) || !data.rows.length) err("rows missing or empty");

const branchesOf = new Map();
for (const row of council.rows) {
  for (const o of row.offerings) branchesOf.set(`${row.code}|${o.course}`, new Set(o.branches.map((b) => b.name)));
}
const codes = new Set(council.rows.map((r) => r.code));
const isPosInt = (n) => Number.isInteger(n) && n > 0;

const seen = new Set();
const covered = new Map(); // round -> Set("code|course|branch")
const mixed = [];
for (const [i, r] of (data.rows ?? []).entries()) {
  const at = `row ${i}`;
  for (const k of Object.keys(r)) if (!KEYS.has(k)) err(`${at}: unknown field ${k}`);
  const code = r.institution?.value;
  if (r.institution?.scheme !== "josaa") err(`${at}: institution.scheme is not josaa`);
  if (!codes.has(code)) {
    err(`${at}: institution ${code} not in data/councils/josaa.json`);
    continue;
  }
  if (!COURSES.has(r.course)) err(`${at}: course ${r.course}`);
  if (!branchesOf.get(`${code}|${r.course}`)?.has(r.branch)) err(`${at}: branch "${r.branch}" not offered by ${code} under ${r.course}`);
  const exam = code.startsWith("1") ? "jee-advanced" : "jee-main";
  if (r.exam !== exam) err(`${at}: exam ${r.exam}, expected ${exam}`);
  if (!SEAT_POOLS.has(r.seat_pool)) err(`${at}: seat_pool ${r.seat_pool}`);
  if (!QUOTAS.has(r.quota)) err(`${at}: quota ${r.quota}`);
  if (!CATEGORIES.has(r.category)) err(`${at}: category ${r.category}`);
  if (!ROUNDS.has(r.round)) err(`${at}: round ${r.round}`);
  if (!isPosInt(r.opening_rank)) err(`${at}: opening_rank ${r.opening_rank} is not a positive integer`);
  if (!isPosInt(r.closing_rank)) err(`${at}: closing_rank ${r.closing_rank} is not a positive integer`);
  if (r.preparatory !== undefined && r.preparatory !== true) err(`${at}: preparatory must be true when present`);
  if (r.preparatory_rank !== undefined) {
    if (!["opening", "closing"].includes(r.preparatory_rank)) err(`${at}: preparatory_rank ${r.preparatory_rank}`);
    if (r.preparatory !== true) err(`${at}: preparatory_rank without preparatory`);
    mixed.push(`${r.round}, ${code} ${r.branch}, ${r.quota} ${r.category} ${r.seat_pool}: ${r.opening_rank} to ${r.closing_rank} (${r.preparatory_rank} rank preparatory)`);
  } else if (r.opening_rank > r.closing_rank) {
    err(`${at}: opening_rank ${r.opening_rank} above closing_rank ${r.closing_rank}`);
  }
  const key = [code, r.course, r.branch, r.seat_pool, r.quota, r.category, r.round].join("|");
  if (seen.has(key)) err(`${at}: duplicate of an earlier row: ${key}`);
  seen.add(key);
  if (!covered.has(r.round)) covered.set(r.round, new Set());
  covered.get(r.round).add(`${code}|${r.course}|${r.branch}`);
}

// Council branches with no cutoff row, per round.
const allBranches = [];
for (const row of council.rows) for (const o of row.offerings) for (const b of o.branches) allBranches.push(`${row.code}|${o.course}|${b.name}`);
const missing = new Map();
for (const [round, set] of covered) for (const b of allBranches) if (!set.has(b)) missing.set(b, [...(missing.get(b) ?? []), round]);

console.log(`${data.rows?.length ?? 0} rows checked against ${codes.size} institutes and ${allBranches.length} branches`);
console.log(`Rows with opening and closing ranks on different lists (not checked for order): ${mixed.length}`);
for (const m of mixed) console.log(`  ${m}`);
console.log(`Council branches without a cutoff row in some round: ${missing.size}`);
for (const [b, rs] of missing) console.log(`  ${b}: ${rs.join(", ")}`);
if (errors.length) {
  console.error(`${errors.length} errors:`);
  for (const e of errors.slice(0, 50)) console.error(`  ${e}`);
  process.exit(1);
}
console.log("OK");
