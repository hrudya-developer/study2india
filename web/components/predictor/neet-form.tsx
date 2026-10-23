"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Search } from "lucide-react";

type Option = { value: string; label: string };
type QuotaOption = Option & { note: string | null };

type Props = {
  courses: Option[];
  categories: Option[];
  /** Quotas in the lists per course, the default ones first. */
  quotas: Record<string, QuotaOption[]>;
  /** Quotas included when none is chosen: those open to every candidate. */
  defaults: Record<string, string[]>;
  states: Option[];
  ownership: Option[];
  initial: { rank: string; course: string; category: string; quotas: string[]; state: string | null; ownership: string[] };
  rankError: string | null;
};

const field = "w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-[0.98rem] focus:border-ink";
const legend = "mb-1.5 block text-[0.82rem] font-bold uppercase tracking-wide text-muted";

/**
 * The predictor's inputs. Without JavaScript it is a plain GET form; with it, empty and default
 * values are left out of the URL so a shared link stays short. Nothing typed here leaves the page
 * except as URL parameters: there is no sign-up and no contact field.
 */
export function NeetPredictorForm({ courses, categories, quotas, defaults, states, ownership, initial, rankError }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [course, setCourse] = useState(initial.course);
  const [picked, setPicked] = useState<string[]>(initial.quotas);
  const [error, setError] = useState<string | null>(rankError);
  const courseQuotas = quotas[course] ?? [];
  const isDefault = (course: string, list: string[]) => {
    const d = defaults[course] ?? [];
    return list.length === d.length && list.every((q) => d.includes(q));
  };
  const extraCount = (initial.state ? 1 : 0) + initial.ownership.length + (isDefault(initial.course, initial.quotas) ? 0 : 1);

  function onCourse(next: string) {
    setCourse(next);
    // Quota names differ by course (B.Sc Nursing has its own), so start again from the defaults.
    setPicked(defaults[next] ?? []);
  }

  function toggleQuota(q: string, on: boolean) {
    setPicked((list) => (on ? [...new Set([...list, q])] : list.filter((x) => x !== q)));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const rank = String(data.get("rank") ?? "").replace(/[\s,_]/g, "");
    if (!/^\d+$/.test(rank) || Number(rank) < 1 || Number(rank) > 2_500_000) {
      setError("Enter your NEET UG All India Rank, a whole number from 1 to 25,00,000.");
      (e.currentTarget.elements.namedItem("rank") as HTMLInputElement | null)?.focus();
      return;
    }
    setError(null);
    const u = new URLSearchParams();
    u.set("rank", String(Number(rank)));
    const c = String(data.get("course") ?? "mbbs");
    if (c !== "mbbs") u.set("course", c);
    const cat = String(data.get("category") ?? "open");
    if (cat !== "open") u.set("category", cat);
    const qs = data.getAll("quota").map(String);
    if (qs.length && !isDefault(c, qs)) for (const q of qs) u.append("quota", q);
    const st = String(data.get("state") ?? "");
    if (st) u.set("state", st);
    for (const o of data.getAll("ownership").map(String)) u.append("ownership", o);
    startTransition(() => router.push(`/predictor/neet?${u.toString()}#results`));
  }

  return (
    <form action="/predictor/neet" method="get" onSubmit={onSubmit} className="space-y-5" aria-busy={pending} noValidate>
      <div>
        <label htmlFor="p-rank" className={legend}>
          NEET UG All India Rank
        </label>
        <input
          id="p-rank"
          name="rank"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="search"
          required
          maxLength={12}
          defaultValue={initial.rank}
          placeholder="e.g. 45000"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "p-rank-error" : "p-rank-hint"}
          className={`${field} tabular text-[1.1rem] font-bold aria-[invalid=true]:border-[#b42318]`}
        />
        {error ? (
          <p id="p-rank-error" className="mt-1.5 text-[0.88rem] text-[#b42318]">
            {error}
          </p>
        ) : (
          <p id="p-rank-hint" className="mt-1.5 text-[0.85rem] text-muted">
            Your rank on the NTA scorecard, not your category rank.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="p-category" className={legend}>
          Category
        </label>
        <select id="p-category" name="category" defaultValue={initial.category} className={field}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={legend}>Course</legend>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-rule bg-band p-1">
          {courses.map((c) => (
            <label
              key={c.value}
              className="flex cursor-pointer items-center justify-center rounded-md px-2 py-2 text-center text-[0.92rem] font-bold text-ink-soft has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand"
            >
              <input type="radio" name="course" value={c.value} checked={course === c.value} onChange={() => onCourse(c.value)} className="sr-only" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <details className="group rounded-lg border border-rule" open={extraCount > 0}>
        <summary className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-[0.95rem] font-bold">
          More options: quotas, state, ownership
          {extraCount ? <span className="tabular rounded-full bg-ink px-2 text-[0.8rem] text-white">{extraCount}</span> : null}
        </summary>
        <div className="space-y-5 border-t border-rule px-3 pb-4 pt-3">
          <fieldset>
            <legend className={legend}>Quotas to include</legend>
            <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {courseQuotas.map((q) => (
                <li key={q.value}>
                  <label className="flex cursor-pointer items-start gap-2 py-1 text-[0.92rem]">
                    <input
                      type="checkbox"
                      name="quota"
                      value={q.value}
                      checked={picked.includes(q.value)}
                      onChange={(e) => toggleQuota(q.value, e.target.checked)}
                      className="mt-1 size-4 shrink-0 accent-[#0d0f36]"
                    />
                    <span>
                      {q.label}
                      {q.note ? <span className="block text-[0.8rem] text-muted">{q.note}</span> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-[0.82rem] text-muted">Quota names are exactly as MCC prints them. The ones ticked at first are open to every candidate; most others have their own eligibility rules.</p>
          </fieldset>

          <div>
            <label htmlFor="p-state" className={legend}>
              College state
            </label>
            <select id="p-state" name="state" defaultValue={initial.state ?? ""} className={field}>
              <option value="">Any state</option>
              {states.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className={legend}>Ownership</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {ownership.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2 py-1 text-[0.92rem]">
                  <input type="checkbox" name="ownership" value={o.value} defaultChecked={initial.ownership.includes(o.value)} className="size-4 accent-[#0d0f36]" />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-bold text-ink hover:bg-brand-hover disabled:opacity-70">
        <Search size={18} aria-hidden="true" />
        {pending ? "Finding colleges..." : "Show my colleges"}
      </button>
      <p className="text-center text-[0.82rem] text-muted">Free, instant and no sign-up. We do not ask for your phone or email.</p>
    </form>
  );
}
