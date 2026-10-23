import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SourceStamp } from "@/components/source-stamp";
import type { CourseBranch, CourseRanked, CourseStats } from "@/lib/queries/catalog";

const fmt = (n: number) => n.toLocaleString("en-IN");

function NotRecorded() {
  return <span className="font-normal italic text-muted">Not recorded</span>;
}

function plural(n: number, one: string, many: string) {
  return `${fmt(n)} ${n === 1 ? one : many}`;
}

/** Joins a list as "a, b and c". */
function listText(parts: string[], last = "and") {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} ${last} ${parts[parts.length - 1]}`;
}

function intakeNote(stats: CourseStats) {
  const years = stats.years;
  if (!years.length) return null;
  let when: string;
  if (years.length === 1) {
    when = years[0].year ? `for academic year ${years[0].year}` : "(the source does not state the academic year)";
  } else {
    const parts = years.map((y) => `${y.year ?? "year not stated"} for ${plural(y.colleges, "college", "colleges")}`);
    when = `from the latest list each college appears in: ${listText(parts)}`;
  }
  return `Seats are the approved intake ${when}, as published by the regulator. Actual admissions can differ.`;
}

export function CourseKeyNumbers({ short, slug, stats }: { short: string; slug: string; stats: CourseStats }) {
  const tiles: { k: string; v: number | null; note?: string }[] = [
    { k: `Colleges offering ${short}`, v: stats.colleges || null },
    { k: "Approved seats", v: stats.seats, note: stats.years.length === 1 && stats.years[0].year ? stats.years[0].year : undefined },
    { k: "States and UTs", v: stats.states || null },
    { k: "Government colleges", v: stats.colleges ? stats.ownership.government : null },
  ];
  const note = intakeNote(stats);
  const partialSeats = stats.colleges > 0 && stats.collegesWithSeats > 0 && stats.collegesWithSeats < stats.colleges;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="key-numbers">
      <h2 id="key-numbers" className="text-2xl font-bold">{short} in numbers</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.k} className="flex min-w-0 flex-col-reverse justify-end rounded-xl bg-band p-3 sm:p-4">
            <dt className="mt-1 text-[0.88rem] leading-snug text-muted">
              {t.k}
              {t.note ? <span className="block">{t.note}</span> : null}
            </dt>
            <dd className="tabular font-display text-[1.3rem] font-extrabold leading-none sm:text-[1.8rem]">
              {t.v === null ? <span className="font-sans text-[1rem] font-normal italic text-muted">Not recorded</span> : fmt(t.v)}
            </dd>
          </div>
        ))}
      </dl>
      {stats.colleges ? (
        <div className="mt-4 space-y-2 text-[0.92rem] text-ink-soft">
          {note ? <p>{note}</p> : null}
          {partialSeats ? (
            <p>
              Seat figures are recorded for {fmt(stats.collegesWithSeats)} of {fmt(stats.colleges)} colleges, and the total covers those colleges only.
            </p>
          ) : null}
          {stats.sources.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {stats.sources
                .filter((s, i, all) => all.findIndex((x) => x.publisher === s.publisher) === i)
                .map((s) => (
                  <SourceStamp key={s.publisher} publisher={s.publisher} url={s.url} checked={s.retrievedOn} />
                ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-ink-soft">
          We have not loaded an official list of colleges offering {short} yet, so college, seat and state figures are not recorded.{" "}
          <Link href={`/colleges?course=${slug}`} className="font-bold underline underline-offset-2 hover:text-brand-hover">
            Browse colleges in this field
          </Link>{" "}
          or ask a counsellor.
        </p>
      )}
    </section>
  );
}

export function CourseStates({ short, slug, stats }: { short: string; slug: string; stats: CourseStats }) {
  if (!stats.byState.length) return null;
  const max = Math.max(1, ...stats.byState.map((s) => s.seats ?? 0));
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="by-state">
      <h2 id="by-state" className="text-2xl font-bold">{short} seats and colleges by state</h2>
      <p className="mt-1 text-[0.92rem] text-muted">
        {plural(stats.byState.length, "state or union territory", "states and union territories")}, sorted by approved seats. Select a state to see its colleges.
      </p>
      <div className="mt-4">
        <table className="w-full text-left text-[0.95rem]">
          <thead>
            <tr className="text-[0.85rem] text-muted">
              <th scope="col" className="py-2 font-normal">State</th>
              <th scope="col" className="py-2 pl-3 text-right font-normal">Colleges</th>
              <th scope="col" className="py-2 pl-3 text-right font-normal">Seats</th>
            </tr>
          </thead>
          <tbody>
            {stats.byState.map((s) => (
              <tr key={s.slug} className="border-t border-rule">
                <td className="py-2.5">
                  <Link href={`/colleges?course=${slug}&state=${s.slug}`} className="font-bold wrap-anywhere hover:text-brand-hover">
                    {s.name}
                  </Link>
                  <div className="mt-1 h-1.5 rounded-full bg-band" aria-hidden="true">
                    <div className="h-1.5 rounded-full bg-brand" style={{ width: `${Math.max(1, ((s.seats ?? 0) / max) * 100)}%` }} />
                  </div>
                </td>
                <td className="tabular py-2.5 pl-3 text-right align-top">{fmt(s.colleges)}</td>
                <td className="tabular py-2.5 pl-3 text-right align-top font-bold">{s.seats === null ? <NotRecorded /> : fmt(s.seats)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stats.collegesWithoutState ? (
        <p className="mt-3 text-[0.9rem] text-muted">
          {plural(stats.collegesWithoutState, "college has", "colleges have")} no state recorded and {stats.collegesWithoutState === 1 ? "is" : "are"} not in this table.
        </p>
      ) : null}
    </section>
  );
}

export function CourseSpecialisations({ short, branches }: { short: string; branches: { total: number; top: CourseBranch[] } }) {
  if (!branches.top.length) return null;
  const max = Math.max(1, ...branches.top.map((b) => b.seats ?? 0));
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="specialisations">
      <h2 id="specialisations" className="text-2xl font-bold">Popular {short} specialisations</h2>
      <p className="mt-1 text-[0.92rem] text-muted">
        {branches.total > branches.top.length
          ? `Top ${branches.top.length} of ${fmt(branches.total)} specialisations recorded, by total approved seats. Names are as the regulator lists them.`
          : `${plural(branches.total, "specialisation", "specialisations")} recorded, by total approved seats. Names are as the regulator lists them.`}
      </p>
      <table className="mt-4 w-full text-left text-[0.95rem]">
        <thead>
          <tr className="text-[0.85rem] text-muted">
            <th scope="col" className="py-2 font-normal">Specialisation</th>
            <th scope="col" className="py-2 pl-3 text-right font-normal">Colleges</th>
            <th scope="col" className="py-2 pl-3 text-right font-normal">Seats</th>
          </tr>
        </thead>
        <tbody>
          {branches.top.map((b) => (
            <tr key={b.name} className="border-t border-rule">
              <td className="py-2.5">
                <span className="font-bold wrap-anywhere">{b.name}</span>
                <div className="mt-1 h-1.5 rounded-full bg-band" aria-hidden="true">
                  <div className="h-1.5 rounded-full bg-ink-2" style={{ width: `${Math.max(1, ((b.seats ?? 0) / max) * 100)}%` }} />
                </div>
              </td>
              <td className="tabular py-2.5 pl-3 text-right align-top">{fmt(b.colleges)}</td>
              <td className="tabular py-2.5 pl-3 text-right align-top font-bold">{b.seats === null ? <NotRecorded /> : fmt(b.seats)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function CourseRankedColleges({
  short,
  slug,
  colleges,
  nirfYear,
  nirfLists,
  ranked,
}: {
  short: string;
  slug: string;
  colleges: number;
  nirfYear: number | null;
  nirfLists: string[];
  ranked: CourseRanked | null;
}) {
  if (!colleges) return null;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="ranked">
      <h2 id="ranked" className="text-2xl font-bold">Top NIRF ranked colleges for {short}</h2>
      {ranked ? (
        <>
          <p className="mt-1 text-[0.92rem] text-muted">
            Colleges offering {short} in the NIRF {ranked.year} {ranked.category} ranking, by rank.{" "}
            {ranked.total > ranked.items.length ? `Showing ${ranked.items.length} of ${fmt(ranked.total)}. ` : null}
            Only institutions with a recorded {short} offering in our data are listed, so some ranked institutions may be missing.
          </p>
          <ol className="mt-4">
            {ranked.items.map((r) => {
              const place = [r.city, r.state].filter(Boolean).join(", ");
              return (
                <li key={r.slug} className="flex items-start gap-3 border-t border-rule py-3 first:border-t-0">
                  <span className="tabular min-w-[3.75rem] shrink-0 rounded-md bg-brand-soft px-2 py-1 text-center text-[0.9rem] font-bold text-ink">
                    {r.rank !== null ? `#${r.rank}` : r.rankBand ?? "Ranked"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/college/${r.slug}`} className="font-bold leading-snug wrap-anywhere hover:text-brand-hover">
                      {r.name}
                    </Link>
                    <p className="text-[0.88rem] text-muted">{place || "Location not recorded"}</p>
                    <p className="tabular text-[0.88rem] sm:hidden">
                      {r.seats === null ? <NotRecorded /> : <span className="font-bold">{fmt(r.seats)}</span>} {short} seats
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="tabular font-bold">{r.seats === null ? <NotRecorded /> : fmt(r.seats)}</p>
                    <p className="text-[0.8rem] text-muted">{short} seats</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <Link href={`/colleges?course=${slug}&ranked=1&sort=rank`} className="mt-3 inline-flex items-center gap-1.5 font-bold hover:text-brand-hover">
            All NIRF ranked {short} colleges <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </>
      ) : (
        <p className="mt-3 text-ink-soft">
          {nirfYear
            ? `None of the ${fmt(colleges)} colleges offering ${short} appear in the NIRF ${nirfYear} ${listText(nirfLists, "or")} rankings we hold.`
            : "NIRF rankings are not loaded yet."}
        </p>
      )}
    </section>
  );
}

