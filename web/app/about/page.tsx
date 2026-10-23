import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { CONTACT } from "@/data/reference";

export const metadata: Metadata = { title: "About us", description: "Study2India is a Kerala-based education consultancy helping students choose and join accredited colleges across India.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage title="About Study2India" intro="A Kerala-based education consultancy helping students make well-informed decisions about higher education.">
      <p>
        Study2India guides students and parents toward genuine, accredited colleges across India, with full transparency at every step. We work with verified
        institutions and combine counselling with checks against official sources, so the decisions families make are based on facts.
      </p>
      <h2>What we do</h2>
      <ul>
        <li>College admissions guidance across medical, dental, nursing, AYUSH, veterinary, engineering, management, law and other fields</li>
        <li>Course selection support based on each student&apos;s goals, rank and budget</li>
        <li>Help through national and state counselling rounds</li>
        <li>Application and documentation help, including scholarships</li>
      </ul>
      <h2>Where to find us</h2>
      <p>
        We have {CONTACT.branches.length} offices across Kerala, with our head office in Thiruvalla. Call <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>, email{" "}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>, or <Link href="/contact">see all offices</Link>.
      </p>
    </InfoPage>
  );
}
