import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Utensils,
  Wine,
  Coffee,
  Croissant,
  ShoppingBag,
  Store,
  Shirt,
  Monitor,
  ShoppingCart,
  Pill,
  WashingMachine,
  Scissors,
  Sparkles,
  Hand,
  Dumbbell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { ListingCarousel } from "@/components/home/ListingCarousel";
import { AnimatedStats } from "@/components/home/AnimatedStats";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { slugify, formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Category icon map (top 15)
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Restaurants": <Utensils className="h-5 w-5" />,
  "Bars & Nightclubs": <Wine className="h-5 w-5" />,
  "Cafes & Coffee Shops": <Coffee className="h-5 w-5" />,
  "Bakeries": <Croissant className="h-5 w-5" />,
  "Delis & Grocery Stores": <ShoppingBag className="h-5 w-5" />,
  "Food Trucks & Carts": <Store className="h-5 w-5" />,
  "Retail Stores": <ShoppingCart className="h-5 w-5" />,
  "Clothing & Fashion": <Shirt className="h-5 w-5" />,
  "Electronics": <Monitor className="h-5 w-5" />,
  "Convenience Stores": <ShoppingCart className="h-5 w-5" />,
  "Pharmacies": <Pill className="h-5 w-5" />,
  "Laundromats & Dry Cleaners": <WashingMachine className="h-5 w-5" />,
  "Salons & Barbershops": <Scissors className="h-5 w-5" />,
  "Spas & Wellness": <Sparkles className="h-5 w-5" />,
  "Nail Salons": <Hand className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Restaurants": "border-l-orange-500",
  "Bars & Nightclubs": "border-l-purple-500",
  "Cafes & Coffee Shops": "border-l-amber-600",
  "Bakeries": "border-l-yellow-500",
  "Delis & Grocery Stores": "border-l-green-600",
  "Food Trucks & Carts": "border-l-red-500",
  "Retail Stores": "border-l-blue-500",
  "Clothing & Fashion": "border-l-pink-500",
  "Electronics": "border-l-cyan-500",
  "Convenience Stores": "border-l-emerald-500",
  "Pharmacies": "border-l-teal-600",
  "Laundromats & Dry Cleaners": "border-l-sky-500",
  "Salons & Barbershops": "border-l-rose-500",
  "Spas & Wellness": "border-l-violet-500",
  "Nail Salons": "border-l-fuchsia-500",
};

// ---------------------------------------------------------------------------
// Borough data with distinctive gradients
// ---------------------------------------------------------------------------

const BOROUGH_DATA = [
  {
    name: "Manhattan",
    slug: "manhattan",
    value: "MANHATTAN",
    gradient: "from-amber-500/15 to-orange-500/5",
    accent: "text-amber-700 dark:text-amber-400",
  },
  {
    name: "Brooklyn",
    slug: "brooklyn",
    value: "BROOKLYN",
    gradient: "from-emerald-500/15 to-teal-500/5",
    accent: "text-emerald-700 dark:text-emerald-400",
  },
  {
    name: "Queens",
    slug: "queens",
    value: "QUEENS",
    gradient: "from-blue-500/15 to-indigo-500/5",
    accent: "text-blue-700 dark:text-blue-400",
  },
  {
    name: "Bronx",
    slug: "bronx",
    value: "BRONX",
    gradient: "from-rose-500/15 to-red-500/5",
    accent: "text-rose-700 dark:text-rose-400",
  },
  {
    name: "Staten Island",
    slug: "staten-island",
    value: "STATEN_ISLAND",
    gradient: "from-violet-500/15 to-purple-500/5",
    accent: "text-violet-700 dark:text-violet-400",
  },
];

// ---------------------------------------------------------------------------
// Data fetching (server component)
// ---------------------------------------------------------------------------

