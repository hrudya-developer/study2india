// Converts an extract of the JoSAA (Joint Seat Allocation Authority) 2026 seat matrix into the council file
// format read by lib/bootstrap.ts (seedCouncils): data/councils/josaa.json.
//
// Sources, both ASP.NET pages read in a browser on 2026-10-24:
//   Seat matrix: https://josaa.admissions.nic.in/applicant/seatmatrix/seatmatrixinfo.aspx
//     (linked from https://josaa.nic.in/seat-matrix/), Institute Type ALL, Institute ALL, Program ALL.
//   Institute addresses: https://josaa.admissions.nic.in/applicant/seatmatrix/instituteview.aspx
//
// Raw input is a directory holding four "¦"-separated text files (lines starting with "#" are comments):
//   institutes.txt  code ¦ name ¦ address          (JoSAA institute code and name, address from Institute View)
//   programs.txt    index ¦ program name           (the seat matrix's "Program Name", as printed)
//   quotas.txt      index ¦ quota                  (the "State/All India Seats" column)
//   seats.txt       records separated by ";" or new lines, each
//                   institute code, program index, quota index, Gender-Neutral total, Female-only total, female supernumerary
//                   (one record per institute, program and quota: the seat matrix's Gender-Neutral and Female-only row pair)
//
// Usage: node scripts/councils/josaa-convert.mjs <raw dir>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ACADEMIC_YEAR = "2026-27";
const RETRIEVED = "2026-10-24";
const GRAND_TOTAL = 67323; // the seat matrix's own "Total Seats" row (64219 seat capacity + 3104 female supernumerary)

// JoSAA's institute types, by the first digit of the institute code (as the seat matrix's Institute Type filter groups them).
const TYPES = { 1: "IIT", 2: "NIT", 3: "IIIT", 4: "GFTI" };
// IITs and IISc (1xx) and NITs and IIEST Shibpur (2xx) are centrally funded institutes of national importance.
// JoSAA prints no ownership for IIITs and other GFTIs (a mix of central, state, PPP and deemed institutes), so it stays null.
const OWNERSHIP = { IIT: "central", NIT: "central", IIIT: null, GFTI: null };

