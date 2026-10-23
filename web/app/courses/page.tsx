import type { Metadata } from "next";
import Link from "next/link";
import { getStreams, getExams } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";
import { FieldIcon } from "@/components/field-icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses in India: duration, entrance exams and colleges",
  description: "Every major course in India by field: medical, dental, nursing, AYUSH, engineering, management, law and more, with duration and entrance exams.",
};

const LEVEL_LABEL: Record<string, string> = { ug: "Undergraduate", pg: "Postgraduate", diploma: "Diploma", doctorate: "Doctorate", certificate: "Certificate", integrated: "Integrated" };

export default async function CoursesPage() {
  const [streams, exams] = await Promise.all([getStreams(), getExams()]);
  const total = streams.reduce((n, s) => n + s.courses.length, 0);

  return (
    <>
      <PageHero crumbs={[{ label: "Courses" }]} title="Courses" intro={`${total} courses across ${streams.length} fields. Durations are shown only where the regulator fixes them.`}>
        <nav aria-label="Jump to field" className="mt-6 flex flex-wrap gap-2">
          {streams.map((s) => (
            <a key={s.slug} href={`#${s.slug}`} className="rounded-full bg-white/10 px-3 py-1 text-[0.88rem] hover:bg-white/20">
              {s.name}
            </a>
          ))}
        </nav>
      </PageHero>

      <div className="bg-band">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
          {streams.map((s) => {
            const ex = exams.filter((e) => e.streams.includes(s.name)).map((e) => e.short);
            return (
              <section key={s.slug} id={s.slug} className="card scroll-mt-32 p-5 sm:p-6" aria-labelledby={`h-${s.slug}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FieldIcon slug={s.slug} className="size-11" />
                    <div>
                      <h2 id={`h-${s.slug}`} className="text-2xl font-bold">
                        {s.name}
                      </h2>
                      <p className="text-[0.9rem] text-muted">{ex.length ? `Entrance exams: ${ex.join(", ")}` : s.summary}</p>
                    </div>
                  </div>
                  <Link href={`/colleges?stream=${s.slug}`} className="rounded-lg border border-rule px-4 py-2 text-[0.92rem] font-bold hover:bg-band">
                    {s.name} colleges{s.institutions ? ` (${s.institutions.toLocaleString("en-IN")})` : ""}
                  </Link>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[0.95rem]">
                    <thead>
                      <tr className="text-[0.85rem] text-muted">
                        <th className="py-2 font-normal">Course</th>
                        <th className="py-2 font-normal">Level</th>
                        <th className="py-2 font-normal">Duration</th>
                        <th className="py-2 font-normal" />
                      </tr>
                    </thead>
                    <tbody>
                      {s.courses.map((c) => (
                        <tr key={c.slug} className="border-t border-rule align-top">
                          <td className="py-3 pr-4">
                            <Link href={`/course/${c.slug}`} className="font-bold hover:text-brand-hover">
                              {c.short}
                            </Link>
                            <span className="block text-[0.88rem] text-muted">{c.name}</span>
                          </td>
                          <td className="py-3 pr-4">{LEVEL_LABEL[c.level] ?? c.level}</td>
                          <td className="py-3 pr-4">{c.duration ?? <span className="italic text-muted">Not recorded</span>}</td>
                          <td className="py-3 text-right">
                            <Link href={`/colleges?course=${c.slug}`} className="whitespace-nowrap font-bold text-brand-hover hover:underline">
                              Colleges
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
