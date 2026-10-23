"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

type Option = { value: string; label: string };
type Group = { label: string; options: Option[] };

/**
 * A dropdown that reads as part of the hero sentence. The trigger is set in the headline type;
 * the list opens as a compact panel (fixed height, scrolls inside, filter box on top) rather than
 * the browser's native list, which cannot be height-limited.
 */
export function SentenceSelect({
  id,
  name,
  label,
  placeholder,
  defaultValue = "",
  options = [],
  groups = [],
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  options?: Option[];
  groups?: Group[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [shift, setShift] = useState(0);
  const rootRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const allGroups: Group[] = useMemo(() => [{ label: "", options: [{ value: "", label: placeholder }, ...options] }, ...groups], [options, groups, placeholder]);
  const flat = useMemo(() => allGroups.flatMap((g) => g.options), [allGroups]);
  const shown = flat.find((o) => o.value === value)?.label ?? placeholder;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      allGroups
        .map((g) => ({ ...g, options: g.options.filter((o) => !q || o.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
        .filter((g) => g.options.length),
    [allGroups, q],
  );
  const visible = filtered.flatMap((g) => g.options);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    // Keep the panel on screen: shift it left when the trigger sits near the right edge.
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(320, window.innerWidth * 0.85);
      setShift(Math.min(0, window.innerWidth - 16 - rect.left - width));
    }
    inputRef.current?.focus();
    const i = visible.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(v: string) {
    setValue(v);
    setOpen(false);
    setQuery("");
    document.getElementById(id)?.focus();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visible[active]) choose(visible[active].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      document.getElementById(id)?.focus();
    }
  }

  let index = -1;
  return (
    <span ref={rootRef} className="relative inline-block max-w-full align-baseline">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        aria-label={`${label}: ${shown}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex max-w-full items-center gap-2 border-b-[3px] border-brand pb-0.5 pr-1 text-left font-[inherit] hover:bg-brand-soft"
      >
        <span className="truncate">{shown}</span>
        <ChevronDown className={`size-[0.6em] shrink-0 text-brand transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={3} aria-hidden="true" />
      </button>

      {open ? (
        <span style={{ left: shift }} className="absolute top-full z-50 mt-2 block w-[min(320px,85vw)] overflow-hidden rounded-xl border border-rule bg-paper font-sans text-base font-normal shadow-[var(--shadow-lift)]">
          <span className="relative block border-b border-rule p-2">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              placeholder={`Type to filter ${label.toLowerCase()}`}
              aria-label={`Filter ${label.toLowerCase()}`}
              aria-controls={listId}
              aria-activedescendant={visible[active] ? `${listId}-${active}` : undefined}
              className="w-full rounded-lg border border-rule bg-band py-2 pl-8 pr-3 text-[0.95rem] focus:border-ink focus:bg-paper"
            />
          </span>
          <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="max-h-[300px] overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? <li className="px-4 py-3 text-[0.92rem] text-muted">No match for &ldquo;{query}&rdquo;</li> : null}
            {filtered.map((g) => (
              <li key={g.label || "_"} role="presentation">
                {g.label ? <span className="block px-4 pb-1 pt-2.5 text-[0.78rem] font-bold text-muted">{g.label}</span> : null}
                <ul role="group" aria-label={g.label || undefined}>
                  {g.options.map((o) => {
                    index++;
                    const i = index;
                    const selected = o.value === value;
                    return (
                      <li
                        key={o.value || "_any"}
                        id={`${listId}-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActive(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choose(o.value)}
                        className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[0.95rem] ${i === active ? "bg-brand-soft text-ink" : "text-ink-soft"} ${selected ? "font-bold text-ink" : ""} ${g.label ? "pl-6" : ""}`}
                      >
                        <span>{o.label}</span>
                        {selected ? <Check size={16} className="shrink-0 text-brand-hover" aria-hidden="true" /> : null}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </span>
      ) : null}
    </span>
  );
}
