import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-cabinet",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MercatoList — NYC Business Marketplace",
    template: "%s | MercatoList",
  },
  description:
    "New York City's premier marketplace for buying and selling businesses. Browse restaurants, retail, services, and more across all five boroughs.",
  keywords: [
    "business for sale NYC",
    "buy a business New York",
    "sell a business NYC",
    "NYC business marketplace",
    "business advisor NYC",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mercatolist.com",
    siteName: "MercatoList",
    title: "MercatoList — NYC Business Marketplace",
    description:
      "New York City's premier marketplace for buying and selling businesses.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MercatoList — NYC Business Marketplace",
    description:
      "New York City's premier marketplace for buying and selling businesses.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
};

// Site-wide structured data. Lives in the root layout so it renders on every
// SSR page, giving search engines + AI agents a stable canonical description
// of the org and a sitelinks search box hint.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "MercatoList",
      url: SITE_URL,
      logo: `${SITE_URL}/og-default.jpg`,
      description:
        "New York City's marketplace for buying and selling small and mid-sized businesses across all five boroughs.",
      areaServed: {
        "@type": "City",
        name: "New York City",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "MercatoList",
      publisher: { "@id": `${SITE_URL}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/listings?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${plusJakarta.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
        />
        <SessionProvider>
          <TooltipProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground focus:text-sm focus:font-semibold focus:shadow-lg"
            >
              Skip to content
            </a>
            <Header />
            <main id="main-content" className="min-h-[calc(100vh-4rem)]">{children}</main>
            <Footer />
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
