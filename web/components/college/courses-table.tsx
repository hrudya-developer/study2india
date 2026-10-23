import Link from "next/link";
import { offeringSeats, type CollegeDetail } from "@/lib/queries/college";
import { FEE_BASIS_LABELS, LEVEL_LABELS, formatInr, formatNumber, publisherShort } from "@/lib/queries/colleges";

type Offering = CollegeDetail["offerings"][number];

const NR = <span className="italic text-muted">Not recorded</span>;

function Fees({ o }: { o: Offering }) {
  const fees = o.fees.filter((f) => f.amount !== null);
  if (!fees.length) return NR;
  return (
    <ul className="space-y-0.5">
      {fees.map((f, i) => (
        <li key={i}>
          <span className="tabular font-bold">{formatInr(f.amount)}</span>{" "}
          <span className="text-[0.85rem] text-ink-soft">
            {f.basis ? FEE_BASIS_LABELS[f.basis] : "basis not recorded"}
            {f.quota ? `, ${f.quota}` : ""}
            {f.component !== "tuition" ? `, ${f.component}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Courses with their intake, grouped by level, with each course's branches one tap away. */
export function CoursesTable({ offerings }: { offerings: Offering[] }) {
  const hasFees = offerings.some((o) => o.fees.some((f) => f.amount !== null));
  const groups = [...new Set(offerings.map((o) => o.level))].map((level) => ({ level, items: offerings.filter((o) => o.level === level) }));

  return (
    <div className="mt-4 space-y-6">
      {groups.map((g) => {
        const known = g.items.map(offeringSeats).filter((n): n is number => n !== null);
        return (
          <div key={g.level}>
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-1.5">
              <h3 className="text-lg font-bold">{LEVEL_LABELS[g.level] ?? g.level}</h3>
              {known.length ? (
                <p className="tabular text-[0.88rem] text-ink-soft">
                  <b className="text-ink">{formatNumber(known.reduce((a, b) => a + b, 0))}</b> seats
                </p>
              ) : null}
            </div>
            <table className="w-full text-left text-[0.95rem]">
              <thead className="sr-only sm:not-sr-only">
                <tr className="text-[0.8rem] uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3 font-bold">
                    Course
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-bold sm:table-cell">
                    Duration
                  </th>
                  {hasFees ? (
                    <th scope="col" className="hidden py-2 pr-3 font-bold md:table-cell">
                      Fees
                    </th>
                  ) : null}
                  <th scope="col" className="py-2 text-right font-bold">
                    Seats
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((o) => {
                  const seats = offeringSeats(o);
                  const sourceShort = o.seatsSource ? publisherShort(o.seatsSource.publisher) : null;
                  return [
                    <tr key={o.id} className="border-t border-rule align-top">
                      <th scope="row" className="py-3 pr-3 font-normal">
                        <Link href={`/course/${o.courseSlug}`} className="font-bold hover:text-brand-hover hover:underline">
                          {o.courseShort}
                        </Link>
                        <span className="block text-[0.86rem] text-muted">{o.courseName}</span>
                        <span className="mt-0.5 block text-[0.84rem] text-ink-soft sm:hidden">{o.duration ?? "Duration not recorded"}</span>
                        {hasFees ? (
                          <span className="mt-1 block text-[0.88rem] md:hidden">
                            <Fees o={o} />
                          </span>
                        ) : null}
                      </th>
                      <td className="hidden py-3 pr-3 text-ink-soft sm:table-cell">{o.duration ?? NR}</td>
                      {hasFees ? (
                        <td className="hidden py-3 pr-3 md:table-cell">
                          <Fees o={o} />
                        </td>
                      ) : null}
                      <td className="py-3 text-right">
                        <span className="tabular block text-[1.05rem] font-bold">{seats !== null ? formatNumber(seats) : NR}</span>
                        <span className="block text-[0.78rem] text-muted">
                          {[o.academicYear, sourceShort].filter(Boolean).join(", ")}
                          {o.seats === null && o.branches.length ? ", sum of branches" : ""}
                        </span>
                      </td>
                    </tr>,
                    o.branches.length > 1 || (o.branches.length === 1 && o.branches[0].name !== o.courseShort) ? (
                      <tr key={`${o.id}-b`}>
                        <td colSpan={hasFees ? 4 : 3} className="pb-3">
                          <details className="group rounded-lg border border-rule bg-[#fafbfd]" open={o.branches.length <= 4}>
                            <summary className="cursor-pointer list-none px-3 py-2 text-[0.9rem] font-bold text-ink-soft marker:hidden hover:text-ink [&::-webkit-details-marker]:hidden">
                              <span className="group-open:hidden">Show {o.branches.length} {o.branches.length === 1 ? "branch" : "branches"} with seats</span>
                              <span className="hidden group-open:inline">
                                {o.branches.length} {o.branches.length === 1 ? "branch" : "branches"} with seats
                              </span>
                            </summary>
                            <ul className="grid gap-x-6 border-t border-rule px-3 py-1.5 text-[0.9rem] sm:grid-cols-2">
                              {o.branches.map((b, i) => (
                                <li key={b.name + i} className="flex justify-between gap-3 border-b border-rule/70 py-1.5 last:border-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-0">
                                  <span className="min-w-0">{b.name}</span>
                                  <span className="tabular shrink-0 font-bold">{b.seats !== null ? formatNumber(b.seats) : NR}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      {!hasFees ? (
        <p className="rounded-lg bg-band px-4 py-3 text-[0.92rem] text-ink-soft">
          <b className="text-ink">Fees: Not recorded.</b> We publish a fee only from the college&apos;s or the fee regulator&apos;s official notice, with its basis (per year or whole course).
          None is loaded for this college yet, so ask the college or a counsellor for the current fee.
        </p>
      ) : null}
    </div>
  );
}
