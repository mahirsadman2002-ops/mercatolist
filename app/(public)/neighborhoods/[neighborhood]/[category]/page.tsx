import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify, formatCurrency } from "@/lib/utils";
import {
  BUSINESS_CATEGORIES,
  BOROUGHS,
  NEIGHBORHOODS,
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

function findNeighborhoodAndBorough(
  neighborhoodSlug: string
): { neighborhood: string; boroughValue: string; boroughLabel: string } | null {
  for (const [boroughValue, neighborhoods] of Object.entries(NEIGHBORHOODS)) {
    for (const n of neighborhoods) {
      if (slugify(n) === neighborhoodSlug) {
        const boroughObj = BOROUGHS.find((b) => b.value === boroughValue);
        return {
          neighborhood: n,
          boroughValue,
          boroughLabel: boroughObj?.label ?? boroughValue,
        };
      }
    }
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
// Static Params — empty array, generated on demand
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return [];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface NeighborhoodCategoryPageProps {
  params: Promise<{ neighborhood: string; category: string }>;
}

export async function generateMetadata({
  params,
}: NeighborhoodCategoryPageProps): Promise<Metadata> {
  const { neighborhood: neighborhoodSlug, category: categorySlug } =
    await params;
  const categoryName = getCategoryFromSlug(categorySlug);
  const location = findNeighborhoodAndBorough(neighborhoodSlug);

  if (!categoryName || !location) {
    return { title: "Not Found | MercatoList" };
  }

  const count = await prisma.businessListing.count({
    where: {
      category: categoryName,
      neighborhood: location.neighborhood,
      status: "ACTIVE",
    },
  });

  return {
    title: `${categoryName} for Sale in ${location.neighborhood}, ${location.boroughLabel} | MercatoList`,
    description: `Browse ${count} ${categoryName.toLowerCase()} businesses for sale in ${location.neighborhood}, ${location.boroughLabel}. View pricing, financials, and details on MercatoList.`,
    alternates: {
      canonical: `/neighborhoods/${neighborhoodSlug}/${categorySlug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function NeighborhoodCategoryPage({
  params,
}: NeighborhoodCategoryPageProps) {
  const { neighborhood: neighborhoodSlug, category: categorySlug } =
    await params;
  const categoryName = getCategoryFromSlug(categorySlug);
  const location = findNeighborhoodAndBorough(neighborhoodSlug);

  if (!categoryName || !location) {
    notFound();
  }

  const { neighborhood, boroughValue, boroughLabel } = location;
  const boroughSlug = getBoroughSlug(boroughValue);

  // Fetch listings
  const listings = await prisma.businessListing.findMany({
    where: {
      category: categoryName,
      neighborhood,
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
      neighborhood,
      status: "ACTIVE",
    },
  });

  // Nearby neighborhoods with this category (same borough, different neighborhood)
  const nearbyNeighborhoodCounts = await prisma.businessListing.groupBy({
    by: ["neighborhood"],
    where: {
      category: categoryName,
      borough: boroughValue as "MANHATTAN" | "BROOKLYN" | "QUEENS" | "BRONX" | "STATEN_ISLAND",
      status: "ACTIVE",
      neighborhood: { not: neighborhood },
    },
    _count: { id: true },
  });

  const nearbyCountMap: Record<string, number> = {};
  for (const row of nearbyNeighborhoodCounts) {
    nearbyCountMap[row.neighborhood] = row._count.id;
  }

  // Only show neighborhoods from constants that have listings
  const boroughNeighborhoods = NEIGHBORHOODS[boroughValue] ?? [];
  const nearbyWithListings = boroughNeighborhoods.filter(
    (n) => n !== neighborhood && (nearbyCountMap[n] ?? 0) > 0
  );

  const serializedListings = listings.map(serializeListing);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: boroughLabel, href: `/boroughs/${boroughSlug}` },
          {
            label: neighborhood,
            href: `/neighborhoods/${neighborhoodSlug}`,
          },
          { label: categoryName },
        ]}
      />

      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          {categoryName} for Sale in {neighborhood}
        </h1>
        <p className="text-lg text-muted-foreground">
          {boroughLabel}, New York City &middot; {totalCount}{" "}
          {totalCount === 1 ? "listing" : "listings"}
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
                  href={`/listings?category=${encodeURIComponent(categoryName)}&neighborhood=${encodeURIComponent(neighborhood)}`}
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
            No {categoryName.toLowerCase()} listings in {neighborhood} right now
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Try broadening your search to see more results.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link href={`/neighborhoods/${neighborhoodSlug}`}>
                All businesses in {neighborhood}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/boroughs/${boroughSlug}/${categorySlug}`}>
                {categoryName} in {boroughLabel}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/categories/${categorySlug}`}>
                {categoryName} in all of NYC
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Navigation Links */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Explore More</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Parent pages */}
          <div className="rounded-lg border p-5">
            <h3 className="font-semibold mb-3">Related Pages</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/neighborhoods/${neighborhoodSlug}`}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  All businesses in {neighborhood}
                </Link>
              </li>
              <li>
                <Link
                  href={`/categories/${categorySlug}`}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  {categoryName} across NYC
                </Link>
              </li>
              <li>
                <Link
                  href={`/boroughs/${boroughSlug}/${categorySlug}`}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  {categoryName} in {boroughLabel}
                </Link>
              </li>
              <li>
                <Link
                  href={`/boroughs/${boroughSlug}`}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  All businesses in {boroughLabel}
                </Link>
              </li>
            </ul>
          </div>

          {/* Nearby neighborhoods with this category */}
          {nearbyWithListings.length > 0 && (
            <div className="rounded-lg border p-5 sm:col-span-2">
              <h3 className="font-semibold mb-3">
                {categoryName} in Nearby Neighborhoods
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {nearbyWithListings.slice(0, 10).map((n) => {
                  const nSlug = slugify(n);
                  const count = nearbyCountMap[n] ?? 0;
                  return (
                    <Link
                      key={n}
                      href={`/neighborhoods/${nSlug}/${categorySlug}`}
                      className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors py-1"
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {n}{" "}
                        <span className="text-muted-foreground">
                          ({count})
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Internal Links */}
      <InternalLinks
        currentBorough={boroughSlug}
        currentNeighborhood={neighborhoodSlug}
        currentCategory={categorySlug}
      />
    </div>
  );
}
