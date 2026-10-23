import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { CourseIndexItem } from "@/lib/queries/courses-index";
import { LEVEL_TINT, levelLabel } from "@/components/courses/levels";

const num = (v: number) => v.toLocaleString("en-IN");

function NotRecorded() {
  return <span className="text-[0.95rem] font-normal italic text-muted">Not recorded</span>;
}

/** One course on the index: the title link covers the card, the colleges link sits above it. */
export function CourseCard({ c }: { c: CourseIndexItem }) {
  // c.seats is already null when fewer than half of the colleges have a figure; say how many do whenever coverage is partial.
  const partialSeats = c.collegesWithSeats > 0 && c.collegesWithSeats < c.colleges;

  return (
    <li className="card card-link relative flex flex-col p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
        <span className={`rounded-full px-2.5 py-0.5 font-bold ${LEVEL_TINT[c.level] ?? "bg-band text-ink-soft"}`}>{levelLabel(c.level)}</span>
        {c.duration ? (
          <span className="inline-flex items-center gap-1 text-ink-soft">
            <Clock size={14} aria-hidden="true" />
            {c.duration}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 italic text-muted">
            <Clock size={14} aria-hidden="true" />
            Duration not recorded
          </span>
        )}
      </div>

      <h3 className="mt-3 text-xl font-bold leading-snug">
        <Link href={`/course/${c.slug}`} className="after:absolute after:inset-0 after:rounded-[14px] hover:text-brand-hover">
          {c.short}
        </Link>
      </h3>
      <p className="text-[0.9rem] text-muted">{c.name}</p>

      <dl className="tabular mt-4 grid grid-cols-2 gap-3 border-t border-rule pt-3">
        <div>
          <dt className="text-[0.8rem] text-muted">Colleges</dt>
          <dd className="text-lg font-bold">{c.colleges > 0 ? num(c.colleges) : <NotRecorded />}</dd>
        </div>
        <div>
          <dt className="text-[0.8rem] text-muted">Approved seats</dt>
          <dd className="text-lg font-bold">{c.seats !== null ? num(c.seats) : <NotRecorded />}</dd>
        </div>
      </dl>
      {partialSeats ? (
        <p className="tabular mt-1 text-[0.8rem] text-muted">
          Seats recorded for {num(c.collegesWithSeats)} of {num(c.colleges)} {c.colleges === 1 ? "college" : "colleges"}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[0.88rem]">
        <span className="text-muted">{c.latestYear ? `Intake ${c.latestYear}` : ""}</span>
        <Link
          href={`/colleges?course=${c.slug}`}
          className="relative z-10 inline-flex items-center gap-1 whitespace-nowrap font-bold text-brand-hover hover:underline"
          aria-label={`${c.short} colleges`}
        >
          View colleges <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}
