import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
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
    "business broker NYC",
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
        <SessionProvider>
          <TooltipProvider>
            <Header />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <Footer />
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
