import { STREAMS, EXAMS } from "@/data/reference";

/** Navigation groupings shared by the desktop mega menu and the phone menu. */

export const POPULAR_STATES = ["Karnataka", "Tamil Nadu", "Kerala", "Telangana", "Andhra Pradesh", "Maharashtra", "Delhi", "Uttar Pradesh", "Puducherry", "West Bengal"];

export const allCourses = STREAMS.flatMap((s) => s.courses.map((c) => ({ ...c, stream: s.slug })));
export const courseBySlug = new Map(allCourses.map((c) => [c.slug, c]));
export const examBySlug = new Map(EXAMS.map((e) => [e.slug, e]));

/** Popular courses grouped the way students think about them. */
export const COURSE_GROUPS: { label: string; slugs: string[] }[] = [
  { label: "Medical and health", slugs: ["mbbs", "bds", "bsc-nursing", "bams", "bhms", "b-pharm", "bpt", "bvsc-ah"] },
  { label: "Engineering and technology", slugs: ["btech", "diploma-engineering", "bca", "barch", "mtech", "mca"] },
  { label: "Management, law and more", slugs: ["mba", "bba", "ba-llb", "llb", "bcom", "bsc", "ba", "bdes"] },
];

export const EXAM_GROUPS: { label: string; slugs: string[] }[] = [
  { label: "Medical and health", slugs: ["neet-ug", "neet-pg", "ini-cet", "aiims-nursing", "gpat"] },
  { label: "Engineering and design", slugs: ["jee-main", "jee-advanced", "bitsat", "gate", "nata", "nid-dat"] },
  { label: "State exams", slugs: ["keam", "kcet", "mht-cet", "ts-eapcet", "ap-eapcet", "wbjee"] },
  { label: "University, management and law", slugs: ["cuet-ug", "cat", "xat", "clat", "ailet"] },
];

/** Exams featured on the home page and in the footer; /exams lists every exam. */
export const FEATURED_EXAMS = EXAM_GROUPS.flatMap((g) => g.slugs);

export function pick<T>(map: Map<string, T>, slugs: string[]): T[] {
  return slugs.map((s) => map.get(s)).filter((x): x is T => !!x);
}
