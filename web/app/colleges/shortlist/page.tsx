import type { Metadata } from "next";
import Link from "next/link";
import { ShortlistView } from "@/components/colleges/shortlist-view";

export const metadata: Metadata = {
  title: "Your shortlist",
  description: "Colleges you have shortlisted on Study2India. Kept in this browser only.",
  robots: { index: false, follow: true },
};

export default function ShortlistPage() {
  return (
    <div className="bg-band">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="text-[0.92rem] text-muted">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/colleges" className="hover:underline">
            Colleges
          </Link>{" "}
          / Shortlist
        </nav>
        <h1 className="mt-3 text-[2rem] font-extrabold leading-tight sm:text-5xl">Your shortlist</h1>
        <p className="mt-2 max-w-[62ch] text-ink-soft">Saved in this browser only. Clearing your browser data clears it, and it does not follow you to another device.</p>
        <div className="mt-6">
          <ShortlistView />
        </div>
      </div>
    </div>
  );
}
