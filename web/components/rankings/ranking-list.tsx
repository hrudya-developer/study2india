"use client";

/*
 * A client component only so the page's payload carries the rows as compact data instead of a
 * second copy of the markup. It has no state; the HTML is rendered on the server as usual.
 */

import Link from "next/link";
import type { PreviousRank, RankingRow } from "@/lib/queries/rankings";
import "./rankings.css";

type Props = {
  rows: RankingRow[];
  year: number;
  category: string;
  previousYear: number | null;
  /** Course label for the seats column, e.g. "MBBS" or "MBA / PGDM"; null hides the column. */
  seatLabel: string | null;
  /** Show which course a seat figure is for (when a list has more than one main course). */
  seatCourseShown: boolean;
};

const fmt = (n: number) => n.toLocaleString("en-IN");
const NR = <span className="nr">Not recorded</span>;

/** The band an entry belongs to, used to put a heading above each run of banded entries. */
function bandOf(r: RankingRow) {
  return r.rank === null ? (r.rankBand ?? "Not recorded") : null;
}

function Change({ r, previous, previousYear }: { r: RankingRow; previous: PreviousRank; previousYear: number }) {
  if (!previous) return <span className="was">Not in {previousYear} list</span>;
  if (r.rank !== null && previous.rank !== null) {
    const d = previous.rank - r.rank;
    if (d === 0) return <span className="was">Same as {previousYear}</span>;
    return (
      <span className={`num ${d > 0 ? "up" : "down"}`}>
        {d > 0 ? "↑ Up" : "↓ Down"} {Math.abs(d)} <span className="was">(was {previous.rank})</span>
      </span>
    );
  }
  return <span className="was num">Was {previous.rank ?? previous.rankBand ?? "unranked"}</span>;
}

export function RankingList({ rows, year, category, previousYear, seatLabel, seatCourseShown }: Props) {
  const cols = 6 + (previousYear !== null ? 1 : 0) + (seatLabel !== null ? 1 : 0);
  const out: React.ReactNode[] = [];

  rows.forEach((r, i) => {
    const band = bandOf(r);
    if (band !== null && band !== (i > 0 ? bandOf(rows[i - 1]) : null)) {
      const numeric = /^\d/.test(band);
      out.push(
        <tr key={`band-${band}`} className="band">
          <th scope="colgroup" colSpan={cols}>
            {numeric ? `Rank band ${band}` : band}
            {numeric ? <span>NIRF publishes the band only, with no exact rank or score. Listed here A to Z.</span> : null}
          </th>
        </tr>,
      );
    }
    const seat = r.seats;
    out.push(
      <tr key={r.slug} className="row">
        <td className={`rank n${r.rank === null ? " band" : ""}`}>{r.rank ?? (r.rankBand && /^\d/.test(r.rankBand) ? r.rankBand : <span className="nr">{r.rankBand ?? "Not recorded"}</span>)}</td>
        <th scope="row" className="name">
          <Link href={`/college/${r.slug}`} prefetch={false}>
            {r.name}
          </Link>
        </th>
        <td className="city">{r.city ?? NR}</td>
        <td className="state">
          {r.city ? <span className="mc">{r.city}, </span> : null}
          {r.state ?? NR}
        </td>
        <td className="fact score right num" data-label="NIRF score">
          {r.score ?? <span className="nr">Not published</span>}
        </td>
        {previousYear !== null ? (
          <td className="fact" data-label={`Since ${previousYear}`}>
            <Change r={r} previous={r.previous ?? null} previousYear={previousYear} />
          </td>
        ) : null}
        <td className="fact own" data-label="Ownership">
          {r.ownershipLabel ?? NR}
        </td>
        {seatLabel !== null ? (
          <td className="fact right num" data-label={`${seatLabel} seats`}>
            {seat && seat.seats !== null ? (
              <>
                {fmt(seat.seats)}
                {seatCourseShown ? <span className="sub">{seat.course}</span> : null}
              </>
            ) : (
              NR
            )}
          </td>
        ) : null}
      </tr>,
    );
  });

  return (
    <table className="rk">
      <caption className="sr-only">
        NIRF {year} {category} ranking{previousYear !== null ? `, with change since ${previousYear}` : ""}
      </caption>
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">Institution</th>
          <th scope="col">City</th>
          <th scope="col">State</th>
          <th scope="col" className="right">
            NIRF score
          </th>
          {previousYear !== null ? <th scope="col">Since {previousYear}</th> : null}
          <th scope="col">Ownership</th>
          {seatLabel !== null ? (
            <th scope="col" className="right">
              {seatLabel} seats
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>{out}</tbody>
    </table>
  );
}
