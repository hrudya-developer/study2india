/**
 * Shared helpers for sitemaps, canonical URLs and structured data.
 *
 * The public origin is fixed to the production domain: sitemaps, robots.txt and JSON-LD must name
 * https://study2india.com even when the app runs on a staging host or locally.
 */
export const SITE_ORIGIN = "https://study2india.com";

/**
 * The origin for metadataBase, which turns relative canonical and Open Graph URLs absolute. In
 * production it is always SITE_ORIGIN, the same origin as the sitemaps and JSON-LD, so a missing
 * or wrong SITE_URL cannot make canonicals point at http://localhost:3000 or a staging host.
 * Outside production SITE_URL may override it, for local testing only.
 */
export function metadataOrigin(): string {
  const local = process.env.NODE_ENV !== "production" ? process.env.SITE_URL?.trim() : undefined;
  return local && /^https?:\/\/[^/]/.test(local) ? local.replace(/\/+$/, "") : SITE_ORIGIN;
}

/** An absolute URL on the public site for a path such as "/college/x" or "/colleges?course=y". */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "") || SITE_ORIGIN;
}

/**
 * The clean URL of a "<course> colleges in <state>" (or "<field> colleges in <state>") landing page,
 * with the page number when past the first. A pure helper, safe to import anywhere.
 */
export function landingPath(dim: string, state: string, page = 1): string {
  return `/colleges/${dim}/${state}${page > 1 ? `?page=${page}` : ""}`;
}

/** The clean URL of a "<course> colleges in <district>" landing page; the district is its slug (lib/districts.ts). */
export function districtLandingPath(dim: string, state: string, district: string, page = 1): string {
  return `/colleges/${dim}/${state}/${district}${page > 1 ? `?page=${page}` : ""}`;
}

/** Escape a value for an XML text node; sitemap <loc> values with "&" are invalid otherwise. */
export function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * Serialise JSON-LD for a <script type="application/ld+json"> tag. "<" is escaped so a value
 * containing "</script>" cannot close the tag early.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type Crumb = { name: string; path?: string };

/**
 * A schema.org BreadcrumbList. Every crumb but the last needs a path; the last (the page itself)
 * gets the current page's URL when it has none, as Google accepts either.
 */
export function breadcrumbList(crumbs: Crumb[], currentPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path ?? currentPath),
    })),
  };
}

/** True for an http(s) URL with a host, the only kind we pass on as sameAs or url. */
export function isWebUrl(v: string | null | undefined): v is string {
  if (!v) return false;
  try {
    const u = new URL(v.trim());
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}
