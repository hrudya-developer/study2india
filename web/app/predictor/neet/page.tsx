import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Info } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SourceStamp } from "@/components/source-stamp";
import { Pagination } from "@/components/colleges/pagination";
import { NeetPredictorForm } from "@/components/predictor/neet-form";
import { formatNumber } from "@/lib/queries/colleges";
import { own } from "@/lib/params";
import {
  BANDS,
  CATEGORIES,
  PREDICTOR_COURSES,
  QUOTA_NOTES,
  defaultQuotas,
  RESULTS_PAGE_SIZE,
  ROUNDS,
  getPredictorMeta,
  highestClosingRank,
  predictColleges,
  predictorHref,
  readPredictorInput,
  stateAuthority,
  type Band,
  type PredictorMeta,
  type PredictorResult,
} from "@/lib/queries/predictor";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const siteUrl = (process.env.SITE_URL ?? "https://study2india.com").replace(/\/$/, "");

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const meta = await getPredictorMeta().catch(() => null);
  const input = readPredictorInput(p, meta);
  const year = meta?.year ?? 2026;
  return {
    title: `NEET UG college predictor ${year}: MBBS, BDS and B.Sc Nursing by All India Rank`,
    description: `Free NEET UG college predictor with no sign-up. Enter your All India Rank to see MBBS, BDS and B.Sc Nursing colleges by MCC ${year} All India counselling closing ranks, round by round, with the official allotment lists linked.`,
    alternates: { canonical: "/predictor/neet" },
    // Result pages are endless combinations of rank and filters; only the bare tool is indexed.
    robots: input.hasParams ? { index: false, follow: true } : undefined,
  };
}

const BAND_STYLE: Record<Band, string> = {
  likely: "bg-verified-bg text-verified border-verified/30",
  possible: "bg-brand-soft text-[#9a4a00] border-brand/40",
  reach: "bg-band text-ink-soft border-rule",
};

function BandBadge({ band }: { band: Band }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.8rem] font-bold uppercase tracking-wide ${BAND_STYLE[band]}`}>{BANDS[band].label}</span>;
}

function why(r: PredictorResult, rank: number): string {
  const round = ROUNDS.find((x) => x.key === r.decidingRound)?.label ?? r.decidingRound;
  const closing = formatNumber(r.decidingRank);
  if (r.band === "likely") return `Your rank ${formatNumber(rank)} is within the Round 1 closing rank of ${closing}.`;
  if (r.band === "possible") return `Beyond the Round 1 closing rank, but within the ${round} closing rank of ${closing}.`;
  return `Beyond every round's closing rank; the highest was ${closing} (${round}), within 10% of your rank.`;
}

