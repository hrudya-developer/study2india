import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Stethoscope, Cpu } from "lucide-react";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "College predictor: free, no sign-up, from official closing ranks",
  description:
    "Free college predictors built only on official counselling closing ranks. NEET UG predictor for MBBS, BDS and B.Sc Nursing from MCC All India counselling; JEE coming soon.",
  alternates: { canonical: "/predictor" },
};

const siteUrl = (process.env.SITE_URL ?? "https://study2india.com").replace(/\/$/, "");

const TOOLS = [
  {
    icon: Stethoscope,
    title: "NEET UG predictor",
    text: "MBBS, BDS and B.Sc Nursing colleges by your All India Rank, from MCC All India counselling closing ranks for every round.",
    href: "/predictor/neet",
  },
  {
    icon: Cpu,
    title: "JEE predictor",
    text: "IIT, NIT and IIIT options by your JEE rank. It opens once JoSAA opening and closing ranks are loaded from the official lists.",
    href: null,
  },
];

export default function PredictorIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "College predictor", item: `${siteUrl}/predictor` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        crumbs={[{ label: "College predictor" }]}
        title="College predictor"
        intro="See which colleges your rank reached in the last counselling, from the counselling bodies' own allotment lists. Free, instant and no sign-up: no phone number, no email, no paid tier."
      />
      <div className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ul className="grid gap-4 sm:grid-cols-2">
            {TOOLS.map((t) => {
              const body = (
                <>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-hover">
                    <t.icon size={22} aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-xl font-bold">{t.title}</h2>
                  <p className="mt-1 text-ink-soft">{t.text}</p>
                  {t.href ? (
                    <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-hover">
                      Open <ArrowUpRight size={16} aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="mt-4 inline-block rounded bg-band px-2 py-0.5 text-[0.85rem] font-bold text-muted">Coming soon</span>
                  )}
                </>
              );
              return (
                <li key={t.title}>
                  {t.href ? (
                    <Link href={t.href} className="card card-link block h-full p-5 sm:p-6">
                      {body}
                    </Link>
                  ) : (
                    <div className="card h-full p-5 sm:p-6">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <section className="card mt-6 p-5 sm:p-6">
            <h2 className="text-2xl font-bold">How our predictors stay honest</h2>
            <ul className="mt-3 ml-5 list-disc space-y-1.5 text-ink-soft">
              <li>Only official closing ranks, each linked to the allotment list it comes from. No estimates and no made up percentages.</li>
              <li>The rules that sort colleges into Likely, Possible and Reach are written on the page, so you can check every result yourself.</li>
              <li>Results live in the page link: share or bookmark it. We never ask for your phone or email to show them.</li>
              <li>Ranks change every year, so a predictor is guidance, not a guarantee.</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
