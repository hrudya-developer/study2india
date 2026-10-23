// Converts the Pharmacy Council of India approved-institution lists into the council file read by
// lib/bootstrap.ts (data/councils/pci.json).
//
// Usage: node scripts/councils/pci-convert.mjs <pci-dump.json>
//
// The dump is the JSON that pci.gov.in's own list pages load (each page under
// https://pci.gov.in/en/approved-institute/ fetches its full table as JSON from its own URL with
// an XHR GET). It was taken in a browser on pci.gov.in with:
//
//   const base = "https://pci.gov.in/en/approved-institute/";
//   const pages = { dip12: "approved-diploma-institutions-u-s-12/", dipc: "diploma-institutions-only-for-conduct/",
//     deg12: "approved-degree-institutions-us-12/", degc: "degree-institutions-only-for-conduct/",
//     pharmd: "approved-institutions-for-pharm-d/", pharmdpb: "approved-institutions-for-pharmd-post-baccalaureate/",
//     mpharm: "approved-institutions-for-m-pharm-courses/", bridge: "approved-institutions-for-bridge-course/" };
//   lists[k] = await jQuery.ajax({ url: base + pages[k], type: "GET", dataType: "json" });
//
// and saved as { retrieved, pages, lists }. Each row has state_name, institution_name,
// naming_series (the PCI code, "PCI-35"), pci_decision (free text), examiningauthority_name,
// permanent_approved_institutions_by_pci and, for Pharm.D, hospital_name.
//
// PCI gives no address, city or management type, and gives intake only inside the decision text.
// Seats are taken from the decision text only where it states an intake for an approval that covers
// the target academic year; everything else stays null.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const TARGET_YEAR = 2026; // academic year 2026-27
const ACADEMIC_YEAR = "2026-27";
const RETRIEVED = "2026-10-23";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "..", "..");

