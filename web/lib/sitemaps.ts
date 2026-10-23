import type { MetadataRoute } from "next";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";
import { getCollegeFacets } from "@/lib/queries/colleges";
import { districtLandingPages, getLandingIndex, landingPages } from "@/lib/queries/landing";
import { SITE_ORIGIN, absoluteUrl, xmlEscape } from "@/lib/seo";
import { rankingSitemapEntries } from "@/lib/queries/rankings";

/**
 * The site's sitemaps. /sitemap.xml is an index of child sitemaps served at /sitemap/<id>.xml:
 * static pages, courses, exams, listing landing pages, district landing pages and published
 * colleges, split into chunks well under the 50,000 URL and 50MB limits.
 */
export const COLLEGES_PER_SITEMAP = 40000;
/** District landing pages per sitemap: "landing-districts", then "landing-districts-2" and on if ever needed. */
export const DISTRICT_LANDINGS_PER_SITEMAP = 40000;

const districtChunkId = (n: number) => (n === 1 ? "landing-districts" : `landing-districts-${n}`);

/** The 1-based chunk number of a district landing sitemap id, or null for any other id. */
function districtChunk(id: string): number | null {
  if (id === "landing-districts") return 1;
  const m = /^landing-districts-(\d+)$/.exec(id);
  return m && Number(m[1]) >= 2 ? Number(m[1]) : null;
}

async function districtChunkPages(n: number) {
  const start = (n - 1) * DISTRICT_LANDINGS_PER_SITEMAP;
  return districtLandingPages(await getLandingIndex()).slice(start, start + DISTRICT_LANDINGS_PER_SITEMAP);
}

const STATIC_PAGES = ["/", "/colleges", "/courses", "/exams", "/rankings", "/scholarships", "/counselling", "/predictor", "/predictor/neet", "/about", "/contact", "/how-we-check-data", "/privacy"];

type College = { slug: string; updated_at: string };

// Sitemaps are fetched in bursts by crawlers; the data changes only when lists are loaded.
const TTL_MS = 10 * 60 * 1000;
const memo = globalThis as unknown as { sitemapColleges?: { at: number; value: Promise<College[]> } };

function getColleges(): Promise<College[]> {
  const hit = memo.sitemapColleges;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = rows<College>(sql`select slug, updated_at from institutions where status = 'published' order by id`);
  memo.sitemapColleges = { at: Date.now(), value };
  value.catch(() => {
    if (memo.sitemapColleges?.value === value) memo.sitemapColleges = undefined;
  });
  return value;
}

/** MariaDB timestamps come back as "YYYY-MM-DD HH:MM:SS" in UTC; null when unparseable. */
function toDate(v: string | null | undefined): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v.includes("T") ? v : `${v.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function latest(dates: (string | null)[]): Date | undefined {
  let best: Date | undefined;
  for (const v of dates) {
    const d = toDate(v);
    if (d && (!best || d > best)) best = d;
  }
  return best;
}

/** The child sitemap ids, in index order. Falls back to a single colleges chunk when the database is unreachable. */
export async function sitemapIds(): Promise<string[]> {
  let chunks = 1;
  let districtChunks = 1;
  try {
    chunks = Math.max(1, Math.ceil((await getColleges()).length / COLLEGES_PER_SITEMAP));
  } catch {
    // The colleges sitemap will be empty until the database is back; the ids stay valid.
  }
  try {
    districtChunks = Math.max(1, Math.ceil((await getLandingIndex()).districtPages / DISTRICT_LANDINGS_PER_SITEMAP));
  } catch {
    // As above: one (empty) district sitemap until the database is back.
  }
  return [
    "pages",
    "courses",
    "exams",
    "landing",
    ...Array.from({ length: districtChunks }, (_, i) => districtChunkId(i + 1)),
    ...Array.from({ length: chunks }, (_, i) => `colleges-${i + 1}`),
  ];
}

const entry = (path: string, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
  // Next writes <loc> as given, so "&" in a query URL must be escaped here.
  url: xmlEscape(absoluteUrl(path)),
  ...(lastModified ? { lastModified } : {}),
});

export async function sitemapEntries(id: string): Promise<MetadataRoute.Sitemap> {
  try {
    if (id === "pages") {
      const rankings = (await rankingSitemapEntries(SITE_ORIGIN)).map((r) => ({ ...r, url: xmlEscape(r.url) }));
      return [...STATIC_PAGES.map((p) => entry(p)), ...rankings];
    }
    if (id === "courses") {
      const list = await rows<{ slug: string }>(sql`select slug from courses order by sort_order, slug`);
      return list.map((c) => entry(`/course/${c.slug}`));
    }
    if (id === "exams") {
      const list = await rows<{ slug: string }>(sql`select slug from exams order by sort_order, slug`);
      return list.map((e) => entry(`/exam/${e.slug}`));
    }
    if (id === "landing") {
      const [facets, index] = await Promise.all([getCollegeFacets(), getLandingIndex()]);
      // One-filter listings that have colleges, then the course or field in a state pages.
      const single = [
        ...facets.courses.filter((c) => c.count > 0).map((c) => `/colleges?course=${c.value}`),
        ...facets.streams.filter((s) => s.count > 0).map((s) => `/colleges?stream=${s.value}`),
        ...facets.states.filter((s) => s.count > 0).map((s) => `/colleges?state=${s.value}`),
      ];
      return [...single.map((p) => entry(p)), ...landingPages(index).map((l) => entry(l.path, toDate(l.lastmod)))];
    }
    const d = districtChunk(id);
    if (d) return (await districtChunkPages(d)).map((l) => entry(l.path, toDate(l.lastmod)));
    const m = /^colleges-(\d+)$/.exec(id);
    if (m) {
      const start = (Number(m[1]) - 1) * COLLEGES_PER_SITEMAP;
      const list = (await getColleges()).slice(start, start + COLLEGES_PER_SITEMAP);
      return list.map((c) => entry(`/college/${c.slug}`, toDate(c.updated_at)));
    }
  } catch {
    // An empty sitemap is better than a 500 that makes crawlers back off the whole index.
  }
  return [];
}

/** lastmod for an index entry, where the child sitemap has dated URLs. */
export async function sitemapLastModified(id: string): Promise<Date | undefined> {
  try {
    const m = /^colleges-(\d+)$/.exec(id);
    if (m) {
      const start = (Number(m[1]) - 1) * COLLEGES_PER_SITEMAP;
      return latest((await getColleges()).slice(start, start + COLLEGES_PER_SITEMAP).map((c) => c.updated_at));
    }
    if (id === "landing") return latest(landingPages(await getLandingIndex()).map((l) => l.lastmod));
    const d = districtChunk(id);
    if (d) return latest((await districtChunkPages(d)).map((l) => l.lastmod));
  } catch {
    // No lastmod is fine.
  }
  return undefined;
}