async function getHomePageData() {
  const [
    listingCount,
    userCount,
    featuredListings,
    boroughCounts,
    totalValue,
  ] = await Promise.all([
    prisma.businessListing.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.businessListing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { viewCount: "desc" },
      take: 12,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        status: true,
        askingPrice: true,
        annualRevenue: true,
        cashFlowSDE: true,
        neighborhood: true,
        borough: true,
        createdAt: true,
        viewCount: true,
        saveCount: true,
        isGhostListing: true,
        photos: { select: { url: true, order: true }, orderBy: { order: "asc" } },
        listedBy: {
          select: {
            name: true,
            displayName: true,
            role: true,
            brokerageName: true,
          },
        },
      },
    }),
    prisma.businessListing.groupBy({
      by: ["borough"],
      where: { status: "ACTIVE" },
      _count: { id: true },
    }),
    prisma.businessListing.aggregate({
      where: { status: "ACTIVE" },
      _sum: { askingPrice: true },
    }),
  ]);

  // Build borough count lookup
  const boroughCountMap: Record<string, number> = {};
  for (const b of boroughCounts) {
    boroughCountMap[b.borough] = b._count.id;
  }

  // Serialize Decimal fields to numbers
  const serializedListings = featuredListings.map((l) => ({
    ...l,
    askingPrice: Number(l.askingPrice),
    annualRevenue: l.annualRevenue ? Number(l.annualRevenue) : null,
    cashFlowSDE: l.cashFlowSDE ? Number(l.cashFlowSDE) : null,
    createdAt: l.createdAt.toISOString(),
  }));

  const totalValueNum = Number(totalValue._sum.askingPrice ?? 0);

  return {
    listingCount,
    userCount,
    featuredListings: serializedListings,
    boroughCountMap,
    totalValue: totalValueNum,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const {
    listingCount,
    userCount,
    featuredListings,
    boroughCountMap,
    totalValue,
  } = await getHomePageData();

  const top15Categories = BUSINESS_CATEGORIES.slice(0, 15);
  const neighborhoodCount = 140;
  const totalValueMillions = Math.floor(totalValue / 1_000_000);

  return (
    <div className="flex flex-col">
      {/* ================================================================= */}
      {/* 1. Hero Section — NYC Skyline Text Effect                         */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.85)_50%,hsl(var(--primary)/0.95)_100%)]" />

        {/* Grid texture */}
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
          <div className="mx-auto max-w-4xl text-center">
            {/* Line 1 */}
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-[1.15]">
              Find Your Next Business in
            </h1>

            {/* Line 2 — NYC skyline text effect */}
            <p
              className="font-heading text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl leading-[1.05] mt-2 text-clip-image"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80')`,
                backgroundSize: "cover",
                backgroundPosition: "center 40%",
              }}
              aria-label="New York City"
            >
              New York City
            </p>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/75 sm:text-xl">
              NYC&apos;s premier marketplace for buying and selling businesses across all five boroughs
            </p>

            {/* Search Bar */}
            <div className="mt-8">
              <SearchBar variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. Animated Stats Bar                                             */}
      {/* ================================================================= */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <ScrollReveal>
          <AnimatedStats
            listingCount={listingCount}
            neighborhoodCount={neighborhoodCount}
            userCount={userCount}
            boroughCount={5}
          />
        </ScrollReveal>
      </section>

      {/* ================================================================= */}
      {/* 3. Featured Listings Carousel                                     */}
      {/* ================================================================= */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Featured Listings
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Explore top business opportunities across NYC
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <ListingCarousel listings={featuredListings} />
        </ScrollReveal>

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
      {/* 4. Category Browse — Enhanced with icons + accent borders          */}
      {/* ================================================================= */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <h2 className="font-heading text-3xl font-bold md:text-4xl">
                Browse by Category
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Find the right type of business for you
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal stagger>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {top15Categories.map((category) => (
                <Link
                  key={category}
                  href={`/categories/${slugify(category)}`}
                  className="group"
                >
                  <Card
                    className={`border border-border/60 border-l-4 ${CATEGORY_COLORS[category] ?? "border-l-accent"} transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5`}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                        {CATEGORY_ICONS[category] ?? <Store className="h-5 w-5" />}
                      </div>
                      <span className="flex-1 text-[15px] font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                        {category}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-all duration-200 group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollReveal>

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
      {/* 5. Borough Browse — Enhanced with gradients + counts              */}
      {/* ================================================================= */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Explore by Borough
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Discover opportunities in every corner of the city
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {BOROUGH_DATA.map((borough) => {
              const count = boroughCountMap[borough.value] ?? 0;
              return (
                <Link
                  key={borough.slug}
                  href={`/boroughs/${borough.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden border border-border/60 transition-all duration-200 group-hover:shadow-lg group-hover:scale-[1.02]">
                    <CardContent className={`relative flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br ${borough.gradient}`}>
                      <h3 className={`font-heading text-lg font-bold sm:text-xl transition-colors ${borough.accent}`}>
                        {borough.name}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground text-center">
                        {count} {count === 1 ? "listing" : "listings"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* ================================================================= */}
      {/* 6. Social Proof / Marketplace Stats                               */}
      {/* ================================================================= */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold md:text-4xl">
                Trusted by NYC Business Owners
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                The marketplace connecting buyers, sellers, and brokers across the five boroughs
              </p>

              {totalValueMillions > 0 && (
                <div className="mt-8 inline-flex items-center gap-3 rounded-xl border bg-card px-6 py-4 shadow-sm">
                  <TrendingUp className="h-6 w-6 text-accent" />
                  <span className="text-lg font-semibold">
                    Over{" "}
                    <span className="text-accent">
                      {formatCurrency(totalValueMillions * 1_000_000)}
                    </span>{" "}
                    in active listings
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <span>{listingCount} active businesses</span>
                <span className="hidden sm:inline text-border" aria-hidden="true">&bull;</span>
                <span>5 boroughs covered</span>
                <span className="hidden sm:inline text-border" aria-hidden="true">&bull;</span>
                <span>Free to list</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. CTA Section                                                    */}
      {/* ================================================================= */}
      <section className="border-t bg-muted">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <ScrollReveal>
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
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
