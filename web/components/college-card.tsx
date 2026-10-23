import Link from "next/link";
import { type CollegeCard as Card, OWNERSHIP_LABELS, FEE_BASIS_LABELS, formatInr } from "@/lib/queries/colleges";

export function CollegeCard({ c, courseShort }: { c: Card; courseShort?: string }) {
  const place = [c.city, c.state].filter(Boolean).join(", ");
  const facts: { label: string; value: string | null }[] = [
    { label: "Ownership", value: c.ownership ? OWNERSHIP_LABELS[c.ownership] ?? c.ownership : null },
    { label: "Established", value: c.establishedYear ? String(c.establishedYear) : null },
    { label: "NAAC grade", value: c.naacGrade },
  ];
  const fee = c.offering?.fees?.find((f) => f.amount);

  return (
    <article className="border-t border-rule py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold leading-snug sm:text-[1.35rem]">
            <Link href={`/college/${c.slug}`} className="hover:underline">
              {c.name}
            </Link>
          </h3>
          <p className="mt-1 text-ink-soft">{place || "Location not recorded"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.isPartner ? <span className="rounded bg-verified-bg px-2 py-0.5 text-[0.85rem] font-bold text-verified">Study2India partner</span> : null}
            {(c.approvals ?? []).map((a) => (
              <span key={a} className="rounded bg-mist px-2 py-0.5 text-[0.85rem] text-ink-soft">
                {a} approved
              </span>
            ))}
            {c.rankings.slice(0, 3).map((r) => (
              <span key={r.category} className="rounded bg-[#e8eaf6] px-2 py-0.5 text-[0.85rem] text-ink">
                NIRF {r.year} {r.category} <span className="tabular font-bold">{r.rank ? `#${r.rank}` : r.rankBand}</span>
              </span>
            ))}
          </div>
        </div>
        <Link href={`/college/${c.slug}`} className="shrink-0 rounded-lg border-2 border-ink px-4 py-2 text-[0.95rem] font-bold hover:bg-mist">
          View details
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[0.95rem] sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-[0.85rem] text-muted">{f.label}</dt>
            <dd className={f.value ? "text-ink" : "text-muted italic"}>{f.value ?? "Not recorded"}</dd>
          </div>
        ))}
        {courseShort ? (
          <div>
            <dt className="text-[0.85rem] text-muted">{courseShort} fee</dt>
            <dd className={fee ? "tabular text-ink" : "text-muted italic"}>
              {fee ? `${formatInr(fee.amount)} ${fee.basis ? FEE_BASIS_LABELS[fee.basis] : ""}${fee.quota ? ` (${fee.quota})` : ""}` : "Not recorded"}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
