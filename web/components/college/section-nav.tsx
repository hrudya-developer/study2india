"use client";

import { useEffect, useRef, useState } from "react";

/** Sticky in-page navigation that marks the section being read. Plain anchor links without script. */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const targets = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        // The topmost section still in the reading band wins.
        const first = sections.find((s) => visible.has(s.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    const list = listRef.current;
    if (!el || !list) return;
    const left = el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="College sections" className="sticky top-[100px] z-30 border-b border-rule bg-paper/95 backdrop-blur">
      <ul ref={listRef} className="scroll-row mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
        {sections.map((s) => (
          <li key={s.id} data-id={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              onClick={() => setActive(s.id)}
              className={`block whitespace-nowrap border-b-[3px] px-3 py-3 text-[0.93rem] font-bold ${
                active === s.id ? "border-brand text-ink" : "border-transparent text-ink-soft hover:border-rule hover:text-ink"
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
