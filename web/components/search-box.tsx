"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, BookOpen, FileText, MapPin, Sparkles, History, TrendingUp, ArrowRight, X } from "lucide-react";
import { landingPath } from "@/lib/seo";

type Item = { label: string; href: string; meta?: string };
type Result = {
  q: string;
  quick: Item[];
  colleges: Item[];
  collegeTotal: number;
  courses: Item[];
  exams: Item[];
  states: Item[];
};
type Group = { key: string; label: string; icon: typeof Search; items: Item[]; note?: string };

/** Starting points shown before the student types. All are real pages with real filters. */
const POPULAR: Item[] = [
  { label: "MBBS colleges in Karnataka", href: landingPath("mbbs", "karnataka") },
  { label: "B.Sc Nursing colleges in Kerala", href: landingPath("bsc-nursing", "kerala") },
  { label: "BDS colleges in Tamil Nadu", href: landingPath("bds", "tamil-nadu") },
  { label: "NEET UG", href: "/exam/neet-ug" },
  { label: "B.Tech colleges in Kerala", href: landingPath("btech", "kerala") },
  { label: "NIRF rankings", href: "/rankings" },
];

const RECENT_KEY = "s2i-recent-searches";
const cache = new Map<string, Result>();

/** A same-site path only: one leading "/", not "//host" or "/\host", which browsers treat as another site. */
function isLocalHref(href: unknown): href is string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\");
}

function readRecent(): Item[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as Item[]) : [];
    return Array.isArray(list) ? list.filter((x) => x && typeof x.label === "string" && isLocalHref(x.href)).slice(0, 4) : [];
  } catch {
    return [];
  }
}

