import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db";
import { getExams } from "@/lib/queries/home";
import { EXAM_FIELDS } from "@/data/reference";
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
  title: "Entrance exams in India: NEET, JEE, MHT CET, BITSAT, CAT, XAT, CLAT and more",
  description: "National, state and institute entrance exams for medical, engineering, management, law, design and science courses, grouped by field, with official dates and sites.",
  alternates: { canonical: "/exams" },
};

export default async function ExamsPage() {
  const today = todayInIndia();
  const [exams, dates] = await Promise.all([getExams(), keyDates(today)]);
  // Within a field: national exams, then institute exams, then state exams by state.
  const order: Record<string, number> = { National: 0, University: 1, State: 2 };
  const groups = EXAM_FIELDS.map((f) => ({
    key: f.key,
    title: f.label,
    items: exams
      .filter((e) => e.field === f.key)
      .sort((a, b) => (order[a.level] ?? 3) - (order[b.level] ?? 3) || (a.states[0] ?? "").localeCompare(b.states[0] ?? "")),
  })).filter((g) => g.items.length);

  return (
    <>
      <PageHero crumbs={[{ label: "Exams" }]} title="Entrance exams" intro="Dates are shown only once the conducting body announces them, each with a link to its official notice. The official site is always the final word." />
      <div className="bg-band">
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
          <nav aria-label="Exam fields" className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <a key={g.key} href={`#${g.key}`} className="rounded-full border border-rule bg-paper px-3 py-1.5 text-[0.9rem] hover:border-brand hover:bg-brand-soft">
                {g.title} <span className="tabular text-muted">({g.items.length})</span>
              </a>
            ))}
          </nav>
          {groups.map((g) => (
            <section key={g.key} id={g.key} className="scroll-mt-32" aria-labelledby={`g-${g.key}`}>
              <h2 id={`g-${g.key}`} className="mb-4 text-2xl font-bold">
                {g.title}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((e) => (
                  <li key={e.slug} className="card flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 text-xl font-bold">
                        <Link href={`/exam/${e.slug}`} className="hover:text-brand-hover">
                          {e.short}
                        </Link>
                      </h3>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[0.78rem] font-bold ${
                          e.level === "State" ? "bg-verified-bg text-verified" : e.level === "University" ? "bg-band text-ink-soft" : "bg-[#e9edff] text-ink-2"
                        }`}
                      >
                        {e.level === "State" ? `State: ${e.states.join(", ") || "not recorded"}` : e.level === "University" ? "Institute" : "National"}
                      </span>
                    </div>
                    <p className="text-[0.9rem] text-muted">{e.name}</p>
                    <p className="mt-3 text-[0.92rem]">
                      {e.counsellingOnly ? "Counselling run by" : "Conducted by"} {e.body}
                    </p>
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
