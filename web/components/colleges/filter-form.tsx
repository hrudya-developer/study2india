"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { CollegeFacets, CollegeFilters, FacetOption } from "@/lib/queries/colleges";

type Props = {
  facets: CollegeFacets;
  cities: FacetOption[];
  filters: CollegeFilters;
  /** Prefix for element ids, so the sidebar and the phone sheet can both be on the page. */
  idPrefix: string;
  /** Apply on every change (desktop sidebar); otherwise wait for the Apply button (phone sheet). */
  autoApply?: boolean;
  onApplied?: () => void;
};

const field = "w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-[0.95rem] focus:border-ink";
const legend = "mb-1.5 text-[0.82rem] font-bold uppercase tracking-wide text-muted";
const count = (n: number) => <span className="tabular ml-auto pl-2 text-[0.82rem] text-muted">{n.toLocaleString("en-IN")}</span>;

export function FilterForm({ facets, cities, filters: f, idPrefix, autoApply, onApplied }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [stream, setStream] = useState(f.stream ?? "");
  const [state, setState] = useState(f.state ?? "");
  const id = (k: string) => `${idPrefix}-${k}`;

  const courseStream = new Map(facets.courses.map((c) => [c.value, c.streamSlug]));
  const courseGroups = facets.streams
    .filter((s) => !stream || s.value === stream)
    .map((s) => ({ ...s, courses: facets.courses.filter((c) => c.streamSlug === s.value) }))
    .filter((g) => g.courses.length);

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const u = new URLSearchParams();
    for (const [k, v] of data.entries()) {
      const s = String(v).trim();
      if (s) u.append(k, s);
    }
    // A district belongs to one state, and a course to one field: drop the stale half of a pair.
    if (u.get("state") !== (f.state ?? null) || !u.get("state")) u.delete("city");
    const c = u.get("course");
    if (c && u.get("stream") && courseStream.get(c) !== u.get("stream")) {
      if (u.get("stream") !== (f.stream ?? null)) u.delete("course");
      else u.delete("stream");
    }
    if (f.sort !== "relevance") u.set("sort", f.sort);
    const qs = u.toString();
    startTransition(() => {
      router.push(qs ? `/colleges?${qs}` : "/colleges");
      onApplied?.();
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply(e.currentTarget);
  }

  function onChange(e: FormEvent<HTMLFormElement>) {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    if (t.name === "stream") setStream(t.value);
    if (t.name === "state") setState(t.value);
    if (autoApply && t.type !== "search" && formRef.current) apply(formRef.current);
  }

  const showCities = !!state && state === f.state && cities.length > 0;

  return (
    <form ref={formRef} action="/colleges" method="get" onSubmit={onSubmit} onChange={onChange} className="space-y-6" aria-busy={pending}>
      <div>
        <label htmlFor={id("q")} className={legend + " block"}>
          Name or city
        </label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id={id("q")} name="q" type="search" defaultValue={f.q} placeholder="e.g. Jadavpur, Kochi" enterKeyHint="search" className={field + " pl-9"} />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor={id("stream")} className={legend + " block"}>
            Field of study
          </label>
          <select id={id("stream")} name="stream" defaultValue={f.stream ?? ""} className={field}>
            <option value="">All fields</option>
            {facets.streams.map((s) => (
              <option key={s.value} value={s.value} disabled={!s.count}>
                {s.label} ({s.count.toLocaleString("en-IN")})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("course")} className={legend + " block"}>
            Course
          </label>
          <select id={id("course")} name="course" defaultValue={f.course ?? ""} className={field}>
            <option value="">Any course</option>
            {courseGroups.map((g) => (
              <optgroup key={g.value} label={g.label}>
                {g.courses.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                    {c.count ? ` (${c.count.toLocaleString("en-IN")})` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={legend}>Course level</legend>
        <div className="flex flex-wrap gap-2">
          {[{ value: "", label: "Any", count: 0 }, ...facets.levels].map((l) => (
            <label key={l.value || "any"} className="cursor-pointer">
              <input type="radio" name="level" value={l.value} defaultChecked={(f.level ?? "") === l.value} className="peer sr-only" />
              <span className="inline-block rounded-full border border-rule px-3 py-1.5 text-[0.88rem] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-brand">
                {l.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-3">
        <div>
          <label htmlFor={id("state")} className={legend + " block"}>
            State
          </label>
          <select id={id("state")} name="state" defaultValue={f.state ?? ""} className={field}>
            <option value="">All states</option>
            {facets.states
              .filter((s) => s.count > 0)
              .map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} ({s.count.toLocaleString("en-IN")})
                </option>
              ))}
          </select>
        </div>
        {showCities ? (
          <div>
            <label htmlFor={id("city")} className={legend + " block"}>
              District or city
            </label>
            <select id={id("city")} name="city" defaultValue={f.city ?? ""} className={field}>
              <option value="">All in this state</option>
              {cities.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({c.count.toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>
        ) : state && state !== f.state ? (
          <p className="text-[0.85rem] text-muted">Apply to pick a district in this state.</p>
        ) : null}
      </div>

      <fieldset>
        <legend className={legend}>Ownership</legend>
        <div className="space-y-1">
          {facets.ownership.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-[0.95rem]">
              <input type="checkbox" name="ownership" value={o.value} defaultChecked={f.ownership.includes(o.value)} className="size-4 shrink-0 accent-[#0d0f36]" />
              {o.label}
              {count(o.count)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Approved or listed by</legend>
        <div className="space-y-1">
          {facets.approvals.map((a) => (
            <label key={a.value} className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-[0.95rem]">
              <input type="checkbox" name="approval" value={a.value} defaultChecked={f.approval.includes(a.value)} className="size-4 shrink-0 accent-[#0d0f36]" />
              {a.label}
              {count(a.count)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Ranking</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-[0.95rem]">
          <input type="checkbox" name="ranked" value="1" defaultChecked={f.ranked} className="size-4 shrink-0 accent-[#0d0f36]" />
          Only NIRF ranked
        </label>
      </fieldset>

      <div className={"flex items-center gap-3 border-t border-rule pt-4" + (autoApply ? "" : " sticky bottom-0 -mx-5 -mb-6 bg-paper px-5 pb-4")}>
        <button type="submit" className="flex-1 rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-ink-2 disabled:opacity-60" disabled={pending}>
          {pending ? "Updating..." : "Apply filters"}
        </button>
        <Link href={f.sort !== "relevance" ? `/colleges?sort=${f.sort}` : "/colleges"} className="px-2 py-2.5 font-bold text-ink-soft underline underline-offset-4 hover:text-ink" onClick={() => onApplied?.()}>
          Reset
        </Link>
      </div>
      <p aria-live="polite" className="sr-only">
        {pending ? "Updating results" : ""}
      </p>
    </form>
  );
}
