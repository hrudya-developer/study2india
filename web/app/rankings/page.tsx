import type { Metadata } from "next";
import Link from "next/link";
import { getRankingCategories, getRankingList } from "@/lib/queries/catalog";
import { PageHero } from "@/components/page-hero";
import { SourceStamp } from "@/components/source-stamp";
import { one, type SearchParams } from "@/lib/params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NIRF rankings of colleges and universities in India",
  description: "Official NIRF India Rankings by category: overall, universities, colleges, medical, engineering, management, pharmacy, dental, law and more.",
};

export default async function RankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const categories = await getRankingCategories();
  const asked = one((await searchParams).category);
  const current = categories.find((c) => c.category === asked) ?? categories.find((c) => c.category === "Overall") ?? categories[0];
  const list = current ? await getRankingList(current.category, Number(current.year)) : [];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Rankings" }]}
        title="NIRF rankings"
        intro="The National Institutional Ranking Framework is published every year by the Ministry of Education. We show it exactly as published, and never move partner colleges up."
      />
      <div className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {current ? (
            <div className="card p-5 sm:p-6">
              <nav aria-label="Ranking category" className="scroll-row -mx-1 flex gap-1 overflow-x-auto border-b border-rule">
                {categories.map((c) => (
                  <Link
                    key={c.category}
                    href={`/rankings?category=${encodeURIComponent(c.category)}`}
                    aria-current={c.category === current.category ? "page" : undefined}
                    className={`-mb-px shrink-0 border-b-[3px] px-3 py-2.5 text-[0.95rem] ${c.category === current.category ? "border-brand font-bold" : "border-transparent text-muted hover:text-ink"}`}
                  >
                    {c.category}
                  </Link>
                ))}
              </nav>
              <h2 className="mt-5 text-2xl font-bold">
                NIRF {current.year}: {current.category}
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="text-[0.85rem] text-muted">
                      <th className="w-20 py-2 font-normal">Rank</th>
                      <th className="py-2 font-normal">Institution</th>
                      <th className="py-2 font-normal">Location</th>
                      <th className="py-2 text-right font-normal">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr key={r.slug} className="border-t border-rule">
                        <td className="tabular py-2.5 font-[family-name:var(--font-display)] text-lg font-bold">{r.rank ?? r.rank_band}</td>
                        <td className="py-2.5">
                          <Link href={`/college/${r.slug}`} className="font-bold hover:text-brand-hover">
                            {r.name}
                          </Link>
                        </td>
                        <td className="py-2.5 text-ink-soft">{[r.city, r.state].filter(Boolean).join(", ") || <span className="italic text-muted">Not recorded</span>}</td>
                        <td className="tabular py-2.5 text-right">{r.score ?? <span className="italic text-muted">Not recorded</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {list[0] ? (
                <div className="mt-4">
                  <SourceStamp publisher={`NIRF India Rankings ${current.year}`} url={list[0].url?.split(" ")[0]} checked={list[0].retrieved_on} />
                </div>
              ) : null}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
}
