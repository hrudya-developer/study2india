import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { CONTACT } from "@/data/reference";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy policy" intro="What we collect when you contact us, and how we use it.">
      <h2>What we collect</h2>
      <p>
        When you request a call back, we collect the student&apos;s name, mobile number, and, if you choose to give them, the course, preferred state and entrance
        rank or score. We also record the page you sent the request from and the consent text you agreed to.
      </p>
      <h2>How we use it</h2>
      <ul>
        <li>To call or message you about admissions, as you asked</li>
        <li>To suggest colleges and courses that fit what you told us</li>
      </ul>
      <p>We do not share your details with colleges without your permission, and we do not sell them.</p>
      <h2>Your choices</h2>
      <p>
        To see, correct or delete what we hold about you, email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or call{" "}
        <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
      </p>
    </InfoPage>
  );
}
