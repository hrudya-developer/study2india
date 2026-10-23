"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { addToShortlist, removeFromShortlist, useShortlist, SHORTLIST_MAX, type ShortlistItem } from "./shortlist-store";

type Variant = "card" | "hero";

const styles: Record<Variant, { base: string; off: string; on: string }> = {
  card: {
    base: "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[0.9rem] font-bold",
    off: "border-rule text-ink hover:border-ink",
    on: "border-verified bg-verified-bg text-verified",
  },
  hero: {
    base: "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 font-bold",
    off: "border-white/30 text-white hover:bg-white/10",
    on: "border-white bg-white text-ink hover:bg-white/90",
  },
};

export function ShortlistButton({ item, variant = "card" }: { item: ShortlistItem; variant?: Variant }) {
  const list = useShortlist();
  const [error, setError] = useState<string | null>(null);
  const saved = !!list?.some((x) => x.slug === item.slug);
  const s = styles[variant];

  function toggle() {
    setError(null);
    const ok = saved ? removeFromShortlist(item.slug) : addToShortlist(item);
    if (!ok) {
      setError(
        !saved && (list?.length ?? 0) >= SHORTLIST_MAX
          ? `Your shortlist is full (${SHORTLIST_MAX}). Remove one first.`
          : "Your browser blocked saving. Shortlist needs site storage turned on.",
      );
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={toggle} aria-pressed={saved} className={`${s.base} ${saved ? s.on : s.off}`}>
        {saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
        {saved ? "Shortlisted" : "Shortlist"}
      </button>
      {error ? (
        <span role="alert" className={`mt-1 max-w-[16rem] text-[0.8rem] ${variant === "hero" ? "text-[#ffd9b0]" : "text-[#a33a00]"}`}>
          {error}
        </span>
      ) : null}
    </span>
  );
}

/** "Shortlist (3)" link for toolbars; renders the bare link before the browser store is read. */
export function ShortlistLink({ className }: { className?: string }) {
  const list = useShortlist();
  const n = list?.length ?? 0;
  return (
    <Link href="/colleges/shortlist" className={className}>
      <Bookmark size={16} aria-hidden="true" />
      Shortlist
      {n ? <span className="tabular rounded-full bg-brand px-1.5 text-[0.78rem] font-bold text-ink">{n}</span> : null}
    </Link>
  );
}
