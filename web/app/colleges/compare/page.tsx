import type { Metadata } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { approvalYears, getCollege, offeringSeats, type CollegeDetail } from "@/lib/queries/college";
import { APPROVAL_BODIES, OWNERSHIP_LABELS, findCollegesByName, formatNumber, publisherShort } from "@/lib/queries/colleges";
import { CompareFromShortlist } from "@/components/colleges/shortlist-view";
import { COMPARE_MAX } from "@/components/colleges/limits";
import { ShortlistButton } from "@/components/colleges/shortlist-button";
import { own } from "@/lib/params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Compare colleges",
  description: "Compare up to four colleges side by side: approvals, seats, courses and NIRF ranks from official lists.",
  robots: { index: false, follow: true },
};

function readSlugs(v: string | string[] | undefined): string[] {
  const list = (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(","));
  return [...new Set(list.map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z0-9-]{1,120}$/.test(s)))].slice(0, COMPARE_MAX);
}

const href = (slugs: string[], q?: string) => {
  const u = new URLSearchParams();
  if (slugs.length) u.set("c", slugs.join(","));
  if (q) u.set("q", q);
  const s = u.toString().replace(/%2C/g, ",");
  return s ? `/colleges/compare?${s}` : "/colleges/compare";
};

const NR = <span className="italic text-muted">Not recorded</span>;

function bestRank(c: CollegeDetail) {
  const year = c.rankings[0]?.year;
  const latest = c.rankings.filter((r) => r.year === year);
  return latest.find((r) => r.category === "Overall") ?? latest[0] ?? null;
}

