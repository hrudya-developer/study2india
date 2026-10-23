import Link from "next/link";
import Image from "next/image";
import { CONTACT } from "@/data/reference";

const NAV = [
  { href: "/colleges", label: "Colleges" },
  { href: "/courses", label: "Courses" },
  { href: "/exams", label: "Exams" },
  { href: "/rankings", label: "Rankings" },
  { href: "/counselling", label: "Counselling" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Study2India home">
          <Image src="/logo.png" alt="Study2India" width={122} height={37} priority />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="rounded-md px-3 py-2 text-[0.95rem] text-ink-soft hover:bg-mist hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-4 md:flex">
          <a href={CONTACT.phoneHref} className="tabular text-[0.95rem] text-ink-soft hover:text-ink">
            {CONTACT.phone}
          </a>
          <a href="#counsel" className="rounded-lg bg-brand px-4 py-2 text-[0.95rem] font-bold text-ink hover:bg-[#ff9a33]">
            Talk to a counsellor
          </a>
        </div>

        <details className="relative ml-auto md:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-rule px-3 py-1.5 text-sm font-bold">Menu</summary>
          <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-rule bg-paper p-2 shadow-lg">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded-md px-3 py-2 hover:bg-mist">
                {n.label}
              </Link>
            ))}
            <a href={CONTACT.phoneHref} className="mt-1 block rounded-md px-3 py-2 tabular text-ink-soft hover:bg-mist">
              Call {CONTACT.phone}
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
