import Link from "next/link";
import { QUOTA_NAMES, type CutoffView } from "@/lib/cutoff-view";

const field = "h-11 w-full rounded-lg border border-rule bg-paper px-3 text-[0.95rem] focus:border-ink";
const label = "mb-1 block text-[0.78rem] font-bold uppercase tracking-wide text-muted";

/**
 * Filters for a large cutoff table: a plain GET form rendered on the server, so it works without
 * JavaScript and every view has a shareable URL. cf=1 marks a sent form, where an empty value
 * (or no quota ticked) means every value; without it the defaults apply.
 */
export function CutoffFilters({ action, view }: { action: string; view: CutoffView }) {
  const { options: o, selected: s } = view;
  return (
    <form action={action} method="get" className="mt-3 rounded-xl border border-rule p-3 sm:p-4">
      <input type="hidden" name="cf" value="1" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {o.years.length > 1 ? (
          <div>
            <label htmlFor="cut-year" className={label}>
              Year
            </label>
            <select id="cut-year" name="year" defaultValue={s.year ?? ""} className={field}>
              <option value="">All years</option>
              {o.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {o.rounds.length ? (
          <div>
            <label htmlFor="cut-round" className={label}>
              Round
            </label>
            <select id="cut-round" name="round" defaultValue={s.round} className={field}>
              <option value="">All rounds</option>
              {o.rounds.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {o.categories.length ? (
          <div>
            <label htmlFor="cut-category" className={label}>
              Category
            </label>
            <select id="cut-category" name="category" defaultValue={s.category} className={field}>
              <option value="">All categories</option>
              {o.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {o.pools.length ? (
          <div>
            <label htmlFor="cut-pool" className={label}>
              Seat pool
            </label>
            <select id="cut-pool" name="pool" defaultValue={s.pool} className={field}>
              <option value="">All seat pools</option>
              {o.pools.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {o.branches.length > 1 ? (
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="cut-branch" className={label}>
              Branch
            </label>
            <select id="cut-branch" name="branch" defaultValue={s.branch} className={field}>
              <option value="">All branches ({o.branches.length})</option>
              {o.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      {o.quotas.length > 1 ? (
        <fieldset className="mt-3">
          <legend className={label}>Quota</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {o.quotas.map((q) => (
              <label key={q} className="flex cursor-pointer items-center gap-2 py-1 text-[0.95rem]">
                <input type="checkbox" name="quota" value={q} defaultChecked={s.quotas.includes(q)} className="size-4 shrink-0 accent-[#0d0f36]" />
                {QUOTA_NAMES[q] ? (
                  <span>
                    <b>{q}</b> <span className="text-ink-soft">{QUOTA_NAMES[q]}</span>
                  </span>
                ) : (
                  q
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-ink-2">
          Show ranks
        </button>
        {view.defaults ? null : (
          <Link href={action} className="font-bold underline underline-offset-2">
            Back to the default view
          </Link>
        )}
      </div>
    </form>
  );
}
