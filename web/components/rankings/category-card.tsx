import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { RankingCategory } from "@/lib/queries/rankings";
import { rankingHref } from "@/lib/queries/rankings";

const fmt = (n: number) => n.toLocaleString("en-IN");

export function CategoryCard({ c, latestYear }: { c: RankingCategory; latestYear: number }) {
  const href = rankingHref(c.slug, c.year, latestYear);
  const banded = c.entries - c.exact;
  return (
    <article className="card card-link relative flex flex-col p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[1.25rem] font-bold">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-[14px] focus-visible:outline-none">
            {c.category}
          </Link>
        </h3>
        <p className="tabular shrink-0 text-[0.88rem] text-muted">
          <span className="font-bold text-ink">{fmt(c.entries)}</span> ranked
        </p>
      </div>
      <p className="mt-1 text-[0.92rem] text-ink-soft">{c.about}</p>
      {c.top.length ? (
        <ol className="mt-4 space-y-2 border-t border-rule pt-3">
          {c.top.map((t) => (
            <li key={t.slug} className="flex items-baseline gap-3">
              <span className="tabular w-6 shrink-0 font-[family-name:var(--font-display)] text-lg font-extrabold text-ink-2">{t.rank}</span>
              <span className="min-w-0 text-[0.95rem] leading-snug">{t.name}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[0.88rem]">
        <span className="inline-flex items-center gap-1 font-bold text-brand-hover">
          Full list <ArrowRight size={15} aria-hidden="true" />
        </span>
        <span className="tabular text-muted">{banded > 0 ? `${fmt(c.exact)} exact, ${fmt(banded)} in bands` : `${fmt(c.exact)} exact ranks`}</span>
      </div>
      {c.source?.urls[0] ? (
        <a href={c.source.urls[0]} target="_blank" rel="noopener" className="relative z-10 mt-2 inline-flex items-center gap-1 self-start text-[0.82rem] text-verified underline underline-offset-2">
          NIRF {c.year} official list <ExternalLink size={11} aria-hidden="true" />
        </a>
      ) : null}
    </article>
  );
}