// Town and state of each institute, read by hand from its JoSAA address. Where the address names only a
// village or post office, the town in the institute's JoSAA name is used. Names follow data/reference.ts STATES.
const PLACES = {
  101: ["Bhubaneswar", "Odisha"], 102: ["Mumbai", "Maharashtra"], 103: ["Mandi", "Himachal Pradesh"], 104: ["New Delhi", "Delhi"],
  105: ["Indore", "Madhya Pradesh"], 106: ["Kharagpur", "West Bengal"], 107: ["Hyderabad", "Telangana"], 108: ["Jodhpur", "Rajasthan"],
  109: ["Kanpur", "Uttar Pradesh"], 110: ["Chennai", "Tamil Nadu"], 111: ["Gandhinagar", "Gujarat"], 112: ["Patna", "Bihar"],
  113: ["Roorkee", "Uttarakhand"], 114: ["Dhanbad", "Jharkhand"], 115: ["Rupnagar", "Punjab"], 116: ["Varanasi", "Uttar Pradesh"],
  117: ["Guwahati", "Assam"], 118: ["Bhilai", "Chhattisgarh"], 119: ["Ponda", "Goa"], 120: ["Palakkad", "Kerala"],
  121: ["Tirupati", "Andhra Pradesh"], 122: ["Jammu", "Jammu and Kashmir"], 123: ["Dharwad", "Karnataka"], 124: ["Bengaluru", "Karnataka"],
  201: ["Jalandhar", "Punjab"], 202: ["Jaipur", "Rajasthan"], 203: ["Bhopal", "Madhya Pradesh"], 204: ["Prayagraj", "Uttar Pradesh"],
  205: ["Agartala", "Tripura"], 206: ["Kozhikode", "Kerala"], 207: ["Delhi", "Delhi"], 208: ["Durgapur", "West Bengal"],
  209: ["Cuncolim", "Goa"], 210: ["Hamirpur", "Himachal Pradesh"], 211: ["Surathkal", "Karnataka"], 212: ["Sohra", "Meghalaya"],
  213: ["Chumukedima", "Nagaland"], 214: ["Patna", "Bihar"], 215: ["Karaikal", "Puducherry"], 216: ["Raipur", "Chhattisgarh"],
  217: ["Ravangla", "Sikkim"], 218: ["Jote", "Arunachal Pradesh"], 219: ["Jamshedpur", "Jharkhand"], 220: ["Kurukshetra", "Haryana"],
  221: ["Imphal", "Manipur"], 222: ["Aizawl", "Mizoram"], 223: ["Rourkela", "Odisha"], 224: ["Silchar", "Assam"],
  225: ["Srinagar", "Jammu and Kashmir"], 226: ["Tiruchirappalli", "Tamil Nadu"], 227: ["Srinagar (Garhwal)", "Uttarakhand"], 228: ["Warangal", "Telangana"],
  229: ["Surat", "Gujarat"], 230: ["Nagpur", "Maharashtra"], 231: ["Tadepalligudem", "Andhra Pradesh"], 232: ["Howrah", "West Bengal"],
  301: ["Gwalior", "Madhya Pradesh"], 302: ["Kota", "Rajasthan"], 303: ["Guwahati", "Assam"], 304: ["Kalyani", "West Bengal"],
  305: ["Sonepat", "Haryana"], 306: ["Una", "Himachal Pradesh"], 307: ["Sri City", "Andhra Pradesh"], 308: ["Gandhinagar", "Gujarat"],
  309: ["Prayagraj", "Uttar Pradesh"], 310: ["Chennai", "Tamil Nadu"], 311: ["Jabalpur", "Madhya Pradesh"], 313: ["Imphal", "Manipur"],
  314: ["Tiruchirappalli", "Tamil Nadu"], 315: ["Lucknow", "Uttar Pradesh"], 316: ["Dharwad", "Karnataka"], 317: ["Kurnool", "Andhra Pradesh"],
  318: ["Kottayam", "Kerala"], 319: ["Ranchi", "Jharkhand"], 320: ["Nagpur", "Maharashtra"], 321: ["Pune", "Maharashtra"],
  322: ["Bhagalpur", "Bihar"], 323: ["Bhopal", "Madhya Pradesh"], 324: ["Surat", "Gujarat"], 325: ["Agartala", "Tripura"],
  326: ["Raichur", "Karnataka"], 327: ["Diu", "Dadra and Nagar Haveli and Daman and Diu"],
  401: ["Silchar", "Assam"], 402: ["Ranchi", "Jharkhand"], 403: ["Haridwar", "Uttarakhand"], 404: ["Bhadohi", "Uttar Pradesh"],
  405: ["Ahmedabad", "Gujarat"], 406: ["Bilaspur", "Chhattisgarh"], 407: ["Prayagraj", "Uttar Pradesh"], 408: ["Aurangabad", "Maharashtra"],
  409: ["Ranchi", "Jharkhand"], 410: ["Longowal", "Punjab"], 411: ["Aizawl", "Mizoram"], 412: ["Tezpur", "Assam"],
  413: ["Bhopal", "Madhya Pradesh"], 414: ["New Delhi", "Delhi"], 415: ["Vijayawada", "Andhra Pradesh"], 416: ["Katra", "Jammu and Kashmir"],
  420: ["Naya Raipur", "Chhattisgarh"], 421: ["Hyderabad", "Telangana"], 422: ["Chandigarh", "Chandigarh"], 423: ["New Delhi", "Delhi"],
  424: ["Bhubaneswar", "Odisha"], 425: ["Kokrajhar", "Assam"], 426: ["Puducherry", "Puducherry"], 427: ["Malda", "West Bengal"],
  428: ["Kishangarh", "Rajasthan"], 430: ["Kundli", "Haryana"], 431: ["Thanjavur", "Tamil Nadu"], 432: ["Nirjuli", "Arunachal Pradesh"],
  433: ["Varanasi", "Uttar Pradesh"], 434: ["Bhilai", "Chhattisgarh"], 435: ["Bhubaneswar", "Odisha"], 436: ["Shillong", "Meghalaya"],
  437: [null, "Jammu and Kashmir"], 438: ["Sagar", "Madhya Pradesh"], 439: ["Mahendergarh", "Haryana"], 440: ["Deoghar", "Jharkhand"],
  441: ["Patna", "Bihar"], 442: ["Salem", "Tamil Nadu"], 443: ["Vadodara", "Gujarat"], 444: ["Ranchi", "Jharkhand"],
  445: ["Rupnagar", "Punjab"], 446: ["Patna", "Bihar"], 447: ["Ajmer", "Rajasthan"], 448: ["Gorakhpur", "Uttar Pradesh"],
  449: ["Fursatganj", "Uttar Pradesh"], 450: ["Awantipora", "Jammu and Kashmir"], 451: ["Indore", "Madhya Pradesh"], 452: ["Bhopal", "Madhya Pradesh"],
  453: ["Kalaburagi", "Karnataka"], 454: ["Agartala", "Tripura"], 455: ["Aizawl", "Mizoram"], 456: ["Imphal", "Manipur"],
  457: ["Kozhikode", "Kerala"], 458: ["Kohima", "Nagaland"], 459: ["Srinagar", "Jammu and Kashmir"], 460: ["Bathinda", "Punjab"],
};

