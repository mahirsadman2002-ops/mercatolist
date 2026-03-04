import Link from "next/link";
import {
  ArrowRight,
  Building2,
  MapPin,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { ListingCard } from "@/components/listings/ListingCard";
import { BUSINESS_CATEGORIES, BOROUGHS } from "@/lib/constants";
import { slugify } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock featured listings (full ListingCardProps shape)
// ---------------------------------------------------------------------------

const FEATURED_LISTINGS = [
  {
    id: "1",
    slug: "joes-pizza-astoria",
    title: "Joe's Pizza -- Established Neighborhood Pizzeria",
    category: "Restaurants",
    status: "ACTIVE",
    askingPrice: 450000,
    annualRevenue: 850000,
    cashFlowSDE: 180000,
    neighborhood: "Astoria",
    borough: "QUEENS",
    createdAt: "2026-01-15T00:00:00Z",
    viewCount: 342,
    saveCount: 28,
    isGhostListing: false,
    photos: [] as { url: string; order: number }[],
    listedBy: {
      name: "Michael Torres",
      displayName: null,
      role: "BROKER",
      brokerageName: "NYC Business Sales",
    },
  },
  {
    id: "2",
    slug: "brooklyn-heights-laundromat",
    title: "Brooklyn Heights Laundromat -- Semi-Absentee",
    category: "Laundromats & Dry Cleaners",
    status: "ACTIVE",
    askingPrice: 275000,
    annualRevenue: 380000,
    cashFlowSDE: 120000,
    neighborhood: "Brooklyn Heights",
    borough: "BROOKLYN",
    createdAt: "2026-02-03T00:00:00Z",
    viewCount: 187,
    saveCount: 15,
    isGhostListing: false,
    photos: [] as { url: string; order: number }[],
    listedBy: {
      name: "Sarah Kim",
      displayName: null,
      role: "USER",
      brokerageName: null,
    },
  },
  {
    id: "3",
    slug: "soho-boutique-fashion",
    title: "SoHo Boutique Fashion Store -- Prime Location",
    category: "Clothing & Fashion",
    status: "ACTIVE",
    askingPrice: 1200000,
    annualRevenue: 1800000,
    cashFlowSDE: 320000,
    neighborhood: "SoHo",
    borough: "MANHATTAN",
    createdAt: "2026-01-28T00:00:00Z",
    viewCount: 523,
    saveCount: 47,
    isGhostListing: false,
    photos: [] as { url: string; order: number }[],
    listedBy: {
      name: "David Chen",
      displayName: "David C.",
      role: "BROKER",
      brokerageName: "Manhattan Biz Brokers",
    },
  },
  {
    id: "4",
    slug: "fordham-barbershop",
    title: "Fordham Road Barbershop -- Loyal Clientele",
    category: "Salons & Barbershops",
    status: "ACTIVE",
    askingPrice: 150000,
    annualRevenue: 220000,
    cashFlowSDE: 85000,
    neighborhood: "Fordham",
    borough: "BRONX",
    createdAt: "2026-02-10T00:00:00Z",
    viewCount: 98,
    saveCount: 8,
    isGhostListing: false,
    photos: [] as { url: string; order: number }[],
    listedBy: {
      name: "James Wright",
      displayName: null,
      role: "USER",
      brokerageName: null,
    },
  },
  {
    id: "5",
    slug: "williamsburg-coffee-shop",
    title: "Williamsburg Specialty Coffee -- Turnkey Operation",
    category: "Cafes & Coffee Shops",
    status: "ACTIVE",
    askingPrice: 350000,
    annualRevenue: 520000,
    cashFlowSDE: 140000,
    neighborhood: "Williamsburg",
    borough: "BROOKLYN",
    createdAt: "2026-02-18T00:00:00Z",
    viewCount: 276,
    saveCount: 31,
    isGhostListing: false,
    photos: [] as { url: string; order: number }[],
    listedBy: {
      name: "Elena Vasquez",
      displayName: null,
      role: "BROKER",
      brokerageName: "BK Business Group",
    },
  },
  {
    id: "6",
    slug: "jackson-heights-grocery",
    title: "Jackson Heights Grocery & Deli -- High Traffic",
    category: "Delis & Grocery Stores",
    status: "ACTIVE",
    askingPrice: 500000,
    annualRevenue: 1100000,
    cashFlowSDE: 195000,
    neighborhood: "Jackson Heights",
    borough: "QUEENS",
    createdAt: "2026-01-05T00:00:00Z",
    viewCount: 412,
    saveCount: 36,
    isGhostListing: false,
    photos: [] as { url: string; order: number }[],
    listedBy: {
      name: "Raj Patel",
      displayName: null,
      role: "USER",
      brokerageName: null,
    },
  },
];

// ---------------------------------------------------------------------------
// Borough data for the borough browse section
// ---------------------------------------------------------------------------

const BOROUGH_DATA = [
  { name: "Manhattan", slug: "manhattan", value: "MANHATTAN" },
  { name: "Brooklyn", slug: "brooklyn", value: "BROOKLYN" },
  { name: "Queens", slug: "queens", value: "QUEENS" },
  { name: "Bronx", slug: "bronx", value: "BRONX" },
  { name: "Staten Island", slug: "staten-island", value: "STATEN_ISLAND" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const top15Categories = BUSINESS_CATEGORIES.slice(0, 15);

  return (
    <div className="flex flex-col">
      {/* ================================================================= */}
      {/* 1. Hero Section                                                   */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.85)_50%,hsl(var(--primary)/0.95)_100%)]" />

        {/* Geometric grid pattern for texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.5) 59px, rgba(255,255,255,0.5) 60px),
              repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.5) 59px, rgba(255,255,255,0.5) 60px)
            `,
          }}
        />

        {/* Content */}
        <div className="relative container mx-auto px-4 py-20 md:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Headline */}
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              Find Your Next Business
              <br />
              <span className="text-accent">in New York City</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/75 sm:text-xl">
              Browse hundreds of businesses for sale across all five boroughs
            </p>

            {/* Search Bar */}
            <div className="mt-8">
              <SearchBar variant="hero" />
            </div>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/50">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                500+ Active Listings
              </span>
              <span className="hidden sm:inline text-primary-foreground/30" aria-hidden="true">
                &bull;
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                All 5 Boroughs
              </span>
              <span className="hidden sm:inline text-primary-foreground/30" aria-hidden="true">
                &bull;
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                100+ Categories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. Featured Listings Section                                      */}
      {/* ================================================================= */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Featured Listings
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Explore top business opportunities across NYC
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_LISTINGS.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/listings">
            <Button variant="outline" size="lg" className="gap-2 font-semibold">
              View All Listings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. Category Browse Section                                        */}
      {/* ================================================================= */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Browse by Category
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Find the right type of business for you
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top15Categories.map((category) => (
              <Link
                key={category}
                href={`/categories/${slugify(category)}`}
                className="group"
              >
                <Card className="border border-border/60 transition-all duration-200 group-hover:border-accent/40 group-hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <span className="text-[15px] font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                      {category}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">
                      Browse
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/listings">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                View all categories
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. Borough Browse Section                                         */}
      {/* ================================================================= */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Explore by Borough
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Discover opportunities in every corner of the city
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {BOROUGH_DATA.map((borough) => (
            <Link
              key={borough.slug}
              href={`/boroughs/${borough.slug}`}
              className="group"
            >
              <Card className="overflow-hidden border border-border/60 transition-all duration-200 group-hover:border-accent/40 group-hover:shadow-md">
                <CardContent className="relative flex flex-col items-center justify-center p-6 sm:p-8">
                  {/* Decorative background accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-accent/[0.05] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-accent transition-colors sm:text-xl">
                      {borough.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground text-center">
                      View listings
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. CTA Section                                                    */}
      {/* ================================================================= */}
      <section className="border-t bg-muted">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <TrendingUp className="h-7 w-7 text-accent" />
            </div>
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              List Your Business for Free
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Reach thousands of qualified buyers across New York City. Create
              your listing in minutes and connect with serious prospects ready
              to invest.
            </p>
            <div className="mt-8">
              <Link href="/my-listings/new">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8"
                >
                  Get Started &mdash; It&apos;s Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
