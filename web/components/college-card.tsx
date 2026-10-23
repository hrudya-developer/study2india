import Link from "next/link";
import { MapPin, Award, CalendarDays, Building } from "lucide-react";
import { type CollegeCard as Card, OWNERSHIP_LABELS, FEE_BASIS_LABELS, formatInr } from "@/lib/queries/colleges";

function initials(name: string) {
  return name
    .replace(/[^A-Za-z ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["and", "the", "for", "of"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function CollegeCard({ c, courseShort }: { c: Card; courseShort?: string }) {
  const place = [c.city, c.state].filter(Boolean).join(", ");
  const fee = c.offering?.fees?.find((f) => f.amount);
  const facts: { icon: typeof Award; label: string; value: string | null }[] = [
    { icon: Building, label: "Ownership", value: c.ownership ? OWNERSHIP_LABELS[c.ownership] ?? c.ownership : null },
    { icon: CalendarDays, label: "Established", value: c.establishedYear ? String(c.establishedYear) : null },
    { icon: Award, label: "NAAC grade", value: c.naacGrade },
  ];

  return (
    <article className="card card-link p-5">
      <div className="flex gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-rule bg-band font-[family-name:var(--font-display)] text-xl font-extrabold text-ink-2" aria-hidden="true">
          {initials(c.name) || "C"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-snug sm:text-xl">
            <Link href={`/college/${c.slug}`} className="hover:text-brand-hover">
              {c.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[0.92rem] text-muted">
            <MapPin size={15} aria-hidden="true" />
            {place || "Location not recorded"}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {c.isPartner ? <span className="rounded bg-verified-bg px-2 py-0.5 text-[0.8rem] font-bold text-verified">Study2India partner</span> : null}
            {c.rankings.slice(0, 3).map((r) => (
              <span key={r.category} className="rounded bg-[#e9edff] px-2 py-0.5 text-[0.8rem] text-ink-2">
                NIRF {r.year} {r.category} <span className="tabular font-bold">{r.rank ? `#${r.rank}` : r.rankBand}</span>
              </span>
            ))}
            {(c.approvals ?? []).map((a) => (
              <span key={a} className="rounded bg-band px-2 py-0.5 text-[0.8rem] text-ink-soft">
                {a} approved
              </span>
            ))}
            {c.streams.slice(0, 3).map((s) => (
              <span key={s} className="rounded bg-band px-2 py-0.5 text-[0.8rem] text-ink-soft">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule pt-4 text-[0.92rem] sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-[0.8rem] text-muted">{f.label}</dt>
            <dd className={f.value ? "font-bold" : "italic text-muted"}>{f.value ?? "Not recorded"}</dd>
          </div>
        ))}
        <div>
          <dt className="text-[0.8rem] text-muted">{courseShort ? `${courseShort} fee` : "Fees"}</dt>
          <dd className={fee ? "tabular font-bold" : "italic text-muted"}>
            {fee ? `${formatInr(fee.amount)} ${fee.basis ? FEE_BASIS_LABELS[fee.basis] : ""}` : "Not recorded"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/college/${c.slug}`} className="rounded-lg bg-ink px-4 py-2 text-[0.9rem] font-bold text-white hover:bg-ink-2">
          View college
        </Link>
        <Link href={`/counselling?college=${encodeURIComponent(c.name)}`} className="rounded-lg bg-brand px-4 py-2 text-[0.9rem] font-bold text-ink hover:bg-brand-hover">
          Get admission help
        </Link>
      </div>
    </article>
  );
}
