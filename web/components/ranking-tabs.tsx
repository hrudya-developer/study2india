"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { RankingList } from "@/lib/queries/home";
import { SourceStamp } from "@/components/source-stamp";
import { slugify } from "@/lib/slug";

export function RankingTabs({ lists }: { lists: RankingList[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const list = lists[active];

  function onKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : lists.length - 1)) % lists.length;
    setActive(next);
    document.getElementById(`${base}-tab-${next}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Ranking category" className="-mx-4 flex gap-1 overflow-x-auto border-b border-rule px-4 sm:mx-0 sm:px-0">
        {lists.map((l, i) => (
          <button
            key={l.category}
            id={`${base}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${base}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={`-mb-px shrink-0 border-b-[3px] px-3 py-2.5 text-[0.95rem] ${
              i === active ? "border-brand font-bold text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {l.category}
          </button>
        ))}
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`}>
        <table className="mt-2 w-full border-collapse text-left">
          <caption className="sr-only">
            NIRF {list.year} {list.category} ranking, top {list.rows.length}
          </caption>
          <thead>
            <tr className="text-[0.85rem] text-muted">
              <th scope="col" className="w-14 py-2 pr-2 font-normal">Rank</th>
              <th scope="col" className="py-2 pr-4 font-normal">Institution</th>
              <th scope="col" className="hidden py-2 pr-4 font-normal sm:table-cell">Location</th>
              <th scope="col" className="w-20 py-2 text-right font-normal">Score</th>
            </tr>
          </thead>
          <tbody>
            {list.rows.map((r) => (
              <tr key={r.slug} className="border-t border-rule align-top">
                <td className="tabular py-3 pr-2 font-[family-name:var(--font-display)] text-xl font-bold">{r.rank ?? r.rankBand}</td>
                <td className="py-3 pr-4">
                  <Link href={`/college/${r.slug}`} className="font-bold hover:underline">
                    {r.name}
                  </Link>
                  <span className="block text-[0.9rem] text-muted sm:hidden">{[r.city, r.state].filter(Boolean).join(", ")}</span>
                </td>
                <td className="hidden py-3 pr-4 text-ink-soft sm:table-cell">{[r.city, r.state].filter(Boolean).join(", ") || "Not recorded"}</td>
                <td className="tabular py-3 text-right text-ink-soft">{r.score ?? "Not recorded"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <SourceStamp publisher={`NIRF India Rankings ${list.year}`} url={list.sourceUrl} checked={list.retrievedOn} />
          {/* The plain category URL shows that category's latest year, the year of these lists; the slug is categorySlug (slugify) from lib/queries/rankings.ts. */}
          <Link href={`/rankings/${slugify(list.category)}`} className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
            Full {list.category} ranking
          </Link>
        </div>
      </div>
    </div>
  );
}