// IIT Delhi's address covers its New Delhi and Abu Dhabi campuses; only the New Delhi part is kept.
const ADDRESS_FIXES = { 104: "Indian Institute of Technology Delhi, Hauz Khas, New Delhi-110 016" };

// The same institution under another list's code, checked by hand. AICTE records come first: where AICTE also
// approves the institute (or the school or campus of it that runs these programmes), the JoSAA row joins that
// record so the seats are not counted twice; the AICTE record already carries its own NIRF link where there is one.
// Otherwise the row joins the NIRF record for the same institution.
const LINKS = {
  // IITs and IISc
  101: ["nirf", "U-0355"], 102: ["nirf", "U-0306"], 103: ["nirf", "U-0184"], 104: ["nirf", "I-1074"], 105: ["nirf", "U-0273"],
  106: ["nirf", "U-0573"], 107: ["nirf", "U-0013"], 108: ["nirf", "U-0395"], 109: ["nirf", "I-1075"], 110: ["nirf", "U-0456"],
  111: ["nirf", "U-0139"], 112: ["nirf", "U-0064"], 113: ["nirf", "U-0560"], 114: ["nirf", "U-0205"], 115: ["nirf", "U-0378"],
  116: ["nirf", "U-0701"], 117: ["nirf", "U-0053"], 118: ["nirf", "U-0946"], 120: ["nirf", "U-0878"], 121: ["nirf", "U-0844"],
  122: ["nirf", "U-0906"], 123: ["nirf", "U-0899"], 124: ["nirf", "U-0220"],
  // NITs and IIEST
  201: ["nirf", "U-0374"], 202: ["nirf", "U-0410"], 203: ["nirf", "U-0284"], 204: ["nirf", "U-0530"], 206: ["nirf", "U-0263"],
  207: ["nirf", "U-0622"], 208: ["nirf", "U-0577"], 210: ["nirf", "U-0189"], 211: ["nirf", "U-0237"], 212: ["nirf", "U-0619"],
  214: ["nirf", "U-0072"], 215: ["nirf", "U-0621"], 216: ["nirf", "U-0092"], 219: ["nirf", "U-0207"], 220: ["nirf", "U-0172"],
  223: ["nirf", "U-0357"], 224: ["nirf", "U-0055"], 225: ["nirf", "U-0197"], 226: ["nirf", "U-0467"], 228: ["nirf", "U-0025"],
  229: ["nirf", "U-0149"], 230: ["nirf", "U-0334"], 232: ["nirf", "U-0584"],
  // IIITs
  301: ["nirf", "U-0267"],
  // Other GFTIs: AICTE records
  402: ["aicte", "1-15782701"], // Birla Institute of Technology, Ranchi (AICTE record carries NIRF U-0202)
  403: ["aicte", "1-23741731"], // Gurukula Kangri Vishwavidyalaya Haridwar
  404: ["aicte", "1-462578871"], // Indian Institute of Carpet Technology (Sant Ravidas Nagar, i.e. Bhadohi)
  406: ["aicte", "1-20043220"], // School of Studies of Engineering and Technology, Guru Ghasidas Vishwavidyalaya
  408: ["aicte", "1-421286153"], // NIELIT Aurangabad
  409: ["aicte", "1-3359504004"], // National Institute of Advanced Manufacturing Technology, Ranchi
  410: ["aicte", "1-515991181"], // SLIET (AICTE record carries NIRF U-0384)
  412: ["aicte", "1-786387751"], // Tezpur University, whose B.Tech seats AICTE approves (carries NIRF U-0056)
  416: ["aicte", "1-40782250"], // Shri Mata Vaishno Devi University (carries NIRF U-0201)
  420: ["aicte", "1-7487752281"], // Dr. Shyama Prasad Mukherjee IIIT, Naya Raipur
  421: ["aicte", "1-1313769821"], // University of Hyderabad (carries NIRF U-0042)
  422: ["aicte", "1-2519066781"], // Punjab Engineering College
  423: ["aicte", "1-9440312900"], // Jawaharlal Nehru University, the AICTE record with its B.Tech seats (carries NIRF U-0109)
  424: ["aicte", "1-31041611"], // IIIT Bhubaneswar
  425: ["aicte", "1-4629663461"], // Central Institute of Technology Kokrajhar
  426: ["aicte", "1-7842176"], // Puducherry Technological University
  427: ["aicte", "1-808250151"], // Ghani Khan Choudhury Institute of Engineering and Technology
  428: ["aicte", "1-419599491"], // Central University of Rajasthan (carries NIRF U-0392)
  431: ["aicte", "1-2197135511"], // NIFTEM Thanjavur (carries NIRF C-45375)
  432: ["aicte", "1-514072491"], // NERIST
  433: ["aicte", "1-581901631"], // Indian Institute of Handloom Technology, Varanasi
  434: ["aicte", "1-43364768257"], // University Teaching Department, CSVTU Bhilai
  435: ["aicte", "1-3751674141"], // Institute of Chemical Technology Mumbai IOC Odisha off campus
  436: ["aicte", "1-3358485801"], // "School of Technology", Central University, East Khasi Hills: NEHU's, same four branches
  438: ["aicte", "1-11337053201"], // Dr. Harisingh Gour Vishwavidyalaya Sagar, the AICTE record with the same B.Tech branches
  439: ["aicte", "1-7468045221"], // Central University of Haryana
  440: ["aicte", "1-2184583431"], // BIT Mesra off campus Deoghar
  441: ["aicte", "1-786232601"], // BIT Patna
  442: ["aicte", "1-2501353871"], // Indian Institute of Handloom Technology, Salem (the B.Tech record)
  445: ["aicte", "1-43863071505"], // NIELIT Deemed to be University, Rupnagar
  446: ["aicte", "1-44079805523"], // NIELIT Patna
  447: ["aicte", "1-11528176391"], // NIELIT Ajmer
  448: ["aicte", "1-27916062"], // NIELIT Gorakhpur
  450: ["aicte", "1-465756641"], // Islamic University of Science and Technology (the B.Tech record)
  451: ["aicte", "1-10540411"], // Shri G.S. Institute of Technology and Science, Indore
  452: ["aicte", "1-445643061"], // NITTTR Bhopal
  453: ["aicte", "1-43710627998"], // Central University of Karnataka
  454: ["aicte", "1-3405873631"], // NIELIT Agartala (the B.Tech record)
  455: ["aicte", "1-648003051"], // NIELIT Aizawl
  456: ["aicte", "1-2863798081"], // NIELIT Imphal
  457: ["aicte", "1-8247181"], // NIELIT Calicut
  459: ["aicte", "1-498139141"], // NIELIT Srinagar/Jammu
  460: ["aicte", "1-1590439441"], // Department of Computer Science and Technology, Central University of Punjab (AICTE's B.Tech record)
  // Other GFTIs: NIRF records (no AICTE record)
  401: ["nirf", "U-0050"], 411: ["nirf", "U-0345"], 413: ["nirf", "U-0626"], 414: ["nirf", "U-0116"], 415: ["nirf", "U-0627"],
  430: ["nirf", "S-8898"],
};

