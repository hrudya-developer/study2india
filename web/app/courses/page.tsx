import type { Metadata } from "next";
import Link from "next/link";
import { getCourseIndex, getCourseIndexStreams, getCourseIndexSummary, type CourseIndexItem } from "@/lib/queries/courses-index";
import { getExams } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";
import { FieldIcon } from "@/components/field-icon";
import { CourseCard } from "@/components/courses/course-card";
import { CourseSearch } from "@/components/courses/course-search";
import { LEVELS } from "@/components/courses/levels";
import { one, qs, type SearchParams } from "@/lib/params";

export const dynamic = "force-dynamic";

type Props = { searchParams: SearchParams };
type Filters = { level?: string; field?: string; q?: string };

const LEVEL_VALUES: readonly string[] = LEVELS.map((l) => l.value);

async function readFilters(searchParams: SearchParams): Promise<Filters> {
  const p = await searchParams;
  const level = one(p.level)?.toLowerCase();
  const field = one(p.field)?.toLowerCase();
  const q = one(p.q)?.slice(0, 80);
  return {
    level: level && LEVEL_VALUES.includes(level) ? level : undefined,
    field: field && /^[a-z0-9-]+$/.test(field) ? field : undefined,
    q,
  };
}

/** Lowercase and drop punctuation and spaces, so "b tech", "B.Tech" and "btech" all match. */
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Text match on course names. When the query is the start of a course's short name
 * ("btech", "B Tech", "bsc"), only short names count, so "B Tech" does not also pull in
 * every course with "Technology" in its full name. Otherwise every word must appear in
 * the short name, full name or field.
 */
function textMatch(c: CourseIndexItem, q: string, shortOnly: boolean): boolean {
  const sq = squash(q);
  if (shortOnly) return squash(c.short).startsWith(sq);
  const hay = `${c.short} ${c.name} ${c.streamName}`.toLowerCase();
  const flat = squash(hay);
  if (sq && flat.includes(sq)) return true;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((w) => hay.includes(w) || flat.includes(squash(w)));
}

function matches(c: CourseIndexItem, f: Filters, shortOnly: boolean): boolean {
  if (f.level && c.level !== f.level) return false;
  if (f.field && c.streamSlug !== f.field) return false;
  if (f.q && !textMatch(c, f.q, shortOnly)) return false;
  return true;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = await readFilters(searchParams);
  const streams = f.field ? await getCourseIndexStreams() : [];
  const field = streams.find((s) => s.slug === f.field);
  const level = LEVELS.find((l) => l.value === f.level);
  const what = [level?.label, field?.name].filter(Boolean).join(" ");
  const title = what ? `${what} courses in India: duration, seats and colleges` : "All courses in India: duration, seats and colleges";
  return {
    title,
    description: `${what || "Every major"} course in India by field, with level, duration, the number of colleges offering it and approved seats from official regulators.`,
    robots: f.q ? { index: false, follow: true } : undefined,
  };
}

const num = (v: number) => v.toLocaleString("en-IN");

