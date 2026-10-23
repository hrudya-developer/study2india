"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

function href(q: string, level?: string, field?: string) {
  const u = new URLSearchParams();
  if (level) u.set("level", level);
  if (field) u.set("field", field);
  if (q.trim()) u.set("q", q.trim());
  const s = u.toString();
  return s ? `/courses?${s}` : "/courses";
}

/**
 * Course name filter. Without script it is a plain GET form; with script it
 * updates the URL as the student types, so every filtered view stays linkable.
 */
export function CourseSearch({ q = "", level, field }: { q?: string; level?: string; field?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow the URL when it changes from outside the box, for example "Clear all".
  // Typed text that matches the URL once trimmed is kept as is, so a trailing space survives.
  if (q !== prevQ) {
    setPrevQ(q);
    if (q !== value.trim()) setValue(q);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function go(next: string) {
    if (timer.current) clearTimeout(timer.current);
    startTransition(() => router.replace(href(next, level, field), { scroll: false }));
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), 300);
  }

  return (
    <form
      action="/courses"
      method="get"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className="relative"
    >
      {level ? <input type="hidden" name="level" value={level} /> : null}
      {field ? <input type="hidden" name="field" value={field} /> : null}
      <label htmlFor="course-q" className="sr-only">
        Search courses by name
      </label>
      <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id="course-q"
        name="q"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search a course, for example B.Tech or nursing"
        autoComplete="off"
        maxLength={80}
        aria-busy={pending}
        className="w-full rounded-lg border border-rule bg-paper py-2.5 pl-10 pr-10 placeholder:text-muted focus:border-ink [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            go("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
          aria-label="Clear search"
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
    </form>
  );
}
