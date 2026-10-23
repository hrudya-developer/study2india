"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterForm } from "./filter-form";

type Props = Omit<ComponentProps<typeof FilterForm>, "idPrefix" | "autoApply" | "onApplied"> & { activeCount: number };

/** Phone and tablet filters: a bottom sheet built on the native dialog, so focus, Escape and the backdrop come for free. */
export function FilterSheet({ activeCount, ...form }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-lg border border-ink bg-paper px-4 py-2.5 font-bold text-ink lg:hidden"
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        Filters
        {activeCount ? <span className="tabular rounded-full bg-brand px-2 text-[0.8rem] text-ink">{activeCount}</span> : null}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="filter-sheet-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-2xl bg-paper p-0 text-ink backdrop:bg-ink/50 sm:mx-auto sm:max-w-lg lg:hidden"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-paper px-5 py-3">
          <h2 id="filter-sheet-title" className="text-xl font-bold">
            Filters
          </h2>
          <button type="button" onClick={() => setOpen(false)} className="-mr-2 rounded-lg p-2 hover:bg-band" aria-label="Close filters">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pb-6 pt-4">{open ? <FilterForm {...form} idPrefix="m" onApplied={() => setOpen(false)} /> : null}</div>
      </dialog>
    </>
  );
}