function ResultRow({ r, rank, meta }: { r: PredictorResult; rank: number; meta: PredictorMeta }) {
  const src = meta.roundSources[r.decidingRound];
  const where = [r.place, r.stateName].filter(Boolean).join(", ");
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 md:flex-nowrap">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BandBadge band={r.band} />
            <span className="text-[0.85rem] text-muted">
              {r.quota} · {r.category} seat
            </span>
          </div>
          <h3 className="mt-2 text-[1.08rem] font-bold leading-snug">
            <Link href={`/college/${r.slug}`} className="hover:text-brand-hover hover:underline">
              {r.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-[0.9rem] text-ink-soft">
            {where || <span className="italic text-muted">Location not recorded</span>}
            {r.ownership ? ` · ${r.ownership}` : ""}
          </p>
          <p className="mt-2 text-[0.88rem] text-ink-soft">{why(r, rank)}</p>
        </div>
        <div className="w-full md:w-[300px] md:shrink-0">
          <table className="w-full table-fixed text-center text-[0.85rem]">
            <caption className="sr-only">Closing rank by round, MCC {meta.year}</caption>
            <thead>
              <tr className="text-[0.72rem] uppercase tracking-wide text-muted">
                {ROUNDS.map((x) => (
                  <th key={x.key} scope="col" className="pb-1 font-bold">
                    <abbr title={`${x.label} closing rank`} className="no-underline">
                      {x.short}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {ROUNDS.map((x) => {
                  const v = r.closing[x.key];
                  const deciding = x.key === r.decidingRound;
                  return (
                    <td key={x.key} className={`tabular border border-rule px-1 py-1.5 ${deciding ? "bg-ink font-bold text-white" : ""}`}>
                      {v === undefined ? <span className="text-muted" title="No allotment in this round for this seat type">None</span> : formatNumber(v)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.82rem]">
            <span className="text-ink-soft">
              Seats:{" "}
              {r.seats !== null ? (
                <b className="tabular text-ink">
                  {formatNumber(r.seats)}
                  {r.seatsYear ? <span className="font-normal text-muted"> ({r.seatsYear})</span> : null}
                </b>
              ) : (
                <span className="italic text-muted">Not recorded</span>
              )}
            </span>
            {src?.url ? (
              <a href={src.url} target="_blank" rel="noopener" title={src.title} className="inline-flex items-center gap-1 text-verified underline underline-offset-2">
                MCC {meta.year} {ROUNDS.find((x) => x.key === r.decidingRound)?.short} list <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function Disclaimer({ year }: { year: number }) {
  return (
    <p role="note" className="flex gap-2.5 rounded-lg border-l-4 border-brand bg-[#fff4e8] px-4 py-3 text-[0.95rem]">
      <Info size={18} className="mt-0.5 shrink-0 text-brand-hover" aria-hidden="true" />
      <span>
        Based on MCC {year} All India counselling closing ranks. Ranks change every year; this is guidance, not a guarantee.
      </span>
    </p>
  );
}

export default async function NeetPredictorPage({ searchParams }: Props) {
  const p = await searchParams;
  const meta = await getPredictorMeta();
  const input = readPredictorInput(p, meta);
  const year = meta?.year ?? 2026;

  const result = meta && input.rank ? await predictColleges(input, meta) : null;
  const shown = result ? (input.band ? result.items.filter((x) => x.band === input.band) : result.items) : [];
  const pageCount = Math.max(1, Math.ceil(shown.length / RESULTS_PAGE_SIZE));
  const page = Math.min(input.page, pageCount);
  const pageItems = shown.slice((page - 1) * RESULTS_PAGE_SIZE, page * RESULTS_PAGE_SIZE);
  const highest = meta && result && !result.items.length ? await highestClosingRank(input, meta) : null;

  const course = PREDICTOR_COURSES[input.course];
  const category = CATEGORIES[input.category];
  const stateInfo = input.state ? meta?.states.find((s) => s.value === input.state) : undefined;
  const authority = stateAuthority(stateInfo?.code);
  const quotaLabels = (meta?.quotas[input.course] ?? []).filter((q) => input.quotas.includes(q.value)).map((q) => q.label);

  const defaults = Object.fromEntries(Object.keys(PREDICTOR_COURSES).map((k) => [k, defaultQuotas(k, meta)]));
  // Default quotas first, then the rest by how many rows the lists have for them.
  const quotaOptions = Object.fromEntries(
    Object.keys(PREDICTOR_COURSES).map((k) => {
      const list = meta?.quotas[k] ?? [];
      const ordered = [...list.filter((q) => defaults[k].includes(q.value)), ...list.filter((q) => !defaults[k].includes(q.value))];
      return [k, ordered.map((q) => ({ value: q.value, label: q.label, note: own(QUOTA_NOTES, q.mcc) ?? null }))];
    }),
  );
  const formKey = predictorHref(input, meta);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "College predictor", item: `${siteUrl}/predictor` },
      { "@type": "ListItem", position: 3, name: "NEET UG", item: `${siteUrl}/predictor/neet` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        crumbs={[{ href: "/predictor", label: "College predictor" }, { label: "NEET UG" }]}
        title={`NEET UG college predictor ${year}`}
        intro={`Enter your All India Rank to see the MBBS, BDS and B.Sc Nursing colleges where MCC ${year} All India counselling allotted seats at that rank, round by round. Free, instant, no sign-up.`}
      />

      <div className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside aria-label="Your rank and choices">
            <div className="card p-5 lg:sticky lg:top-[120px] lg:max-h-[calc(100dvh-136px)] lg:overflow-y-auto">
              <h2 className="mb-4 text-xl font-bold">Your rank and choices</h2>
              {meta ? (
                <NeetPredictorForm
                  key={formKey}
                  courses={Object.entries(PREDICTOR_COURSES).map(([value, c]) => ({ value, label: c.label }))}
                  categories={Object.entries(CATEGORIES).map(([value, c]) => ({ value, label: c.label }))}
                  quotas={quotaOptions}
                  defaults={defaults}
                  states={meta.states.map((s) => ({ value: s.value, label: s.label }))}
                  ownership={meta.ownership}
                  initial={{ rank: input.rankText, course: input.course, category: input.category, quotas: input.quotas, state: input.state, ownership: input.ownership }}
                  rankError={input.rankError}
                />
              ) : (
                <p className="text-ink-soft">The MCC closing ranks are not loaded yet. Please check back soon.</p>
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <Disclaimer year={year} />

            <section id="results" aria-labelledby="results-heading" className="scroll-mt-32">
              {result && input.rank ? (
                <>
                  <h2 id="results-heading" className="text-2xl font-bold">
                    {result.items.length ? `${formatNumber(result.items.length)} ${course.label} ${result.items.length === 1 ? "option" : "options"}` : `No ${course.label} options`} for AIR{" "}
                    {formatNumber(input.rank)}
                  </h2>
                  <p className="mt-1 text-[0.95rem] text-ink-soft">
                    {category.label} candidate · {quotaLabels.join(", ")}
                    {stateInfo ? ` · colleges in ${stateInfo.label}` : ""}
                    {input.ownership.length ? ` · ${meta?.ownership.filter((o) => input.ownership.includes(o.value)).map((o) => o.label).join(", ")}` : ""}
                  </p>

                  {result.items.length ? (
                    <>
                      <div className="scroll-row -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Show results by band">
                        {([null, "likely", "possible", "reach"] as (Band | null)[]).map((b) => {
                          const n = b ? result.counts[b] : result.items.length;
                          const active = input.band === b;
                          return (
                            <Link
                              key={b ?? "all"}
                              href={predictorHref({ ...input, band: b, page: 1 }, meta)}
                              aria-current={active ? "true" : undefined}
                              className={`tabular shrink-0 rounded-full border px-3 py-1.5 text-[0.88rem] font-bold ${
                                active ? "border-ink bg-ink text-white" : "border-rule bg-paper text-ink-soft hover:border-ink hover:text-ink"
                              }`}
                            >
                              {b ? BANDS[b].label : "All"} ({formatNumber(n)})
                            </Link>
                          );
                        })}
                      </div>
                      {pageItems.length ? (
                        <ol className="mt-4 space-y-3">
                          {pageItems.map((r) => (
                            <ResultRow key={`${r.slug}|${r.quota}`} r={r} rank={input.rank!} meta={meta!} />
                          ))}
                        </ol>
                      ) : (
                        <p className="card mt-4 p-5 text-ink-soft">No {input.band ? BANDS[input.band].label : ""} options for these choices. The other bands above may have some.</p>
                      )}
                      <Pagination page={page} pageCount={pageCount} href={(n) => predictorHref({ ...input, page: n }, meta)} />
                    </>
                  ) : (
                    <div className="card mt-4 space-y-3 p-5 sm:p-6">
                      <p>
                        In the MCC {year} All India lists, no {course.label} seat for these choices closed at or within 10% of rank {formatNumber(input.rank)}.
                        {highest ? (
                          <>
                            {" "}
                            The highest closing rank for them was <b className="tabular">{formatNumber(highest)}</b>.
                          </>
                        ) : null}
                      </p>
                      <ul className="ml-5 list-disc space-y-1 text-ink-soft">
                        <li>Include more quotas, or remove the state and ownership filters, under More options.</li>
                        {input.course !== "bds" ? (
                          <li>
                            Try <Link href={predictorHref({ ...input, course: "bds", quotas: [], band: null, page: 1 }, meta)} className="font-bold underline">BDS</Link>
                            {input.course !== "bsc-nursing" ? (
                              <>
                                {" "}or <Link href={predictorHref({ ...input, course: "bsc-nursing", quotas: [], band: null, page: 1 }, meta)} className="font-bold underline">B.Sc Nursing</Link>
                              </>
                            ) : null}
                            ; their closing ranks differ from {course.label}.
                          </li>
                        ) : null}
                        {input.course !== "bsc-nursing" ? (
                          <li>Paid seat quotas such as Self-Financed Merit Seat closed at much higher ranks in these lists; tick them under More options to see them.</li>
                        ) : null}
                        <li>State quota seats are allotted by each state&apos;s own counselling, with its own merit list and closing ranks, which are not covered here.</li>
                        <li>AYUSH courses (BAMS, BHMS and others) and veterinary seats are not in these lists.</li>
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-5 sm:p-6">
                  <h2 id="results-heading" className="text-2xl font-bold">
                    {input.rankError ? "Check your rank" : "Enter your rank to begin"}
                  </h2>
                  <p className="mt-2 text-ink-soft">
                    {input.rankError ??
                      "Type your NEET UG All India Rank and category. Results appear instantly, sorted with the likeliest colleges first, and the page link can be shared or bookmarked."}
                  </p>
                </div>
              )}
            </section>

            {input.rank && stateInfo ? (
              <section className="card p-5 sm:p-6" aria-labelledby="state-quota">
                <h2 id="state-quota" className="text-xl font-bold">
                  State quota seats in {stateInfo.label}
                </h2>
                <p className="mt-2 text-ink-soft">
                  This predictor covers MCC All India counselling only. State quota seats in {stateInfo.label} are allotted through the state&apos;s own counselling,
                  with its own merit list and closing ranks, which are not included here.
                </p>
                {authority ? (
                  <a href={authority.url} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 font-bold underline underline-offset-2">
                    {authority.body} <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <p className="mt-2 text-[0.92rem] text-muted">We have not recorded the counselling authority for {stateInfo.label} yet; check the state health or medical education department&apos;s notice.</p>
                )}
              </section>
            ) : null}

            <section className="card p-5 sm:p-6" aria-labelledby="how">
              <h2 id="how" className="text-2xl font-bold">
                How this predictor works
              </h2>
              <p className="mt-2 text-ink-soft">
                For every college, course, quota and seat category in the MCC {year} All India allotment lists, we compare your All India Rank with the closing rank
                (the last rank allotted a seat) in each round: Round 1, Round 2, Round 3 and the Stray Vacancy Round.
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                {(Object.keys(BANDS) as Band[]).map((b) => (
                  <div key={b} className="rounded-xl border border-rule p-4">
                    <dt>
                      <BandBadge band={b} />
                    </dt>
                    <dd className="mt-2 text-[0.92rem] text-ink-soft">
                      {b === "likely"
                        ? "Your rank is at or within the Round 1 closing rank."
                        : b === "possible"
                          ? "Your rank is beyond the Round 1 closing rank but within the closing rank of a later round."
                          : "Your rank is up to 10% beyond the highest closing rank of any round. Colleges further away are not shown."}
                    </dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-4 ml-5 list-disc space-y-1.5 text-[0.95rem] text-ink-soft">
                <li>
                  Open seats are open to every candidate, so a reserved category candidate sees their own category&apos;s seats and Open seats; a PwD candidate also sees
                  the seats of their category without PwD. For each college and quota we show the seat category that gives the best result, and name it.
                </li>
                <li>Results are sorted Likely first, then Possible, then Reach, and within each by closing rank, lowest first.</li>
                <li>
                  Round 2 and Round 3 closing ranks count only fresh allotments and upgrades in that round, not seats kept from an earlier round. &quot;None&quot; means
                  MCC allotted no seat of that type in that round.
                </li>
                <li>These are not probabilities. Seat matrices, the number of candidates and their choices change every year.</li>
                <li>
                  By default we include the quotas any candidate can be allotted: All India and, for MBBS and BDS, MCC&apos;s Open Seat Quota, which holds the AIIMS,
                  JIPMER and BHU seats. Other quotas (deemed university paid seats, Delhi University, IP University, AMU, ESI and more) are under More options.
                </li>
                <li>
                  Quota names are exactly as MCC prints them. 20 of the institutions in the MCC lists, including several newer AIIMS, are not yet matched to a college
                  page of ours and are left out of these results.
                </li>
                <li>State quota counselling, AYUSH and veterinary admissions are not covered.</li>
              </ul>
              {meta ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ROUNDS.map((x) => {
                    const s = meta.roundSources[x.key];
                    return s ? <SourceStamp key={x.key} publisher={`MCC ${year} ${x.label} allotment`} url={s.url} checked={s.retrievedOn} /> : null;
                  })}
                </div>
              ) : null}
              <p className="mt-4 text-[0.92rem] text-ink-soft">
                Want help building a choice list from these results?{" "}
                <Link href="/counselling" className="font-bold underline">
                  Talk to a counsellor
                </Link>
                , free.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
