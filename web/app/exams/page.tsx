import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";
import { getExams } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";
import { formatRange, phaseOf, todayInIndia } from "@/lib/exam-timeline";

type DateRow = { slug: string; event: string; cycle: string; starts_on: string; ends_on: string | null; status: string };

/** For each exam, the next date still to come, or failing that the most recent one. */
async function keyDates(today: string) {
  const list = await rows<DateRow>(sql`
    select e.slug, d.event, d.cycle, d.starts_on, d.ends_on, d.status
    from exam_dates d join exams e on e.id = d.exam_id
    where d.starts_on is not null
    order by d.starts_on
  `);
  const out = new Map<string, { row: DateRow; upcoming: boolean }>();
  for (const r of list) {
    const live = phaseOf(r.starts_on, r.ends_on, today) !== "past";
    const cur = out.get(r.slug);
    if (live) {
      if (!cur || !cur.upcoming) out.set(r.slug, { row: r, upcoming: true });
    } else if (!cur || (!cur.upcoming && r.starts_on >= cur.row.starts_on)) {
      out.set(r.slug, { row: r, upcoming: false });
    }
  }
  return out;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrance exams in India: NEET, JEE, KEAM, CUET, CAT, CLAT and more",
  description: "National and state entrance exams for medical, engineering, management, law, design and other courses, with conducting bodies and official sites.",
  alternates: { canonical: "/exams" },
};

export default async function ExamsPage() {
  const today = todayInIndia();
  const [exams, dates] = await Promise.all([getExams(), keyDates(today)]);
  const groups = [
    { title: "National exams", items: exams.filter((e) => e.level !== "State") },
    { title: "State exams", items: exams.filter((e) => e.level === "State") },
  ];

  return (
    <>
      <PageHero crumbs={[{ label: "Exams" }]} title="Entrance exams" intro="Dates are shown only once the conducting body announces them, each with a link to its official notice. The official site is always the final word." />
      <div className="bg-band">
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
          {groups.map((g) => (
            <section key={g.title} aria-labelledby={`g-${g.title}`}>
              <h2 id={`g-${g.title}`} className="mb-4 text-2xl font-bold">
                {g.title}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((e) => (
                  <li key={e.slug} className="card flex flex-col p-5">
                    <h3 className="text-xl font-bold">
                      <Link href={`/exam/${e.slug}`} className="hover:text-brand-hover">
                        {e.short}
                      </Link>
                    </h3>
                    <p className="text-[0.9rem] text-muted">{e.name}</p>
                    <p className="mt-3 text-[0.92rem]">Conducted by {e.body}</p>
                    <p className="mt-1 text-[0.92rem] text-ink-soft">Leads to: {e.streams.join(", ")}</p>
                    {(() => {
                      const k = dates.get(e.slug);
                      if (!k) return <p className="mt-3 text-[0.9rem] italic text-muted">Dates not recorded yet</p>;
                      const when = formatRange(k.row.starts_on, k.row.ends_on);
                      return k.upcoming ? (
                        <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-[0.9rem]">
                          <span className="font-bold">Next:</span> {k.row.event}, <span className="tabular font-bold whitespace-nowrap">{when}</span>
                          {k.row.status === "tentative" ? <span className="text-muted"> (tentative)</span> : null}
                        </p>
                      ) : (
                        <p className="mt-3 rounded-lg bg-band px-3 py-2 text-[0.9rem] text-muted">
                          <span className="font-bold">Last recorded:</span> {k.row.event} ({k.row.cycle}), <span className="tabular whitespace-nowrap">{when}</span>
                        </p>
                      );
                    })()}
                    <div className="mt-auto flex items-center justify-between pt-4 text-[0.9rem]">
                      <Link href={`/exam/${e.slug}`} className="font-bold text-brand-hover hover:underline">
                        Exam details
                      </Link>
                      {e.url ? (
                        <a href={e.url} target="_blank" rel="noopener" className="flex items-center gap-1 text-muted hover:text-ink">
                          Official site <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
