/**
 * Shared helpers for sitemaps, canonical URLs and structured data.
 *
 * The public origin is fixed to the production domain: sitemaps, robots.txt and JSON-LD must name
 * https://study2india.com even when the app runs on a staging host or locally.
 */
export const SITE_ORIGIN = "https://study2india.com";

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