// State names as written in data/reference.ts, read from the file so they cannot drift.
const refText = readFileSync(path.join(root, "data", "reference.ts"), "utf8");
const STATES = [...refText.matchAll(/\{ code: "([A-Z]{2})", name: "([^"]+)"/g)].map((m) => ({ code: m[1], name: m[2] }));
const ALIASES = Object.fromEntries([...refText.matchAll(/^\s+"([^"]+)": "([A-Z]{2})",$/gm)].map((m) => [m[1], m[2]]));
function stateName(raw) {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const direct = STATES.find((s) => s.name.toLowerCase() === key);
  if (direct) return direct.name;
  const code = ALIASES[key];
  const viaAlias = code && STATES.find((s) => s.code === code);
  if (viaAlias) return viaAlias.name;
  throw new Error(`Unknown state: ${raw}`);
}

export function clean(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&[a-z]+;/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const SMALL = new Set(["of", "and", "for", "in", "the", "at", "by", "on", "to"]);
/** PCI prints some names in capitals; those are title-cased, mixed-case names are kept as printed. */
function tidyName(raw) {
  const s = clean(raw).replace(/\s+,/g, ",");
  if (/[a-z]/.test(s)) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[(.\-/&'])([a-z])/g, (_, p, c) => p + c.toUpperCase())))
    .join(" ");
}

// Which course each list covers, and how its course is named in decision text.
const LISTS = {
  dip12: { course: "d-pharm", label: "Approved Diploma institutions u/s 12" },
  dipc: { course: "d-pharm", label: "Diploma institutions only for conduct" },
  deg12: { course: "b-pharm", label: "Approved Degree institutions u/s 12" },
  degc: { course: "b-pharm", label: "Degree institutions only for conduct" },
  pharmd: { course: "pharm-d", label: "Approved institutions for Pharm.D" },
  mpharm: { course: "m-pharm", label: "Approved institutions for M.Pharm courses" },
};
// Pharm.D (Post Baccalaureate) and the B.Pharm (Practice) bridge course have no course slug yet.
const SKIPPED_LISTS = ["pharmdpb", "bridge"];

/** The course a stretch of decision text names, if any. */
function courseNamed(text) {
  if (/Pharm\.?\s?D\s*\(?\s*P\.?\s?B|Post\s*Baccalaureate/i.test(text)) return "pharm-d-pb";
  if (/B\.?\s?Pharm\s*\(\s*Practice/i.test(text)) return "bridge";
  if (/\bM\.?\s?Pharm/i.test(text)) return "m-pharm";
  if (/\bB\.?\s?Pharm/i.test(text)) return "b-pharm";
  if (/\bD\.?\s?Pharm/i.test(text)) return "d-pharm";
  if (/\bPharm\.?\s?D\b/i.test(text)) return "pharm-d";
  return null;
}

const Y = String.raw`(20\d\d)\s*-\s*(?:20)?(\d\d)`;
const N = String.raw`0*(\d{1,3})`;
// Each pattern yields {from, to, seats}: the academic years (by starting year) the stated intake covers.
const PATTERNS = [
  // "Extend approval upto 2026-2027 academic session for 60 admissions", "already approved upto ..."
  { re: new RegExp(String.raw`(?:approval|approved)\s*up\s*to\s*${Y}\s*(?:academic)?\s*(?:session)?\s*for\s*${N}\s*(?:admissions?|intakes?|seats?)`, "gi"), get: (m) => ({ from: null, to: +m[1], seats: +m[3] }) },
  // "Extension upto 2026-2027 academic session for 60 admissions"
  { re: new RegExp(String.raw`Extension\s*up\s*to\s*${Y}\s*(?:academic)?\s*(?:session)?\s*for\s*${N}\s*admissions?`, "gi"), get: (m) => ({ from: null, to: +m[1], seats: +m[3] }) },
  // "Grant approval from 2024-2025 to 2026-2027 academic session for 60 admissions u/s 12"
  { re: new RegExp(String.raw`(?:approval\s*)?(?:from|for)\s*${Y}\s*to\s*${Y}\s*(?:academic)?\s*(?:session)?\s*(?:u/s\s*12\s*)?for\s*${N}\s*admissions?`, "gi"), get: (m) => ({ from: +m[1], to: +m[3], seats: +m[5] }) },
  // "Grant approval for 2026-2027 academic session for the conduct of 1st year for 60 admissions"
  { re: new RegExp(String.raw`approval\s*(?:for|upto)\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*(?:the\s*)?conduct\s*of\s*(?:course\s*for\s*)?(\d)\s*(?:st|nd|rd|th)\s*year\s*for\s*${N}\s*(?:admissions?|intakes?|seats?)`, "gi"), get: (m) => (+m[3] === 1 ? { from: +m[1], to: +m[1], seats: +m[4] } : null) },
  // "Grant approval for 2026-2027 academic session for 60 admissions for the conduct of 1st year"
  { re: new RegExp(String.raw`approval\s*for\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*${N}\s*admissions?\s*for\s*(?:the\s*)?cond[a-z]*\s*of\s*(\d)\s*(?:st|nd|rd|th)\s*year`, "gi"), get: (m) => (+m[4] === 1 ? { from: +m[1], to: +m[1], seats: +m[3] } : null) },
  // "Grant approval for 2026-2027 academic session for 15 admissions for M.Pharm (Pharmaceutics) course"
  { re: new RegExp(String.raw`approval\s*for\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*${N}\s*admissions?\s*(?:(?:for|in)\b(?!\s*(?:the\s*)?cond)|u/s)`, "gi"), get: (m) => ({ from: +m[1], to: +m[1], seats: +m[3] }) },
  // "Grant approval from 2026-2027 academic session for 100 admissions u/s 12" (open ended)
  { re: new RegExp(String.raw`approval\s*from\s*${Y}\s*academic\s*session\s*for\s*${N}\s*admissions?`, "gi"), get: (m) => ({ from: +m[1], to: null, seats: +m[3] }) },
  // "approved admission for 60 from 2026-2027"
  { re: new RegExp(String.raw`approved\s*admissions?\s*for\s*${N}\s*from\s*${Y}`, "gi"), get: (m) => ({ from: +m[2], to: null, seats: +m[1] }) },
  // "Allow 60 admissions in 2026-2027 academic session in 1st year"
  { re: new RegExp(String.raw`Allow\s*${N}\s*admissions?\s*in\s*${Y}\s*academic\s*session(?:\s*in\s*(\d)\s*(?:st|nd|rd|th)\s*year)?`, "gi"), get: (m) => (!m[4] || +m[4] === 1 ? { from: +m[2], to: +m[2], seats: +m[1] } : null) },
  // "Grant approval for the 2026-2027 academic session for 1st year admission of 60 seat intake"
  { re: new RegExp(String.raw`approval\s*for\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*(?:the\s*)?(?:1\s*st|first)\s*year\s*admission\s*of\s*${N}\s*(?:seat\s*)?intake`, "gi"), get: (m) => ({ from: +m[1], to: +m[1], seats: +m[3] }) },
  // "GRANT APPROVAL FOR 60 SEATS D.PHARM SESSION 2026-27", "Approved for 60 seats in D.Pharm course for session 2026-27"
  { re: new RegExp(String.raw`(?:approval|approved)\s*(?:for|of)\s*${N}\s*seats\b[^.]{0,40}?session\s*${Y}`, "gi"), get: (m) => ({ from: +m[2], to: +m[2], seats: +m[1] }) },
  // Course of study: "2026-2027 - 1st Year cos 2027-2028 - 2nd Year cos For 60 admission",
  // "Course of Study (COS) 2027 - 2028 - 1st year cos 2028 - 2029 - 2nd year cos No. of Admission Approved - 15"
  { re: new RegExp(String.raw`${Y}\s*-?\s*1\s*st\s*year\s*cos.{0,200}?(?:For\s*${N}\s*admissions?|No\.?\s*of\s*Admission\s*Approved\s*-\s*${N})`, "gi"), get: (m) => ({ from: +m[1], to: null, seats: +(m[3] ?? m[4]) }) },
];
// Changes in intake: "Permit raise in admissions from 60 to 100 from 2026-27 a.s.", "reduce the intake from 100 to 60".
const RAISE = new RegExp(String.raw`(?:Permit|permitted|approve[d]?\s*for|already\s*approved)[^.]{0,30}?raise\s*in\s*admissions?\s*from\s*${N}\s*(?:to|-)\s*${N}\s*(?:intakes?\s*)?from\s*${Y}`, "gi");
const RAISE_DONE = new RegExp(String.raw`Raise\s*in\s*admissions?\s*from\s*${N}\s*to\s*${N}\s*from\s*${Y}\s*(?:academic\s*session\s*)?is\s*already\s*approved`, "gi");
const REDUCE = new RegExp(String.raw`reduce\s*(?:the\s*)?(?:intake|admissions?)\s*(?:from|form)\s*${N}\s*to\s*${N}`, "gi");

const covers = (s, y) => (s.from === null || s.from <= y) && (s.to === null || s.to >= y);

/**
 * Reads one decision for one course. Returns the intake for the target year (or null), and whether
 * every dated statement for the course starts after the target year (a course PCI approved only
 * from a later session).
 */
export function readDecision(text, course) {
  const statements = [];
  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      const s = p.get(m);
      if (!s) continue;
      // The course is named just before or after the statement; skip statements about another course.
      const around = text.slice(Math.max(0, m.index - 25), m.index + m[0].length + 60);
      const named = courseNamed(text.slice(m.index, m.index + m[0].length + 60)) ?? courseNamed(around);
      if (named && named !== course) continue;
      statements.push({ ...s, at: m.index });
    }
  }
  const dated = statements.filter((s) => s.from !== null || s.to !== null);
  const laterOnly = dated.length > 0 && dated.every((s) => (s.from ?? s.to) > TARGET_YEAR);
  const current = statements.filter((s) => covers(s, TARGET_YEAR));
  const values = new Set(current.map((s) => s.seats));

  // A raise or reduction in intake that applies by the target year: from A to B.
  const changes = [];
  for (const re of [RAISE, RAISE_DONE]) {
    for (const m of text.matchAll(re)) {
      const named = courseNamed(text.slice(Math.max(0, m.index - 60), m.index + m[0].length));
      if (named && named !== course) continue;
      if (+m[3] <= TARGET_YEAR) changes.push([+m[1], +m[2]]);
    }
  }
  for (const m of text.matchAll(REDUCE)) {
    const named = courseNamed(text.slice(Math.max(0, m.index - 60), m.index + m[0].length));
    if (named && named !== course) continue;
    changes.push([+m[1], +m[2]]);
  }

  let seats = null;
  if (changes.length === 1) {
    // The changed intake holds when every stated intake for the year is the old or the new figure.
    // A raise is only read alongside an approval for the year ("Extend approval up to 2026-2027
    // academic session for B.Pharm course. (Permit raise in admissions from 60 to 100 ...)").
    const [from, to] = changes[0];
    const upTo = text.match(new RegExp(String.raw`approval\s*up\s*to\s*${Y}`, "i"));
    const approvedForYear = current.length > 0 || (upTo !== null && Number(upTo[1]) >= TARGET_YEAR);
    if (approvedForYear && [...values].every((v) => v === from || v === to)) seats = to;
  } else if (changes.length === 0 && values.size === 1) {
    seats = current[0].seats;
  }
  // Two different intakes for the same year without one stated change: leave it unknown.
  return { seats, laterOnly };
}

function pickTop(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/** "M.Pharm (Pharmaceutics)" from the decision's opening words, when it names the specialisation. */
export function mpharmBranch(text) {
  let m = text.match(/^M\.?\s?Pharm\.?\s*\(([^)]+)\)/i);
  if (!m) m = text.match(/^M\.?\s?Pharm\.?\s+([A-Za-z][A-Za-z &]+?)\s+Status:/i);
  if (!m) return null;
  const name = m[1].trim().replace(/\s+/g, " ");
  return `M.Pharm (${name.replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bAnd\b/g, "and")})`;
}

function main() {
  const [dumpPath] = process.argv.slice(2);
  if (!dumpPath) throw new Error("Usage: node scripts/councils/pci-convert.mjs <pci-dump.json>");
  const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
  const sameAs = JSON.parse(readFileSync(path.join(here, "pci-same-as.json"), "utf8"));
  const institutions = new Map();
  const stats = { listed: {}, skippedLater: 0, mpharmUnnamed: 0 };
  for (const [key, list] of Object.entries(LISTS)) {
    const rows = dump.lists[key];
    stats.listed[key] = rows.length;
    for (const r of rows) {
      const code = clean(r.naming_series).replace(/\s+/g, "");
      if (!/^PCI-\d+$/.test(code)) throw new Error(`Unexpected PCI code ${r.naming_series}`);
      const inst = institutions.get(code) ?? { code, names: new Map(), states: new Set(), universities: new Map(), offerings: new Map(), lists: new Set() };
      institutions.set(code, inst);
      const name = tidyName(r.institution_name);
      inst.names.set(name, (inst.names.get(name) ?? 0) + (key.endsWith("12") ? 2 : 1));
      inst.states.add(stateName(clean(r.state_name)));
      inst.lists.add(key);
      const authority = clean(r.examiningauthority_name);
      if (authority && list.course !== "d-pharm" && !/^-+$/.test(authority)) inst.universities.set(authority, (inst.universities.get(authority) ?? 0) + 1);

      const text = clean(r.pci_decision);
      const { seats, laterOnly } = readDecision(text, list.course);
      if (laterOnly) {
        stats.skippedLater++;
        continue;
      }
      const off = inst.offerings.get(list.course) ?? { course: list.course, seats: null, seen: [], branches: new Map(), unnamed: 0 };
      inst.offerings.set(list.course, off);
      if (list.course === "m-pharm") {
        const branch = mpharmBranch(text);
        if (!branch) {
          off.unnamed++;
          stats.mpharmUnnamed++;
        } else {
          const prev = off.branches.get(branch);
          off.branches.set(branch, prev === undefined || prev === null ? seats : prev === seats || seats === null ? prev : null);
        }
      } else {
        off.seen.push(seats);
      }
    }
  }


  const rows = [];
  for (const inst of [...institutions.values()].sort((a, b) => Number(a.code.slice(4)) - Number(b.code.slice(4)))) {
    if (inst.states.size !== 1) throw new Error(`${inst.code} is listed under more than one state`);
    const offerings = [];
    for (const course of ["d-pharm", "b-pharm", "pharm-d", "m-pharm"]) {
      const off = inst.offerings.get(course);
      if (!off) continue;
      if (course === "m-pharm") {
        const branches = [...off.branches.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, seats]) => ({ name, seats }));
        const complete = off.unnamed === 0 && branches.length > 0 && branches.every((b) => b.seats !== null);
        const o = { course, seats: complete ? branches.reduce((t, b) => t + b.seats, 0) : null };
        if (branches.length) o.branches = branches;
        offerings.push(o);
      } else {
        // Listed in both the u/s 12 and the conduct list: keep a stated intake only if they agree.
        const known = [...new Set(off.seen.filter((s) => s !== null))];
        offerings.push({ course, seats: known.length === 1 ? known[0] : null });
      }
    }
    if (!offerings.length) continue;
    const row = {
      code: inst.code,
      name: pickTop(inst.names),
      address: null,
      district: null,
      state: [...inst.states][0],
      management: null,
      ownership: null,
      offerings,
    };
    const university = pickTop(inst.universities);
    if (university) row.university = university;
    if (sameAs[inst.code]) row.same_as = { scheme: "nirf", value: sameAs[inst.code] };
    rows.push(row);
  }

  const sources = [
    {
      publisher: "Pharmacy Council of India",
      title: `PCI approved institutions (${Object.values(LISTS).map((l) => l.label).join("; ")}), decisions for the ${ACADEMIC_YEAR} academic session`,
      url: "https://pci.gov.in/en/approved-institute/approved-diploma-institutions-u-s-12/",
      retrieved: RETRIEVED,
      prefix: "PCI-",
    },
  ];

  const out = {
    council: "PCI",
    scheme: "pci",
    stream: "pharmacy",
    academic_year: ACADEMIC_YEAR,
    sources,
    note:
      "Institutions on the Pharmacy Council of India's approved lists at pci.gov.in (Approved Institutes menu: D.Pharm and B.Pharm u/s 12 and only-for-conduct lists, Pharm.D and M.Pharm lists), keyed by PCI's own institution code. " +
      "PCI publishes no address, city or management type. Intake appears only inside PCI's free-text decision, so seats are filled only where that decision states an intake for an approval covering 2026-27 (for example 'Extend approval upto 2026-2027 academic session for 60 admissions', a first-year grant for 2026-27, or a raise in intake from 2026-27); decisions that give no intake, or whose stated approval ends before 2026-27, leave seats null. " +
      "Courses PCI approved only from 2027-28 are left out. M.Pharm specialisations are listed as branches where PCI names them; the M.Pharm total is filled only when every specialisation has a stated intake. " +
      "Pharm.D (Post Baccalaureate) and the B.Pharm (Practice) bridge course are not included. The university is the examining authority PCI lists for the degree courses.",
    rows,
  };
  const outPath = path.join(root, "data", "councils", "pci.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.error(JSON.stringify({ rows: rows.length, ...stats, skipped_lists: SKIPPED_LISTS.map((k) => `${k}:${dump.lists[k]?.length ?? 0}`) }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
