import type { MetadataRoute } from "next";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";

export const dynamic = "force-dynamic";

const base = (process.env.SITE_URL ?? "https://study2india.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/colleges", "/courses", "/exams", "/rankings", "/scholarships", "/counselling", "/about", "/contact", "/how-we-check-data"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  try {
    const [colleges, courses, exams, streams] = await Promise.all([
      rows<{ slug: string; updated_at: string }>(sql`select slug, updated_at from institutions where status = 'published'`),
      rows<{ slug: string }>(sql`select slug from courses`),
      rows<{ slug: string }>(sql`select slug from exams`),
      rows<{ slug: string }>(sql`select slug from streams`),
    ]);
    return [
      ...fixed,
      ...streams.map((s) => ({ url: `${base}/colleges?stream=${s.slug}`, priority: 0.6 })),
      ...courses.map((c) => ({ url: `${base}/course/${c.slug}`, priority: 0.6 })),
      ...exams.map((e) => ({ url: `${base}/exam/${e.slug}`, priority: 0.6 })),
      ...colleges.map((c) => ({ url: `${base}/college/${c.slug}`, lastModified: new Date(c.updated_at.replace(" ", "T") + "Z"), priority: 0.8 })),
    ];
  } catch {
    return fixed;
  }
}
