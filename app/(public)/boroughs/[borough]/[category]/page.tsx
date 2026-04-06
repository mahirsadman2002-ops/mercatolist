import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify, formatCurrency } from "@/lib/utils";

export const revalidate = 3600;
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
import { ArrowRight, MapPin, Store } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategoryFromSlug(slug: string): string | null {
  for (const cat of BUSINESS_CATEGORIES) {
    if (slugify(cat) === slug) return cat;
  }
  return null;
}

function getBoroughFromSlug(
  slug: string
): { value: string; label: string } | null {
  for (const b of BOROUGHS) {
    const bSlug = b.value.toLowerCase().replace(/_/g, "-");
    if (bSlug === slug) return { value: b.value, label: b.label };
  }
  return null;
}

function getBoroughSlug(boroughValue: string): string {
  return boroughValue.toLowerCase().replace(/_/g, "-");
}

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
  const params: { borough: string; category: string }[] = [];
  for (const b of BOROUGHS) {
    const boroughSlug = b.value.toLowerCase().replace(/_/g, "-");
    for (const cat of BUSINESS_CATEGORIES) {
      params.push({ borough: boroughSlug, category: slugify(cat) });
    }
  }
  return params;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface BoroughCategoryPageProps {
  params: Promise<{ borough: string; category: string }>;
}

