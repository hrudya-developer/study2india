"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

/**
 * A top navigation item with a mega menu. Mouse users open it by hovering; keyboard users get the
 * link plus a separate toggle button (the disclosure pattern), so tabbing past the menu does not
 * walk through every link inside it. Escape closes it and returns focus to the toggle.
 */
export function NavMega({ label, href, panelClass, children }: { label: string; href: string; panelClass: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <li
      ref={rootRef}
      data-open={open}
      className="has-mega group relative flex items-center"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".mega a")) setOpen(false);
      }}
    >
      <Link href={href} className="block rounded-md py-2 pl-3 text-[0.95rem] font-bold text-ink-soft hover:text-ink group-data-[open=true]:text-ink">
        {label}
      </Link>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label} menu`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-7 items-center justify-center rounded-md text-ink-soft hover:text-ink"
      >
        <ChevronDown size={15} className="transition-transform group-hover:rotate-180 group-data-[open=true]:rotate-180" aria-hidden="true" />
      </button>
      <div id={id} className={`mega absolute left-0 top-full pt-2 ${panelClass}`}>
        {children}
      </div>
    </li>
  );
}
