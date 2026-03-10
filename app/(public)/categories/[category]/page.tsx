import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;
import { slugify, formatCurrency } from "@/lib/utils";
import {
  BUSINESS_CATEGORIES,
  BOROUGHS,
  NEIGHBORHOODS,
  RELATED_CATEGORIES,
} from "@/lib/constants";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { InternalLinks } from "@/components/seo/InternalLinks";
import { ListingCard } from "@/components/listings/ListingCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, DollarSign, BarChart3, Store } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategoryFromSlug(slug: string): string | null {
  for (const cat of BUSINESS_CATEGORIES) {
    if (slugify(cat) === slug) return cat;
  }
  return null;
}

function getBoroughSlug(boroughValue: string): string {
  return boroughValue.toLowerCase().replace(/_/g, "-");
}

function getBoroughLabel(boroughValue: string): string {
  const found = BOROUGHS.find((b) => b.value === boroughValue);
  return found ? found.label : boroughValue;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Restaurants:
    "New York City's world-class dining scene creates constant opportunities for restaurant buyers and sellers. With over 27,000 restaurants across the five boroughs, the market offers everything from quick-service spots to fine dining establishments.",
  "Bars & Nightclubs":
    "NYC's legendary nightlife scene drives steady demand for bars and nightclubs. From craft cocktail lounges in Manhattan to neighborhood bars in Brooklyn, these businesses benefit from the city's unmatched after-dark economy.",
  "Laundromats & Dry Cleaners":
    "Laundromats are among the most sought-after businesses in NYC, known for steady cash flow and recession-resistant demand. In a city where most residents don't have in-unit laundry, these businesses serve an essential need.",
  "Cafes & Coffee Shops":
    "The coffee culture in New York City is thriving, with opportunities ranging from independent specialty cafes to established franchise locations across all five boroughs.",
  "Retail Stores":
    "NYC's iconic commercial corridors and massive foot traffic make retail a dynamic sector. From boutique shops in the Village to high-volume stores in Midtown, retail opportunities abound.",
  Bakeries:
    "New York's bakery scene is iconic, from neighborhood bagel shops to artisan patisseries. These businesses enjoy loyal customer bases and strong daily foot traffic across all five boroughs.",
  "Delis & Grocery Stores":
    "Delis and grocery stores are a cornerstone of New York City life. With high population density and constant demand for convenient food options, these businesses serve as essential neighborhood anchors.",
  "Salons & Barbershops":
    "The personal care industry thrives in New York City, where millions of residents seek regular grooming services. Salons and barbershops benefit from recurring clientele and strong neighborhood loyalty.",
  "Convenience Stores":
    "Convenience stores are high-traffic, essential retail businesses in NYC. The city's density and round-the-clock lifestyle make these stores a reliable revenue generator in virtually every neighborhood.",
  "Gyms & Fitness Studios":
    "New York City's health-conscious population fuels consistent demand for gyms and fitness studios. From boutique studios to full-service gyms, the market offers diverse opportunities.",
  "Liquor Stores":
    "Liquor stores in New York City benefit from strong, consistent consumer demand and limited license availability. A liquor license in NYC is a valuable asset that appreciates over time.",
  "Food Trucks & Carts":
    "NYC's street food culture is legendary. Food trucks and carts offer lower startup costs and the flexibility to serve the city's massive lunchtime crowds, tourists, and event-goers.",
  "Nail Salons":
    "Nail salons are a staple of NYC's personal care market, with strong demand driven by the city's image-conscious population and the convenience of neighborhood locations.",
  "Spas & Wellness":
    "The wellness industry is booming in New York City, with growing demand for spa services, holistic treatments, and self-care experiences across all demographics.",
  Pharmacies:
    "Independent pharmacies in NYC fill a vital healthcare role, especially in underserved neighborhoods. These businesses combine steady prescription revenue with front-end retail sales.",
  "Auto Repair & Body Shops":
    "Auto repair shops serve a critical need in the outer boroughs, where car ownership is higher. Limited competition and essential services make these businesses attractive investments.",
  "Daycare & Childcare":
    "With a growing population of young families and limited childcare options, daycare centers in NYC enjoy strong demand and the potential for stable, recurring revenue.",
  "E-commerce Businesses":
    "NYC-based e-commerce businesses benefit from proximity to a massive consumer market, creative talent pools, and robust logistics infrastructure for shipping and fulfillment.",
  "Clothing & Fashion":
    "New York City is a global fashion capital, making it an ideal market for clothing and fashion retail businesses of every scale and niche.",
  "Smoke Shops & Vape Shops":
    "Smoke and vape shops have grown rapidly in NYC, particularly in high-foot-traffic areas. These businesses benefit from a diverse customer base and evolving product categories.",
};

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function serializeListing(listing: {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  askingPrice: unknown;
  annualRevenue: unknown;
  cashFlowSDE: unknown;
  neighborhood: string;
  borough: string;
  createdAt: Date;
  viewCount: number;
  saveCount: number;
  isGhostListing: boolean;
  photos: { url: string; order: number }[];
  listedBy: {
    name: string;
    displayName: string | null;
    role: string;
    brokerageName: string | null;
  };
}) {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    category: listing.category,
    status: listing.status,
    askingPrice: Number(listing.askingPrice),
    annualRevenue: listing.annualRevenue ? Number(listing.annualRevenue) : null,
    cashFlowSDE: listing.cashFlowSDE ? Number(listing.cashFlowSDE) : null,
    neighborhood: listing.neighborhood,
    borough: listing.borough,
    createdAt: listing.createdAt.toISOString(),
    viewCount: listing.viewCount,
    saveCount: listing.saveCount,
    isGhostListing: listing.isGhostListing,
    photos: listing.photos,
    listedBy: listing.listedBy,
  };
}