export async function generateMetadata({
  params,
}: BoroughCategoryPageProps): Promise<Metadata> {
  const { borough: boroughSlug, category: categorySlug } = await params;
  const borough = getBoroughFromSlug(boroughSlug);
  const categoryName = getCategoryFromSlug(categorySlug);

  if (!borough || !categoryName) {
    return { title: "Not Found | MercatoList" };
  }

  const count = await prisma.businessListing.count({
    where: {
      category: categoryName,
      borough: borough.value as "MANHATTAN" | "BROOKLYN" | "QUEENS" | "BRONX" | "STATEN_ISLAND",
      status: "ACTIVE",
    },
  });

  return {
    title: `${categoryName} for Sale in ${borough.label} | MercatoList`,
    description: `Browse ${count} ${categoryName.toLowerCase()} businesses for sale in ${borough.label}, NYC. Find listings with pricing, financials, and advisor details on MercatoList.`,
    alternates: {
      canonical: `/boroughs/${boroughSlug}/${categorySlug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BoroughCategoryPage({
  params,
}: BoroughCategoryPageProps) {
  const { borough: boroughSlug, category: categorySlug } = await params;
  const borough = getBoroughFromSlug(boroughSlug);
  const categoryName = getCategoryFromSlug(categorySlug);

  if (!borough || !categoryName) {
    notFound();
  }

  const boroughValue = borough.value as "MANHATTAN" | "BROOKLYN" | "QUEENS" | "BRONX" | "STATEN_ISLAND";

  // Fetch listings
  const listings = await prisma.businessListing.findMany({
    where: {
      category: categoryName,
      borough: boroughValue,
      status: "ACTIVE",
    },
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

  const totalCount = await prisma.businessListing.count({
    where: {
      category: categoryName,
      borough: boroughValue,
      status: "ACTIVE",
    },
  });

  // Neighborhood counts for this borough + category
  const neighborhoodCounts = await prisma.businessListing.groupBy({
    by: ["neighborhood"],
    where: {
      category: categoryName,
      borough: boroughValue,
      status: "ACTIVE",
    },
    _count: { id: true },
  });

  const neighborhoodCountMap: Record<string, number> = {};
  for (const row of neighborhoodCounts) {
    neighborhoodCountMap[row.neighborhood] = row._count.id;
  }

  // All neighborhoods in this borough (from constants)
  const boroughNeighborhoods = NEIGHBORHOODS[borough.value] ?? [];

  // Neighborhoods that have listings
  const activeNeighborhoods = boroughNeighborhoods.filter(
    (n) => (neighborhoodCountMap[n] ?? 0) > 0
  );

  // Other boroughs for this category
  const otherBoroughCounts = await prisma.businessListing.groupBy({
    by: ["borough"],
    where: {
      category: categoryName,
      status: "ACTIVE",
      borough: { not: boroughValue },
    },
    _count: { id: true },
  });

  const otherBoroughCountMap: Record<string, number> = {};
  for (const row of otherBoroughCounts) {
    otherBoroughCountMap[row.borough] = row._count.id;
  }

  const serializedListings = listings.map(serializeListing);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: borough.label, href: `/boroughs/${boroughSlug}` },
          { label: categoryName },
        ]}
      />

      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          {categoryName} for Sale in {borough.label}
        </h1>
        <p className="text-lg text-muted-foreground">
          {totalCount} {totalCount === 1 ? "listing" : "listings"} in{" "}
          {borough.label}, New York City
        </p>
      </section>

      {/* Listings Grid */}
      {serializedListings.length > 0 ? (
        <section className="mb-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serializedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {totalCount > 24 && (
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link
                  href={`/listings?category=${encodeURIComponent(categoryName)}&borough=${encodeURIComponent(borough.value)}`}
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
            No {categoryName.toLowerCase()} listings in {borough.label} right
            now
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Try browsing this category city-wide or explore other businesses in{" "}
            {borough.label}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link href={`/categories/${categorySlug}`}>
                {categoryName} in all of NYC
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/boroughs/${boroughSlug}`}>
                All businesses in {borough.label}
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Browse by Neighborhood */}
      {activeNeighborhoods.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">
            {categoryName} by Neighborhood in {borough.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeNeighborhoods.map((neighborhood) => {
              const count = neighborhoodCountMap[neighborhood] ?? 0;
              const neighborhoodSlug = slugify(neighborhood);
              return (
                <Link
                  key={neighborhood}
                  href={`/neighborhoods/${neighborhoodSlug}/${categorySlug}`}
                  className="group rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {neighborhood}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {count} {count === 1 ? "listing" : "listings"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Navigation Links */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Explore More</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Parent pages */}
          <div className="rounded-lg border p-5">
            <h3 className="font-semibold mb-3">Parent Pages</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/boroughs/${boroughSlug}`}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  All businesses in {borough.label}
                </Link>
              </li>
              <li>
                <Link
                  href={`/categories/${categorySlug}`}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  {categoryName} in all of NYC
                </Link>
              </li>
            </ul>
          </div>

          {/* Same category in other boroughs */}
          <div className="rounded-lg border p-5">
            <h3 className="font-semibold mb-3">
              {categoryName} in Other Boroughs
            </h3>
            <ul className="space-y-2">
              {BOROUGHS.filter((b) => b.value !== borough.value).map((b) => {
                const otherSlug = getBoroughSlug(b.value);
                const otherCount = otherBoroughCountMap[b.value] ?? 0;
                return (
                  <li key={b.value}>
                    <Link
                      href={`/boroughs/${otherSlug}/${categorySlug}`}
                      className="text-sm text-foreground/80 hover:text-primary transition-colors"
                    >
                      {b.label}{" "}
                      <span className="text-muted-foreground">
                        ({otherCount})
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Related categories in this borough */}
          {(RELATED_CATEGORIES[categoryName] ?? []).length > 0 && (
            <div className="rounded-lg border p-5">
              <h3 className="font-semibold mb-3">
                Related Categories in {borough.label}
              </h3>
              <ul className="space-y-2">
                {(RELATED_CATEGORIES[categoryName] ?? []).map((related) => {
                  const relatedSlug = slugify(related);
                  return (
                    <li key={related}>
                      <Link
                        href={`/boroughs/${boroughSlug}/${relatedSlug}`}
                        className="text-sm text-foreground/80 hover:text-primary transition-colors"
                      >
                        {related}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Internal Links */}
      <InternalLinks
        currentBorough={boroughSlug}
        currentCategory={categorySlug}
      />
    </div>
  );
}
