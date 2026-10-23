/*
 * Reference data: states, streams, courses and exams.
 * Course durations are filled only where the regulator fixes them; anything
 * uncertain stays null and shows as "Not recorded" on the site.
 */

export const STATES: { code: string; name: string; ut?: boolean }[] = [
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
  { code: "AN", name: "Andaman and Nicobar Islands", ut: true },
  { code: "CH", name: "Chandigarh", ut: true },
  { code: "DH", name: "Dadra and Nagar Haveli and Daman and Diu", ut: true },
  { code: "DL", name: "Delhi", ut: true },
  { code: "JK", name: "Jammu and Kashmir", ut: true },
  { code: "LA", name: "Ladakh", ut: true },
  { code: "LD", name: "Lakshadweep", ut: true },
  { code: "PY", name: "Puducherry", ut: true },
];

/** Spellings used by NIRF, AISHE and councils, mapped to our state codes. */
export const STATE_ALIASES: Record<string, string> = {
  "orissa": "OR",
  "pondicherry": "PY",
  "uttaranchal": "UK",
  "nct of delhi": "DL",
  "new delhi": "DL",
  "jammu & kashmir": "JK",
  "andaman & nicobar islands": "AN",
  "dadra & nagar haveli": "DH",
  "daman & diu": "DH",
  "dadra and nagar haveli": "DH",
  "daman and diu": "DH",
  "telengana": "TG",
  "chattisgarh": "CT",
  "tamilnadu": "TN",
};

export type StreamSeed = { slug: string; name: string; summary: string; courses: CourseSeed[] };
export type CourseSeed = {
  slug: string;
  name: string;
  short: string;
  level: "ug" | "pg" | "diploma" | "doctorate" | "certificate" | "integrated";
  duration: string | null;
};

