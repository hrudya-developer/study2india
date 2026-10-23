import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Page numbers with gaps: 1 ... 4 5 6 ... 40. */
function pageList(page: number, count: number): (number | "gap")[] {
  const keep = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => keep.add(p));
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((p) => keep.add(p));
  const list = [...keep].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  list.forEach((p, i) => {
    if (i && p - list[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const btn = "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 font-bold";
  return (
    <nav aria-label="Result pages" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${btn} gap-1 border-rule bg-paper hover:border-ink`}>
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="max-[420px]:sr-only">Previous</span>
        </Link>
      ) : null}
      {pageList(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`g${i}`} className="px-1 text-muted" aria-hidden="true">
            ...
          </span>
        ) : p === page ? (
          <span key={p} aria-current="page" className={`${btn} tabular border-ink bg-ink text-white`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} className={`${btn} tabular border-rule bg-paper hover:border-ink`} aria-label={`Page ${p}`}>
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={`${btn} gap-1 border-rule bg-paper hover:border-ink`}>
          <span className="max-[420px]:sr-only">Next</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
