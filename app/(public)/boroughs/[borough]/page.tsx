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
// Helpers: slug <-> DB value mapping
// ---------------------------------------------------------------------------

const BOROUGH_SLUG_TO_VALUE: Record<string, string> = {
  manhattan: "MANHATTAN",
  brooklyn: "BROOKLYN",
  queens: "QUEENS",
  bronx: "BRONX",
  "staten-island": "STATEN_ISLAND",
};

const BOROUGH_VALUE_TO_LABEL: Record<string, string> = {
  MANHATTAN: "Manhattan",
  BROOKLYN: "Brooklyn",
  QUEENS: "Queens",
  BRONX: "Bronx",
  STATEN_ISLAND: "Staten Island",
};

function boroughSlugToValue(slug: string): string | undefined {
  return BOROUGH_SLUG_TO_VALUE[slug];
}

function boroughValueToLabel(value: string): string {
  return BOROUGH_VALUE_TO_LABEL[value] ?? value;
}

function boroughValueToSlug(value: string): string {
  return boroughValueToLabel(value).toLowerCase().replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Borough descriptions
// ---------------------------------------------------------------------------

const BOROUGH_DESCRIPTIONS: Record<string, string> = {
  MANHATTAN:
    "Manhattan is the beating heart of New York City's commercial landscape. From high-traffic restaurants in Midtown to boutique retail in SoHo and professional services on the Upper East Side, opportunities span every industry and price point.",
  BROOKLYN:
    "Brooklyn's entrepreneurial spirit makes it one of NYC's most exciting boroughs for business opportunities. From the creative economy of Williamsburg to the diverse food scene of Sunset Park, Brooklyn offers businesses with character and loyal customer bases.",
  QUEENS:
    "Queens is the most ethnically diverse urban area in the world, creating unparalleled business opportunities. From Flushing's bustling Asian markets to Astoria's legendary food scene, Queens offers affordable rents and thriving commercial corridors.",
  BRONX:
    "The Bronx is experiencing a renaissance of commercial development and small business growth. Emerging neighborhoods like Mott Haven and established corridors in Fordham offer lower rents, strong community ties, and untapped market potential.",
  STATEN_ISLAND:
    "Staten Island's suburban character creates a unique market for local service businesses. With less competition than other boroughs, loyal customer bases, and lower operating costs, it's an ideal market for owner-operators.",
};

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return [
    { borough: "manhattan" },
    { borough: "brooklyn" },
    { borough: "queens" },
    { borough: "bronx" },
    { borough: "staten-island" },
  ];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface BoroughPageProps {
  params: Promise<{ borough: string }>;
}

export async function generateMetadata({
  params,
}: BoroughPageProps): Promise<Metadata> {
  const { borough } = await params;
  const boroughValue = boroughSlugToValue(borough);
  if (!boroughValue) return {};

  const label = boroughValueToLabel(boroughValue);

  const count = await prisma.businessListing.count({
    where: { borough: boroughValue as never, status: "ACTIVE" },
  });

  const title = `Businesses for Sale in ${label} | MercatoList`;
  const description = `Browse ${count} businesses for sale in ${label}, New York City. Find restaurants, retail stores, service businesses and more on MercatoList.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://mercatolist.com/boroughs/${borough}`,
      type: "website",
    },
    alternates: {
      canonical: `https://mercatolist.com/boroughs/${borough}`,
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

export default async function BoroughPage({ params }: BoroughPageProps) {
  const { borough } = await params;
  const boroughValue = boroughSlugToValue(borough);

  if (!boroughValue) notFound();

  const label = boroughValueToLabel(boroughValue);
  const description = BOROUGH_DESCRIPTIONS[boroughValue] ?? "";

  // ---- Data fetching -------------------------------------------------------

  // Active listing count for this borough
  const activeCount = await prisma.businessListing.count({
    where: { borough: boroughValue as never, status: "ACTIVE" },
  });

  // Featured listings: top 8 by viewCount
  const featuredListingsRaw = await prisma.businessListing.findMany({
    where: { borough: boroughValue as never, status: "ACTIVE" },
    orderBy: { viewCount: "desc" },
    take: 8,
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

  const featuredListings = featuredListingsRaw.map(serializeListing);

  // Neighborhood listing counts
  const neighborhoods = NEIGHBORHOODS[boroughValue] ?? [];
  const neighborhoodCounts = await Promise.all(
    neighborhoods.map(async (name) => {
      const count = await prisma.businessListing.count({
        where: {
          borough: boroughValue as never,
          neighborhood: name,
          status: "ACTIVE",
        },
      });
      return { name, slug: slugify(name), count };
    })
  );

  // Category counts for this borough
  const categoryCountsRaw = await prisma.businessListing.groupBy({
    by: ["category"],
    where: { borough: boroughValue as never, status: "ACTIVE" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const categoryCounts = categoryCountsRaw.map((c) => ({
    category: c.category,
    slug: slugify(c.category),
    count: c._count.id,
  }));

  // Top 5 listings for JSON-LD
  const top5 = featuredListings.slice(0, 5);

  // ---- JSON-LD -------------------------------------------------------------

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Businesses for Sale in ${label}`,
    description: `Browse businesses for sale in ${label}, New York City on MercatoList.`,
    url: `https://mercatolist.com/boroughs/${borough}`,
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
            { label: "Boroughs", href: "/listings" },
            { label: label },
          ]}
        />

        {/* ----------------------------------------------------------------- */}
        {/* Hero Section                                                      */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 sm:px-10 sm:py-16 mb-12 overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00aDJ2Mmgt MnYtMnptLTQgNGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-teal-400" />
              <span className="text-sm font-medium text-teal-400 tracking-wide uppercase">
                {label}, New York City
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Businesses for Sale in {label}
            </h1>

            <p className="text-lg text-slate-300 mb-2">
              {activeCount} active listing{activeCount !== 1 ? "s" : ""} in{" "}
              {label}
            </p>

            <p className="text-base text-slate-400 leading-relaxed max-w-2xl mb-8">
              {description}
            </p>

            <Link href={`/listings?borough=${boroughValue}`}>
              <Button
                size="lg"
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold"
              >
                Search businesses in {label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Featured Listings                                                 */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Featured Listings in {label}
            </h2>
            {featuredListings.length > 0 && (
              <Link
                href={`/listings?borough=${boroughValue}`}
                className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {featuredListings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <Store className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">
                No active listings in {label} yet
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Check back soon or{" "}
                <Link
                  href="/listings"
                  className="text-teal-600 hover:underline"
                >
                  browse all listings
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Browse by Neighborhood                                            */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold tracking-tight">
              Browse by Neighborhood
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {neighborhoodCounts.map((n) => (
              <Link
                key={n.slug}
                href={`/neighborhoods/${n.slug}`}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-teal-500/40 hover:shadow-sm"
              >
                <span className="font-medium text-sm text-foreground group-hover:text-teal-600 transition-colors">
                  {n.name}
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs tabular-nums shrink-0"
                >
                  {n.count}
                </Badge>
              </Link>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Browse by Category                                                */}
        {/* ----------------------------------------------------------------- */}
        {categoryCounts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-bold tracking-tight">
                Browse by Category in {label}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categoryCounts.map((c) => (
                <Link
                  key={c.slug}
                  href={`/boroughs/${borough}/${c.slug}`}
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
        {/* CTA Section                                                       */}
        {/* ----------------------------------------------------------------- */}
        <section className="rounded-xl border border-border bg-muted/40 px-6 py-10 sm:px-10 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">
            List Your Business in {label}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Reach thousands of qualified buyers looking to purchase businesses in{" "}
            {label}. Create your listing in minutes.
          </p>
          <Link href="/my-listings/new">
            <Button
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold"
            >
              Create a Listing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Internal Links                                                    */}
        {/* ----------------------------------------------------------------- */}
        <InternalLinks currentBorough={borough} />
      </div>
    </>
  );
}
