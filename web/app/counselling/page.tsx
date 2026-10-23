import type { Metadata } from "next";
import { Phone, MessageCircle, Mail } from "lucide-react";
import { getSearchOptions } from "@/lib/queries/home";
import { PageHero } from "@/components/page-hero";
import { CounsellingForm } from "@/components/counselling-form";
import { CONTACT } from "@/data/reference";
import { one, type SearchParams } from "@/lib/params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free admission counselling",
  description: "Talk to a Study2India counsellor in Kerala about colleges, entrance exams, counselling rounds and fees. Free.",
  alternates: { canonical: "/counselling" },
};

const STEPS = [
  { t: "Request a call", d: "Tell us the course, state and your rank or score if you have one." },
  { t: "Talk it through", d: "A counsellor calls you during office hours and asks about your goals and budget." },
  { t: "Get a shortlist", d: "We suggest colleges that fit, with fees and approvals checked against official sources." },
  { t: "Through counselling", d: "We help you register for the right counselling rounds and fill your choices." },
  { t: "Admission", d: "We help with documents and reporting at the college, and with scholarships you qualify for." },
];

export default async function CounsellingPage({ searchParams }: { searchParams: SearchParams }) {
  const options = await getSearchOptions();
  const college = one((await searchParams).college);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Counselling" }]}
        title="Free admission counselling"
        intro={college ? `Ask us about admission to ${college}, or any other college.` : "From choosing a course to reporting at the college, a counsellor from our Kerala team works through it with you."}
      />
      <div className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0 space-y-6">
            <section className="card p-5 sm:p-6">
              <h2 className="text-2xl font-bold">How it works</h2>
              <ol className="mt-5 space-y-5">
                {STEPS.map((s, i) => (
                  <li key={s.t} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-white">{i + 1}</span>
                    <div>
                      <h3 className="text-lg font-bold">{s.t}</h3>
                      <p className="text-ink-soft">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="card p-5 sm:p-6">
              <h2 className="text-2xl font-bold">Prefer to reach us directly?</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3"><Phone size={18} className="text-muted" aria-hidden="true" /><a href={CONTACT.phoneHref} className="tabular font-bold">{CONTACT.phone}</a></li>
                <li className="flex items-center gap-3"><MessageCircle size={18} className="text-muted" aria-hidden="true" /><a href={CONTACT.whatsappHref} rel="noopener" className="font-bold">Message us on WhatsApp</a></li>
                <li className="flex items-center gap-3"><Mail size={18} className="text-muted" aria-hidden="true" /><a href={`mailto:${CONTACT.email}`} className="font-bold">{CONTACT.email}</a></li>
              </ul>
              <h3 className="mt-6 text-lg font-bold">Our offices</h3>
              <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                {CONTACT.branches.map((b) => (
                  <li key={b.name} className="flex justify-between gap-3 border-b border-rule py-2">
                    <span>{b.name}</span>
                    <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="tabular font-bold">{b.phone}</a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside>
            <div className="card p-5 sm:p-6 lg:sticky lg:top-[120px]">
              <h2 className="text-xl font-bold">Request a call back</h2>
              <p className="mb-4 mt-1 text-[0.92rem] text-muted">A counsellor will call you during office hours.</p>
              <CounsellingForm courses={options.courses} states={options.states} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
