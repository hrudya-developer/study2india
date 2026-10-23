"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Scale, Trash2 } from "lucide-react";
import { clearShortlist, removeFromShortlist, useShortlist } from "./shortlist-store";
import { COMPARE_MAX } from "./limits";

export function ShortlistView() {
  const list = useShortlist();
  const [picked, setPicked] = useState<string[]>([]);

  if (list === null) {
    return <p className="card p-6 text-ink-soft">Reading your shortlist from this browser...</p>;
  }

  if (!list.length) {
    return (
      <div className="card p-6">
        <h2 className="text-2xl font-bold">Your shortlist is empty</h2>
        <p className="mt-2 max-w-[60ch] text-ink-soft">
          Tap Shortlist on any college to keep it here. The list stays in this browser only: no account, no phone number needed.
        </p>
        <Link href="/colleges" className="mt-5 inline-block rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-ink-2">
          Browse colleges
        </Link>
      </div>
    );
  }

  const live = picked.filter((s) => list.some((x) => x.slug === s));
  const toggle = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length >= COMPARE_MAX ? p : [...p, slug]));
  const compareHref = `/colleges/compare?c=${live.join(",")}`;

  return (
    <div>
      <div className="card sticky top-[108px] z-10 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-[0.95rem] text-ink-soft">
          {live.length ? (
            <>
              <b className="text-ink">{live.length}</b> of up to {COMPARE_MAX} picked to compare
            </>
          ) : (
            `Tick 2 to ${COMPARE_MAX} colleges to compare them side by side.`
          )}
        </p>
        {live.length >= 2 ? (
          <Link href={compareHref} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 font-bold text-ink hover:bg-brand-hover">
            <Scale size={16} aria-hidden="true" />
            Compare {live.length}
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-band px-4 py-2 font-bold text-muted" aria-disabled="true">
            <Scale size={16} aria-hidden="true" />
            Compare
          </span>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {list.map((item) => {
          const on = live.includes(item.slug);
          const full = !on && live.length >= COMPARE_MAX;
          return (
            <li key={item.slug} className={`card flex items-center gap-3 p-4 ${on ? "border-brand" : ""}`}>
              <input
                type="checkbox"
                id={`pick-${item.slug}`}
                checked={on}
                disabled={full}
                onChange={() => toggle(item.slug)}
                className="size-5 shrink-0 accent-[#0d0f36]"
                aria-label={`Pick ${item.name} to compare`}
              />
              <div className="min-w-0 flex-1">
                <Link href={`/college/${item.slug}`} className="font-bold leading-snug hover:text-brand-hover hover:underline">
                  {item.name}
                </Link>
                {item.place ? (
                  <p className="mt-0.5 flex items-center gap-1 text-[0.88rem] text-muted">
                    <MapPin size={14} aria-hidden="true" />
                    {item.place}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeFromShortlist(item.slug)}
                className="shrink-0 rounded-lg p-2 text-ink-soft hover:bg-band hover:text-ink"
                aria-label={`Remove ${item.name} from shortlist`}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Remove every college from your shortlist?")) clearShortlist();
        }}
        className="mt-5 font-bold text-ink-soft underline underline-offset-4 hover:text-ink"
      >
        Clear shortlist
      </button>
    </div>
  );
}

/** On the compare page: add colleges from the shortlist that are not in the table yet. */
export function CompareFromShortlist({ current }: { current: string[] }) {
  const list = useShortlist();
  if (!list) return null;
  const options = list.filter((x) => !current.includes(x.slug));
  if (!options.length) return null;
  const room = current.length < COMPARE_MAX;
  return (
    <div>
      <h3 className="text-[0.85rem] font-bold uppercase tracking-wide text-muted">From your shortlist</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {options.slice(0, 12).map((x) => (
          <li key={x.slug}>
            {room ? (
              <Link
                href={`/colleges/compare?c=${[...current, x.slug].join(",")}`}
                className="inline-block rounded-lg border border-rule bg-paper px-3 py-1.5 text-[0.9rem] font-bold hover:border-ink"
              >
                + {x.name}
              </Link>
            ) : (
              <span className="inline-block rounded-lg border border-rule px-3 py-1.5 text-[0.9rem] text-muted">{x.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
