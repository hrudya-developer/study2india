import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { RankingList } from "@/components/rankings/ranking-list";
import { RankingFilters } from "@/components/rankings/ranking-filters";
import { HowToRead } from "@/components/rankings/how-to-read";
import { JsonLd, NirfSource, formatDate } from "@/components/rankings/bits";
import { YearSwitch } from "@/components/rankings/year-switch";
import {
  categorySlug,
  filterRows,
  findCategory,
  getCategoryYears,
  getRankingCategories,
  getRankingTable,
  rankingFacets,
  rankingHref,
  type RankingFilters as Filters,
  type RankingTable,
} from "@/lib/queries/rankings";
import { one, type SearchParams } from "@/lib/params";
import { SITE_ORIGIN } from "@/lib/seo";

export const dynamic = "force-dynamic";

// JSON-LD names the public origin, like the sitemaps and the other pages (lib/seo.ts).
const siteUrl = SITE_ORIGIN;
const fmt = (n: number) => n.toLocaleString("en-IN");

type Props = { params: Promise<{ category: string }>; searchParams: SearchParams };

type Loaded = { table: RankingTable; latest: number; filters: Filters; stateName: string | null; ownershipName: string | null };

/** The list for the URL, with only the filters that match something in it. Null for an unknown list or year. */
async function load({ params, searchParams }: Props): Promise<Loaded | null> {
  const [{ category: slug }, sp] = await Promise.all([params, searchParams]);
  const found = await findCategory(slug);
  if (!found) return null;
  const latest = found.years[0];
  const askedYear = one(sp.year);
  const year = askedYear ? Number(askedYear) : latest;
  if (!found.years.includes(year)) return null;
  const table = await getRankingTable(found.category, year);
  if (!table) return null;
  const facets = rankingFacets(table.rows);
  const state = facets.states.find((s) => s.value === one(sp.state));
  const ownership = facets.ownership.find((o) => o.value === one(sp.ownership));
  const q = one(sp.q)?.slice(0, 80);
  return {
    table,
    latest,
    filters: { state: state?.value, ownership: ownership?.value, q },
    stateName: state?.label ?? null,
    ownershipName: ownership?.label ?? null,
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const l = await load(props);
  if (!l) return { title: "Ranking not found" };
  const { table: t, latest } = l;
  const top = t.rows.filter((r) => r.rank !== null).slice(0, 3);
  const where = l.stateName ? ` in ${l.stateName}` : " in India";
  return {
    title: `NIRF ${t.year} ${t.category} Rankings: ${t.noun}${where}`,
    description: `The full NIRF ${t.year} ${t.category} ranking from the Ministry of Education: ${fmt(t.rows.length)} institutions${
      top.length ? `, led by ${top.map((r) => r.name).join(", ")}` : ""
    }. Rank, NIRF score, city, state and ownership, filter by state, and no ads in the table.`,
    alternates: { canonical: rankingHref(t.slug, t.year, latest) },
    openGraph: { title: `NIRF ${t.year} ${t.category} Rankings`, url: rankingHref(t.slug, t.year, latest) },
  };
}

export default async function RankingCategoryPage(props: Props) {
  const l = await load(props);
  if (!l) notFound();
  const { table: t, latest, filters } = l;
  const allYears = await getCategoryYears();
  const facets = rankingFacets(t.rows);
  const shown = filterRows(t.rows, filters);
  const filtered = !!(filters.state || filters.ownership || filters.q);
  const path = `/rankings/${t.slug}`;
  const yearParam = t.year === latest ? null : t.year;
  const indexHref = t.year === latest ? "/rankings" : `/rankings?year=${t.year}`;

  const exact = t.rows.filter((r) => r.rank !== null).length;
  const scored = t.rows.filter((r) => r.score !== null).length;
  const topStates = [...facets.states].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 6);

  const seats = t.seats;
  const seatLabel = seats && seats.recorded > 0 ? seats.courses.join(" / ") : null;
  const others = (await getRankingCategories(t.year)).map((c) => c.category).filter((c) => c !== t.category);

  const canonical = `${siteUrl}${rankingHref(t.slug, t.year, latest)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Rankings", item: `${siteUrl}${indexHref}` },
        { "@type": "ListItem", position: 3, name: `NIRF ${t.year} ${t.category}`, item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `NIRF ${t.year} ${t.category} ranking`,
      description: `Institutions with an exact rank in the NIRF ${t.year} ${t.category} list, as published by the Ministry of Education.`,
      url: canonical,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: Math.min(exact, 100),
      itemListElement: t.rows
        .filter((r) => r.rank !== null)
        .slice(0, 100)
        .map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${siteUrl}/college/${r.slug}` })),
    },
  ];

  const summary = [
    filters.q ? `matching "${filters.q}"` : null,
    l.stateName ? `in ${l.stateName}` : null,
    l.ownershipName ? `with ownership recorded as ${l.ownershipName.toLowerCase()}` : null,
  ].filter(Boolean);

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero crumbs={[{ label: "Rankings", href: indexHref }, { label: `NIRF ${t.year} ${t.category}` }]} title={`NIRF ${t.year} ${t.category} rankings`} intro={t.about}>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {[
            { label: "Institutions ranked", value: fmt(t.rows.length) },
            { label: "Exact ranks", value: fmt(exact) },
            { label: "With NIRF score", value: fmt(scored) },
            { label: "States and UTs", value: fmt(facets.states.length) },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-[0.82rem] uppercase tracking-wide text-[#b9bce0]">{s.label}</dt>
              <dd className="tabular font-[family-name:var(--font-display)] text-[1.5rem] font-extrabold leading-tight">{s.value}</dd>
            </div>
          ))}
        </dl>
        <YearSwitch years={t.years} current={t.year} hrefFor={(y) => rankingHref(t.slug, y, latest)} />
      </PageHero>

      <div className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <nav aria-label="Other NIRF lists" className="scroll-row -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={path + (yearParam ? `?year=${yearParam}` : "")} aria-current="page" className="shrink-0 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-[0.92rem] font-bold text-white">
              {t.category}
            </Link>
            {others.map((c) => {
              const ys = allYears.get(c) ?? [];
              return (
                <Link
                  key={c}
                  href={rankingHref(categorySlug(c), t.year, ys[0])}
                  className="shrink-0 rounded-full border border-rule bg-paper px-3.5 py-1.5 text-[0.92rem] font-bold text-ink-soft hover:border-ink hover:text-ink"
                >
                  {c}
                </Link>
              );
            })}
          </nav>

          <section aria-labelledby="list-title" className="card">
            <div className="border-b border-rule p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="list-title" className="text-[1.4rem] font-bold">
                  Full list
                </h2>
                <p className="tabular text-[0.92rem] text-ink-soft" aria-live="polite">
                  {filtered ? (
                    <>
                      <span className="font-bold text-ink">{fmt(shown.length)}</span> of {fmt(t.rows.length)} {summary.join(", ")}
                    </>
                  ) : (
                    <>
                      All <span className="font-bold text-ink">{fmt(t.rows.length)}</span> institutions, in NIRF order
                    </>
                  )}
                </p>
              </div>
              <div className="mt-4">
                <RankingFilters
                  key={`${filters.state ?? ""}|${filters.ownership ?? ""}|${filters.q ?? ""}`}
                  action={path}
                  year={yearParam}
                  filters={filters}
                  states={facets.states}
                  ownership={facets.ownership}
                />
              </div>
              {!filtered && topStates.length > 1 ? (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[0.88rem]">
                  <span className="text-muted">Most listed:</span>
                  {topStates.map((s) => (
                    <Link
                      key={s.value}
                      href={`${path}?${new URLSearchParams({ ...(yearParam ? { year: String(yearParam) } : {}), state: s.value })}`}
                      scroll={false}
                      className="rounded-full bg-band px-2.5 py-1 font-bold text-ink-soft hover:bg-brand-soft hover:text-ink"
                    >
                      {s.label} <span className="tabular font-normal text-muted">{s.count}</span>
                    </Link>
                  ))}
                </p>
              ) : null}
              {facets.ownershipRecorded < t.rows.length ? (
                <p className="mt-3 text-[0.82rem] text-muted">
                  Ownership is recorded for {fmt(facets.ownershipRecorded)} of {fmt(t.rows.length)} institutions in this list; NIRF tables do not include it, so the ownership filter covers only those we have
                  from regulators&apos; lists.
                </p>
              ) : null}
            </div>

            {shown.length ? (
              <RankingList rows={shown} year={t.year} category={t.category} previousYear={t.previousYear} seatLabel={seatLabel} seatCourseShown={!!seats && seats.courses.length > 1} />
            ) : (
              <div className="p-6 sm:p-8">
                <p className="text-lg font-bold">No institution in this list matches.</p>
                <p className="mt-1 text-ink-soft">
                  Try another state or a shorter name.{" "}
                  <Link href={path + (yearParam ? `?year=${yearParam}` : "")} scroll={false} className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
                    Show the whole list
                  </Link>
                </p>
              </div>
            )}

            <div className="space-y-3 border-t border-rule p-4 sm:p-5">
              <NirfSource year={t.year} source={t.source} />
              {seats ? (
                seats.recorded > 0 ? (
                  <p className="text-[0.85rem] text-muted">
                    {seatLabel} seats are the approved intake we hold for each institution, recorded for {fmt(seats.recorded)} of {fmt(t.rows.length)} in this list
                    {seats.publishers.length ? (
                      <>
                        {", from "}
                        {seats.publishers.map((p, i) => (
                          <span key={`${p.publisher}${p.academicYear}`}>
                            {i > 0 ? (i === seats.publishers.length - 1 ? " and " : ", ") : null}
                            {p.url ? (
                              <a href={p.url} target="_blank" rel="noopener" className="underline underline-offset-2">
                                {p.publisher}
                              </a>
                            ) : (
                              p.publisher
                            )}
                            {p.academicYear ? ` (${p.academicYear})` : null}, checked {formatDate(p.retrievedOn)}
                          </span>
                        ))}
                      </>
                    ) : null}
                    . Seats are not part of NIRF. Where a regulator lists seats only by branch and a branch figure is missing, we show Not recorded rather than a partial total.
                  </p>
                ) : (
                  <p className="text-[0.85rem] text-muted">We have not recorded {seats.courses.join(" or ")} seats for the institutions in this list yet, so no seat column is shown.</p>
                )
              ) : null}
              {t.previousYear === null ? (
                <p className="text-[0.85rem] text-muted">Change since last year appears here once an earlier NIRF {t.category} list is loaded.</p>
              ) : null}
            </div>
          </section>

          <div className="mt-10">
            <HowToRead />
          </div>
        </div>
      </div>
    </>
  );
}
