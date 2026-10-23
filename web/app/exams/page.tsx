import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getExams } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrance exams in India: NEET, JEE, KEAM, CUET, CAT, CLAT and more",
  description: "National and state entrance exams for medical, engineering, management, law, design and other courses, with conducting bodies and official sites.",
};

export default async function ExamsPage() {
  const exams = await getExams();
  const groups = [
    { title: "National exams", items: exams.filter((e) => e.level !== "State") },
    { title: "State exams", items: exams.filter((e) => e.level === "State") },
  ];

  return (
    <>
      <PageHero crumbs={[{ label: "Exams" }]} title="Entrance exams" intro="Dates are shown only once the conducting body announces them. The official site is always the final word." />
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
