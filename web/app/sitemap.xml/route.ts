import { sitemapIds, sitemapLastModified } from "@/lib/sitemaps";
import { SITE_ORIGIN, xmlEscape } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** The sitemap index robots.txt points to; Next does not generate one for generateSitemaps. */
export async function GET() {
  const ids = await sitemapIds();
  const dates = await Promise.all(ids.map((id) => sitemapLastModified(id)));
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ids.map((id, i) => {
      const d = dates[i];
      return `<sitemap><loc>${xmlEscape(`${SITE_ORIGIN}/sitemap/${id}.xml`)}</loc>${d ? `<lastmod>${d.toISOString()}</lastmod>` : ""}</sitemap>`;
    }),
    "</sitemapindex>",
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
