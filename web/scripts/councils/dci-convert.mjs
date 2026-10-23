// Converts an extract of the Dental Council of India (now National Dental Commission) College Search
// into the council file format read by lib/bootstrap.ts (seedCouncils): data/councils/dci.json.
//
// Source: https://dciindia.gov.in/CollegeSearch.aspx, searched state by state with course "ALL" from the
// College Search box on https://dciindia.gov.in/Home.aspx, plus each college's "View More Details" page
// (SearchCollegeDetails.aspx) for its address. The site is ASP.NET postback only, so it was read in a browser.
//
// Raw input: one line per college, fields separated by "¦":
//   index ¦ college name ¦ state ¦ type ¦ seats ¦ address line 1 ¦ address line 2 ¦ city ¦ PIN
// where seats is a comma list of <course><speciality>:<seats>, course B = BDS, M = MDS, P = PG Diploma,
// and speciality is an index into SPECIALITIES below (8 = "N/A", used for BDS).
//
// Usage: node scripts/councils/dci-convert.mjs <raw.txt> [<raw.txt> ...]
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ACADEMIC_YEAR = "2026-27";
const RETRIEVED = "2026-10-23";

// DCI's speciality names in the order the extract indexes them, spelling as DCI prints it.
const SPECIALITIES = [
  "Orthodonitics & Dentofacial Orthopedics",
  "Conservative Dentistry & Endodontics",
  "Pediatric and Preventive Dentistry",
  "Public Health Dentistry",
  "Oral Medicine & Radiology",
  "Prosthodontics and Crown & Bridge",
  "Periodontology",
  "Oral and Maxillofacial Surgery",
  "N/A",
  "Oral & Maxillofacial Pathology and Oral Microbiology",
];
// The one obvious misspelling in DCI's speciality list.
const specialityName = (s) => s.replace("Orthodonitics", "Orthodontics");

// DCI's state spellings, mapped to the names in data/reference.ts STATES.
const STATE_NAMES = {
  "Andaman & Nicobar Islands": "Andaman and Nicobar Islands",
  "Jammu & Kashmir": "Jammu and Kashmir",
  "Orissa": "Odisha",
  "Pondicherry": "Puducherry",
  "Uttrakhand": "Uttarakhand",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
};

// DCI's college type, mapped to the ownership values in lib/db/schema.ts.
const OWNERSHIP = { "Govt.": "government", "Private": "private" };

// Colleges that are the same institution as a NIRF record already in the database (same name and city),
// checked by hand. Keyed by DCI's college name. University-level NIRF records (e.g. Jamia Millia Islamia,
// Saveetha Institute, Dr. D. Y. Patil Vidyapeeth) are left unlinked: DCI lists the dental college, not the university.
const NIRF_LINKS = {
  "Govt. Dental College & Hospital, Mumbai": "C-13829",
  "Govt. Dental College & Hospital, Nagpur": "C-14033",
  "A.B. Shetty Memorial Institute of Dental Sciences, Mangalore": "C-19320",
  "KLE Vishwanath Katti Institute of Dental Sciences, Belgaum": "C-24504",
  "Maulana Azad Dental College & Hospital, New Delhi": "C-28507",
  "Christian Dental College, Ludhiana": "C-29150",
  "Post Graduate Institute of Dental Sciences, Rohtak": "C-30756",
  "JSS Dental College & Hospital, Mysore": "C-35008",
  "Govt. Dental College, Bangalore": "C-40178",
  "KLE Society’s Institute of Dental Sciences,Bangalore": "C-40342",
  "Chettinad Dental College & Research Institute, Kancheepuram": "C-45605",
  "Govt. Dental College, Trivandrum": "C-48122",
  "Govt. Dental College & Hospital, Ahmedabad": "C-5910",
  "Mahatma Gandhi Post Graduate Institute of Dental Sciences, Puducherry": "C-6548",
  "Manipal College of Dental Sciences, Mangalore": "C-7240",
  "Manipal College of Dental Sciences, Manipal": "C-7254",
  "Govt. Dental College, Kozhikode": "C-8121",
  "Yenepoya Dental College & Hospital, Mangalore": "C-8528",
  "Nair Hospital Dental College, Mumbai": "N-153",
  "SDM College of Dental Sciences & Hospital, Dharwad": "N-238",
  "S.R.M. Dental College, Ramapuram, Chennai": "N-352",
  "SRM Kattankulathur Dental College & Hospital, Kanchipuram": "N-353",
  "Faculty of Dental Sciences, Banaras Hindu University, Varanasi": "N-71",
  "Sree Balaji Dental College & Hospital, Narayanpuram": "N-91",
};

const tidy = (v) => {
  const s = String(v ?? "").replace(/\s+/g, " ").replace(/\s+,/g, ",").replace(/^[\s,.]+|[\s,]+$/g, "").trim();
  return s || null;
};
// Address lines that are only a phone number, a stray digit or "as above" are dropped.
const addressLine = (v) => {
  const s = tidy(v);
  return s && !/^\d{1,2}$|^\d{10,12}$|^as above$/i.test(s) ? s : null;
};
const titleCase = (s) => (s && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (m, a, c) => a + c.toUpperCase()) : s);

// DCI publishes no college code, so each college is keyed by a hash of its state, name and city.
const hashCode = (state, name, city) => {
  const key = [state, name, city ?? ""].map((x) => x.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()).join("|");
  return BigInt("0x" + createHash("sha1").update(key).digest("hex").slice(0, 12)).toString(36);
};

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error("Usage: node scripts/councils/dci-convert.mjs <raw.txt> [<raw.txt> ...]");
  process.exit(1);
}
const lines = inputs.flatMap((f) => readFileSync(f, "utf8").split("\n")).filter((l) => l.trim());

