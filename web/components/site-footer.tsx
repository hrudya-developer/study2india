import Link from "next/link";
import Image from "next/image";
import { Phone, MessageCircle, Mail, MapPin, ExternalLink } from "lucide-react";
import { CONTACT, STREAMS, EXAMS } from "@/data/reference";
import { slugify } from "@/lib/slug";
import { landingPath } from "@/lib/seo";
import { POPULAR_STATES } from "@/components/site-header";

const FOOTER_COURSES = ["mbbs", "bds", "bsc-nursing", "gnm", "bams", "bhms", "b-pharm", "bpt", "btech", "diploma-engineering", "mba", "bba", "ba-llb", "barch", "bca", "bcom"];

/** Course and state pairs students search for most; each is a filtered college list. */
const POPULAR_SEARCHES: { course: string; short: string; states: string[] }[] = [
  { course: "mbbs", short: "MBBS", states: ["Karnataka", "Tamil Nadu", "Kerala", "Maharashtra"] },
  { course: "bds", short: "BDS", states: ["Karnataka", "Tamil Nadu", "Kerala"] },
  { course: "bsc-nursing", short: "B.Sc Nursing", states: ["Karnataka", "Kerala", "Tamil Nadu"] },
  { course: "bams", short: "BAMS", states: ["Kerala", "Karnataka"] },
  { course: "btech", short: "B.Tech", states: ["Kerala", "Tamil Nadu", "Karnataka"] },
  { course: "b-pharm", short: "B.Pharm", states: ["Kerala", "Karnataka"] },
  { course: "mba", short: "MBA", states: ["Kerala", "Karnataka"] },
];

/** The regulators whose lists the site is built from, linked to their official sites. */
const SOURCES = [
  { short: "AICTE", name: "All India Council for Technical Education", url: "https://www.aicte-india.org" },
  { short: "NMC", name: "National Medical Commission", url: "https://www.nmc.org.in" },
  { short: "INC", name: "Indian Nursing Council", url: "https://www.indiannursingcouncil.org" },
  { short: "NCISM", name: "National Commission for Indian System of Medicine", url: "https://ncismindia.org" },
  { short: "NCH", name: "National Commission for Homoeopathy", url: "https://www.nch.org.in" },
  { short: "NIRF", name: "National Institutional Ranking Framework", url: "https://www.nirfindia.org" },
];

const head = "text-[0.82rem] font-bold uppercase tracking-wide text-white";
const list = "mt-3 space-y-1 text-[0.92rem]";
const link = "inline-block py-0.5 hover:text-white hover:underline";

export function SiteFooter() {
  const courses = STREAMS.flatMap((s) => s.courses);
  const footerCourses = FOOTER_COURSES.map((slug) => courses.find((c) => c.slug === slug)).filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <footer className="mt-16 bg-ink text-[#c4c7e2] sm:mt-20">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-8 sm:px-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">Not sure where to start?</p>
            <p className="mt-1">Talk to a counsellor from our Kerala team. It&apos;s free.</p>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link href="/counselling" className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-brand px-5 font-bold text-ink hover:bg-brand-hover sm:flex-none">
              Book free counselling
            </Link>
            <a href={CONTACT.whatsappHref} rel="noopener" className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-white/30 px-5 font-bold text-white hover:bg-white/10 sm:flex-none">
              <MessageCircle size={18} aria-hidden="true" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-9 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_3fr]">
        <div>
          <div className="inline-block rounded-lg bg-white px-3 py-2">
            <Image src="/logo.png" alt="Study2India" width={122} height={37} />
          </div>
          <p className="mt-4 max-w-xs text-[0.92rem]">
            Kerala-based education consultancy helping students find and join approved colleges across India, with every figure traced to an official source.
          </p>
          <ul className="mt-5 space-y-2 text-[0.92rem]">
            <li>
              <a href={CONTACT.phoneHref} className="flex items-center gap-2 hover:text-white">
                <Phone size={15} aria-hidden="true" /> <span className="tabular">{CONTACT.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-white">
                <Mail size={15} aria-hidden="true" /> {CONTACT.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={15} aria-hidden="true" /> Head office: Thiruvalla, Kerala
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-4">
          <div>
            <h2 className={head}>Colleges by field</h2>
            <ul className={list}>
              {STREAMS.map((s) => (
                <li key={s.slug}>
                  <Link href={`/colleges?stream=${s.slug}`} className={link}>
                    {s.name} colleges
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={head}>Colleges by state</h2>
            <ul className={list}>
              {POPULAR_STATES.map((s) => (
                <li key={s}>
                  <Link href={`/colleges?state=${slugify(s)}`} className={link}>
                    Colleges in {s}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/colleges" className={`${link} font-bold text-white`}>
                  All states
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={head}>Popular courses</h2>
            <ul className={list}>
              {footerCourses.map((c) => (
                <li key={c.slug}>
                  <Link href={`/course/${c.slug}`} className={link}>
                    {c.short}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/courses" className={`${link} font-bold text-white`}>
                  All courses
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={head}>Entrance exams</h2>
            <ul className={list}>
              {EXAMS.map((e) => (
                <li key={e.slug}>
                  <Link href={`/exam/${e.slug}`} className={link}>
                    {e.short}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className={`${head} mt-8`}>Study2India</h2>
            <ul className={list}>
              {[
                ["/rankings", "NIRF rankings"],
                ["/scholarships", "Scholarships"],
                ["/counselling", "Free counselling"],
                ["/about", "About us"],
                ["/how-we-check-data", "How we check data"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={link}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className={head}>Popular searches</h2>
          <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1 text-[0.9rem]">
            {POPULAR_SEARCHES.flatMap((p) =>
              p.states.map((s) => (
                <li key={`${p.course}-${s}`} className="after:ml-1 after:text-white/30 after:content-['|'] last:after:content-none">
                  <Link href={landingPath(p.course, slugify(s))} className={link}>
                    {p.short} colleges in {s}
                  </Link>
                </li>
              )),
            )}
          </ul>

          <h2 className={`${head} mt-8`}>Where our data comes from</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-[0.88rem]">
            {SOURCES.map((s) => (
              <li key={s.short}>
                <a href={s.url} target="_blank" rel="noopener" title={s.name} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 px-3 hover:border-white/60 hover:text-white">
                  <span className="font-bold text-white">{s.short}</span>
                  <span className="hidden sm:inline">{s.name}</span>
                  <ExternalLink size={12} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className={head}>Our offices in Kerala</h2>
          <ul className="mt-3 grid gap-x-8 gap-y-2 text-[0.9rem] sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT.branches.map((b) => (
              <li key={b.name} className="flex justify-between gap-3 border-b border-white/10 pb-2">
                <span>{b.name}</span>
                <a className="tabular text-white hover:text-brand" href={`tel:${b.phone.replace(/\s/g, "")}`}>
                  {b.phone}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap justify-between gap-4 text-[0.85rem] text-[#9599bd]">
            <p>© {new Date().getFullYear()} Study2India. All rights reserved.</p>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/privacy" className="hover:text-white">
                Privacy policy
              </Link>
              <Link href="/how-we-check-data" className="hover:text-white">
                How we check data
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