export const STREAMS: StreamSeed[] = [
  {
    slug: "medical",
    name: "Medical",
    summary: "MBBS and postgraduate medicine",
    courses: [
      { slug: "mbbs", name: "Bachelor of Medicine and Bachelor of Surgery", short: "MBBS", level: "ug", duration: "5.5 years including 1 year internship" },
      { slug: "md-ms", name: "Doctor of Medicine / Master of Surgery", short: "MD / MS", level: "pg", duration: "3 years" },
    ],
  },
  {
    slug: "dental",
    name: "Dental",
    summary: "BDS and MDS",
    courses: [
      { slug: "bds", name: "Bachelor of Dental Surgery", short: "BDS", level: "ug", duration: "5 years including 1 year internship" },
      { slug: "mds", name: "Master of Dental Surgery", short: "MDS", level: "pg", duration: "3 years" },
    ],
  },
  {
    slug: "nursing",
    name: "Nursing",
    summary: "B.Sc, M.Sc and post basic nursing",
    courses: [
      { slug: "bsc-nursing", name: "Bachelor of Science in Nursing", short: "B.Sc Nursing", level: "ug", duration: "4 years" },
      { slug: "post-basic-bsc-nursing", name: "Post Basic B.Sc Nursing", short: "P.B. B.Sc Nursing", level: "ug", duration: "2 years" },
      { slug: "msc-nursing", name: "Master of Science in Nursing", short: "M.Sc Nursing", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "ayush",
    name: "AYUSH",
    summary: "Ayurveda, Homoeopathy, Unani, Siddha, Naturopathy",
    courses: [
      { slug: "bams", name: "Bachelor of Ayurvedic Medicine and Surgery", short: "BAMS", level: "ug", duration: "5.5 years including 1 year internship" },
      { slug: "bhms", name: "Bachelor of Homoeopathic Medicine and Surgery", short: "BHMS", level: "ug", duration: "5.5 years including 1 year internship" },
      { slug: "bums", name: "Bachelor of Unani Medicine and Surgery", short: "BUMS", level: "ug", duration: "5.5 years including 1 year internship" },
      { slug: "bsms", name: "Bachelor of Siddha Medicine and Surgery", short: "BSMS", level: "ug", duration: "5.5 years including 1 year internship" },
      { slug: "bnys", name: "Bachelor of Naturopathy and Yogic Sciences", short: "BNYS", level: "ug", duration: "5.5 years including 1 year internship" },
    ],
  },
  {
    slug: "veterinary",
    name: "Veterinary",
    summary: "Veterinary science and animal husbandry",
    courses: [
      { slug: "bvsc-ah", name: "Bachelor of Veterinary Science and Animal Husbandry", short: "BVSc & AH", level: "ug", duration: "5.5 years including 6 months internship" },
      { slug: "mvsc", name: "Master of Veterinary Science", short: "MVSc", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "pharmacy",
    name: "Pharmacy",
    summary: "D.Pharm, B.Pharm, Pharm.D, M.Pharm",
    courses: [
      { slug: "b-pharm", name: "Bachelor of Pharmacy", short: "B.Pharm", level: "ug", duration: "4 years" },
      { slug: "d-pharm", name: "Diploma in Pharmacy", short: "D.Pharm", level: "diploma", duration: "2 years" },
      { slug: "pharm-d", name: "Doctor of Pharmacy", short: "Pharm.D", level: "integrated", duration: "6 years" },
      { slug: "m-pharm", name: "Master of Pharmacy", short: "M.Pharm", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "allied-health",
    name: "Allied Health",
    summary: "Physiotherapy, lab technology, radiology and more",
    courses: [
      { slug: "bpt", name: "Bachelor of Physiotherapy", short: "BPT", level: "ug", duration: null },
      { slug: "bsc-mlt", name: "B.Sc Medical Laboratory Technology", short: "B.Sc MLT", level: "ug", duration: null },
      { slug: "bsc-radiology", name: "B.Sc Radiology and Imaging Technology", short: "B.Sc Radiology", level: "ug", duration: null },
      { slug: "bot", name: "Bachelor of Occupational Therapy", short: "BOT", level: "ug", duration: null },
    ],
  },
  {
    slug: "engineering",
    name: "Engineering",
    summary: "B.Tech, M.Tech and polytechnic diplomas",
    courses: [
      { slug: "btech", name: "Bachelor of Technology / Bachelor of Engineering", short: "B.Tech / BE", level: "ug", duration: "4 years" },
      { slug: "mtech", name: "Master of Technology / Master of Engineering", short: "M.Tech / ME", level: "pg", duration: "2 years" },
      { slug: "diploma-engineering", name: "Diploma in Engineering", short: "Polytechnic diploma", level: "diploma", duration: "3 years" },
    ],
  },
  {
    slug: "management",
    name: "Management",
    summary: "MBA, PGDM and BBA",
    courses: [
      { slug: "mba", name: "Master of Business Administration", short: "MBA", level: "pg", duration: "2 years" },
      { slug: "pgdm", name: "Post Graduate Diploma in Management", short: "PGDM", level: "pg", duration: "2 years" },
      { slug: "bba", name: "Bachelor of Business Administration", short: "BBA", level: "ug", duration: "3 to 4 years" },
    ],
  },
  {
    slug: "law",
    name: "Law",
    summary: "Integrated and 3 year LLB, LLM",
    courses: [
      { slug: "ba-llb", name: "Integrated BA LLB", short: "BA LLB", level: "integrated", duration: "5 years" },
      { slug: "llb", name: "Bachelor of Laws", short: "LLB", level: "ug", duration: "3 years" },
      { slug: "llm", name: "Master of Laws", short: "LLM", level: "pg", duration: "1 to 2 years" },
    ],
  },
  {
    slug: "architecture",
    name: "Architecture",
    summary: "B.Arch and planning",
    courses: [
      { slug: "barch", name: "Bachelor of Architecture", short: "B.Arch", level: "ug", duration: "5 years" },
      { slug: "march", name: "Master of Architecture", short: "M.Arch", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "agriculture",
    name: "Agriculture",
    summary: "Agriculture, horticulture, forestry, fisheries",
    courses: [
      { slug: "bsc-agriculture", name: "B.Sc (Hons) Agriculture", short: "B.Sc Agriculture", level: "ug", duration: "4 years" },
    ],
  },
  {
    slug: "science",
    name: "Science",
    summary: "B.Sc and M.Sc",
    courses: [
      { slug: "bsc", name: "Bachelor of Science", short: "B.Sc", level: "ug", duration: "3 to 4 years" },
      { slug: "msc", name: "Master of Science", short: "M.Sc", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "commerce",
    name: "Commerce",
    summary: "B.Com and M.Com",
    courses: [
      { slug: "bcom", name: "Bachelor of Commerce", short: "B.Com", level: "ug", duration: "3 to 4 years" },
      { slug: "mcom", name: "Master of Commerce", short: "M.Com", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "arts",
    name: "Arts and Humanities",
    summary: "BA and MA",
    courses: [
      { slug: "ba", name: "Bachelor of Arts", short: "BA", level: "ug", duration: "3 to 4 years" },
      { slug: "ma", name: "Master of Arts", short: "MA", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "computer-applications",
    name: "Computer Applications",
    summary: "BCA and MCA",
    courses: [
      { slug: "bca", name: "Bachelor of Computer Applications", short: "BCA", level: "ug", duration: "3 to 4 years" },
      { slug: "mca", name: "Master of Computer Applications", short: "MCA", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "design",
    name: "Design",
    summary: "B.Des and M.Des",
    courses: [
      { slug: "bdes", name: "Bachelor of Design", short: "B.Des", level: "ug", duration: "4 years" },
      { slug: "mdes", name: "Master of Design", short: "M.Des", level: "pg", duration: "2 years" },
    ],
  },
  {
    slug: "education",
    name: "Education",
    summary: "B.Ed and teacher education",
    courses: [{ slug: "bed", name: "Bachelor of Education", short: "B.Ed", level: "ug", duration: "2 years" }],
  },
  {
    slug: "hotel-management",
    name: "Hotel Management",
    summary: "Hospitality and hotel administration",
    courses: [
      { slug: "bsc-hha", name: "B.Sc Hospitality and Hotel Administration", short: "B.Sc HHA", level: "ug", duration: "3 years" },
    ],
  },
  {
    slug: "mass-communication",
    name: "Mass Communication",
    summary: "Journalism and media",
    courses: [
      { slug: "bjmc", name: "Bachelor of Journalism and Mass Communication", short: "BJMC", level: "ug", duration: null },
    ],
  },
];

export type ExamSeed = {
  slug: string;
  short: string;
  name: string;
  body: string;
  level: "National" | "State" | "University";
  url: string | null;
  streams: string[];
};

export const EXAMS: ExamSeed[] = [
  { slug: "neet-ug", short: "NEET UG", name: "National Eligibility cum Entrance Test (UG)", body: "National Testing Agency", level: "National", url: "https://neet.nta.nic.in", streams: ["medical", "dental", "ayush", "veterinary", "nursing"] },
  { slug: "neet-pg", short: "NEET PG", name: "National Eligibility cum Entrance Test (PG)", body: "National Board of Examinations in Medical Sciences", level: "National", url: "https://natboard.edu.in", streams: ["medical"] },
  { slug: "neet-mds", short: "NEET MDS", name: "National Eligibility cum Entrance Test (MDS)", body: "National Board of Examinations in Medical Sciences", level: "National", url: "https://natboard.edu.in", streams: ["dental"] },
  { slug: "jee-main", short: "JEE Main", name: "Joint Entrance Examination (Main)", body: "National Testing Agency", level: "National", url: "https://jeemain.nta.nic.in", streams: ["engineering", "architecture"] },
  { slug: "jee-advanced", short: "JEE Advanced", name: "Joint Entrance Examination (Advanced)", body: "Indian Institutes of Technology", level: "National", url: "https://jeeadv.ac.in", streams: ["engineering", "architecture"] },
  { slug: "gate", short: "GATE", name: "Graduate Aptitude Test in Engineering", body: "IISc Bangalore and IITs (organising institute rotates)", level: "National", url: null, streams: ["engineering"] },
  { slug: "keam", short: "KEAM", name: "Kerala Engineering Architecture Medical", body: "Commissioner for Entrance Examinations, Kerala", level: "State", url: "https://cee.kerala.gov.in", streams: ["engineering", "medical", "dental", "ayush", "agriculture", "veterinary", "pharmacy", "architecture"] },
  { slug: "kcet", short: "KCET", name: "Karnataka Common Entrance Test", body: "Karnataka Examinations Authority", level: "State", url: "https://cetonline.karnataka.gov.in/kea/", streams: ["engineering", "agriculture", "pharmacy", "veterinary"] },
  { slug: "cuet-ug", short: "CUET UG", name: "Common University Entrance Test (UG)", body: "National Testing Agency", level: "National", url: "https://cuet.nta.nic.in", streams: ["science", "commerce", "arts", "management", "computer-applications"] },
  { slug: "cat", short: "CAT", name: "Common Admission Test", body: "Indian Institutes of Management", level: "National", url: "https://iimcat.ac.in", streams: ["management"] },
  { slug: "clat", short: "CLAT", name: "Common Law Admission Test", body: "Consortium of National Law Universities", level: "National", url: "https://consortiumofnlus.ac.in", streams: ["law"] },
  { slug: "nata", short: "NATA", name: "National Aptitude Test in Architecture", body: "Council of Architecture", level: "National", url: "https://www.nata.in", streams: ["architecture"] },
  { slug: "uceed", short: "UCEED", name: "Undergraduate Common Entrance Examination for Design", body: "IIT Bombay", level: "National", url: "https://www.uceed.iitb.ac.in", streams: ["design"] },
  { slug: "nchm-jee", short: "NCHM JEE", name: "National Council for Hotel Management Joint Entrance Examination", body: "National Testing Agency", level: "National", url: null, streams: ["hotel-management"] },
  { slug: "gpat", short: "GPAT", name: "Graduate Pharmacy Aptitude Test", body: "National Board of Examinations in Medical Sciences", level: "National", url: "https://natboard.edu.in", streams: ["pharmacy"] },
];

/** NIRF ranking categories mapped to our streams (null = cross-stream list). */
export const NIRF_CATEGORY_STREAM: Record<string, string | null> = {
  Overall: null,
  University: null,
  Universities: null,
  College: null,
  Colleges: null,
  Research: null,
  "Research Institutions": null,
  Innovation: null,
  "Open University": null,
  "Skill University": null,
  "State Public University": null,
  "State Public Universities": null,
  "Sustainable Development Goals": null,
  SDG: null,
  Engineering: "engineering",
  Management: "management",
  Pharmacy: "pharmacy",
  Medical: "medical",
  Dental: "dental",
  Law: "law",
  Architecture: "architecture",
  "Architecture and Planning": "architecture",
  Agriculture: "agriculture",
  "Agriculture and Allied Sectors": "agriculture",
};

export const CONTACT = {
  phone: "+91 95269 23555",
  phoneHref: "tel:+919526923555",
  whatsappHref: "https://wa.me/919645838555",
  email: "info@study2india.com",
  branches: [
    { name: "Thiruvalla (head office)", phone: "+91 96458 38555" },
    { name: "Thodupuzha", phone: "+91 95269 23555" },
    { name: "Kottayam", phone: "+91 97458 28555" },
    { name: "Thrissur", phone: "+91 99471 74555" },
    { name: "Kattappana", phone: "+91 70258 48586" },
    { name: "Kochi", phone: "+91 95269 89555" },
    { name: "Kollam", phone: "+91 99475 89555" },
    { name: "Kannur", phone: "+91 99471 74555" },
  ],
};
