import Link from "next/link";

/** Links between loaded NIRF years; rendered only when more than one year is loaded. */
export function YearSwitch({ years, current, hrefFor }: { years: number[]; current: number; hrefFor: (year: number) => string }) {
  if (years.length < 2) return null;
  return (
    <nav aria-label="NIRF year" className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-[0.85rem] text-[#b9bce0]">Year</span>
      {years.map((y) => (
        <Link
          key={y}
          href={hrefFor(y)}
          aria-current={y === current ? "page" : undefined}
          className={`tabular rounded-full border px-3.5 py-1.5 text-[0.92rem] font-bold ${
            y === current ? "border-brand bg-brand text-ink" : "border-white/25 text-white hover:border-white/60"
          }`}
        >
          {y}
        </Link>
      ))}
    </nav>
  );
}
