import Link from "next/link";
import { CONTACT } from "@/data/reference";

const GROUPS = [
  {
    title: "Find colleges",
    links: [
      { href: "/colleges?stream=medical", label: "Medical colleges" },
      { href: "/colleges?stream=engineering", label: "Engineering colleges" },
      { href: "/colleges?stream=management", label: "Management colleges" },
      { href: "/colleges?stream=nursing", label: "Nursing colleges" },
      { href: "/colleges?stream=law", label: "Law colleges" },
    ],
  },
  {
    title: "Plan",
    links: [
      { href: "/rankings", label: "NIRF rankings" },
      { href: "/exams", label: "Entrance exams" },
      { href: "/courses", label: "Courses" },
      { href: "/scholarships", label: "Scholarships" },
    ],
  },
  {
    title: "Study2India",
    links: [
      { href: "/about", label: "About us" },
      { href: "/counselling", label: "Free counselling" },
      { href: "/how-we-check-data", label: "How we check our data" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-[#c9cbe0]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">Study2India</p>
          <p className="mt-3 max-w-xs text-[0.95rem]">
            Education consultancy based in Kerala, helping students choose and join accredited colleges across India.
          </p>
          <p className="mt-5 text-[0.95rem]">
            <a href={CONTACT.phoneHref} className="tabular text-white hover:text-brand">
              {CONTACT.phone}
            </a>
            <br />
            <a href={`mailto:${CONTACT.email}`} className="hover:text-brand">
              {CONTACT.email}
            </a>
            <br />
            <a href={CONTACT.whatsappHref} className="hover:text-brand" rel="noopener">
              Message us on WhatsApp
            </a>
          </p>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h2 className="text-base font-bold text-white">{g.title}</h2>
            <ul className="mt-3 space-y-2 text-[0.95rem]">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className="text-base font-bold text-white">Our offices in Kerala</h2>
          <ul className="mt-3 grid gap-x-8 gap-y-2 text-[0.92rem] sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT.branches.map((b) => (
              <li key={b.name} className="flex justify-between gap-3 border-b border-white/10 pb-2">
                <span>{b.name}</span>
                <a className="tabular text-white hover:text-brand" href={`tel:${b.phone.replace(/\s/g, "")}`}>
                  {b.phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-[#9a9cb8]">© {new Date().getFullYear()} Study2India. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
