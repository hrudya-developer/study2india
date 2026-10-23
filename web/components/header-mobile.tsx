"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Search, X, ChevronDown, Phone, MessageCircle } from "lucide-react";
import { SearchBox } from "@/components/search-box";
import { CONTACT, STREAMS, STATES } from "@/data/reference";
import { slugify } from "@/lib/slug";
import { courseBySlug, examBySlug, COURSE_GROUPS, EXAM_GROUPS, pick } from "@/components/nav-data";

/** Opens a native modal dialog: focus stays inside, Escape closes it, the page behind is inert. */
function useDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => setOpen(false);
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  return {
    ref,
    open,
    show: () => {
      ref.current?.showModal();
      setOpen(true);
    },
    close: () => ref.current?.close(),
  };
}

/** Links inside the phone menu, grouped into sections that open one at a time. */
function MobileNavLinks() {
  const section = "group border-b border-rule";
  const summary = "flex min-h-12 cursor-pointer list-none items-center justify-between px-3 font-bold";
  const link = "block rounded-lg px-3 py-2 text-[0.95rem] text-ink-soft hover:bg-band";
  const chevron = <ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden="true" />;
  return (
    <nav aria-label="Menu">
      <ul className="mb-2">
        {[
          ["/colleges", "All colleges"],
          ["/courses", "All courses"],
          ["/exams", "Entrance exams"],
          ["/rankings", "NIRF rankings"],
          ["/scholarships", "Scholarships"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="flex min-h-12 items-center rounded-lg px-3 font-bold hover:bg-band">
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <details className={section}>
        <summary className={summary}>Colleges by field {chevron}</summary>
        <ul className="grid grid-cols-2 pb-3">
          {STREAMS.map((s) => (
            <li key={s.slug}>
              <Link href={`/colleges?stream=${s.slug}`} className={link}>
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      <details className={section}>
        <summary className={summary}>Colleges by state {chevron}</summary>
        <ul className="grid grid-cols-2 pb-3">
          {STATES.map((s) => (
            <li key={s.code}>
              <Link href={`/colleges?state=${slugify(s.name)}`} className={link}>
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      <details className={section}>
        <summary className={summary}>Popular courses {chevron}</summary>
        <ul className="grid grid-cols-2 pb-3">
          {pick(courseBySlug, COURSE_GROUPS.flatMap((g) => g.slugs)).map((c) => (
            <li key={c.slug}>
              <Link href={`/course/${c.slug}`} className={link}>
                {c.short}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      <details className={section}>
        <summary className={summary}>Entrance exams {chevron}</summary>
        <ul className="grid grid-cols-2 pb-3">
          {pick(examBySlug, EXAM_GROUPS.flatMap((g) => g.slugs)).map((e) => (
            <li key={e.slug}>
              <Link href={`/exam/${e.slug}`} className={link}>
                {e.short}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      <div className="mt-5 space-y-2 px-1">
        <Link href="/counselling" className="flex min-h-12 items-center justify-center rounded-lg bg-brand px-4 font-bold text-ink hover:bg-brand-hover">
          Book free counselling
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <a href={CONTACT.phoneHref} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-rule font-bold hover:bg-band">
            <Phone size={17} aria-hidden="true" /> Call
          </a>
          <a href={CONTACT.whatsappHref} rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-rule font-bold hover:bg-band">
            <MessageCircle size={17} aria-hidden="true" /> WhatsApp
          </a>
        </div>
        <p className="px-2 pt-2 text-[0.85rem] text-muted">
          <span className="tabular">{CONTACT.phone}</span>, {CONTACT.branches.length} offices in Kerala
        </p>
      </div>
    </nav>
  );
}

/** Slide-in navigation for phones and tablets. Its links render only while it is open. */
export function MobileMenu() {
  const d = useDialog();
  return (
    <>
      <button
        type="button"
        onClick={d.show}
        aria-haspopup="dialog"
        aria-expanded={d.open}
        aria-controls="mobile-nav"
        className="flex h-11 items-center gap-1.5 rounded-lg border border-rule px-3 text-[0.92rem] font-bold hover:bg-band"
      >
        <Menu size={19} aria-hidden="true" />
        <span>Menu</span>
      </button>
      <dialog
        ref={d.ref}
        id="mobile-nav"
        aria-label="Site menu"
        className="drawer bg-paper text-ink"
        onClick={(e) => {
          // A click on the backdrop lands on the dialog itself; a click on a link should also close it.
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest("a")) d.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">Menu</p>
            <button type="button" onClick={d.close} aria-label="Close menu" className="flex size-11 items-center justify-center rounded-lg hover:bg-band">
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-6 pt-2">{d.open ? <MobileNavLinks /> : null}</div>
        </div>
      </dialog>
    </>
  );
}

/** A search button that opens a full-screen search with suggestions, for small screens. */
export function MobileSearch() {
  const d = useDialog();
  return (
    <>
      <button
        type="button"
        onClick={d.show}
        aria-haspopup="dialog"
        aria-expanded={d.open}
        aria-label="Search colleges, courses and exams"
        className="flex size-11 items-center justify-center rounded-lg border border-rule hover:bg-band"
      >
        <Search size={19} aria-hidden="true" />
      </button>
      <dialog ref={d.ref} aria-label="Search" className="sheet bg-paper text-ink">
        <div className="mx-auto flex h-full max-w-2xl flex-col px-4 pt-3">
          <div className="flex items-center justify-between pb-3">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">Search</p>
            <button type="button" onClick={d.close} aria-label="Close search" className="flex size-11 items-center justify-center rounded-lg hover:bg-band">
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <div className="-mx-1 flex-1 overflow-y-auto overscroll-contain px-1 pb-8 pt-1">
            {d.open ? <SearchBox id="sheet-q" variant="sheet" placeholder="College, course, exam or state" autoFocus onNavigate={d.close} /> : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
