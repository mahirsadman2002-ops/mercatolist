import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Clock,
  Tag,
  CalendarDays,
  Store,
} from "lucide-react";

import { formatCurrency, calculateDaysOnMarket } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { PhotoGallery } from "@/components/listings/PhotoGallery";
import { FinancialInfo } from "@/components/listings/FinancialInfo";
import { BusinessDetails } from "@/components/listings/BusinessDetails";
import { ListingMap } from "@/components/listings/ListingMap";
import { ListingContactSidebar } from "@/components/listings/ListingContactSidebar";
import { ListingStatusBadge } from "@/components/listings/ListingStatusBadge";

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_LISTINGS: Record<string, any> = {
  "joes-pizza-astoria": {
    id: "1",
    slug: "joes-pizza-astoria",
    status: "ACTIVE",
    isGhostListing: false,
    shareToken: null,
    title: "Joe's Pizza -- Established Neighborhood Pizzeria",
    description:
      "Well-established neighborhood pizzeria in the heart of Astoria, Queens. This beloved local institution has been serving authentic New York-style pizza for over 15 years. Located on a high-traffic corner with excellent visibility and foot traffic. The restaurant features a fully equipped commercial kitchen, a spacious dining area seating 45, and a popular takeout/delivery operation. The business has built a loyal customer base and maintains strong relationships with local delivery platforms. Current owner is relocating and willing to provide comprehensive training and transition support.",
    category: "Restaurants",
    askingPrice: 450000,
    annualRevenue: 850000,
    cashFlowSDE: 180000,
    netIncome: 145000,
    profitMargin: 17.06,
    askingMultiple: 2.5,
    monthlyRent: 8500,
    rentEscalation: "3% annually",
    annualPayroll: 220000,
    totalExpenses: 705000,
    inventoryValue: 15000,
    inventoryIncluded: true,
    ffeValue: 120000,
    ffeIncluded: true,
    sellerFinancing: true,
    sbaFinancingAvailable: true,
    yearEstablished: 2010,
    numberOfEmployees: 12,
    employeesWillingToStay: true,
    ownerInvolvement: "OWNER_OPERATED",
    ownerHoursPerWeek: 45,
    squareFootage: 2200,
    leaseTerms: "7 years remaining",
    leaseRenewalOption: true,
    reasonForSelling: "Owner relocating out of state",
    licensesPermits:
      "NYC Food Service License, Health Department Certificate, Liquor License (Beer & Wine)",
    trainingSupport: "4 weeks of hands-on training included",
    address: "30-12 Steinway Street",
    hideAddress: false,
    neighborhood: "Astoria",
    borough: "QUEENS",
    city: "New York",
    state: "NY",
    zipCode: "11103",
    latitude: 40.7592,
    longitude: -73.9196,
    showPhoneNumber: true,
    viewCount: 342,
    saveCount: 28,
    shareCount: 5,
    photos: [] as { id: string; url: string; order: number }[],
    createdAt: "2026-01-15T00:00:00Z",
    listedBy: {
      id: "u1",
      name: "Michael Torres",
      displayName: null,
      avatarUrl: null,
      role: "BROKER",
      brokerageName: "NYC Business Sales",
      brokeragePhone: "(212) 555-0101",
      phone: "(212) 555-0102",
      email: "michael@nycbizsales.com",
    },
    coBrokers: [],
  },
};

// Default fallback listing for unknown slugs (used during development)
const DEFAULT_MOCK_LISTING = MOCK_LISTINGS["joes-pizza-astoria"];

// =============================================================================
// View Count Incrementer (Client Component)
// =============================================================================

