import type { NextRequest } from "next/server";
import { searchSite } from "@/lib/queries/search";

/** Grouped suggestions for the search box: quick answers, colleges, courses, exams and states. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  try {
    const result = await searchSite(q);
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return Response.json({ error: "Search is unavailable right now." }, { status: 503 });
  }
}
