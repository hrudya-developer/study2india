import { ExternalLink } from "lucide-react";
import { SourceStamp } from "@/components/source-stamp";
import type { RankingSource } from "@/lib/queries/rankings";

/** JSON-LD with "<" escaped, so no value can close the script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** "Source: NIRF 2025, Ministry of Education" with the official nirfindia.org pages for the list. */
export function NirfSource({ year, source }: { year: number; source: RankingSource | null }) {
  const publisher = `NIRF ${year}, Ministry of Education`;
  if (!source) return <p className="text-[0.85rem] text-muted">Source: {publisher}</p>;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <SourceStamp publisher={publisher} url={source.urls[0]} checked={source.retrievedOn} />
      {source.urls.length > 1 ? (
        <p className="flex flex-wrap items-center gap-x-2 text-[0.85rem] text-muted">
          <span>Official list pages:</span>
          {source.urls.map((u, i) => (
            <a key={u} href={u} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 font-bold text-ink-soft underline underline-offset-2 hover:text-ink">
              {i + 1}
              <ExternalLink size={11} aria-hidden="true" />
              <span className="sr-only"> (page {i + 1} on nirfindia.org)</span>
            </a>
          ))}
        </p>
      ) : null}
    </div>
  );
}

export function formatDate(d: string) {
  const t = new Date(d.slice(0, 10) + "T00:00:00");
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
