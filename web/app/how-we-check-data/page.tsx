import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "How we check our data", description: "Where Study2India's college, course, ranking, fee and cutoff data comes from, and how we keep it accurate." };

export default function HowWeCheckPage() {
  return (
    <InfoPage title="How we check our data" intro="Fees, seats and cutoffs decide where a student can study, so we treat every figure as something a family will act on.">
      <h2>Only official sources</h2>
      <p>We take data from the bodies that publish it, never from other college portals:</p>
      <ul>
        <li>Rankings: NIRF, published by the Ministry of Education</li>
        <li>Medical and dental colleges and seats: the National Medical Commission and the Dental Council of India</li>
        <li>Nursing, pharmacy, veterinary and AYUSH: their national councils and commissions</li>
        <li>Cutoffs and seat allotments: the Medical Counselling Committee and the state counselling authorities</li>
        <li>Fees: state fee regulatory orders and the colleges&apos; own prospectuses</li>
        <li>Approvals and grades: UGC, AICTE and NAAC</li>
      </ul>
      <h2>Every figure shows its source</h2>
      <p>Wherever a ranking, seat count, fee or cutoff appears, we show which body published it and the date we last checked it.</p>
      <h2>If we don&apos;t know, we say so</h2>
      <p>
        A figure we have not verified shows as <strong>Not recorded</strong>. We never estimate. Fees are shown exactly as published, per year or for the whole
        course, and never converted from one to the other.
      </p>
      <h2>Partners are labelled</h2>
      <p>Colleges we work with carry a clear partner label. Being a partner never changes a college&apos;s place in a ranking or search result.</p>
      <h2>Spotted a mistake?</h2>
      <p>
        Tell us at <a href="mailto:info@study2india.com">info@study2india.com</a> with the page and the official source, and we will check and correct it.
      </p>
    </InfoPage>
  );
}
