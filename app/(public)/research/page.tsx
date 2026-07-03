import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Building2,
  MapPin,
  LineChart,
  Database,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Research — NYC Business Sales Data",
  description:
    "MercatoList is building the largest database of sold business data in New York City — real sale prices, valuation multiples, and market trends across all five boroughs.",
};

const PILLARS = [
  {
    icon: TrendingUp,
    title: "Real Sale Prices",
    body: "Actual closed prices — not asking prices — so buyers and sellers can benchmark against what NYC businesses really sell for.",
  },
  {
    icon: BarChart3,
    title: "Valuation Multiples",
    body: "Price-to-revenue and price-to-cash-flow multiples by category, so you can value a business with real local data.",
  },
  {
    icon: Building2,
    title: "By Category",
    body: "From restaurants and delis to laundromats and salons — trends broken down by the business types that define NYC.",
  },
  {
    icon: MapPin,
    title: "By Borough & Neighborhood",
    body: "How sale prices and demand differ from the Upper East Side to Bay Ridge to Astoria.",
  },
  {
    icon: LineChart,
    title: "Market Trends",
    body: "How valuations and days-on-market shift over time as the NYC small-business market moves.",
  },
  {
    icon: Database,
    title: "Growing Every Day",
    body: "Every deal that closes on MercatoList adds to the dataset. The more the marketplace grows, the sharper the picture.",
  },
];

export default function ResearchPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <BarChart3 className="size-3.5" /> Research
            </span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Building the largest database of sold business data in NYC
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/75">
              What did that corner deli actually sell for? What multiple do NYC laundromats
              trade at? We&apos;re gathering the real numbers behind New York City business sales —
              so buyers, sellers, and advisors can make decisions with data, not guesswork.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/listings">
                  Browse Businesses <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/list-your-business">List Your Business</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What we're building */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold">What we&apos;re building</h2>
          <p className="mt-3 text-muted-foreground">
            A living picture of the NYC business market — transparent, local, and grounded in
            real transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-border/60">
              <CardContent className="p-6">
                <div className="flex size-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Early-stage note + CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center md:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              The dataset is just getting started
            </h2>
            <p className="mt-4 text-muted-foreground">
              MercatoList is new, and this database grows with every deal that closes on the
              platform. Detailed reports and interactive charts are on the way. In the meantime,
              the best way to help build it is to buy, sell, and list on MercatoList — and check
              back often as new listings are added daily.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/listings">
                  Explore Listings <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/advisors">Find an Advisor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
