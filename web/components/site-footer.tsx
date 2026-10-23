import Link from "next/link";
import Image from "next/image";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { CONTACT, STREAMS, EXAMS } from "@/data/reference";
import { slugify } from "@/lib/slug";
import { POPULAR_STATES } from "@/components/site-header";

const TOP_FIELDS = ["medical", "dental", "nursing", "engineering", "management", "pharmacy", "law", "ayush", "veterinary", "architecture"];

export function SiteFooter() {
  const fields = STREAMS.filter((s) => TOP_FIELDS.includes(s.slug));
  const courses = STREAMS.flatMap((s) => s.courses).filter((c) => c.level === "ug").slice(0, 12);

  return (
    <footer className="mt-20 bg-ink text-[#c4c7e2]">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">Not sure where to start?</p>
            <p className="mt-1">Talk to a counsellor from our Kerala team. It&apos;s free.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/counselling" className="rounded-lg bg-brand px-5 py-3 font-bold text-ink hover:bg-brand-hover">
              Book free counselling
            </Link>
            <a href={CONTACT.whatsappHref} rel="noopener" className="flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-bold text-white hover:bg-white/10">
              <MessageCircle size={18} aria-hidden="true" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <div className="inline-block rounded-lg bg-white px-3 py-2">
            <Image src="/logo.png" alt="Study2India" width={122} height={37} />
          </div>
          <p className="mt-4 max-w-xs text-[0.92rem]">
            Kerala-based education consultancy helping students find and join accredited colleges across India, with every figure checked against official sources.
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

        <div>
          <h2 className="text-[0.95rem] font-bold text-white">Top colleges</h2>
          <ul className="mt-3 space-y-1.5 text-[0.92rem]">
            {fields.map((s) => (
              <li key={s.slug}>
                <Link href={`/colleges?stream=${s.slug}`} className="hover:text-white">
                  {s.name} colleges
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[0.95rem] font-bold text-white">Colleges by state</h2>
          <ul className="mt-3 space-y-1.5 text-[0.92rem]">
            {POPULAR_STATES.map((s) => (
              <li key={s}>
                <Link href={`/colleges?state=${slugify(s)}`} className="hover:text-white">
                  Colleges in {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[0.95rem] font-bold text-white">Popular courses</h2>
          <ul className="mt-3 space-y-1.5 text-[0.92rem]">
            {courses.map((c) => (
              <li key={c.slug}>
                <Link href={`/course/${c.slug}`} className="hover:text-white">
                  {c.short}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[0.95rem] font-bold text-white">Entrance exams</h2>
          <ul className="mt-3 space-y-1.5 text-[0.92rem]">
            {EXAMS.slice(0, 10).map((e) => (
              <li key={e.slug}>
                <Link href={`/exam/${e.slug}`} className="hover:text-white">
                  {e.short}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className="text-[0.95rem] font-bold text-white">Our offices in Kerala</h2>
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
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/about" className="hover:text-white">About us</Link>
              <Link href="/how-we-check-data" className="hover:text-white">How we check data</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
              <Link href="/privacy" className="hover:text-white">Privacy policy</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
