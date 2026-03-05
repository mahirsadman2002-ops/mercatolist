import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Store, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { BOROUGHS, NEIGHBORHOODS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { InternalLinks } from "@/components/seo/InternalLinks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given a neighborhood slug, find the matching neighborhood name and its
 * borough key. Returns undefined if no match is found.
 */
function findBoroughForNeighborhood(
  neighborhoodSlug: string
): { boroughValue: string; neighborhoodName: string } | undefined {
  for (const [boroughValue, neighborhoods] of Object.entries(NEIGHBORHOODS)) {
    for (const name of neighborhoods) {
      if (slugify(name) === neighborhoodSlug) {
        return { boroughValue, neighborhoodName: name };
      }
    }
  }
  return undefined;
}

function boroughValueToLabel(value: string): string {
  const match = BOROUGHS.find((b) => b.value === value);
  return match?.label ?? value;
}

function boroughValueToSlug(value: string): string {
  return boroughValueToLabel(value).toLowerCase().replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const params: { neighborhood: string }[] = [];

  for (const neighborhoods of Object.values(NEIGHBORHOODS)) {
    for (const name of neighborhoods) {
      params.push({ neighborhood: slugify(name) });
    }
  }

  return params;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface NeighborhoodPageProps {
  params: Promise<{ neighborhood: string }>;
}

export async function generateMetadata({
  params,
}: NeighborhoodPageProps): Promise<Metadata> {
  const { neighborhood } = await params;
  const match = findBoroughForNeighborhood(neighborhood);
  if (!match) return {};

  const { boroughValue, neighborhoodName } = match;
  const boroughLabel = boroughValueToLabel(boroughValue);

  const count = await prisma.businessListing.count({
    where: {
      neighborhood: neighborhoodName,
      borough: boroughValue as never,
      status: "ACTIVE",
    },
  });

  const title = `Businesses for Sale in ${neighborhoodName}, ${boroughLabel} | MercatoList`;
  const description = `Find ${count} businesses for sale in ${neighborhoodName}, ${boroughLabel}. Browse listings on MercatoList — NYC's marketplace for buying and selling businesses.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://mercatolist.com/neighborhoods/${neighborhood}`,
      type: "website",
    },
    alternates: {
      canonical: `https://mercatolist.com/neighborhoods/${neighborhood}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Serialise a Prisma listing for the client ListingCard
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
    annualRevenue: listing.annualRevenue != null ? Number(listing.annualRevenue) : null,
    cashFlowSDE: listing.cashFlowSDE != null ? Number(listing.cashFlowSDE) : null,
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
// Page
// ---------------------------------------------------------------------------

export default async function NeighborhoodPage({
  params,
}: NeighborhoodPageProps) {
  const { neighborhood } = await params;
  const match = findBoroughForNeighborhood(neighborhood);

  if (!match) notFound();

  const { boroughValue, neighborhoodName } = match;
  const boroughLabel = boroughValueToLabel(boroughValue);
  const boroughSlug = boroughValueToSlug(boroughValue);

  // ---- Data fetching -------------------------------------------------------

  // Active listing count
  const activeCount = await prisma.businessListing.count({
    where: {
      neighborhood: neighborhoodName,
      borough: boroughValue as never,
      status: "ACTIVE",
    },
  });

  // Listings: up to 24, ordered by most recent
  const listingsRaw = await prisma.businessListing.findMany({
    where: {
      neighborhood: neighborhoodName,
      borough: boroughValue as never,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    take: 24,
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

  const listings = listingsRaw.map(serializeListing);

  // Category counts for this neighborhood
  const categoryCountsRaw = await prisma.businessListing.groupBy({
    by: ["category"],
    where: {
      neighborhood: neighborhoodName,
      borough: boroughValue as never,
      status: "ACTIVE",
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const categoryCounts = categoryCountsRaw.map((c) => ({
    category: c.category,
    slug: slugify(c.category),
    count: c._count.id,
  }));

  // Nearby neighborhoods: other neighborhoods in the same borough
  const allNeighborhoods = NEIGHBORHOODS[boroughValue] ?? [];
  const nearbyNeighborhoods = allNeighborhoods
    .filter((n) => n !== neighborhoodName)
    .map((name) => ({
      name,
      slug: slugify(name),
    }));

  // ---- JSON-LD -------------------------------------------------------------

  const top5 = listings.slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Businesses for Sale in ${neighborhoodName}, ${boroughLabel}`,
    description: `Browse businesses for sale in ${neighborhoodName}, ${boroughLabel} on MercatoList.`,
    url: `https://mercatolist.com/neighborhoods/${neighborhood}`,
    numberOfItems: top5.length,
    itemListElement: top5.map((listing, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `https://mercatolist.com/listings/${listing.slug}`,
      name: listing.title,
    })),
  };

  // ---- Render ---------------------------------------------------------------

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: boroughLabel, href: `/boroughs/${boroughSlug}` },
            { label: neighborhoodName },
          ]}
        />

        {/* ----------------------------------------------------------------- */}
        {/* Hero Section                                                      */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-teal-500" />
            <span className="text-sm font-medium text-teal-600 tracking-wide">
              {boroughLabel} &middot; {activeCount} active listing
              {activeCount !== 1 ? "s" : ""}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Businesses for Sale in {neighborhoodName}
          </h1>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Listings Grid                                                     */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-16">
          {listings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <Store className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">
                No active listings in {neighborhoodName} right now
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-md mx-auto">
                Check back soon or browse nearby neighborhoods below.
              </p>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Browse by Category                                                */}
        {/* ----------------------------------------------------------------- */}
        {categoryCounts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-bold tracking-tight">
                Browse by Category in {neighborhoodName}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categoryCounts.map((c) => (
                <Link
                  key={c.slug}
                  href={`/neighborhoods/${neighborhood}/${c.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-teal-500/40 hover:shadow-sm"
                >
                  <span className="font-medium text-sm text-foreground group-hover:text-teal-600 transition-colors">
                    {c.category}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs tabular-nums shrink-0"
                  >
                    {c.count}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Nearby Neighborhoods                                              */}
        {/* ----------------------------------------------------------------- */}
        {nearbyNeighborhoods.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-bold tracking-tight">
                Nearby Neighborhoods in {boroughLabel}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {nearbyNeighborhoods.map((n) => (
                <Link
                  key={n.slug}
                  href={`/neighborhoods/${n.slug}`}
                  className="group flex items-center rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-teal-500/40 hover:shadow-sm"
                >
                  <span className="font-medium text-sm text-foreground group-hover:text-teal-600 transition-colors">
                    {n.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Borough Link                                                      */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-12">
          <Link
            href={`/boroughs/${boroughSlug}`}
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Explore all of {boroughLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Internal Links                                                    */}
        {/* ----------------------------------------------------------------- */}
        <InternalLinks currentNeighborhood={neighborhood} />
      </div>
    </>
  );
}
