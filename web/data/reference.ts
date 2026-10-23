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
      { slug: "dm-mch", name: "Doctorate of Medicine / Master of Chirurgiae (super speciality)", short: "DM / M.Ch", level: "pg", duration: null },
      { slug: "pg-diploma-medical", name: "Postgraduate Diploma in a clinical or para-clinical subject", short: "PG Diploma (Medical)", level: "diploma", duration: null },
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
    summary: "ANM, GNM, B.Sc, M.Sc, post basic and nurse practitioner programmes",
    courses: [
      { slug: "anm", name: "Auxiliary Nurse Midwifery", short: "ANM", level: "diploma", duration: "2 years" },
      { slug: "gnm", name: "General Nursing and Midwifery", short: "GNM", level: "diploma", duration: "3 years" },
      { slug: "bsc-nursing", name: "Bachelor of Science in Nursing", short: "B.Sc Nursing", level: "ug", duration: "4 years" },
      { slug: "post-basic-bsc-nursing", name: "Post Basic B.Sc Nursing", short: "P.B. B.Sc Nursing", level: "ug", duration: "2 years" },
      { slug: "msc-nursing", name: "Master of Science in Nursing", short: "M.Sc Nursing", level: "pg", duration: "2 years" },
      { slug: "post-basic-diploma-nursing", name: "Post Basic Diploma in a nursing speciality", short: "Post Basic Diploma (Nursing)", level: "diploma", duration: null },
      { slug: "nurse-practitioner", name: "Nurse Practitioner programmes (critical care, midwifery and others)", short: "Nurse Practitioner", level: "diploma", duration: null },
      { slug: "phd-nursing", name: "Doctor of Philosophy in Nursing", short: "PhD Nursing", level: "doctorate", duration: null },
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
      { slug: "ayush-pg", name: "MD / MS in Ayurveda, Unani or Siddha", short: "MD / MS (AYUSH)", level: "pg", duration: "3 years" },
      { slug: "md-homoeopathy", name: "Doctor of Medicine in Homoeopathy", short: "MD (Hom.)", level: "pg", duration: "3 years" },
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
      { slug: "bplan", name: "Bachelor of Planning", short: "B.Plan", level: "ug", duration: "4 years" },
      { slug: "mplan", name: "Master of Planning", short: "M.Plan", level: "pg", duration: "2 years" },
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
      { slug: "bfa", name: "Bachelor of Fine Arts", short: "BFA", level: "ug", duration: null },
      { slug: "mfa", name: "Master of Fine Arts", short: "MFA", level: "pg", duration: "2 years" },
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
      { slug: "bhmct", name: "Bachelor of Hotel Management and Catering Technology", short: "BHMCT", level: "ug", duration: "4 years" },
      { slug: "diploma-hotel-management", name: "Diploma in Hotel Management and Catering Technology", short: "Diploma (Hotel Mgmt)", level: "diploma", duration: null },
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

/** The field an exam is listed under on /exams. */
export type ExamField = "medical" | "engineering" | "management" | "law" | "design" | "science" | "general";

export const EXAM_FIELDS: { key: ExamField; label: string }[] = [
  { key: "engineering", label: "Engineering and technology" },
  { key: "medical", label: "Medical, dental, nursing and pharmacy" },
  { key: "management", label: "Management" },
  { key: "law", label: "Law" },
  { key: "design", label: "Design and architecture" },
  { key: "science", label: "Science, agriculture and teaching" },
  { key: "general", label: "University, hospitality and multi-field exams" },
];

export type ExamSeed = {
  slug: string;
  short: string;
  name: string;
  body: string;
  /** National: open across India. State: for one state's colleges. University: one university or institute's own admissions. */
  level: "National" | "State" | "University";
  url: string | null;
  streams: string[];
  /** Courses the exam admits to, where that is narrower than its fields. An empty list means none of our courses. */
  courses?: string[];
  field: ExamField;
  /** State codes whose colleges admit through this exam; set for every state-level exam. */
  states?: string[];
  /** Admission by counselling on qualifying marks, with no entrance test of its own. */
  counsellingOnly?: boolean;
  /** For an exam that only some institutions use: the names those institutions go by. */
  institutions?: RegExp;
};

export const EXAMS: ExamSeed[] = [
  { slug: "neet-ug", short: "NEET UG", name: "National Eligibility cum Entrance Test (UG)", body: "National Testing Agency", level: "National", url: "https://neet.nta.nic.in", streams: ["medical", "dental", "ayush", "veterinary", "nursing"], courses: ["mbbs", "bds", "bams", "bhms", "bums", "bsms", "bnys", "bvsc-ah"], field: "medical" },
  { slug: "neet-pg", short: "NEET PG", name: "National Eligibility cum Entrance Test (PG)", body: "National Board of Examinations in Medical Sciences", level: "National", url: "https://natboard.edu.in", streams: ["medical"], courses: ["md-ms", "pg-diploma-medical"], field: "medical" },
  { slug: "neet-mds", short: "NEET MDS", name: "National Eligibility cum Entrance Test (MDS)", body: "National Board of Examinations in Medical Sciences", level: "National", url: "https://natboard.edu.in", streams: ["dental"], courses: ["mds"], field: "medical" },
  { slug: "jee-main", short: "JEE Main", name: "Joint Entrance Examination (Main): Paper 1 for B.E./B.Tech, Paper 2 for B.Arch and B.Planning", body: "National Testing Agency", level: "National", url: "https://jeemain.nta.nic.in", streams: ["engineering", "architecture"], courses: ["btech", "barch", "bplan"], field: "engineering" },
  { slug: "jee-advanced", short: "JEE Advanced", name: "Joint Entrance Examination (Advanced)", body: "Indian Institutes of Technology", level: "National", url: "https://jeeadv.ac.in", streams: ["engineering", "architecture"], courses: ["btech"], field: "engineering" },
  { slug: "gate", short: "GATE", name: "Graduate Aptitude Test in Engineering", body: "IISc Bangalore and IITs (organising institute rotates)", level: "National", url: null, streams: ["engineering"], courses: ["mtech"], field: "engineering" },
  { slug: "keam", short: "KEAM", name: "Kerala Engineering Architecture Medical", body: "Commissioner for Entrance Examinations, Kerala", level: "State", url: "https://cee.kerala.gov.in", streams: ["engineering", "medical", "dental", "ayush", "agriculture", "veterinary", "pharmacy", "architecture"], courses: ["btech", "barch", "b-pharm"], field: "engineering", states: ["KL"] },
  { slug: "kcet", short: "KCET", name: "Karnataka Common Entrance Test", body: "Karnataka Examinations Authority", level: "State", url: "https://cetonline.karnataka.gov.in/kea/", streams: ["engineering", "agriculture", "pharmacy", "veterinary"], courses: ["btech", "b-pharm", "bsc-agriculture"], field: "engineering", states: ["KA"] },
  { slug: "cuet-ug", short: "CUET UG", name: "Common University Entrance Test (UG)", body: "National Testing Agency", level: "National", url: "https://cuet.nta.nic.in", streams: ["science", "commerce", "arts", "management", "computer-applications"], courses: ["bsc", "bcom", "ba", "bba", "bca"], field: "general" },
  { slug: "cat", short: "CAT", name: "Common Admission Test", body: "Indian Institutes of Management", level: "National", url: "https://iimcat.ac.in", streams: ["management"], courses: ["mba", "pgdm"], field: "management" },
  { slug: "clat", short: "CLAT", name: "Common Law Admission Test", body: "Consortium of National Law Universities", level: "National", url: "https://consortiumofnlus.ac.in", streams: ["law"], courses: ["ba-llb", "llm"], field: "law" },
  { slug: "nata", short: "NATA", name: "National Aptitude Test in Architecture", body: "Council of Architecture", level: "National", url: "https://www.nata.in", streams: ["architecture"], courses: ["barch"], field: "design" },
  { slug: "uceed", short: "UCEED", name: "Undergraduate Common Entrance Examination for Design", body: "IIT Bombay", level: "National", url: "https://www.uceed.iitb.ac.in", streams: ["design"], courses: ["bdes"], field: "design" },
  { slug: "nchm-jee", short: "NCHM JEE", name: "National Council for Hotel Management Joint Entrance Examination", body: "National Testing Agency", level: "National", url: null, streams: ["hotel-management"], courses: ["bsc-hha"], field: "general" },
  { slug: "gpat", short: "GPAT", name: "Graduate Pharmacy Aptitude Test", body: "National Board of Examinations in Medical Sciences", level: "National", url: "https://natboard.edu.in", streams: ["pharmacy"], courses: ["m-pharm"], field: "medical" },

  // Engineering: state exams
  { slug: "mht-cet", short: "MHT CET", name: "Maharashtra Common Entrance Test (PCM and PCB groups)", body: "State Common Entrance Test Cell, Maharashtra", level: "State", url: "https://cetcell.mahacet.org", streams: ["engineering", "pharmacy", "agriculture"], courses: ["btech", "b-pharm", "bsc-agriculture"], field: "engineering", states: ["MH"] },
  { slug: "ap-eapcet", short: "AP EAPCET", name: "Andhra Pradesh Engineering, Agriculture and Pharmacy Common Entrance Test", body: "Andhra Pradesh State Council of Higher Education", level: "State", url: "https://cets.apsche.ap.gov.in/EAPCET", streams: ["engineering", "agriculture", "pharmacy"], courses: ["btech", "b-pharm", "bsc-agriculture"], field: "engineering", states: ["AP"] },
  { slug: "ts-eapcet", short: "TG EAPCET", name: "Telangana Engineering, Agriculture and Pharmacy Common Entrance Test (formerly TS EAMCET)", body: "JNTU Hyderabad for the Telangana Council of Higher Education", level: "State", url: "https://eapcet.tgche.ac.in", streams: ["engineering", "agriculture", "pharmacy"], courses: ["btech", "b-pharm", "bsc-agriculture"], field: "engineering", states: ["TG"] },
  { slug: "wbjee", short: "WBJEE", name: "West Bengal Joint Entrance Examination", body: "West Bengal Joint Entrance Examinations Board", level: "State", url: "https://wbjeeb.nic.in", streams: ["engineering", "pharmacy", "architecture"], courses: ["btech", "b-pharm", "barch"], field: "engineering", states: ["WB"] },
  { slug: "comedk-uget", short: "COMEDK UGET", name: "COMEDK Undergraduate Entrance Test for private engineering colleges in Karnataka", body: "Consortium of Medical, Engineering and Dental Colleges of Karnataka", level: "State", url: "https://www.comedk.org", streams: ["engineering"], courses: ["btech"], field: "engineering", states: ["KA"] },
  { slug: "tnea", short: "TNEA", name: "Tamil Nadu Engineering Admissions (counselling on Class 12 marks, no entrance test)", body: "Directorate of Technical Education, Tamil Nadu", level: "State", url: "https://www.tneaonline.org", streams: ["engineering", "architecture"], courses: ["btech", "barch"], field: "engineering", states: ["TN"], counsellingOnly: true },
  { slug: "gujcet", short: "GUJCET", name: "Gujarat Common Entrance Test", body: "Gujarat Secondary and Higher Secondary Education Board", level: "State", url: "https://www.gseb.org", streams: ["engineering", "pharmacy"], courses: ["btech", "b-pharm"], field: "engineering", states: ["GJ"] },
  // Engineering: university and institute exams
  { slug: "bitsat", short: "BITSAT", name: "BITS Admission Test", body: "Birla Institute of Technology and Science, Pilani", level: "University", url: "https://www.bitsadmission.com", streams: ["engineering", "pharmacy"], courses: ["btech", "b-pharm"], field: "engineering", institutions: /Birla Institute of Technology (and|&) Science/i },
  { slug: "viteee", short: "VITEEE", name: "VIT Engineering Entrance Examination", body: "Vellore Institute of Technology", level: "University", url: "https://viteee.vit.ac.in", streams: ["engineering"], courses: ["btech"], field: "engineering", institutions: /Vellore Institute of Technology/i },
  { slug: "srmjeee", short: "SRMJEEE", name: "SRM Joint Engineering Entrance Examination (UG)", body: "SRM Institute of Science and Technology", level: "University", url: "https://www.srmist.edu.in/srmjeee/", streams: ["engineering"], courses: ["btech"], field: "engineering", institutions: /SRM Institute of Science and Technology/i },
  { slug: "met", short: "MET", name: "Manipal Entrance Test", body: "Manipal Academy of Higher Education", level: "University", url: "https://www.manipal.edu/mu/admission/indian-students/online-entrance-exam-overview.html", streams: ["engineering"], courses: ["btech"], field: "engineering", institutions: /Manipal Academy of Higher Education|Manipal Institute of Technology/i },

  // Medical and nursing
  { slug: "ini-cet", short: "INI-CET", name: "Institutes of National Importance Combined Entrance Test (MD, MS, MDS, 6-year DM and M.Ch)", body: "All India Institute of Medical Sciences, New Delhi", level: "National", url: "https://www.aiimsexams.ac.in", streams: ["medical", "dental"], courses: ["md-ms", "mds", "dm-mch"], field: "medical", institutions: /All India Institute of Medical Sciences|\bAIIMS\b|Jawaharlal Institute of Post ?graduate|\bJIPMER\b|Post ?graduate Institute of Medical Education|\bPGIMER\b|National Institute of Mental Health|\bNIMHANS\b|Sree Chitra/i },
  { slug: "aiims-nursing", short: "AIIMS Nursing", name: "AIIMS Nursing Entrance Examinations (B.Sc (Hons) Nursing, Post Basic B.Sc Nursing, M.Sc Nursing)", body: "All India Institute of Medical Sciences, New Delhi", level: "National", url: "https://www.aiimsexams.ac.in", streams: ["nursing"], courses: ["bsc-nursing", "post-basic-bsc-nursing", "msc-nursing"], field: "medical", institutions: /All India Institute of Medical Sciences|\bAIIMS\b/i },

  // Management
  { slug: "xat", short: "XAT", name: "Xavier Aptitude Test", body: "XLRI Jamshedpur", level: "National", url: "https://xatonline.in", streams: ["management"], courses: ["mba", "pgdm"], field: "management" },
  { slug: "mat", short: "MAT", name: "Management Aptitude Test", body: "All India Management Association", level: "National", url: "https://mat.aima.in", streams: ["management"], courses: ["mba", "pgdm"], field: "management" },
  { slug: "cmat", short: "CMAT", name: "Common Management Admission Test", body: "National Testing Agency", level: "National", url: "https://cmat.nta.nic.in", streams: ["management"], courses: ["mba", "pgdm"], field: "management" },
  { slug: "nmat", short: "NMAT", name: "NMAT by GMAC", body: "Graduate Management Admission Council", level: "National", url: "https://www.mba.com/exams/nmat", streams: ["management"], courses: ["mba", "pgdm"], field: "management" },
  { slug: "snap", short: "SNAP", name: "Symbiosis National Aptitude Test", body: "Symbiosis International (Deemed University)", level: "University", url: "https://www.snaptest.org", streams: ["management"], courses: ["mba"], field: "management", institutions: /Symbiosis/i },
  { slug: "ipmat-indore", short: "IPMAT Indore", name: "Integrated Programme in Management Aptitude Test, IIM Indore", body: "Indian Institute of Management Indore", level: "University", url: "https://iimidr.ac.in/programmes/academic-programmes/five-year-integrated-programme-in-management-ipm/ipm-admissions-details/", streams: ["management"], courses: ["bba"], field: "management", institutions: /Indian Institute of Management,? Indore/i },
  { slug: "mah-mba-cet", short: "MAH MBA CET", name: "Maharashtra MBA/MMS Common Entrance Test", body: "State Common Entrance Test Cell, Maharashtra", level: "State", url: "https://cetcell.mahacet.org", streams: ["management"], courses: ["mba"], field: "management", states: ["MH"] },

  // Law
  { slug: "ailet", short: "AILET", name: "All India Law Entrance Test", body: "National Law University Delhi", level: "University", url: "https://nationallawuniversitydelhi.in", streams: ["law"], courses: ["ba-llb", "llm"], field: "law", institutions: /National Law University,? (New )?Delhi/i },
  { slug: "lsat-india", short: "LSAT India", name: "Law School Admission Test, India", body: "Law School Admission Council", level: "National", url: "https://discoverlaw.in", streams: ["law"], courses: ["ba-llb", "llb", "llm"], field: "law" },
  { slug: "mh-cet-law", short: "MH CET Law", name: "Maharashtra LL.B. Common Entrance Tests (3-year and 5-year LL.B.)", body: "State Common Entrance Test Cell, Maharashtra", level: "State", url: "https://cetcell.mahacet.org", streams: ["law"], courses: ["ba-llb", "llb"], field: "law", states: ["MH"] },

  // Design
  { slug: "nid-dat", short: "NID DAT", name: "NID Design Aptitude Test", body: "National Institute of Design", level: "University", url: "https://admissions.nid.edu", streams: ["design"], courses: ["bdes", "mdes"], field: "design", institutions: /National Institute of Design/i },
  { slug: "nift", short: "NIFT Entrance", name: "NIFT Entrance Examination (conducted by the National Testing Agency)", body: "National Institute of Fashion Technology", level: "University", url: "https://www.nift.ac.in/admissions", streams: ["design"], courses: ["bdes", "mdes"], field: "design", institutions: /National Institute of Fashion Technology/i },

  // Science, agriculture, teaching and postgraduate
  { slug: "nest", short: "NEST", name: "National Entrance Screening Test (5-year integrated M.Sc)", body: "NISER Bhubaneswar and UM-DAE CEBS Mumbai", level: "University", url: "https://www.nestexam.in", streams: ["science"], courses: ["bsc"], field: "science", institutions: /National Institute of Science Education and Research|Centre for Excellence in Basic Sciences/i },
  { slug: "iiser-iat", short: "IISER IAT", name: "IISER Aptitude Test (BS-MS and BS programmes)", body: "Indian Institutes of Science Education and Research", level: "University", url: "https://www.iiseradmission.in", streams: ["science"], courses: ["bsc"], field: "science", institutions: /Indian Institute of Science Education (and|&) Research/i },
  { slug: "cuet-pg", short: "CUET PG", name: "Common University Entrance Test (PG)", body: "National Testing Agency", level: "National", url: "https://exams.nta.nic.in/cuet-pg/", streams: ["science", "commerce", "arts", "computer-applications"], courses: ["msc", "mcom", "ma", "mca"], field: "general" },
  { slug: "icar-aieea-pg", short: "ICAR AIEEA PG", name: "ICAR All India Entrance Examination for Admission (PG) in agriculture and allied subjects", body: "National Testing Agency for the Indian Council of Agricultural Research", level: "National", url: "https://exams.nta.nic.in/icar/", streams: ["agriculture"], courses: [], field: "science" },
  { slug: "ncet", short: "NCET", name: "National Common Entrance Test for the 4-year Integrated Teacher Education Programme (ITEP)", body: "National Testing Agency", level: "National", url: "https://exams.nta.nic.in/ncet/", streams: ["education"], courses: [], field: "science" },

  // Multi-field state exam
  { slug: "ojee", short: "OJEE", name: "Odisha Joint Entrance Examination (B.Pharm, nursing, MBA, MCA, M.Tech and lateral entry; B.Tech admission is through JEE Main)", body: "Odisha Joint Entrance Examination Committee", level: "State", url: "https://ojee.nic.in", streams: ["pharmacy", "nursing", "management", "computer-applications", "engineering", "architecture"], courses: ["b-pharm", "m-pharm", "bsc-nursing", "post-basic-bsc-nursing", "msc-nursing", "mba", "mca", "mtech", "march", "mplan"], field: "general", states: ["OR"] },
];

/** How the site names an exam's level. */
export function examLevelLabel(level: string): string {
  return level === "State" ? "State exam" : level === "University" ? "Institute exam" : "National exam";
}

/** State names for an exam's state codes. */
export function examStateNames(e: Pick<ExamSeed, "states"> | undefined): string[] {
  return (e?.states ?? []).map((c) => STATES.find((s) => s.code === c)?.name ?? c);
}

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