function saveRecent(item: Item) {
  try {
    const next = [item, ...readRecent().filter((x) => x.href !== item.href)].slice(0, 4);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* Storage can be blocked; recent searches are a convenience only. */
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bold the parts of a suggestion that match what was typed. */
function Highlight({ text, q }: { text: string; q: string }) {
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-transparent font-bold text-ink">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export type SearchBoxProps = {
  id: string;
  variant?: "hero" | "header" | "page" | "sheet";
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** Focus this box when "/" is pressed anywhere on the page. */
  shortcut?: boolean;
  onNavigate?: () => void;
};

export function SearchBox({ id, variant = "hero", defaultValue = "", placeholder = "Search a college, course, exam or state", autoFocus, shortcut, onNavigate }: SearchBoxProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [recent, setRecent] = useState<Item[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const q = value.trim();
  const typed = q.replace(/[^a-z0-9]/gi, "").length >= 2;

  // Fetch suggestions as the student types, debounced, cancelling stale requests.
  useEffect(() => {
    if (!typed) {
      setResult(null);
      setStatus("idle");
      return;
    }
    const key = q.toLowerCase();
    const hit = cache.get(key);
    if (hit) {
      setResult(hit);
      setStatus("idle");
      return;
    }
    const ctrl = new AbortController();
    setStatus("loading");
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Result;
        cache.set(key, data);
        setResult(data);
        setStatus("idle");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
      }
    }, 140);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q, typed]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      const input = inputRef.current;
      if (!input || input.offsetParent === null) return;
      e.preventDefault();
      input.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const groups: Group[] = useMemo(() => {
    if (!typed) {
      const g: Group[] = [];
      if (recent.length) g.push({ key: "recent", label: "Recent", icon: History, items: recent });
      g.push({ key: "popular", label: "Popular searches", icon: TrendingUp, items: POPULAR });
      return g;
    }
    if (!result || result.q.toLowerCase() !== q.toLowerCase()) return [];
    const total = result.collegeTotal;
    return [
      { key: "quick", label: "Best match", icon: Sparkles, items: result.quick },
      { key: "colleges", label: "Colleges", icon: Building2, items: result.colleges, note: total > result.colleges.length ? `${total.toLocaleString("en-IN")} match` : undefined },
      { key: "courses", label: "Courses", icon: BookOpen, items: result.courses },
      { key: "exams", label: "Entrance exams", icon: FileText, items: result.exams },
      { key: "states", label: "States", icon: MapPin, items: result.states },
    ].filter((g) => g.items.length);
  }, [typed, recent, result, q]);

  const seeAll: Item | null = typed ? { label: `See all results for "${q}"`, href: `/search?q=${encodeURIComponent(q)}` } : null;
  const flat = useMemo(() => [...groups.flatMap((g) => g.items), ...(seeAll ? [seeAll] : [])], [groups, seeAll]);
  const resultCount = groups.reduce((n, g) => n + g.items.length, 0);

  const go = useCallback(
    (item: Item, remember: Item = item) => {
      saveRecent(remember);
      setOpen(false);
      inputRef.current?.blur();
      onNavigate?.();
      router.push(item.href);
    },
    [router, onNavigate],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((a) => (flat.length ? (a + 1) % flat.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((a) => (flat.length ? (a <= 0 ? flat.length - 1 : a - 1) : -1));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && flat[active]) {
        e.preventDefault();
        go(flat[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (value) {
        e.preventDefault();
        setValue("");
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(`${listId}-o${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  const isHeader = variant === "header";
  const inline = variant === "sheet";
  const showPanel = open && (groups.length > 0 || typed);

  const wrap = {
    hero: "flex items-center gap-2 rounded-2xl border-2 border-ink bg-paper p-1.5 pl-4 shadow-[var(--shadow-lift)] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/25",
    page: "flex items-center gap-2 rounded-xl bg-paper p-1.5 pl-4 focus-within:ring-4 focus-within:ring-brand",
    sheet: "flex items-center gap-2 rounded-xl border-2 border-ink bg-paper p-1 pl-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/25",
    header: "flex items-center gap-2 rounded-full border border-rule bg-band py-1 pl-3 pr-1 focus-within:border-brand focus-within:bg-paper focus-within:ring-2 focus-within:ring-brand/40",
  }[variant];

  const input = {
    hero: "py-2.5 text-[1.05rem] sm:text-[1.1rem]",
    page: "py-2.5 text-[1.05rem]",
    sheet: "py-2.5 text-[1.05rem]",
    header: "py-1 text-[0.92rem]",
  }[variant];

  let index = -1;
  return (
    <div ref={rootRef} className={`relative ${inline ? "" : "w-full"}`}>
      <form
        action="/search"
        method="get"
        role="search"
        onSubmit={(e) => {
          if (!q) {
            e.preventDefault();
            inputRef.current?.focus();
            return;
          }
          e.preventDefault();
          go({ label: q, href: `/search?q=${encodeURIComponent(q)}` });
        }}
      >
        <label htmlFor={id} className="sr-only">
          Search colleges, courses, exams and states
        </label>
        <div className={wrap}>
          <Search size={isHeader ? 16 : 20} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            id={id}
            name="q"
            type="text"
            maxLength={80}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-activedescendant={showPanel && active >= 0 ? `${listId}-o${active}` : undefined}
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => {
              setRecent(readRecent());
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            className={`search-input min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted ${input}`}
          />
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setValue("");
                setActive(-1);
                inputRef.current?.focus();
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-band hover:text-ink"
            >
              <X size={isHeader ? 15 : 18} aria-hidden="true" />
            </button>
          ) : isHeader ? (
            <kbd className="mr-2 hidden rounded border border-rule bg-paper px-1.5 text-[0.75rem] font-bold text-muted xl:inline" aria-hidden="true">
              /
            </kbd>
          ) : null}
          {isHeader ? null : (
            <button type="submit" className="shrink-0 rounded-xl bg-brand px-4 py-2.5 font-bold text-ink hover:bg-brand-hover sm:px-6">
              <span className="sr-only sm:not-sr-only">Search</span>
              <ArrowRight size={18} className="sm:hidden" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      <p className="sr-only" aria-live="polite">
        {open && typed && status === "idle" && result ? (resultCount ? `${resultCount} suggestions. Use the up and down arrows to choose.` : "No suggestions.") : ""}
      </p>

      <div
        className={
          showPanel
            ? inline
              ? "mt-3"
              : `absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-rule bg-paper shadow-[var(--shadow-lift)] ${isHeader ? "right-0 w-[min(34rem,calc(100vw-2rem))]" : "left-0 w-full"}`
            : "hidden"
        }
      >
        <div role="listbox" id={listId} aria-label="Search suggestions" className={inline ? "" : "max-h-[min(70vh,34rem)] overflow-y-auto overscroll-contain py-2"}>
          {typed && status === "loading" && !groups.length ? <p className="px-4 py-3 text-[0.92rem] text-muted">Searching...</p> : null}
          {typed && status === "error" ? <p className="px-4 py-3 text-[0.92rem] text-muted">Suggestions are not available right now. Press Enter to search.</p> : null}
          {typed && status === "idle" && result && !groups.length ? (
            <p className="px-4 py-3 text-[0.92rem] text-ink-soft">
              No match for &ldquo;{q}&rdquo;. Try a shorter word, a course such as MBBS, or a state.
            </p>
          ) : null}
          {groups.map((g) => (
            <div key={g.key} role="group" aria-labelledby={`${listId}-${g.key}`} className="py-1">
              <p id={`${listId}-${g.key}`} className="flex items-center justify-between gap-3 px-4 pb-1 pt-2 text-[0.78rem] font-bold uppercase tracking-wide text-muted">
                <span>{g.label}</span>
                {g.note ? <span className="normal-case tracking-normal">{g.note}</span> : null}
              </p>
              {g.items.map((item) => {
                index++;
                const i = index;
                const Icon = g.icon;
                return (
                  <a
                    key={`${g.key}-${item.href}`}
                    id={`${listId}-o${i}`}
                    role="option"
                    aria-selected={i === active}
                    href={item.href}
                    tabIndex={-1}
                    onMouseMove={() => active !== i && setActive(i)}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      go(item);
                    }}
                    className={`flex items-start gap-3 px-4 py-2 ${i === active ? "bg-brand-soft" : ""} ${g.key === "quick" ? "font-bold" : ""}`}
                  >
                    <Icon size={17} className={`mt-0.5 shrink-0 ${g.key === "quick" ? "text-brand-hover" : "text-muted"}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.95rem] leading-snug text-ink-soft">{typed ? <Highlight text={item.label} q={q} /> : item.label}</span>
                      {item.meta ? <span className="block truncate text-[0.82rem] font-normal text-muted">{item.meta}</span> : null}
                    </span>
                  </a>
                );
              })}
            </div>
          ))}
          {seeAll ? (
            <a
              id={`${listId}-o${flat.length - 1}`}
              role="option"
              aria-selected={active === flat.length - 1}
              href={seeAll.href}
              tabIndex={-1}
              onMouseMove={() => setActive(flat.length - 1)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                go(seeAll, { label: q, href: seeAll.href });
              }}
              className={`mt-1 flex items-center gap-2 border-t border-rule px-4 py-3 text-[0.92rem] font-bold text-brand-hover ${active === flat.length - 1 ? "bg-brand-soft" : ""}`}
            >
              <Search size={16} aria-hidden="true" />
              <span className="min-w-0 truncate">{seeAll.label}</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