function ViewCountIncrementerScript({ listingId }: { listingId: string }) {
  // We use a small inline script approach to fire the view count POST
  // without needing a full client component boundary around the page.
  // This keeps the page fully server-rendered while still incrementing views.
  const script = `
    (function() {
      if (typeof window === 'undefined') return;
      var key = 'mercatolist_viewed_' + ${JSON.stringify(listingId)};
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      fetch('/api/listings/' + ${JSON.stringify(listingId)} + '/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(function() {});
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}

// =============================================================================
// Helper: Look up listing from mock data
// =============================================================================

async function getListingBySlug(
  slug: string,
  token?: string | null
): Promise<any | null> {
  // In production, this would fetch from the database via Prisma.
  // For now, use mock data.
  const listing = MOCK_LISTINGS[slug] ?? null;

  if (!listing) {
    // Fall back to default mock listing for any unknown slug during development
    // Format slug into a readable title: "joes-pizza-astoria" → "Joes Pizza Astoria"
    const formattedTitle = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return { ...DEFAULT_MOCK_LISTING, slug, title: formattedTitle };
  }

  // Ghost listing access check
  if (listing.isGhostListing && listing.shareToken) {
    if (token !== listing.shareToken) {
      return null;
    }
  }

  return listing;
}

// =============================================================================
// Helper: Format borough name for display
// =============================================================================

function formatBoroughDisplay(borough: string): string {
  return borough
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// =============================================================================
// generateMetadata — Dynamic SEO metadata
// =============================================================================

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;
  const listing = await getListingBySlug(slug, token);

  if (!listing) {
    return {
      title: "Listing Not Found | MercatoList",
      description: "This listing could not be found or is no longer available.",
    };
  }

  const borough = formatBoroughDisplay(listing.borough);
  const title = `${listing.title} | ${listing.neighborhood}, ${borough} | MercatoList`;
  const description =
    listing.description.length > 160
      ? listing.description.slice(0, 157) + "..."
      : listing.description;
  const priceStr = formatCurrency(listing.askingPrice);

  return {
    title,
    description: `${priceStr} — ${description}`,
    openGraph: {
      title,
      description: `${priceStr} — ${description}`,
      type: "website",
      url: `https://mercatolist.com/listings/${slug}`,
      siteName: "MercatoList",
      images:
        listing.photos.length > 0 && listing.photos[0].url
          ? [
              {
                url: listing.photos[0].url,
                width: 1200,
                height: 630,
                alt: listing.title,
              },
            ]
          : [
              {
                url: "/og-default.jpg",
                width: 1200,
                height: 630,
                alt: "MercatoList — NYC Business Marketplace",
              },
            ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `${priceStr} — ${description}`,
    },
    alternates: {
      canonical: `https://mercatolist.com/listings/${slug}`,
    },
    robots: listing.isGhostListing
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

// =============================================================================
// JSON-LD Structured Data
// =============================================================================

function generateJsonLd(listing: any) {
  const borough = formatBoroughDisplay(listing.borough);

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.title,
    description: listing.description,
    url: `https://mercatolist.com/listings/${listing.slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.hideAddress ? undefined : listing.address,
      addressLocality: listing.neighborhood,
      addressRegion: listing.state,
      postalCode: listing.zipCode,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
    areaServed: {
      "@type": "City",
      name: `${borough}, New York City`,
    },
  };

  if (listing.photos.length > 0 && listing.photos[0].url) {
    jsonLd.image = listing.photos.map(
      (p: { url: string }) => p.url
    );
  }

  if (listing.yearEstablished) {
    jsonLd.foundingDate = String(listing.yearEstablished);
  }

  if (listing.numberOfEmployees) {
    jsonLd.numberOfEmployees = {
      "@type": "QuantitativeValue",
      value: listing.numberOfEmployees,
    };
  }

  // Offer for asking price
  jsonLd.makesOffer = {
    "@type": "Offer",
    price: listing.askingPrice,
    priceCurrency: "USD",
    availability:
      listing.status === "ACTIVE"
        ? "https://schema.org/InStock"
        : listing.status === "SOLD"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/LimitedAvailability",
  };

  return jsonLd;
}

// =============================================================================
// Page Component
// =============================================================================

export default async function ListingDetailPage({
  params,
  searchParams,
}: ListingDetailPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;

  const listing = await getListingBySlug(slug, token);

  if (!listing) {
    notFound();
  }

  const borough = formatBoroughDisplay(listing.borough);
  const daysOnMarket = calculateDaysOnMarket(new Date(listing.createdAt));
  const jsonLd = generateJsonLd(listing);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        suppressHydrationWarning
      />

      {/* View Count Incrementer */}
      <ViewCountIncrementerScript listingId={listing.id} />

      <div className="min-h-screen bg-background">
        {/* ================================================================
            Breadcrumb Navigation
        ================================================================ */}
        <div className="border-b border-border/40 bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <Link
                href="/"
                className="transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                href="/listings"
                className="transition-colors hover:text-foreground"
              >
                Listings
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                href={`/categories/${encodeURIComponent(listing.category.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-"))}`}
                className="transition-colors hover:text-foreground"
              >
                {listing.category}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-medium text-foreground">
                {listing.title}
              </span>
            </nav>
          </div>
        </div>

        {/* ================================================================
            Photo Gallery / Map Hero (full width, above fold)
        ================================================================ */}
        <div className="container mx-auto px-4 pt-6">
          {listing.photos && listing.photos.length > 0 ? (
            <PhotoGallery
              photos={listing.photos}
              title={listing.title}
              latitude={listing.latitude}
              longitude={listing.longitude}
            />
          ) : (
            <div className="h-[400px] w-full overflow-hidden rounded-xl">
              <ListingMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                hideAddress={listing.hideAddress}
                address={listing.hideAddress ? undefined : listing.address}
                neighborhood={listing.neighborhood}
                borough={listing.borough}
              />
            </div>
          )}
        </div>

        {/* ================================================================
            Two-Column Layout: Content + Sidebar
        ================================================================ */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            {/* ==============================================================
                Left Column (Content — 2/3 width)
            ============================================================== */}
            <div className="min-w-0 flex-1 lg:max-w-[calc(66.666%-1.25rem)]">
              {/* ---- Title & Status Header ---- */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-start gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {listing.title}
                  </h1>
                  <div className="mt-1 shrink-0 sm:mt-2">
                    <ListingStatusBadge status={listing.status} />
                  </div>
                </div>

                {/* Quick info badges */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-teal" />
                    <span className="font-semibold text-foreground">
                      {formatCurrency(listing.askingPrice)}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {listing.neighborhood}, {borough}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <Store className="h-4 w-4" />
                    <span>{listing.category}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      {daysOnMarket} {daysOnMarket === 1 ? "day" : "days"} on
                      market
                    </span>
                  </div>
                  {listing.yearEstablished && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        <span>Est. {listing.yearEstablished}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* ---- Description ---- */}
              <section aria-labelledby="description-heading">
                <h2
                  id="description-heading"
                  className="mb-4 text-lg font-semibold tracking-tight"
                >
                  About This Business
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                  {listing.description.split("\n").map(
                    (paragraph: string, index: number) =>
                      paragraph.trim() ? (
                        <p key={index} className="mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ) : null
                  )}
                </div>

                {/* Highlight tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {listing.sellerFinancing && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                    >
                      Seller Financing Available
                    </Badge>
                  )}
                  {listing.sbaFinancingAvailable && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                    >
                      SBA Pre-Qualified
                    </Badge>
                  )}
                  {listing.inventoryIncluded && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800"
                    >
                      Inventory Included
                    </Badge>
                  )}
                  {listing.ffeIncluded && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                    >
                      FF&E Included
                    </Badge>
                  )}
                  {listing.employeesWillingToStay && (
                    <Badge
                      variant="outline"
                      className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800"
                    >
                      Staff Willing to Stay
                    </Badge>
                  )}
                  {listing.trainingSupport && (
                    <Badge
                      variant="outline"
                      className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800"
                    >
                      Training Included
                    </Badge>
                  )}
                </div>
              </section>

              <Separator className="my-8" />

              {/* ---- Financial Information ---- */}
              <section aria-labelledby="financial-heading">
                <FinancialInfo listing={listing} />
              </section>

              <div className="my-8" />

              {/* ---- Business Details ---- */}
              <section aria-labelledby="business-details-heading">
                <BusinessDetails listing={listing} />
              </section>

              <div className="my-8" />

              {/* ---- Location ---- */}
              <section aria-labelledby="location-heading">
                <h2
                  id="location-heading"
                  className="mb-4 text-lg font-semibold tracking-tight"
                >
                  Location
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {listing.hideAddress
                    ? `Located in ${listing.neighborhood}, ${borough}. Exact address provided upon inquiry.`
                    : `${listing.address}, ${listing.neighborhood}, ${borough}, ${listing.city}, ${listing.state} ${listing.zipCode}`}
                </p>
                <ListingMap
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  hideAddress={listing.hideAddress}
                  address={listing.hideAddress ? undefined : listing.address}
                  neighborhood={listing.neighborhood}
                  borough={listing.borough}
                />
              </section>
            </div>

            {/* ==============================================================
                Right Column (Sidebar — 1/3 width)
            ============================================================== */}
            <aside className="w-full shrink-0 lg:w-[380px]">
              <div className="lg:sticky lg:top-24">
                <ListingContactSidebar listing={listing} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