export default async function CoursesPage({ searchParams }: Props) {
  const f = await readFilters(searchParams);
  const [courses, streams, summary, exams] = await Promise.all([getCourseIndex(), getCourseIndexStreams(), getCourseIndexSummary(), getExams()]);

  const field = streams.find((s) => s.slug === f.field);
  const active: Filters = { level: f.level, field: field?.slug, q: f.q };
  const sq = active.q ? squash(active.q) : "";
  const shortOnly = !!sq && courses.some((c) => squash(c.short).startsWith(sq));
  const shown = courses.filter((c) => matches(c, active, shortOnly));
  const totalSeats = courses.reduce((n, c) => n + (c.seats ?? 0), 0);
  const filtered = !!(active.level || active.field || active.q);
  const levelName = LEVELS.find((l) => l.value === active.level)?.label;

  // Counts that respect the other active filters, so each option shows what it would return.
  const fieldCount = (slug?: string) => courses.filter((c) => matches(c, { ...active, field: slug }, shortOnly)).length;
  const levelCount = (value?: string) => courses.filter((c) => matches(c, { ...active, level: value }, shortOnly)).length;
  const levels = LEVELS.filter((l) => courses.some((c) => c.level === l.value));

  const groups = streams
    .map((s) => ({ ...s, items: shown.filter((c) => c.streamSlug === s.slug) }))
    .filter((g) => g.items.length);

  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.9rem] ${
      on ? "border-ink bg-ink font-bold text-white" : "border-rule bg-paper text-ink-soft hover:border-brand hover:text-ink"
    }`;

  const fieldLinks = [{ slug: undefined as string | undefined, name: "All fields" }, ...streams];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Courses" }]}
        title="All courses in India"
        intro="Every major course by field of study, with the colleges offering it and their approved intake from AICTE, NMC, INC, NCISM, NCH and NIRF records. Durations are shown only where the regulator fixes them."
      >
        <dl className="tabular mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Courses", value: num(summary.courses) },
            { label: "Fields of study", value: num(summary.fields) },
            { label: "Colleges covered", value: num(summary.colleges) },
            { label: "Approved seats recorded", value: totalSeats ? num(totalSeats) : "Not recorded" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 px-4 py-3">
              <dt className="text-[0.85rem] text-[#c9cbe6]">{s.label}</dt>
              <dd className="text-2xl font-extrabold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <div className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-10">
          <aside aria-label="Filter by field of study" className="hidden min-w-0 lg:block">
            <nav className="card p-3 lg:sticky lg:top-[120px]">
              <h2 className="px-2 pb-2 pt-1 text-lg font-bold">Field of study</h2>
              <ul className="space-y-0.5">
                {fieldLinks.map((s) => {
                  const on = (s.slug ?? "") === (active.field ?? "");
                  const count = fieldCount(s.slug);
                  return (
                    <li key={s.slug ?? "all"}>
                      <Link
                        href={`/courses${qs({ level: active.level, field: s.slug, q: active.q })}`}
                        aria-current={on ? "true" : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.93rem] ${on ? "bg-brand-soft font-bold text-ink" : "text-ink-soft hover:bg-band hover:text-ink"}`}
                      >
                        {s.slug ? <FieldIcon slug={s.slug} size={15} className="size-7 rounded-lg" /> : <span className="size-7 shrink-0" aria-hidden="true" />}
                        <span className="min-w-0 flex-1">{s.name}</span>
                        <span className="tabular text-[0.82rem] text-muted">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0">
            <div className="card space-y-4 p-4 sm:p-5">
              <CourseSearch key={`${active.level ?? ""}|${active.field ?? ""}`} q={active.q} level={active.level} field={active.field} />

              <div>
                <h2 className="mb-2 text-[0.9rem] font-bold text-muted">Level</h2>
                <div className="flex flex-wrap gap-2">
                  {[{ value: undefined as string | undefined, short: "All levels" }, ...levels].map((l) => (
                    <Link
                      key={l.value ?? "all"}
                      href={`/courses${qs({ level: l.value, field: active.field, q: active.q })}`}
                      aria-current={(l.value ?? "") === (active.level ?? "") ? "true" : undefined}
                      className={chip((l.value ?? "") === (active.level ?? ""))}
                    >
                      {l.short}
                      <span className="tabular text-[0.8rem] opacity-75">{levelCount(l.value)}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="lg:hidden">
                <h2 className="mb-2 text-[0.9rem] font-bold text-muted">Field of study</h2>
                <div className="scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
                  {fieldLinks.map((s) => {
                    const on = (s.slug ?? "") === (active.field ?? "");
                    return (
                      <Link
                        key={s.slug ?? "all"}
                        href={`/courses${qs({ level: active.level, field: s.slug, q: active.q })}`}
                        aria-current={on ? "true" : undefined}
                        className={chip(on)}
                      >
                        {s.name}
                        <span className="tabular text-[0.8rem] opacity-75">{fieldCount(s.slug)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3 text-[0.93rem]">
                <p className="tabular text-ink-soft" aria-live="polite">
                  {filtered ? (
                    <>
                      Showing <span className="font-bold text-ink">{shown.length}</span> of {courses.length} courses
                      {levelName ? `, ${levelName.toLowerCase()} level` : ""}
                      {field ? ` in ${field.name}` : ""}
                      {active.q ? ` matching "${active.q}"` : ""}
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-ink">{courses.length}</span> courses in {streams.length} fields
                    </>
                  )}
                </p>
                {filtered ? (
                  <Link href="/courses" className="text-ink-soft underline underline-offset-4 hover:text-ink">
                    Clear all filters
                  </Link>
                ) : null}
              </div>
            </div>

            {groups.length ? (
              <div className="mt-8 space-y-10">
                {groups.map((g) => {
                  const ex = exams.filter((e) => e.streams.includes(g.name)).map((e) => e.short);
                  const seats = g.items.reduce((n, c) => n + (c.seats ?? 0), 0);
                  return (
                    <section key={g.slug} id={g.slug} className="scroll-mt-32" aria-labelledby={`h-${g.slug}`}>
                      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <FieldIcon slug={g.slug} className="size-11" />
                          <div className="min-w-0">
                            <h2 id={`h-${g.slug}`} className="text-2xl font-bold">
                              {g.name} courses
                            </h2>
                            <p className="tabular text-[0.9rem] text-muted">
                              {g.items.length} {g.items.length === 1 ? "course" : "courses"}
                              {seats ? `, ${num(seats)} approved seats recorded` : ""}
                              {ex.length ? `. Entrance exams: ${ex.join(", ")}` : ""}
                            </p>
                          </div>
                        </div>
                        <Link href={`/colleges?stream=${g.slug}`} className="rounded-lg border border-rule bg-paper px-4 py-2 text-[0.92rem] font-bold hover:border-brand">
                          {g.name} colleges
                        </Link>
                      </div>
                      {g.summary && !ex.length ? <p className="mt-3 max-w-[70ch] text-[0.95rem] text-ink-soft">{g.summary}</p> : null}
                      <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {g.items.map((c) => (
                          <CourseCard key={c.slug} c={c} />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="card mt-8 p-6 text-center sm:p-8">
                <h2 className="text-2xl font-bold">No courses match these filters</h2>
                <p className="mx-auto mt-2 max-w-[52ch] text-ink-soft">
                  Try a shorter search, another level or all fields. If the course you want is not listed yet, a counsellor can still help you, free.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/courses" className="rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-[#1c1f55]">
                    See all courses
                  </Link>
                  <Link href="/counselling" className="rounded-lg border border-rule bg-paper px-5 py-2.5 font-bold hover:border-brand">
                    Talk to a counsellor
                  </Link>
                </div>
              </div>
            )}

            <p className="mt-10 text-[0.88rem] text-muted">
              College and seat counts come from regulator records for the latest academic year we hold. &quot;Not recorded&quot; means we have no official figure for
              that course yet, not that no college offers it.{" "}
              <Link href="/how-we-check-data" className="underline underline-offset-4 hover:text-ink">
                How we check data
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
