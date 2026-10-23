import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getScholarships } from "@/lib/queries/catalog";
import { PageHero } from "@/components/page-hero";
import { SCHOLARSHIP_DEADLINE_SOURCE } from "@/data/scholarships";
import { daysUntil, formatDate, todayInIndia } from "@/lib/exam-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scholarships for college students in India",
  description: "Central and state government scholarships for college students, with eligibility, amounts, 2026-27 deadlines and official application links.",
};

type Scholarship = Awaited<ReturnType<typeof getScholarships>>[number];

function Deadline({ date, today }: { date: string | null; today: string }) {
  if (!date) return <span className="italic text-muted">Not recorded</span>;
  const days = daysUntil(date, today);
  if (days < 0)
    return (
      <span className="text-muted">
        <span className="tabular line-through decoration-rule">{formatDate(date)}</span> <span className="rounded-full bg-band px-2 py-0.5 text-[0.78rem] font-bold">Closed</span>
      </span>
    );
  return (
    <span>
      <span className="tabular font-bold">{formatDate(date)}</span>{" "}
      <span className="whitespace-nowrap rounded-full bg-brand px-2 py-0.5 text-[0.78rem] font-bold text-ink">
        {days === 0 ? "Closes today" : `${days} day${days === 1 ? "" : "s"} left`}
      </span>
    </span>
  );
}

function Card({ s, today }: { s: Scholarship; today: string }) {
  const open = s.deadline !== null && daysUntil(s.deadline, today) >= 0;
  return (
    <li className={`card flex flex-col p-5 ${open ? "ring-2 ring-brand/40" : ""}`}>
      <h3 className="text-xl font-bold">{s.name}</h3>
      <p className="text-[0.9rem] text-muted">{s.provider}</p>
      <dl className="mt-3 space-y-2 text-[0.95rem]">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted">Amount</dt>
          <dd>{s.amount_text ?? <span className="italic text-muted">Not recorded</span>}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted">Deadline</dt>
          <dd>
            <Deadline date={s.deadline} today={today} />
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted">Eligibility</dt>
          <dd className="text-ink-soft">{s.eligibility_text ?? <span className="italic text-muted">Not recorded</span>}</dd>
        </div>
      </dl>
      {s.official_url ? (
        <a href={s.official_url} target="_blank" rel="noopener" className="mt-auto inline-flex items-center gap-1 pt-4 font-bold text-brand-hover">
          Official page <ExternalLink size={15} aria-hidden="true" />
        </a>
      ) : null}
    </li>
  );
}

export default async function ScholarshipsPage() {
  const today = todayInIndia();
  const list = await getScholarships();
  const central = list.filter((s) => !s.provider_type?.startsWith("State"));
  const states = [...new Set(list.filter((s) => s.provider_type?.startsWith("State")).map((s) => s.provider_type!.replace(/^State:\s*/, "")))].sort();
  const groups = [
    { id: "central", title: "Central government", items: central },
    ...states.map((st) => ({ id: st.toLowerCase().replace(/\s+/g, "-"), title: st, items: list.filter((s) => s.provider_type === `State: ${st}`) })),
  ].filter((g) => g.items.length);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Scholarships" }]}
        title="Scholarships"
        intro="Central and state government scholarships for college students, checked on each provider's own site. Our counsellors help with eligibility and documents."
      />
      <div className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {list.length ? (
            <>
              <nav aria-label="Scholarship groups" className="mb-8 flex flex-wrap gap-2">
                {groups.map((g) => (
                  <a key={g.id} href={`#${g.id}`} className="rounded-full border border-rule bg-paper px-3 py-1.5 text-[0.92rem] font-bold hover:border-brand hover:bg-brand-soft">
                    {g.title} <span className="font-normal text-muted">({g.items.length})</span>
                  </a>
                ))}
              </nav>
              <div className="space-y-10">
                {groups.map((g) => (
                  <section key={g.id} id={g.id} aria-labelledby={`h-${g.id}`} className="scroll-mt-32">
                    <h2 id={`h-${g.id}`} className="mb-4 text-2xl font-bold">
                      {g.title}
                    </h2>
                    <ul className="grid gap-4 md:grid-cols-2">
                      {g.items.map((s) => (
                        <Card key={s.slug} s={s} today={today} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              <p className="mt-10 max-w-[75ch] text-[0.88rem] text-muted">
                Deadlines are the 2026-27 last dates for fresh applications as published by the provider; for central schemes, the windows listed on the{" "}
                <a href={SCHOLARSHIP_DEADLINE_SOURCE.url} target="_blank" rel="noopener" className="underline underline-offset-2">
                  National Scholarship Portal
                </a>
                , checked {formatDate(SCHOLARSHIP_DEADLINE_SOURCE.retrieved)}. Amounts are shown only as the official guidelines state them. Where a figure is not published, we show &ldquo;Not recorded&rdquo;.
              </p>
            </>
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
