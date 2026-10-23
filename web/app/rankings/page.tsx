import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { SourceStamp } from "@/components/source-stamp";
import { CategoryCard } from "@/components/rankings/category-card";
import { HowToRead } from "@/components/rankings/how-to-read";
import { JsonLd } from "@/components/rankings/bits";
import { YearSwitch } from "@/components/rankings/year-switch";
import { categorySlug, getCategoryYears, getRankingCategories, getRankingYears, rankingHref } from "@/lib/queries/rankings";
import { one, type SearchParams } from "@/lib/params";
import { SITE_ORIGIN } from "@/lib/seo";

export const dynamic = "force-dynamic";

// JSON-LD names the public origin, like the sitemaps and the other pages (lib/seo.ts).
const siteUrl = SITE_ORIGIN;
const fmt = (n: number) => n.toLocaleString("en-IN");

type Props = { searchParams: SearchParams };

/** The year asked for in the URL, if it is loaded; otherwise the latest. Null when nothing is loaded. */
async function pickYear(asked: string | undefined) {
  const years = await getRankingYears();
  if (!years.length) return { years, year: null, latest: null, valid: !asked };
  const n = Number(asked);
  if (asked && !years.includes(n)) return { years, year: years[0], latest: years[0], valid: false };
  return { years, year: asked ? n : years[0], latest: years[0], valid: true };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { year, latest } = await pickYear(one((await searchParams).year));
  if (!year) return { title: "NIRF rankings of colleges and universities in India", alternates: { canonical: "/rankings" } };
  const cats = await getRankingCategories(year);
  return {
    title: `NIRF ${year} rankings: all ${cats.length} lists of top colleges and universities in India`,
    description: `Every NIRF ${year} ranking list from the Ministry of Education (${cats
      .slice(0, 6)
      .map((c) => c.category)
      .join(", ")} and more), shown exactly as published, with no ads in the tables and no ratings of our own.`,
    alternates: { canonical: year === latest ? "/rankings" : `/rankings?year=${year}` },
  };
}

export default async function RankingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  // Older links asked for a category on this page; each category now has its own page.
  const asked = one(sp.category);
  if (asked) {
    const all = await getCategoryYears();
    const match = [...all.keys()].find((c) => c.toLowerCase() === asked.toLowerCase() || categorySlug(c) === asked.toLowerCase());
    if (match) permanentRedirect(`/rankings/${categorySlug(match)}`);
  }

  const { years, year, latest, valid } = await pickYear(one(sp.year));
  if (!valid) notFound();

  if (!year || !latest) {
    return (
      <>
        <PageHero crumbs={[{ label: "Rankings" }]} title="NIRF rankings" />
        <div className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="card p-8">
              <h2 className="text-2xl font-bold">Rankings are being loaded</h2>
              <p className="mt-2 max-w-[60ch] text-ink-soft">
                We load the NIRF tables directly from nirfindia.org, category by category, and check them before publishing. Until then, see them on the{" "}
                <a href="https://www.nirfindia.org" target="_blank" rel="noopener" className="font-bold underline">
                  official NIRF site
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const cats = await getRankingCategories(year);
  const general = cats.filter((c) => c.group === "general");
  const subject = cats.filter((c) => c.group === "subject");
  const entries = cats.reduce((a, c) => a + c.entries, 0);
  const checked = cats.map((c) => c.source?.retrievedOn).filter((d): d is string => !!d).sort().at(-1);
  const canonical = year === latest ? "/rankings" : `/rankings?year=${year}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Rankings", item: `${siteUrl}${canonical}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `NIRF ${year} ranking lists`,
      numberOfItems: cats.length,
      itemListElement: cats.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `NIRF ${year} ${c.category} ranking`,
        url: `${siteUrl}${rankingHref(c.slug, year, latest)}`,
      })),
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        crumbs={[{ label: "Rankings" }]}
        title={`NIRF ${year} rankings`}
        intro="Every list in the National Institutional Ranking Framework, published by the Ministry of Education. Pick a list to see every ranked institution, filter by state or ownership, and open any college."
      >
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {[
            { label: "Ranking lists", value: fmt(cats.length) },
            { label: "Entries across lists", value: fmt(entries) },
            { label: "Published by", value: "Ministry of Education" },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-[0.82rem] uppercase tracking-wide text-[#b9bce0]">{s.label}</dt>
              <dd className="tabular font-[family-name:var(--font-display)] text-[1.5rem] font-extrabold leading-tight">{s.value}</dd>
            </div>
          ))}
        </dl>
        <YearSwitch years={years} current={year} hrefFor={(y) => (y === latest ? "/rankings" : `/rankings?year=${y}`)} />
      </PageHero>

      <div className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <nav aria-label="Jump to a list" className="scroll-row -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {cats.map((c) => (
              <Link
                key={c.slug}
                href={rankingHref(c.slug, year, latest)}
                className="shrink-0 rounded-full border border-rule bg-paper px-3.5 py-1.5 text-[0.92rem] font-bold text-ink-soft hover:border-ink hover:text-ink"
              >
                {c.category}
              </Link>
            ))}
          </nav>

          {subject.length ? (
            <section aria-labelledby="by-subject">
              <h2 id="by-subject" className="text-[1.6rem] font-bold">
                By subject
              </h2>
              <p className="mt-1 text-ink-soft">For a course choice: engineering, medicine, management and the other subject lists.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subject.map((c) => (
                  <CategoryCard key={c.slug} c={c} latestYear={latest} />
                ))}
              </div>
            </section>
          ) : null}

          {general.length ? (
            <section aria-labelledby="by-type" className="mt-12">
              <h2 id="by-type" className="text-[1.6rem] font-bold">
                Overall and by type of institution
              </h2>
              <p className="mt-1 text-ink-soft">Lists that compare whole institutions: universities, colleges, research and more.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {general.map((c) => (
                  <CategoryCard key={c.slug} c={c} latestYear={latest} />
                ))}
              </div>
            </section>
          ) : null}

          {checked ? (
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
              <SourceStamp publisher={`NIRF ${year}, Ministry of Education`} checked={checked} />
              <span className="text-[0.85rem] text-muted">Each card links to its official list on nirfindia.org.</span>
            </div>
          ) : null}

          <div className="mt-10">
            <HowToRead />
          </div>
        </div>
      </div>
    </>
  );
}
