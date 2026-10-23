import Link from "next/link";
import { MapPin, Trophy } from "lucide-react";
import { type CollegeCard as Card, OWNERSHIP_LABELS, APPROVAL_BODIES, FEE_BASIS_LABELS, formatInr, formatNumber } from "@/lib/queries/colleges";
import { ShortlistButton } from "@/components/colleges/shortlist-button";
import { seatCoverageNote } from "@/lib/coverage";

export function initials(name: string) {
  return (
    name
      .replace(/[^A-Za-z ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["and", "the", "for", "of"].includes(w.toLowerCase()))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "C"
  );
}

function rankText(r: { rank: number | null; rankBand: string | null }) {
  return r.rank ? `#${r.rank}` : r.rankBand ?? "";
}

const VISIBLE_COURSES = 4;

/**
 * Credits the lists behind the figures the card shows: the seat figures' own lists (an NMC or INC
 * list, not the record's first source) and the NIRF year of the rank badge. Falls back to the
 * record's source when the card shows neither.
 */
function creditLine(c: Card, rankYear: number | null): { text: string; title: string } | null {
  const parts: string[] = [];
  const titles: string[] = [];
  if (c.seatSources.length) {
    parts.push(`Seats: ${c.seatSources.map((s) => `${s.short}${s.year ? ` ${s.year}` : ""}`).join(", ")}`);
    titles.push(...c.seatSources.map((s) => s.publisher));
  }
  if (rankYear !== null) {
    parts.push(`${parts.length ? "rank" : "Rank"}: NIRF ${rankYear}`);
    titles.push("National Institutional Ranking Framework");
  }
  if (parts.length) return { text: parts.join("; "), title: [...new Set(titles)].join(", ") };
  if (!c.source) return null;
  const year = c.source.short === "NIRF" ? "" : c.academicYear ? ` list ${c.academicYear}` : "";
  return { text: `Data from ${c.source.short}${year}`, title: c.source.publisher };
}

export function CollegeCard({ c, courseSlug, courseShort }: { c: Card; courseSlug?: string; courseShort?: string }) {
  const place = [c.city, c.state].filter(Boolean).join(", ");
  const fee = c.offering?.fees?.find((f) => f.amount);
  // The Overall rank is the one students compare across colleges; otherwise the best category rank.
  const best = c.rankings.find((r) => r.category === "Overall") ?? c.rankings[0];
  const otherRanks = c.rankings.filter((r) => r !== best).slice(0, 2);
  // Put the course the student filtered by first, then the largest intakes.
  const courses = courseSlug ? [...c.courses].sort((a, b) => Number(b.slug === courseSlug) - Number(a.slug === courseSlug)) : c.courses;
  const shown = courses.slice(0, VISIBLE_COURSES);
  const more = courses.length - shown.length;
  const seatNote = seatCoverageNote(c.seats);
  const credit = creditLine(c, best ? best.year : null);

  return (
    <article className="card overflow-hidden">
      <div className="flex gap-3.5 p-4 sm:gap-4 sm:p-5">
        <div
          className="hidden size-14 shrink-0 items-center justify-center rounded-xl border border-rule bg-band font-[family-name:var(--font-display)] text-lg font-extrabold text-ink-2 min-[400px]:flex"
          aria-hidden="true"
        >
          {initials(c.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-[1.08rem] font-bold leading-snug sm:text-[1.2rem]">
              <Link href={`/college/${c.slug}`} className="hover:text-brand-hover hover:underline hover:decoration-brand hover:underline-offset-4">
                {c.name}
              </Link>
            </h3>
            {best ? (
              <span className="flex shrink-0 flex-col items-end rounded-lg bg-[#e9edff] px-2.5 py-1 text-right leading-tight text-ink-2" title={`NIRF ${best.year}, ${best.category}`}>
                <span className="tabular flex items-center gap-1 text-[1.05rem] font-extrabold">
                  <Trophy size={14} aria-hidden="true" />
                  {rankText(best)}
                </span>
                <span className="text-[0.72rem]">
                  NIRF {best.year} {best.category}
                </span>
              </span>
            ) : null}
          </div>
          <p className="mt-1 flex items-start gap-1.5 text-[0.92rem] text-ink-soft">
            <MapPin size={15} className="mt-[3px] shrink-0 text-muted" aria-hidden="true" />
            <span>{place || <span className="italic text-muted">Location not recorded</span>}</span>
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5 text-[0.8rem]" aria-label="Key facts">
            {c.isPartner ? <li className="rounded bg-verified-bg px-2 py-0.5 font-bold text-verified">Study2India partner</li> : null}
            {c.ownership ? <li className="rounded bg-ink px-2 py-0.5 font-bold text-white">{OWNERSHIP_LABELS[c.ownership] ?? c.ownership}</li> : null}
            {(c.approvals ?? []).map((a) => (
              <li key={a} className="rounded border border-verified/30 bg-verified-bg px-2 py-0.5 text-verified">
                {APPROVAL_BODIES[a]?.badge ?? `${a} approved`}
              </li>
            ))}
            {otherRanks.map((r) => (
              <li key={r.category} className="rounded bg-[#e9edff] px-2 py-0.5 text-ink-2">
                NIRF {r.category} <span className="tabular font-bold">{rankText(r)}</span>
              </li>
            ))}
            {c.establishedYear ? <li className="rounded bg-band px-2 py-0.5 text-ink-soft">Est. {c.establishedYear}</li> : null}
          </ul>
          {c.affiliatingUniversity ? (
            <p className="mt-2 line-clamp-1 text-[0.85rem] text-muted">
              Affiliated to <span className="text-ink-soft">{c.affiliatingUniversity}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-rule bg-[#fafbfd] px-4 py-3 sm:px-5">
        {c.courses.length ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[0.8rem] font-bold uppercase tracking-wide text-muted">
                Courses and seats{c.academicYear ? `, ${c.academicYear}` : ""}
              </p>
              <p className="text-[0.88rem] text-ink-soft">
                {c.seats.complete ? "Total intake" : "Intake"}{" "}
                {c.seats.total !== null ? (
                  <span className="tabular font-bold text-ink">{formatNumber(c.seats.total)}</span>
                ) : (
                  <span className="italic text-muted">Not recorded</span>
                )}
                {seatNote ? <span className="tabular text-muted"> {c.seats.total !== null ? seatNote : `(${seatNote})`}</span> : null}
              </p>
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {shown.map((o) => (
                <li
                  key={o.slug}
                  className={`inline-flex items-baseline gap-1.5 rounded-md border px-2 py-1 text-[0.88rem] ${o.slug === courseSlug ? "border-brand bg-brand-soft" : "border-rule bg-paper"}`}
                >
                  <span className="font-bold">{o.short}</span>
                  <span className="tabular text-ink-soft">{o.seats !== null ? `${formatNumber(o.seats)} seats` : "seats not recorded"}</span>
                  {o.branches > 1 ? <span className="text-[0.78rem] text-muted">{o.branches} branches</span> : null}
                </li>
              ))}
              {more > 0 ? (
                <li>
                  <Link href={`/college/${c.slug}#courses`} className="inline-block rounded-md px-2 py-1 text-[0.88rem] font-bold text-ink-soft underline underline-offset-2 hover:text-ink">
                    +{more} more
                  </Link>
                </li>
              ) : null}
            </ul>
            {courseShort && c.offering && fee ? (
              <p className="mt-2 text-[0.88rem]">
                {courseShort} tuition <span className="tabular font-bold">{formatInr(fee.amount)}</span> {fee.basis ? FEE_BASIS_LABELS[fee.basis] : ""}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[0.88rem] text-muted">Course-wise seats not recorded yet{c.streams.length ? `. Fields: ${c.streams.slice(0, 3).join(", ")}` : ""}.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule px-4 py-3 sm:px-5">
        {credit ? (
          <p className="basis-full text-[0.8rem] text-verified sm:mr-auto sm:basis-auto" title={credit.title}>
            {credit.text}
          </p>
        ) : (
          <span className="hidden sm:mr-auto sm:block" />
        )}
        <div className="flex w-full gap-2 sm:w-auto [&>span]:flex-1 sm:[&>span]:flex-none [&>span>button]:w-full">
          <ShortlistButton item={{ slug: c.slug, name: c.name, place }} />
          <Link href={`/college/${c.slug}`} className="flex-1 rounded-lg bg-ink px-4 py-2 text-center text-[0.9rem] font-bold text-white hover:bg-ink-2 sm:flex-none">
            View college
          </Link>
        </div>
      </div>
    </article>
  );
}
