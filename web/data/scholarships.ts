/**
 * Central and state scholarships for college students, read from official sources only: the
 * National Scholarship Portal (scheme guidelines and its 2026-27 scheme windows), AICTE and
 * ministry guidelines published on it, PM-Vidyalaxmi, and the state portals of Kerala,
 * Karnataka and Maharashtra. Eligibility is summarised in our own words. An amount appears only
 * as the official document states it, and a deadline only when one is published for 2026-27;
 * otherwise the field is null and the site shows "Not recorded". Loaded by
 * lib/seed/reference-extras.ts.
 */

export type ScholarshipSource = {
  publisher: string;
  /** Unique title: the loader keys the sources table on it. */
  title: string;
  url: string;
  retrieved: string;
};

export type ScholarshipRow = {
  slug: string;
  name: string;
  provider: string;
  providerType: "Central" | "State";
  /** State the scheme belongs to, for state schemes. */
  state?: string;
  eligibility: string;
  amount: string | null;
  /** Last date for fresh applications in 2026-27, when officially published (YYYY-MM-DD). */
  deadline: string | null;
  officialUrl: string;
  source: ScholarshipSource;
};

const RETRIEVED = "2026-10-24";
const src = (publisher: string, title: string, url: string): ScholarshipSource => ({ publisher, title, url, retrieved: RETRIEVED });

const NSP_LIST = src("National Scholarship Portal", "NSP schemes on the portal, academic year 2026-27", "https://scholarships.gov.in/All-Scholarships");

