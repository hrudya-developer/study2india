import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getScholarships } from "@/lib/queries/catalog";
import { PageHero } from "@/components/page-hero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scholarships for college students in India",
  description: "Government, university and trust scholarships for students, with eligibility, amounts and official application links.",
};

export default async function ScholarshipsPage() {
  const list = await getScholarships();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Scholarships" }]}
        title="Scholarships"
        intro="Government, university and trust scholarships, many of which students from Kerala are eligible for but rarely apply to. Our counsellors help with eligibility and documents."
      />
      <div className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {list.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {list.map((s) => (
                <li key={s.slug} className="card p-5">
                  <h2 className="text-xl font-bold">{s.name}</h2>
                  <p className="text-[0.9rem] text-muted">{s.provider}</p>
                  <dl className="mt-3 space-y-1.5 text-[0.95rem]">
                    <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Amount</dt><dd>{s.amount_text ?? <span className="italic text-muted">Not recorded</span>}</dd></div>
                    <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Deadline</dt><dd>{s.deadline ?? <span className="italic text-muted">Not recorded</span>}</dd></div>
                    <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Eligibility</dt><dd>{s.eligibility_text ?? <span className="italic text-muted">Not recorded</span>}</dd></div>
                  </dl>
                  {s.official_url ? (
                    <a href={s.official_url} target="_blank" rel="noopener" className="mt-4 inline-flex items-center gap-1 font-bold text-brand-hover">
                      Official page <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="card p-8">
              <h2 className="text-2xl font-bold">Scholarship listings are being added</h2>
              <p className="mt-2 max-w-[60ch] text-ink-soft">
                We list a scholarship only after checking it on the provider&apos;s own site. Meanwhile, the{" "}
                <a href="https://scholarships.gov.in" target="_blank" rel="noopener" className="font-bold underline">
                  National Scholarship Portal
                </a>{" "}
                covers most central and state government schemes, and a counsellor can check what you qualify for.
              </p>
              <Link href="/counselling" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-bold text-ink hover:bg-brand-hover">
                Ask a counsellor
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