const rows = [];
const noSeats = [];
const flagged = [];
let pgDiploma = 0;
for (const line of lines) {
  const [, rawName, rawState, type, seats, line1, line2, rawCity, pin] = line.split("¦");
  const name = tidy(rawName);
  const state = STATE_NAMES[tidy(rawState)] ?? tidy(rawState);
  const city = titleCase(tidy(rawCity));
  const entries = seats.split(",").filter(Boolean).map((e) => {
    const [, course, sp, n] = e.match(/^([BMP])(\d+):(\d+)$/);
    return { course, speciality: SPECIALITIES[Number(sp)], seats: Number(n) };
  });
  const offerings = [];

  const bds = entries.filter((e) => e.course === "B");
  if (bds.length > 1) {
    // DCI prints the BDS row more than once; which figure is right cannot be told, so the intake stays unknown.
    flagged.push(`${name}: BDS printed ${bds.length} times (${bds.map((e) => e.seats).join(" + ")}), seats left null`);
    offerings.push({ course: "bds", seats: null });
  } else if (bds.length === 1 && bds[0].seats > 0) {
    offerings.push({ course: "bds", seats: bds[0].seats });
  }

  // Specialities with 0 permitted seats (surrendered or stopped) are left out of the split.
  const branches = entries
    .filter((e) => e.course === "M" && e.seats > 0)
    .map((e) => ({ name: `MDS ${specialityName(e.speciality)}`, seats: e.seats }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (branches.length) offerings.push({ course: "mds", seats: branches.reduce((a, b) => a + b.seats, 0), branches });

  pgDiploma += entries.filter((e) => e.course === "P").reduce((a, e) => a + e.seats, 0);
  if (!offerings.length) {
    noSeats.push(`${name} (${state})`);
    continue;
  }

  // DCI's address lines often repeat each other or the city; a part already contained in an earlier one is dropped.
  const parts = [];
  for (const part of [addressLine(line1), addressLine(line2), city]) {
    if (part && !parts.some((q) => q.toLowerCase().includes(part.toLowerCase()))) parts.push(part);
  }
  const p = tidy(pin);
  const management = tidy(type);
  const row = {
    code: hashCode(state, name, city),
    name,
    address: parts.length ? `${[...parts, state].join(", ")}${p ? ` - ${p}` : ""}` : null,
    district: null,
    state,
    management,
    ownership: management ? OWNERSHIP[management] ?? null : null,
    offerings,
  };
  if (NIRF_LINKS[name]) row.same_as = { scheme: "nirf", value: NIRF_LINKS[name] };
  rows.push(row);
}
rows.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));

const file = {
  council: "DCI",
  scheme: "dci",
  stream: "dental",
  academic_year: ACADEMIC_YEAR,
  sources: [
    {
      publisher: "Dental Council of India (National Dental Commission)",
      title: "College Search: dental colleges with permitted BDS, MDS and PG Diploma seats, and each college's details page",
      url: "https://dciindia.gov.in/CollegeSearch.aspx",
      retrieved: RETRIEVED,
      prefix: "",
    },
  ],
  note:
    "Every college the DCI (National Dental Commission) College Search returns for any state that has BDS or MDS seats. " +
    "The search table is headed 'Permitted Seats for Academic Year 2025-26', but its college-wise seats add up exactly to the totals DCI's " +
    "Permitted Seats page (https://dciindia.gov.in/PermittedSeats.aspx) gives for 2026-27 (BDS 28,114, MDS 7,704; 2025-26 was 28,016 and 7,357) " +
    "and its remarks describe 2026-27 changes, so the seats are recorded as 2026-27. " +
    "BDS seats are the permitted intake. DCI prints MDS seats only by speciality, so the MDS total is the sum of the speciality seats, kept in branches. " +
    "Colleges with no permitted BDS or MDS seats (admissions stopped or permission refused) and specialities with 0 seats are left out; " +
    "PG Diploma seats are left out (no course for them). Addresses come from each college's DCI details page. " +
    "DCI publishes no college code, so each college is keyed by a hash of its state, name and city. " +
    "same_as joins a college to the NIRF record for the same institution (checked by hand).",
  rows,
};
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const out = path.join(root, "data", "councils", "dci.json");
writeFileSync(out, JSON.stringify(file, null, 1) + "\n");

const offeringsOf = (c) => rows.flatMap((r) => r.offerings).filter((o) => o.course === c);
const total = (c) => offeringsOf(c).reduce((a, o) => a + (o.seats ?? 0), 0);
console.log(`${lines.length} colleges read, ${rows.length} written to ${out}`);
console.log(`BDS: ${offeringsOf("bds").length} colleges, ${total("bds")} seats (${offeringsOf("bds").filter((o) => o.seats === null).length} unknown)`);
console.log(`MDS: ${offeringsOf("mds").length} colleges, ${total("mds")} seats`);
console.log(`PG Diploma seats left out: ${pgDiploma}`);
console.log(`NIRF links: ${rows.filter((r) => r.same_as).length} of ${Object.keys(NIRF_LINKS).length}`);
const missing = Object.keys(NIRF_LINKS).filter((n) => !rows.some((r) => r.name === n));
if (missing.length) console.log(`NIRF links with no matching college: ${missing.join("; ")}`);
if (flagged.length) console.log(`Flagged:\n  ${flagged.join("\n  ")}`);
if (noSeats.length) console.log(`Left out, no BDS or MDS seats:\n  ${noSeats.join("\n  ")}`);