// JoSAA's degree, the last "(N Years, ...)" group of a program name, mapped to a course in data/reference.ts.
// 5-year dual and integrated programmes that award a B.Tech or an M.Tech go under btech (reference.ts has no
// integrated engineering course); science, design and BS programmes have no course here and are left out.
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
// Degrees whose suffix is dropped from the branch name (the course says it); other degrees keep it, so a
// 5-year dual degree reads apart from the 4-year B.Tech in the same subject.
const PLAIN = new Set(["4 Years, Bachelor of Technology", "5 Years, Bachelor of Architecture", "4 Years, Bachelor of Planning"]);

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/councils/josaa-convert.mjs <raw dir>");
  process.exit(1);
}
const lines = (f) =>
  readFileSync(path.join(dir, f), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"));
const table = (f) => new Map(lines(f).map((l) => { const [k, ...v] = l.split("¦"); return [k.trim(), v.map((x) => x.trim())]; }));

const institutes = table("institutes.txt");
const programs = new Map([...table("programs.txt")].map(([k, v]) => [Number(k), v[0]]));
const quotas = new Map([...table("quotas.txt")].map(([k, v]) => [Number(k), v[0]]));
const oddRows = [];
const records = lines("seats.txt")
  .flatMap((l) => l.split(";"))
  .filter((r) => r.trim())
  .map((r) => {
    const [inst, prog, quota, neutral, female, supernumerary] = r.split(",").map((x) => Number(x.trim()));
    if (!institutes.has(String(inst)) || !programs.has(prog) || !quotas.has(quota)) throw new Error(`Unknown code in record ${r}`);
    // JoSAA prints this as it stands (e.g. NIT Srinagar's Ladakh quota: female-only 1 "including 2" supernumerary); kept, only reported.
    if (female < supernumerary) oddRows.push(r.trim());
    return { inst: String(inst), prog, quota, seats: neutral + female };
  });
const grand = records.reduce((a, r) => a + r.seats, 0);
if (grand !== GRAND_TOTAL) throw new Error(`Records add up to ${grand}, the seat matrix says ${GRAND_TOTAL}`);

const degreeOf = (name) => {
  const i = name.search(/\(\d+ Years?, (?!.*\(\d+ Years?, )/);
  if (i < 0) throw new Error(`No degree in program name: ${name}`);
  return { subject: name.slice(0, i).trim(), degree: name.slice(i + 1, -1) };
};
const tidy = (s) => s.replace(/\s+/g, " ").replace(/\s+([,.)])/g, "$1").replace(/\(\s+/g, "(").trim();

// Seats per institute, course and program, all quotas together.
const byInst = new Map();
const left = { degree: new Map(), abroad: 0 };
for (const r of records) {
  const name = programs.get(r.prog);
  const { subject, degree } = degreeOf(name);
  if (!(degree in DEGREES)) throw new Error(`Degree not mapped: ${degree}`);
  const course = DEGREES[degree];
  if (!course) {
    left.degree.set(degree, (left.degree.get(degree) ?? 0) + r.seats);
    continue;
  }
  // IIT Delhi's Abu Dhabi campus programmes are taught outside India.
  if (/^Abu Dhabi Campus/.test(subject)) {
    left.abroad += r.seats;
    continue;
  }
  const branch = tidy(PLAIN.has(degree) ? subject : `${subject} (${degree})`);
  if (!byInst.has(r.inst)) byInst.set(r.inst, new Map());
  const courses = byInst.get(r.inst);
  if (!courses.has(course)) courses.set(course, new Map());
  const branches = courses.get(course);
  const key = `${r.prog}`;
  const cur = branches.get(key) ?? { name: branch, seats: 0 };
  cur.seats += r.seats;
  branches.set(key, cur);
}

const pinOf = (address) => {
  const all = [...address.matchAll(/(?<!\d)([1-8]\d{2})\s?(\d{3})(?!\d)/g)].map((m) => m[1] + m[2]);
  return all.length ? all[all.length - 1] : null;
};

const rows = [];
const noCourses = [];
for (const [code, [name, rawAddress]] of institutes) {
  const type = TYPES[code[0]];
  const place = PLACES[code];
  if (!place) throw new Error(`No place for institute ${code}`);
  const courses = byInst.get(code);
  if (!courses) {
    noCourses.push(`${code} ${name}`);
    continue;
  }
  const offerings = ["btech", "barch", "bplan"]
    .filter((c) => courses.has(c))
    .map((c) => {
      const branches = [...courses.get(c).values()].filter((b) => b.seats > 0);
      // Two JoSAA programs that tidy to the same branch name stay apart in the seat matrix; keep them apart here too.
      const names = new Set();
      for (const b of branches) {
        if (names.has(b.name)) throw new Error(`Duplicate branch name at ${code}: ${b.name}`);
        names.add(b.name);
      }
      branches.sort((a, b) => a.name.localeCompare(b.name));
      return { course: c, seats: branches.reduce((a, b) => a + b.seats, 0), branches };
    })
    .filter((o) => o.seats > 0);
  if (!offerings.length) {
    noCourses.push(`${code} ${name}`);
    continue;
  }
  const address = tidy(ADDRESS_FIXES[code] ?? rawAddress);
  const row = {
    code,
    name: tidy(name),
    address,
    district: null,
    city: place[0],
    pin: pinOf(address),
    state: place[1],
    management: type,
    ownership: OWNERSHIP[type],
    offerings,
  };
  if (LINKS[code]) row.same_as = { scheme: LINKS[code][0], value: LINKS[code][1] };
  rows.push(row);
}
rows.sort((a, b) => Number(a.code) - Number(b.code));

const file = {
  council: "JoSAA",
  scheme: "josaa",
  stream: null,
  academic_year: ACADEMIC_YEAR,
  sources: [
    {
      publisher: "Joint Seat Allocation Authority (JoSAA)",
      title: "JoSAA 2026 seat matrix (IITs, IISc, NITs, IIEST, IIITs and other GFTIs) and institute addresses",
      url: "https://josaa.admissions.nic.in/applicant/seatmatrix/seatmatrixinfo.aspx",
      retrieved: RETRIEVED,
      prefix: "",
    },
  ],
  note:
    "Every institute in the JoSAA 2026 seat matrix (academic year 2026-27) with B.Tech, B.Arch or B.Plan seats: IITs and IISc, NITs and IIEST Shibpur, IIITs and other government funded technical institutes (GFTIs). " +
    "code is JoSAA's institute code and management is JoSAA's institute type (IIT, NIT, IIIT, GFTI). " +
    "A program's seats add up every category (OPEN, GEN-EWS, OBC-NCL, SC, ST and their PwD seats), both seat pools (Gender-Neutral and Female-only, the female-only seats including the female supernumerary seats) and, at NITs and some GFTIs, both the home state and other state quotas; " +
    "each program is a branch and the course total is the sum of its branches. " +
    "5-year dual degree (B.Tech + M.Tech, B.Tech + MBA) and integrated M.Tech programmes are kept under btech, because there is no integrated engineering course; their branch names keep JoSAA's degree, e.g. '(5 Years, Bachelor and Master of Technology (Dual Degree))'. " +
    "Left out: BS, B.Sc + M.Sc, integrated M.Sc and B.Des programmes (no course for them) and IIT Delhi's Abu Dhabi campus programmes. " +
    "city is the town in JoSAA's institute address, or the town in its JoSAA name where the address gives only a village or post office; pin is the PIN in the address. " +
    "ownership is central for IITs, IISc, NITs and IIEST and left empty for IIITs and other GFTIs, whose ownership JoSAA does not print. " +
    "same_as joins an institute to the AICTE record for the same institution (or the school or campus of it that runs these programmes) where AICTE also lists it, so its seats are not counted twice, and otherwise to its NIRF record (checked by hand).",
  rows,
};
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const out = path.join(root, "data", "councils", "josaa.json");
writeFileSync(out, JSON.stringify(file, null, 1) + "\n");

const offeringsOf = (c) => rows.flatMap((r) => r.offerings).filter((o) => o.course === c);
const total = (c) => offeringsOf(c).reduce((a, o) => a + o.seats, 0);
console.log(`${institutes.size} institutes and ${records.length} seat-matrix records read (${grand} seats); ${rows.length} institutes written to ${out}`);
for (const t of Object.values(TYPES)) {
  const rs = rows.filter((r) => r.management === t);
  const seats = rs.flatMap((r) => r.offerings).reduce((a, o) => a + o.seats, 0);
  console.log(`  ${t}: ${rs.length} institutes, ${seats} seats`);
}
for (const c of ["btech", "barch", "bplan"]) console.log(`${c}: ${offeringsOf(c).length} institutes, ${total(c)} seats`);
console.log(`Left out: ${left.abroad} seats at IIT Delhi Abu Dhabi; by degree: ${[...left.degree].map(([d, n]) => `${d} ${n}`).join("; ")}`);
console.log(`Links: ${rows.filter((r) => r.same_as?.scheme === "aicte").length} AICTE, ${rows.filter((r) => r.same_as?.scheme === "nirf").length} NIRF, ${rows.filter((r) => !r.same_as).length} none`);
const unused = Object.keys(LINKS).filter((c) => !rows.some((r) => r.code === c));
if (unused.length) console.log(`Links with no institute written: ${unused.join(", ")}`);
if (oddRows.length) console.log(`Female-only total below its supernumerary count, as printed: ${oddRows.join("; ")}`);
if (noCourses.length) console.log(`No B.Tech, B.Arch or B.Plan seats:\n  ${noCourses.join("\n  ")}`);
