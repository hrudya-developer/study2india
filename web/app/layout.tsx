import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/atkinson-hyperlegible-next/latin-400.css";
import "@fontsource/atkinson-hyperlegible-next/latin-700.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { metadataOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(metadataOrigin()),
  title: {
    default: "Study2India: colleges, courses, fees and rankings in India",
    template: "%s | Study2India",
  },
  description:
    "Search colleges across India by course and state. Rankings, fees and cutoffs from official sources, with free counselling from our team in Kerala.",
  openGraph: { siteName: "Study2India", locale: "en_IN", type: "website" },
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