export default async function ComparePage({ searchParams }: Props) {
  const p = await searchParams;
  const slugs = readSlugs(p.c);
  const q = (Array.isArray(p.q) ? p.q[0] : p.q)?.trim().slice(0, 80);
  const [found, matches] = await Promise.all([Promise.all(slugs.map((s) => getCollege(s))), q ? findCollegesByName(q) : Promise.resolve([])]);
  const colleges = found.filter((c): c is CollegeDetail => !!c);
  const current = colleges.map((c) => c.slug);
  const room = current.length < COMPARE_MAX;

  const rows: { label: string; cell: (c: CollegeDetail) => React.ReactNode }[] = [
    { label: "Location", cell: (c) => [c.city ?? c.district, c.state].filter(Boolean).join(", ") || NR },
    { label: "Ownership", cell: (c) => (c.ownership ? own(OWNERSHIP_LABELS, c.ownership) ?? c.ownership : NR) },
    {
      label: "Approved or listed by",
      cell: (c) => {
        const years = approvalYears(c);
        return c.approvals.length ? (
          <ul className="space-y-0.5">
            {c.approvals.map((a) => (
              <li key={a}>
                {own(APPROVAL_BODIES, a)?.badge ?? a}
                {own(years, a) ? <span className="text-muted">, {own(years, a)}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          NR
        );
      },
    },
    {
      label: "NIRF rank",
      cell: (c) => {
        const r = bestRank(c);
        return r ? (
          <>
            <b className="tabular text-[1.1rem]">{r.rank ? `#${r.rank}` : r.rankBand}</b>
            <span className="block text-[0.85rem] text-muted">
              {r.year}, {r.category}
            </span>
          </>
        ) : (
          <span className="text-muted">Not ranked</span>
        );
      },
    },
    {
      label: "Total seats",
      cell: (c) => {
        const seats = c.offerings.map(offeringSeats).filter((n): n is number => n !== null);
        return seats.length ? <b className="tabular text-[1.1rem]">{formatNumber(seats.reduce((a, b) => a + b, 0))}</b> : NR;
      },
    },
    {
      label: "Courses and seats",
      cell: (c) =>
        c.offerings.length ? (
          <ul className="space-y-1">
            {c.offerings.map((o) => {
              const s = offeringSeats(o);
              return (
                <li key={o.id} className="flex justify-between gap-3">
                  <span>{o.courseShort}</span>
                  <span className="tabular font-bold">{s !== null ? formatNumber(s) : "Not recorded"}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          NR
        ),
    },
    { label: "Established", cell: (c) => c.establishedYear ?? NR },
    { label: "Affiliated to", cell: (c) => c.affiliatingUniversity ?? NR },
    { label: "Fields", cell: (c) => (c.streams.length ? c.streams.map((s) => s.name).join(", ") : NR) },
    { label: "Fees", cell: (c) => (c.offerings.some((o) => o.fees.some((f) => f.amount)) ? <Link href={`/college/${c.slug}#courses`} className="underline">See fee table</Link> : NR) },
    { label: "Cutoffs", cell: (c) => (c.cutoffs.length ? <Link href={`/college/${c.slug}#admission`} className="underline">See cutoffs</Link> : NR) },
    {
      label: "Data from",
      cell: (c) => <span className="text-[0.88rem] text-verified">{[...new Set(c.sources.map((s) => publisherShort(s.publisher)))].join(", ") || "Not recorded"}</span>,
    },
  ];

  return (
    <div className="bg-band">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="text-[0.92rem] text-muted">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/colleges" className="hover:underline">
            Colleges
          </Link>{" "}
          / Compare
        </nav>
        <h1 className="mt-3 text-[2rem] font-extrabold leading-tight sm:text-5xl">Compare colleges</h1>
        <p className="mt-2 max-w-[66ch] text-ink-soft">
          Up to {COMPARE_MAX} colleges side by side, from the same official lists as the college pages. Share this page&apos;s link to share the comparison.
        </p>

        {colleges.length ? (
          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[0.95rem]">
              <caption className="sr-only">Comparison of {colleges.map((c) => c.name).join(", ")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[120px] bg-paper p-3 align-bottom text-[0.8rem] uppercase tracking-wide text-muted sm:w-[170px]">
                    College
                  </th>
                  {colleges.map((c) => (
                    <th key={c.slug} scope="col" className="min-w-[200px] border-l border-rule p-3 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/college/${c.slug}`} className="font-[family-name:var(--font-display)] text-[1.05rem] font-bold leading-snug hover:text-brand-hover hover:underline">
                          {c.name}
                        </Link>
                        <Link
                          href={href(current.filter((s) => s !== c.slug))}
                          className="-mr-1 shrink-0 rounded p-1 text-muted hover:bg-band hover:text-ink"
                          aria-label={`Remove ${c.name} from comparison`}
                        >
                          <X size={16} aria-hidden="true" />
                        </Link>
                      </div>
                      <div className="mt-2">
                        <ShortlistButton item={{ slug: c.slug, name: c.name, place: [c.city ?? c.district, c.state].filter(Boolean).join(", ") }} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-rule align-top">
                    <th scope="row" className="sticky left-0 z-10 bg-paper p-3 text-[0.88rem] font-bold text-ink-soft">
                      {r.label}
                    </th>
                    {colleges.map((c) => (
                      <td key={c.slug} className="border-l border-rule p-3">
                        {r.cell(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card mt-6 p-5 text-ink-soft">No colleges picked yet. Search below, or pick from your shortlist.</p>
        )}
        {slugs.length > colleges.length ? <p className="mt-3 text-[0.9rem] text-muted">Some colleges in the link were not found and are left out.</p> : null}

        <div className="card mt-6 space-y-5 p-5">
          <h2 className="text-xl font-bold">{room ? "Add a college" : `You are comparing the maximum of ${COMPARE_MAX}`}</h2>
          {room ? (
            <>
              <form action="/colleges/compare" method="get" role="search" className="flex max-w-xl gap-2">
                {current.length ? <input type="hidden" name="c" value={current.join(",")} /> : null}
                <label htmlFor="cmp-q" className="sr-only">
                  College name or city
                </label>
                <input id="cmp-q" name="q" type="search" defaultValue={q} placeholder="College name or city" className="min-w-0 flex-1 rounded-lg border border-rule bg-paper px-3 py-2.5 focus:border-ink" />
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 font-bold text-white hover:bg-ink-2">
                  <Search size={16} aria-hidden="true" />
                  Find
                </button>
              </form>
              {q ? (
                matches.length ? (
                  <ul className="divide-y divide-rule">
                    {matches.map((m) => (
                      <li key={m.slug} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="font-bold leading-snug">{m.name}</p>
                          <p className="text-[0.85rem] text-muted">{[m.city, m.state].filter(Boolean).join(", ")}</p>
                        </div>
                        {current.includes(m.slug) ? (
                          <span className="shrink-0 text-[0.88rem] text-muted">Added</span>
                        ) : (
                          <Link href={href([...current, m.slug])} className="shrink-0 rounded-lg border border-ink px-3 py-1.5 text-[0.9rem] font-bold hover:bg-band">
                            Add
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-soft">No college matches &quot;{q}&quot;.</p>
                )
              ) : null}
              <CompareFromShortlist current={current} />
            </>
          ) : (
            <p className="text-ink-soft">Remove one to add another.</p>
          )}
        </div>
      </div>
    </div>
  );
}