export const SCHOLARSHIPS: ScholarshipRow[] = [
  {
    slug: "pm-usp-central-sector-scheme",
    name: "PM-USP Central Sector Scheme of Scholarship for College and University Students",
    provider: "Ministry of Education, Department of Higher Education",
    providerType: "Central",
    eligibility:
      "For students above the 80th percentile of successful candidates in their stream in the Class 12 board exam, studying a regular degree course (not distance or diploma) at a recognised institution, with family income up to Rs 4.5 lakh a year and no other merit or state scholarship. Renewal needs 50% marks and 75% attendance. On NSP the 2026-27 window (1 June to 31 October 2026) is listed for renewal applications.",
    amount: "Rs 12,000 a year at graduation level (first three years); Rs 20,000 a year at postgraduate level",
    deadline: null,
    officialUrl: "https://scholarships.gov.in/public/schemeGuidelines/CSSS_GUIDLINES_07022024_updated.pdf",
    source: src("Ministry of Education", "PM-USP Central Sector Scheme of Scholarship: guidelines on NSP", "https://scholarships.gov.in/public/schemeGuidelines/CSSS_GUIDLINES_07022024_updated.pdf"),
  },
  {
    slug: "aicte-pragati-degree",
    name: "AICTE Pragati Scholarship for Girl Students (Degree)",
    provider: "All India Council for Technical Education",
    providerType: "Central",
    eligibility:
      "For girls admitted to the first year of a degree course, or to the second year through lateral entry, at an AICTE-approved institution. Family income must not exceed Rs 8 lakh a year, and at most two girls per family can receive it.",
    amount: "Rs 50,000 a year (guidelines published on NSP)",
    deadline: "2026-10-31",
    officialUrl: "https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2010_G.pdf",
    source: src("All India Council for Technical Education", "AICTE Pragati Scholarship (Degree): guidelines on NSP", "https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2010_G.pdf"),
  },
  {
    slug: "aicte-saksham-degree",
    name: "AICTE Saksham Scholarship for Specially Abled Students (Degree)",
    provider: "All India Council for Technical Education",
    providerType: "Central",
    eligibility:
      "For students with a disability of 40% or more admitted to the first year of a degree course, or to the second year through lateral entry, at an AICTE-approved institution, with family income up to Rs 8 lakh a year.",
    amount: "Rs 50,000 a year (guidelines published on NSP)",
    deadline: "2026-10-31",
    officialUrl: "https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2012_G.pdf",
    source: src("All India Council for Technical Education", "AICTE Saksham Scholarship (Degree): guidelines on NSP", "https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2012_G.pdf"),
  },
  {
    slug: "aicte-swanath",
    name: "AICTE Swanath Scholarship Scheme",
    provider: "All India Council for Technical Education",
    providerType: "Central",
    eligibility:
      "For orphans, students who lost one or both parents to Covid-19, wards of armed forces and central paramilitary personnel martyred in action, and students whose parent has a critical illness or died or was severely disabled in an accident. Must be in a regular degree or diploma course at an AICTE-approved institution, have family income up to Rs 8 lakh a year, and not hold another government or AICTE scholarship.",
    amount: "Rs 50,000 a year",
    deadline: "2026-10-31",
    officialUrl: "https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_3039_G.pdf",
    source: src("All India Council for Technical Education", "AICTE Swanath Scholarship: guidelines on NSP (May 2025)", "https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_3039_G.pdf"),
  },
  {
    slug: "pm-usp-special-scholarship-jk-ladakh",
    name: "PM-USP Special Scholarship Scheme for Jammu and Kashmir and Ladakh",
    provider: "Ministry of Education, Department of Higher Education (run through AICTE)",
    providerType: "Central",
    eligibility:
      "For students from the Union Territories of Jammu and Kashmir and Ladakh who, after Class 12, take admission in institutions outside the two UTs through AICTE's counselling, in general degree, professional or medical courses.",
    amount:
      "Academic fee up to Rs 30,000 (general degree), Rs 1.25 lakh (professional) or Rs 3 lakh (medical) a year, plus maintenance up to Rs 1 lakh a year",
    deadline: "2026-10-31",
    officialUrl: "https://scholarships.gov.in/public/schemeGuidelines/AICTE/PM_USPY(SSSJKL)SchemeSpecifications.pdf",
    source: src("Ministry of Education", "PM-USP Special Scholarship Scheme for J&K and Ladakh: specifications on NSP", "https://scholarships.gov.in/public/schemeGuidelines/AICTE/PM_USPY(SSSJKL)SchemeSpecifications.pdf"),
  },
  {
    slug: "top-class-scholarship-sc",
    name: "Scheme of Top Class Scholarship for SC Students",
    provider: "Ministry of Social Justice and Empowerment",
    providerType: "Central",
    eligibility:
      "For Scheduled Caste students with family income up to Rs 8 lakh a year who are admitted to the first year of a full-time course at a notified institution (such as IIMs, IITs, AIIMS, NITs and NLUs), within that institution's slots. 30% of slots are for girls, and no more than two siblings in a family can benefit.",
    amount:
      "Full tuition and non-refundable fees (capped at Rs 2 lakh a year at private institutions), plus Rs 86,000 in the first year and Rs 41,000 in each later year for living costs, books and a computer",
    deadline: "2026-10-31",
    officialUrl: "https://scholarships.gov.in/public/schemeGuidelines/Top_Class_Education_Scheme_2018.pdf",
    source: src("Ministry of Social Justice and Empowerment", "Top Class Scholarship for SC Students: guidelines on NSP (from 2025-26)", "https://scholarships.gov.in/public/schemeGuidelines/Top_Class_Education_Scheme_2018.pdf"),
  },
  {
    slug: "pm-yasasvi-top-class-college",
    name: "PM YASASVI Top Class Education in College for OBC, EBC and DNT Students",
    provider: "Ministry of Social Justice and Empowerment (Backward Classes)",
    providerType: "Central",
    eligibility:
      "For OBC, EBC and DNT students with family income up to Rs 2.5 lakh a year who are admitted to a full-time course at a notified institution, within that institution's slots. 30% of slots are for girls, and no more than two siblings in a family can benefit.",
    amount:
      "Full tuition and non-refundable fees (capped at Rs 2 lakh a year at private institutions), Rs 3,000 a month for living costs, Rs 5,000 a year for books, and up to Rs 45,000 once for a computer",
    deadline: "2026-10-31",
    officialUrl: "https://scholarships.gov.in/public/schemeGuidelines/ApprovedmodifieddraftofTopClassCollege.pdf",
    source: src("Ministry of Social Justice and Empowerment", "Top Class Education in College for OBC, EBC and DNT Students: guidelines on NSP", "https://scholarships.gov.in/public/schemeGuidelines/ApprovedmodifieddraftofTopClassCollege.pdf"),
  },
  {
    slug: "pm-vidyalaxmi",
    name: "PM-Vidyalaxmi education loan scheme",
    provider: "Ministry of Education",
    providerType: "Central",
    eligibility:
      "For students admitted to quality higher education institutions covered by the scheme who apply for an education loan through the PM-Vidyalaxmi portal. Loans are collateral free and guarantor free; the interest subvention depends on family income.",
    amount:
      "75% credit guarantee on loans up to Rs 7.5 lakh; 3% interest subvention on loans up to Rs 10 lakh for family income up to Rs 8 lakh; full interest subvention continues for family income up to Rs 4.5 lakh",
    deadline: null,
    officialUrl: "https://pmvidyalaxmi.co.in/",
    source: src("Ministry of Education", "PM-Vidyalaxmi: about the scheme", "https://pmvidyalaxmi.co.in/"),
  },
  {
    slug: "kerala-suvarna-jubilee-merit-scholarship",
    name: "Suvarna Jubilee Merit Scholarship",
    provider: "Directorate of Collegiate Education, Kerala",
    providerType: "State",
    state: "Kerala",
    eligibility:
      "For first-year undergraduate or postgraduate students in government or aided colleges or university departments in Kerala, from BPL families, with at least 50% in the qualifying exam.",
    amount: "Rs 10,000 a year",
    deadline: null,
    officialUrl: "https://dcescholarship.kerala.gov.in/",
    source: src("Directorate of Collegiate Education, Kerala", "DCE Scholarship portal: Suvarna Jubilee Merit Scholarship details", "https://dcescholarship.kerala.gov.in/he_ma/he_maindx.php"),
  },
  {
    slug: "kerala-state-merit-scholarship",
    name: "State Merit Scholarship",
    provider: "Directorate of Collegiate Education, Kerala",
    providerType: "State",
    state: "Kerala",
    eligibility:
      "For first-year undergraduate or postgraduate students in government or aided colleges or university departments in Kerala, with at least 50% in the qualifying exam and family income up to Rs 1 lakh a year (the notification allows exemptions on merit).",
    amount: "Rs 1,250 a year for graduation (300 awards); Rs 1,500 a year for postgraduation (150 awards)",
    deadline: null,
    officialUrl: "https://dcescholarship.kerala.gov.in/",
    source: src("Directorate of Collegiate Education, Kerala", "DCE Scholarship portal: State Merit Scholarship details", "https://dcescholarship.kerala.gov.in/he_ma/he_maindx.php"),
  },
  {
    slug: "kerala-bhinnaseshy-souhrida-scholarship",
    name: "Bhinnaseshy Souhrida Scholarship",
    provider: "Directorate of Collegiate Education, Kerala",
    providerType: "State",
    state: "Kerala",
    eligibility:
      "For students with physical or mental disabilities who are permanent residents of Kerala, studying from Plus One up to postgraduate, B.Ed or M.Ed courses in government or aided institutions in Kerala. There is no income limit.",
    amount: null,
    deadline: null,
    officialUrl: "https://dcescholarship.kerala.gov.in/",
    source: src("Directorate of Collegiate Education, Kerala", "DCE Scholarship portal: Bhinnaseshy Souhrida Scholarship details", "https://dcescholarship.kerala.gov.in/he_ma/he_maindx.php"),
  },
  {
    slug: "kerala-e-grantz-post-matric",
    name: "e-Grantz post-matric educational assistance (SC, ST and OBC)",
    provider: "Scheduled Castes, Scheduled Tribes and OBC Development Departments, Kerala",
    providerType: "State",
    state: "Kerala",
    eligibility:
      "For SC, ST and OBC students in Kerala in post-matric courses. Students register once on e-Grantz 3.0 with their personal and bank details and Aadhaar, and the same registration is used for the department's assistance schemes through the course.",
    amount: null,
    deadline: null,
    officialUrl: "https://egrantz.kerala.gov.in/",
    source: src("Government of Kerala", "e-Grantz 3.0 portal", "https://egrantz.kerala.gov.in/"),
  },
  {
    slug: "karnataka-ssp-social-welfare-post-matric",
    name: "Karnataka post-matric scholarships, Social Welfare Department",
    provider: "Social Welfare Department, Government of Karnataka (State Scholarship Portal)",
    providerType: "State",
    state: "Karnataka",
    eligibility:
      "Post-matric scholarships of the Social Welfare Department for students in Class 11 and above, applied for on the Karnataka State Scholarship Portal. NSP One Time Registration is required first.",
    amount: null,
    deadline: "2027-01-31",
    officialUrl: "https://ssp.karnataka.gov.in/",
    source: src("Government of Karnataka", "Karnataka State Scholarship Portal: last dates for 2026-27", "https://ssp.karnataka.gov.in/"),
  },
  {
    slug: "karnataka-ssp-tribal-welfare-post-matric",
    name: "Karnataka post-matric scholarships, Tribal Welfare Department",
    provider: "Tribal Welfare Department, Government of Karnataka (State Scholarship Portal)",
    providerType: "State",
    state: "Karnataka",
    eligibility:
      "Post-matric scholarships of the Tribal Welfare Department for students in Class 11 and above, applied for on the Karnataka State Scholarship Portal. NSP One Time Registration is required first.",
    amount: null,
    deadline: "2026-12-31",
    officialUrl: "https://ssp.karnataka.gov.in/",
    source: src("Government of Karnataka", "Karnataka State Scholarship Portal: last dates for 2026-27", "https://ssp.karnataka.gov.in/"),
  },
  {
    slug: "karnataka-ssp-backward-classes-post-matric",
    name: "Karnataka post-matric scholarships, Backward Classes Welfare Department",
    provider: "Backward Classes Welfare Department, Government of Karnataka (State Scholarship Portal)",
    providerType: "State",
    state: "Karnataka",
    eligibility:
      "Post-matric scholarships of the Backward Classes Welfare Department for students in Class 11 and above, applied for on the Karnataka State Scholarship Portal. NSP One Time Registration is required first.",
    amount: null,
    deadline: "2026-10-31",
    officialUrl: "https://ssp.karnataka.gov.in/",
    source: src("Government of Karnataka", "Karnataka State Scholarship Portal: last dates for 2026-27", "https://ssp.karnataka.gov.in/"),
  },
  {
    slug: "karnataka-ssp-minority-welfare-post-matric",
    name: "Karnataka post-matric scholarships, Minorities Welfare Department",
    provider: "Department of Minority Welfare, Government of Karnataka (State Scholarship Portal)",
    providerType: "State",
    state: "Karnataka",
    eligibility: "Post-matric scholarships of the Minorities Welfare Department for students in Class 11 and above, applied for on the Karnataka State Scholarship Portal.",
    amount: null,
    deadline: "2026-11-30",
    officialUrl: "https://ssp.karnataka.gov.in/",
    source: src("Government of Karnataka", "Karnataka State Scholarship Portal: last dates for 2026-27", "https://ssp.karnataka.gov.in/"),
  },
  {
    slug: "maharashtra-goi-post-matric-sc",
    name: "Government of India Post-Matric Scholarship (Maharashtra)",
    provider: "Social Justice and Special Assistance Department, Maharashtra (MahaDBT)",
    providerType: "State",
    state: "Maharashtra",
    eligibility:
      "For Scheduled Caste and Neo-Buddhist students in post-matric courses with family income up to Rs 2.5 lakh a year. Applications for 2026-27 are taken on the MahaDBT 2.0 portal.",
    amount: "Tuition fees, exam fees and a monthly maintenance allowance by course group",
    deadline: null,
    officialUrl: "https://mahadbt.maharashtra.gov.in/",
    source: src("Government of Maharashtra", "MahaDBT: Government of India Post-Matric Scholarship scheme details", "https://mahadbt.maharashtra.gov.in/"),
  },
  {
    slug: "maharashtra-rajarshi-shahu-ebc",
    name: "Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojana (EBC)",
    provider: "Higher and Technical Education Department, Maharashtra (MahaDBT)",
    providerType: "State",
    state: "Maharashtra",
    eligibility:
      "For EBC and EWS students domiciled in Maharashtra who are admitted to diploma, degree or postgraduate technical and professional courses through the Centralised Admission Process, with family income up to Rs 8 lakh a year.",
    amount: "50% of tuition and exam fees for male students; 100% for female students",
    deadline: null,
    officialUrl: "https://mahadbt.maharashtra.gov.in/",
    source: src("Government of Maharashtra", "MahaDBT: Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojana (EBC) details", "https://mahadbt.maharashtra.gov.in/"),
  },
];

/** NSP's scheme list, which gives the 2026-27 application windows used for the deadlines above. */
export const SCHOLARSHIP_DEADLINE_SOURCE = NSP_LIST;
