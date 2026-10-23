import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Phone, Search, MessageCircle, Mail, Menu } from "lucide-react";
import { CONTACT, STREAMS, EXAMS, STATES } from "@/data/reference";
import { slugify } from "@/lib/slug";
import { FieldIcon } from "@/components/field-icon";

export const POPULAR_STATES = ["Karnataka", "Tamil Nadu", "Kerala", "Telangana", "Andhra Pradesh", "Maharashtra", "Delhi", "Uttar Pradesh", "Puducherry", "West Bengal"];
const POPULAR_COURSES = ["mbbs", "bds", "bsc-nursing", "bams", "bvsc-ah", "b-pharm", "bpt", "btech", "mba", "bba", "ba-llb", "barch", "bcom", "bca", "bsc", "bdes"];

const allCourses = STREAMS.flatMap((s) => s.courses.map((c) => ({ ...c, stream: s.slug })));

function NavTrigger({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-md px-3 py-2 text-[0.95rem] font-bold text-ink-soft group-hover:text-ink">
      {label}
      <ChevronDown size={15} aria-hidden="true" />
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-paper shadow-[0_1px_0_var(--color-rule)]">
      <div className="bg-ink text-[0.85rem] text-[#c9cbe6]">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <p className="truncate">
            <span className="font-bold text-brand">Admissions 2026:</span> free counselling for students across Kerala
          </p>
          <div className="hidden items-center gap-5 md:flex">
            <a href={CONTACT.phoneHref} className="flex items-center gap-1.5 hover:text-white">
              <Phone size={14} aria-hidden="true" />
              <span className="tabular">{CONTACT.phone}</span>
            </a>
            <a href={CONTACT.whatsappHref} className="flex items-center gap-1.5 hover:text-white" rel="noopener">
              <MessageCircle size={14} aria-hidden="true" />
              WhatsApp
            </a>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-1.5 hover:text-white">
              <Mail size={14} aria-hidden="true" />
              {CONTACT.email}
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Study2India home">
          <Image src="/logo.png" alt="Study2India" width={122} height={37} priority />
        </Link>

        <form action="/search" method="get" role="search" className="relative hidden max-w-xs flex-1 lg:block">
          <label htmlFor="header-q" className="sr-only">
            Search colleges, courses and exams
          </label>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="header-q"
            name="q"
            type="search"
            placeholder="Search colleges, courses, exams"
            className="w-full rounded-full border border-rule bg-band py-2 pl-9 pr-3 text-[0.92rem] placeholder:text-muted focus:border-ink focus:bg-paper"
          />
        </form>

        <nav aria-label="Main" className="ml-auto hidden md:block">
          <ul className="flex items-center">
            <li className="has-mega group relative">
              <Link href="/colleges" className="block">
                <NavTrigger label="Colleges" />
              </Link>
              <div className="mega absolute right-0 top-full w-[760px] max-w-[92vw] pt-2 lg:left-0 lg:right-auto">
                <div className="card grid grid-cols-[1.6fr_1fr] gap-6 p-5">
                  <div>
                    <p className="mb-2 text-[0.8rem] font-bold text-muted">Colleges by field</p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {STREAMS.map((s) => (
                        <li key={s.slug}>
                          <Link href={`/colleges?stream=${s.slug}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.92rem] hover:bg-band">
                            <FieldIcon slug={s.slug} size={15} className="size-7 rounded-lg" />
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-l border-rule pl-6">
                    <p className="mb-2 text-[0.8rem] font-bold text-muted">Colleges by state</p>
                    <ul className="space-y-1">
                      {POPULAR_STATES.map((s) => (
                        <li key={s}>
                          <Link href={`/colleges?state=${slugify(s)}`} className="block rounded-lg px-2 py-1.5 text-[0.92rem] hover:bg-band">
                            Colleges in {s}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="/colleges" className="mt-3 inline-block px-2 font-bold text-brand-hover hover:underline">
                      All colleges
                    </Link>
                  </div>
                </div>
              </div>
            </li>
            <li className="has-mega group relative">
              <Link href="/courses" className="block">
                <NavTrigger label="Courses" />
              </Link>
              <div className="mega absolute right-0 top-full w-[520px] max-w-[92vw] pt-2 lg:left-0 lg:right-auto">
                <div className="card p-5">
                  <p className="mb-2 text-[0.8rem] font-bold text-muted">Popular courses</p>
                  <ul className="grid grid-cols-3 gap-1">
                    {POPULAR_COURSES.map((slug) => {
                      const c = allCourses.find((x) => x.slug === slug);
                      return c ? (
                        <li key={slug}>
                          <Link href={`/course/${slug}`} className="block rounded-lg px-2 py-1.5 text-[0.92rem] hover:bg-band">
                            {c.short}
                          </Link>
                        </li>
                      ) : null;
                    })}
                  </ul>
                  <Link href="/courses" className="mt-3 inline-block px-2 font-bold text-brand-hover hover:underline">
                    All {allCourses.length} courses
                  </Link>
                </div>
              </div>
            </li>
            <li className="has-mega group relative">
              <Link href="/exams" className="block">
                <NavTrigger label="Exams" />
              </Link>
              <div className="mega absolute right-0 top-full w-[420px] max-w-[92vw] pt-2">
                <div className="card p-5">
                  <ul className="grid grid-cols-2 gap-1">
                    {EXAMS.map((e) => (
                      <li key={e.slug}>
                        <Link href={`/exam/${e.slug}`} className="block rounded-lg px-2 py-1.5 text-[0.92rem] hover:bg-band">
                          {e.short}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
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

        <Link href="/counselling" className="ml-2 hidden shrink-0 rounded-lg bg-brand px-4 py-2.5 text-[0.95rem] font-bold text-ink hover:bg-brand-hover md:block">
          Free counselling
        </Link>

        <details className="relative ml-auto md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-rule px-3 py-2 text-sm font-bold">
            <Menu size={17} aria-hidden="true" /> Menu
          </summary>
          <div className="absolute right-0 z-50 mt-2 max-h-[75vh] w-[min(88vw,340px)] overflow-y-auto rounded-xl border border-rule bg-paper p-3 shadow-[var(--shadow-lift)]">
            <form action="/search" method="get" role="search" className="mb-3">
              <label htmlFor="mobile-q" className="sr-only">
                Search
              </label>
              <input id="mobile-q" name="q" type="search" placeholder="Search colleges, courses, exams" className="w-full rounded-lg border border-rule px-3 py-2" />
            </form>
            {[
              ["/colleges", "Colleges"],
              ["/courses", "Courses"],
              ["/exams", "Exams"],
              ["/rankings", "Rankings"],
              ["/scholarships", "Scholarships"],
              ["/counselling", "Free counselling"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="block rounded-lg px-3 py-2 font-bold hover:bg-band">
                {label}
              </Link>
            ))}
            <p className="mt-2 border-t border-rule px-3 pt-3 text-[0.8rem] font-bold text-muted">Colleges by field</p>
            <div className="grid grid-cols-2">
              {STREAMS.map((s) => (
                <Link key={s.slug} href={`/colleges?stream=${s.slug}`} className="rounded-lg px-3 py-1.5 text-[0.92rem] hover:bg-band">
                  {s.name}
                </Link>
              ))}
            </div>
            <a href={CONTACT.phoneHref} className="mt-2 block rounded-lg bg-band px-3 py-2 font-bold">
              Call <span className="tabular">{CONTACT.phone}</span>
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}

export const STATE_SLUGS = STATES.map((s) => ({ name: s.name, slug: slugify(s.name) }));
