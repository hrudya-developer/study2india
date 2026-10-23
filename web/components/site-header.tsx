import Link from "next/link";
import Image from "next/image";
import { Phone, MessageCircle, Mail, ArrowUpRight } from "lucide-react";
import { NavMega } from "@/components/nav-mega";
import { CONTACT, STREAMS, STATES } from "@/data/reference";
import { slugify } from "@/lib/slug";
import { FieldIcon } from "@/components/field-icon";
import { SearchBox } from "@/components/search-box";
import { MobileMenu, MobileSearch } from "@/components/header-mobile";
import { POPULAR_STATES, allCourses, courseBySlug, examBySlug, COURSE_GROUPS, EXAM_GROUPS, pick } from "@/components/nav-data";

export { POPULAR_STATES };

const megaLink = "block rounded-lg px-2 py-1.5 text-[0.92rem] text-ink-soft hover:bg-band hover:text-ink";
const megaHead = "mb-1.5 px-2 text-[0.78rem] font-bold uppercase tracking-wide text-muted";

export function SiteHeader() {
  return (
    <>
      <div className="bg-ink text-[0.85rem] text-[#c9cbe6]">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <p className="truncate">
            <span className="font-bold text-brand">Admissions 2026:</span> free counselling<span className="hidden sm:inline"> for students across Kerala</span>
          </p>
          <a href={CONTACT.phoneHref} className="flex shrink-0 items-center gap-1.5 hover:text-white md:hidden">
            <Phone size={14} aria-hidden="true" />
            <span className="tabular">{CONTACT.phone}</span>
          </a>
          <div className="hidden shrink-0 items-center gap-5 whitespace-nowrap md:flex">
            <a href={CONTACT.phoneHref} className="flex items-center gap-1.5 hover:text-white">
              <Phone size={14} aria-hidden="true" />
              <span className="tabular">{CONTACT.phone}</span>
            </a>
            <a href={CONTACT.whatsappHref} className="flex items-center gap-1.5 hover:text-white" rel="noopener">
              <MessageCircle size={14} aria-hidden="true" />
              WhatsApp
            </a>
            <a href={`mailto:${CONTACT.email}`} className="hidden items-center gap-1.5 hover:text-white lg:flex">
              <Mail size={14} aria-hidden="true" />
              {CONTACT.email}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-4">
          <Link href="/" className="shrink-0 rounded" aria-label="Study2India home">
            <Image src="/logo.png" alt="Study2India" width={122} height={37} priority />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center">
              <NavMega label="Colleges" href="/colleges" panelClass="w-[780px] max-w-[92vw]">
                  <div className="card grid grid-cols-[1.7fr_1fr] gap-6 p-5">
                    <div>
                      <p className={megaHead}>By field of study</p>
                      <ul className="grid grid-cols-2 gap-x-3">
                        {STREAMS.map((s) => (
                          <li key={s.slug}>
                            <Link href={`/colleges?stream=${s.slug}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.92rem] text-ink-soft hover:bg-band hover:text-ink">
                              <FieldIcon slug={s.slug} size={15} className="size-7 rounded-lg" />
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-l border-rule pl-6">
                      <p className={megaHead}>By state</p>
                      <ul>
                        {POPULAR_STATES.map((s) => (
                          <li key={s}>
                            <Link href={`/colleges?state=${slugify(s)}`} className={megaLink}>
                              Colleges in {s}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-col gap-1 border-t border-rule pt-3">
                        <Link href="/colleges" className="flex items-center gap-1 px-2 font-bold text-brand-hover hover:underline">
                          All colleges and states <ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                        <Link href="/rankings" className="flex items-center gap-1 px-2 font-bold text-brand-hover hover:underline">
                          NIRF ranked colleges <ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
              </NavMega>
              <NavMega label="Courses" href="/courses" panelClass="w-[620px] max-w-[92vw]">
                  <div className="card p-5">
                    <div className="grid grid-cols-3 gap-4">
                      {COURSE_GROUPS.map((g) => (
                        <div key={g.label}>
                          <p className={megaHead}>{g.label}</p>
                          <ul>
                            {pick(courseBySlug, g.slugs).map((c) => (
                              <li key={c.slug}>
                                <Link href={`/course/${c.slug}`} className={megaLink}>
                                  {c.short}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <Link href="/courses" className="mt-3 flex items-center gap-1 border-t border-rule px-2 pt-3 font-bold text-brand-hover hover:underline">
                      All {allCourses.length} courses by field <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
              </NavMega>
              <NavMega label="Exams" href="/exams" panelClass="w-[560px] max-w-[92vw]">
                  <div className="card p-5">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {EXAM_GROUPS.map((g) => (
                        <div key={g.label}>
                          <p className={megaHead}>{g.label}</p>
                          <ul>
                            {pick(examBySlug, g.slugs).map((e) => (
                              <li key={e.slug}>
                                <Link href={`/exam/${e.slug}`} className={megaLink}>
                                  {e.short}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <Link href="/exams" className="mt-3 flex items-center gap-1 border-t border-rule px-2 pt-3 font-bold text-brand-hover hover:underline">
                      All entrance exams <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
              </NavMega>
              <li>
                <Link href="/rankings" className="block rounded-md px-3 py-2 text-[0.95rem] font-bold text-ink-soft hover:text-ink">
                  Rankings
                </Link>
              </li>
              <li>
                <Link href="/scholarships" className="block rounded-md px-3 py-2 text-[0.95rem] font-bold text-ink-soft hover:text-ink">
                  Scholarships
                </Link>
              </li>
            </ul>
          </nav>

          <div className="ml-auto hidden min-w-[12rem] max-w-sm flex-1 xl:block">
            <SearchBox id="header-q" variant="header" placeholder="Search colleges, courses, exams" shortcut />
          </div>

          <div className="ml-auto flex items-center gap-2 xl:ml-0">
            <Link href="/counselling" className="hidden h-11 shrink-0 items-center rounded-lg bg-brand px-4 text-[0.95rem] font-bold text-ink hover:bg-brand-hover sm:flex">
              Free counselling
            </Link>
            <div className="xl:hidden">
              <MobileSearch />
            </div>
            <div className="lg:hidden">
              <MobileMenu />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export const STATE_SLUGS = STATES.map((s) => ({ name: s.name, slug: slugify(s.name) }));
