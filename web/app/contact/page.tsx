import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { CONTACT } from "@/data/reference";

export const metadata: Metadata = { title: "Contact us", description: "Phone, WhatsApp, email and office numbers for Study2India across Kerala." };

export default function ContactPage() {
  return (
    <InfoPage title="Contact us" intro="Call, message or visit any of our offices in Kerala.">
      <ul>
        <li>
          Phone: <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
        </li>
        <li>
          WhatsApp: <a href={CONTACT.whatsappHref} rel="noopener">message us</a>
        </li>
        <li>
          Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </li>
        <li>
          Head office:{" "}
          <a href="https://www.google.com/maps/search/?api=1&query=Study+2+India+Thiruvalla" target="_blank" rel="noopener">
            Thiruvalla, Kerala (open in Google Maps)
          </a>
        </li>
      </ul>
      <h2>Offices</h2>
      <table className="w-full text-left">
        <tbody>
          {CONTACT.branches.map((b) => (
            <tr key={b.name} className="border-b border-rule">
              <td className="py-2.5">{b.name}</td>
              <td className="tabular py-2.5 text-right">
                <a href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </InfoPage>
  );
}