export function CourseOwnership({ short, slug, stats }: { short: string; slug: string; stats: CourseStats }) {
  if (!stats.colleges) return null;
  const { government, private: priv, others, notRecorded } = stats.ownership;
  const otherTotal = others.reduce((n, o) => n + o.colleges, 0);
  const pct = (n: number) => (n / stats.colleges) * 100;
  const pctText = (n: number) => {
    const p = pct(n);
    return p > 0 && p < 1 ? "under 1%" : `${Math.round(p)}%`;
  };
  const parts = [
    { key: "government", label: "Government", n: government, color: "bg-verified", href: `/colleges?course=${slug}&ownership=government` },
    { key: "private", label: "Private", n: priv, color: "bg-ink-2", href: `/colleges?course=${slug}&ownership=private` },
    { key: "others", label: "Others", n: otherTotal, color: "bg-brand", href: null },
    { key: "none", label: "Not recorded", n: notRecorded, color: "bg-[#c3c8d8]", href: null },
  ].filter((p) => p.n > 0);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="ownership">
      <h2 id="ownership" className="text-2xl font-bold">Government and private {short} colleges</h2>
      <p className="mt-1 text-[0.92rem] text-muted">How the {plural(stats.colleges, "college", "colleges")} offering {short} are run, as recorded by the regulator.</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-band" aria-hidden="true">
        {parts.map((p) => (
          <div key={p.key} className={p.color} style={{ width: `${pct(p.n)}%` }} />
        ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {parts.map((p) => {
          const body = (
            <>
              <span className={`mt-1.5 size-3 shrink-0 rounded-sm ${p.color}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="font-bold">{p.label}</span>
                <span className="block text-[0.88rem] text-muted">{pctText(p.n)} of colleges</span>
              </span>
              <span className="tabular text-[1.15rem] font-bold">{fmt(p.n)}</span>
            </>
          );
          return (
            <li key={p.key}>
              {p.href ? (
                <Link href={p.href} className="flex items-start gap-3 rounded-xl border border-rule p-3 hover:border-brand hover:bg-brand-soft">
                  {body}
                </Link>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-rule p-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {others.length ? (
        <p className="mt-3 text-[0.92rem] text-ink-soft">
          Others: {listText(others.map((o) => `${o.label} (${fmt(o.colleges)})`))}.
        </p>
      ) : null}
    </section>
  );
}
