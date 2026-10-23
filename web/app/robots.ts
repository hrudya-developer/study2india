import type { MetadataRoute } from "next";

const base = (process.env.SITE_URL ?? "https://study2india.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/search", "/admin"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
