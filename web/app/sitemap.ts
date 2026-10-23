import type { MetadataRoute } from "next";
import { sitemapEntries, sitemapIds } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

/** Child sitemaps at /sitemap/<id>.xml; /sitemap.xml (app/sitemap.xml/route.ts) is their index. */
export async function generateSitemaps() {
  return (await sitemapIds()).map((id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await props.id);
}
