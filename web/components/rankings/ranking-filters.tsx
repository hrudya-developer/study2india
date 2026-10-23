"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { FacetOption, RankingFilters as Filters } from "@/lib/queries/rankings";

type Props = {
  action: string;
  /** A year other than the latest, kept in the URL while filtering. */
  year: number | null;
  filters: Filters;
  states: FacetOption[];
  ownership: FacetOption[];
};

const field = "h-11 w-full rounded-lg border border-rule bg-paper px-3 text-[0.95rem] focus:border-ink";
const label = "mb-1 block text-[0.78rem] font-bold uppercase tracking-wide text-muted";

/**
 * A plain GET form, so filters work without JavaScript and every result has a shareable URL.
 * With JavaScript, a change of state or ownership applies at once.
 */
export function RankingFilters({ action, year, filters: f, states, ownership }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(form: HTMLFormElement) {
    const u = new URLSearchParams();
    for (const [k, v] of new FormData(form).entries()) {
      const s = String(v).trim();
      if (s) u.set(k, s);
    }
    const qs = u.toString();
    startTransition(() => router.push(qs ? `${action}?${qs}` : action, { scroll: false }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    go(e.currentTarget);
  }

  function onChange(e: FormEvent<HTMLFormElement>) {
    if ((e.target as HTMLElement).tagName === "SELECT") go(e.currentTarget);
  }

  const active = !!(f.state || f.ownership || f.q);

  return (
    <form action={action} method="get" onSubmit={onSubmit} onChange={onChange} aria-busy={pending} className="grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
      {year ? <input type="hidden" name="year" value={year} /> : null}
      <div className="col-span-2 lg:col-span-1">
        <label htmlFor="rank-q" className={label}>
          Name or city
        </label>
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="rank-q" name="q" type="search" defaultValue={f.q ?? ""} placeholder="e.g. IIT, Manipal, Kochi" className={`${field} pl-9`} maxLength={80} />
        </div>
      </div>
      <div className="min-w-0">
        <label htmlFor="rank-state" className={label}>
          State
        </label>
        <select id="rank-state" name="state" defaultValue={f.state ?? ""} className={field}>
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label} ({s.count})
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label htmlFor="rank-ownership" className={label}>
          Ownership
        </label>
        <select id="rank-ownership" name="ownership" defaultValue={f.ownership ?? ""} className={field} disabled={!ownership.length}>
          <option value="">Any ownership</option>
          {ownership.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.count})
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
        <button type="submit" className="h-11 rounded-lg bg-brand px-5 font-bold text-ink hover:bg-brand-hover">
          {pending ? "Loading" : "Show"}
        </button>
        {active ? (
          <Link href={year ? `${action}?year=${year}` : action} scroll={false} className="text-[0.92rem] font-bold text-ink-soft underline underline-offset-4 hover:text-ink">
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