// ---------------------------------------------------------------------------
// Static Params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return BUSINESS_CATEGORIES.map((cat) => ({
    category: slugify(cat),
  }));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const categoryName = getCategoryFromSlug(categorySlug);

  if (!categoryName) {
    return { title: "Category Not Found | MercatoList" };
  }

  const count = await prisma.businessListing.count({
    where: { category: categoryName, status: "ACTIVE" },
  });

  return {
    title: `${categoryName} for Sale in NYC | MercatoList`,
    description: `Browse ${count} ${categoryName.toLowerCase()} businesses for sale across all five NYC boroughs. Find the right opportunity on MercatoList.`,
    alternates: {
      canonical: `/categories/${categorySlug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const categoryName = getCategoryFromSlug(categorySlug);

  if (!categoryName) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The category you are looking for does not exist.
        </p>
        <Button asChild>
          <Link href="/categories">Browse All Categories</Link>
        </Button>
      </div>
    );
  }

  // Fetch listings
  const listings = await prisma.businessListing.findMany({
    where: { category: categoryName, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      photos: { select: { url: true, order: true } },
      listedBy: {
        select: {
          name: true,
          displayName: true,
          role: true,
          brokerageName: true,
        },
      },
    },
  });

  // Borough counts
  const boroughCounts = await prisma.businessListing.groupBy({
    by: ["borough"],
    where: { category: categoryName, status: "ACTIVE" },
    _count: { id: true },
  });

  const boroughCountMap: Record<string, number> = {};
  for (const row of boroughCounts) {
    boroughCountMap[row.borough] = row._count.id;
  }

  // Market stats
  const totalCount = listings.length > 0
    ? await prisma.businessListing.count({
        where: { category: categoryName, status: "ACTIVE" },
      })
    : 0;

  const statsAgg = totalCount > 0
    ? await prisma.businessListing.aggregate({
        where: { category: categoryName, status: "ACTIVE" },
        _avg: { askingPrice: true },
        _min: { askingPrice: true },
        _max: { askingPrice: true },
      })
    : null;

  // Related categories
  const relatedCategoryNames = RELATED_CATEGORIES[categoryName] ?? [];

  // Description
  const description =
    CATEGORY_DESCRIPTIONS[categoryName] ??
    `Browse ${categoryName.toLowerCase()} businesses for sale across New York City's five boroughs. Find the right opportunity on MercatoList.`;

  // Serialize listings for ListingCard
  const serializedListings = listings.map(serializeListing);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryName} for Sale in NYC`,
    description,
    numberOfItems: totalCount,
    itemListElement: serializedListings.slice(0, 10).map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://mercatolist.com/listings/${listing.slug}`,
      name: listing.title,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Categories", href: "/listings" },
          { label: categoryName },
        ]}
      />

      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          {categoryName} for Sale in NYC
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          {totalCount} {totalCount === 1 ? "listing" : "listings"} across New
          York City
        </p>
        <p className="text-foreground/80 max-w-3xl leading-relaxed">
          {description}
        </p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link
              href={`/listings?category=${encodeURIComponent(categoryName)}`}
            >
              Search all {categoryName.toLowerCase()} listings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Listings Grid */}
      {serializedListings.length > 0 ? (
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">
            Latest {categoryName} Listings
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serializedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {totalCount > 24 && (
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link
                  href={`/listings?category=${encodeURIComponent(categoryName)}`}
                >
                  View all {totalCount} listings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="mb-16 rounded-lg border border-dashed p-12 text-center">
          <Store className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No active {categoryName.toLowerCase()} listings right now
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            New listings are added regularly. Browse all listings or check back
            soon.
          </p>
          <Button asChild>
            <Link href="/listings">Browse All Listings</Link>
          </Button>
        </section>
      )}

      {/* Browse by Borough */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">
          {categoryName} by Borough
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {BOROUGHS.map((borough) => {
            const count = boroughCountMap[borough.value] ?? 0;
            const boroughSlug = getBoroughSlug(borough.value);
            return (
              <Link
                key={borough.value}
                href={`/boroughs/${boroughSlug}/${categorySlug}`}
                className="group rounded-lg border p-5 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {borough.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {count} {count === 1 ? "listing" : "listings"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Market Stats */}
      {statsAgg && totalCount > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">
            {categoryName} Market Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Average Price</span>
              </div>
              <p className="text-2xl font-bold">
                {statsAgg._avg.askingPrice
                  ? formatCurrency(Number(statsAgg._avg.askingPrice))
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg border p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Price Range</span>
              </div>
              <p className="text-2xl font-bold">
                {statsAgg._min.askingPrice && statsAgg._max.askingPrice
                  ? `${formatCurrency(Number(statsAgg._min.askingPrice))} - ${formatCurrency(Number(statsAgg._max.askingPrice))}`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg border p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Active Listings</span>
              </div>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="rounded-lg border p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Store className="h-4 w-4" />
                <span className="text-sm font-medium">Boroughs Active</span>
              </div>
              <p className="text-2xl font-bold">
                {Object.keys(boroughCountMap).length} of 5
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Related Categories */}
      {relatedCategoryNames.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Related Categories</h2>
          <div className="flex flex-wrap gap-3">
            {relatedCategoryNames.map((related) => {
              const relatedSlug = slugify(related);
              return (
                <Link key={related} href={`/categories/${relatedSlug}`}>
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
                  >
                    {related}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Internal Links */}
      <InternalLinks currentCategory={categorySlug} />
    </div>
  );
}
