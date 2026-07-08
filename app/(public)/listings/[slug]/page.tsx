import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Eye,
  MapPin,
  Clock,
  Tag,
  CalendarDays,
  Store,
  FolderOpen,
} from "lucide-react";

import { formatCurrency, calculateDaysOnMarket } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { applyAddressPrivacy, stripInternalListingFields } from "@/lib/address-privacy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { PhotoGallery } from "@/components/listings/PhotoGallery";
import { FinancialInfo } from "@/components/listings/FinancialInfo";
import { BusinessDetails } from "@/components/listings/BusinessDetails";
import { ListingMap } from "@/components/listings/ListingMap";
import { ListingContactSidebar } from "@/components/listings/ListingContactSidebar";
import { ListingStatusBadge } from "@/components/listings/ListingStatusBadge";
import { CollectionDiscoveryPopup } from "@/components/listings/CollectionDiscoveryPopup";
import { SuggestedListings } from "@/components/listings/SuggestedListings";
import { BrowseModeBanner } from "@/components/listings/BrowseModeBanner";


// Revalidate every 60 seconds so listing data stays fresh
// 5 minutes. Was 60s which gave us almost no edge caching — every request
// after a minute re-ran the listing fetch + SuggestedListings query against
// Neon. Listings change infrequently; 5 minutes is plenty fresh.
export const revalidate = 300;

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
// Helper: Look up listing from the database by slug
// FIX: Previously used mock data which caused fake IDs, wrong titles,
// and broken save/contact/inquiry flows. Now queries the real database.
// =============================================================================

const PUBLIC_LISTING_STATUSES = ["ACTIVE", "UNDER_CONTRACT", "SOLD"];

async function getListingBySlug(
  slug: string,
  token?: string | null,
  viewer?: { id?: string | null; role?: string | null } | null
): Promise<any | null> {
  const listing = await prisma.businessListing.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { order: "asc" } },
      listedBy: {
        select: {
          id: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          brokerageName: true,
          brokeragePhone: true,
          phone: true,
          email: true,
        },
      },
      coBrokers: {
        select: {
          id: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          brokerageName: true,
          phone: true,
        },
      },
    },
  });

  if (!listing) return null;

  const isOwner = !!viewer?.id && viewer.id === listing.listedById;
  const isPrivileged = isOwner || viewer?.role === "ADMIN";

  // DRAFT / OFF_MARKET listings are private previews — only the owner (or an
  // admin) may view them. Everyone else gets a 404.
  if (!isPrivileged && !PUBLIC_LISTING_STATUSES.includes(listing.status)) {
    return null;
  }

  // Ghost listing access check. A ghost with a missing/blank shareToken must
  // NOT be publicly viewable — only owner/admin can see it.
  if (listing.isGhostListing && !isPrivileged) {
    const validToken = !!listing.shareToken && token === listing.shareToken;
    if (!validToken) {
      return null;
    }
  }

  // Convert Decimal fields to numbers for client rendering
  const serialized = {
    ...listing,
    askingPrice: listing.askingPrice ? Number(listing.askingPrice) : null,
    annualRevenue: listing.annualRevenue ? Number(listing.annualRevenue) : null,
    cashFlowSDE: listing.cashFlowSDE ? Number(listing.cashFlowSDE) : null,
    netIncome: listing.netIncome ? Number(listing.netIncome) : null,
    profitMargin: listing.profitMargin ? Number(listing.profitMargin) : null,
    askingMultiple: listing.askingMultiple ? Number(listing.askingMultiple) : null,
    monthlyRent: listing.monthlyRent ? Number(listing.monthlyRent) : null,
    annualPayroll: listing.annualPayroll ? Number(listing.annualPayroll) : null,
    totalExpenses: listing.totalExpenses ? Number(listing.totalExpenses) : null,
    inventoryValue: listing.inventoryValue ? Number(listing.inventoryValue) : null,
    ffeValue: listing.ffeValue ? Number(listing.ffeValue) : null,
    soldPrice: listing.soldPrice ? Number(listing.soldPrice) : null,
    latitude: listing.latitude ? Number(listing.latitude) : 40.7128,
    longitude: listing.longitude ? Number(listing.longitude) : -74.006,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    photos: listing.photos.map((p) => ({
      id: p.id,
      url: p.url,
      thumbUrl: p.thumbUrl,
      cardUrl: p.cardUrl,
      fullUrl: p.fullUrl,
      order: p.order,
    })),
  };

  // Owners / admins see everything unredacted (so they can preview drafts and
  // verify their own contact details). For everyone else:
  //  - never expose the seller/broker email (contact goes through inquiries);
  //    prevents PII scraping at scale from the page's HTML/RSC payload
  //  - hide phone numbers unless the lister opted in via showPhoneNumber
  //  - apply address privacy when the lister set hideAddress
  if (isPrivileged) {
    return { ...serialized, isPreview: !PUBLIC_LISTING_STATUSES.includes(listing.status) };
  }

  const scrubbed: any = listing.hideAddress
    ? applyAddressPrivacy(serialized)
    : stripInternalListingFields(serialized as Record<string, unknown>);

  if (scrubbed.listedBy) {
    scrubbed.listedBy = {
      ...scrubbed.listedBy,
      email: "",
      phone: listing.showPhoneNumber ? scrubbed.listedBy.phone : null,
      brokeragePhone: listing.showPhoneNumber
        ? scrubbed.listedBy.brokeragePhone
        : null,
    };
  }
  if (!listing.showPhoneNumber && Array.isArray(scrubbed.coBrokers)) {
    scrubbed.coBrokers = scrubbed.coBrokers.map((cb: any) => ({
      ...cb,
      phone: null,
    }));
  }

  return scrubbed;
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
  const priceStr = listing.askingPrice ? formatCurrency(listing.askingPrice) : "Price TBD";

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

  // telephone — only expose when the seller has opted in to showing it
  // publicly. Brokers' brokeragePhone is preferred over personal phone.
  if (listing.showPhoneNumber) {
    const phone =
      listing.listedBy?.brokeragePhone || listing.listedBy?.phone || null;
    if (phone) jsonLd.telephone = phone;
  }

  // priceRange — Google's recommended $-tier glyph derived from asking price.
  // Tiers roughly track NYC small-business deal-size buckets.
  const price = typeof listing.askingPrice === "number" ? listing.askingPrice : null;
  if (price != null) {
    jsonLd.priceRange =
      price < 250_000
        ? "$"
        : price < 1_000_000
          ? "$$"
          : price < 5_000_000
            ? "$$$"
            : "$$$$";
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

// BreadcrumbList tells crawlers + AI agents the hierarchical path from the
// root to this listing — Home > [Borough] > [Category] > [Listing].
function generateBreadcrumbJsonLd(listing: any) {
  const borough = formatBoroughDisplay(listing.borough);
  const boroughSlug = listing.borough.toLowerCase().replace(/_/g, "-");
  const categorySlug = listing.category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://mercatolist.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${borough}, NYC`,
        item: `https://mercatolist.com/boroughs/${boroughSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${listing.category} in ${borough}`,
        item: `https://mercatolist.com/boroughs/${boroughSlug}/${categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: listing.title,
        item: `https://mercatolist.com/listings/${listing.slug}`,
      },
    ],
  };
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

  // Collection context from URL params
  const collectionId = typeof sp.collectionId === "string" ? sp.collectionId : undefined;
  const position = typeof sp.position === "string" ? parseInt(sp.position, 10) : undefined;
  const total = typeof sp.total === "string" ? parseInt(sp.total, 10) : undefined;

  let listing;
  let session;
  try {
    // Resolve the viewer first so listing lookup can gate drafts / scrub PII.
    session = await auth().catch(() => null);
    listing = await getListingBySlug(slug, token, session?.user);
  } catch (error) {
    console.error("Error loading listing:", error);
    notFound();
  }

  if (!listing) {
    notFound();
  }

  // Fetch collection name and neighboring listings for navigation
  let collectionName: string | null = null;
  let prevSlug: string | null = null;
  let nextSlug: string | null = null;
  if (collectionId) {
    try {
      const col = await prisma.collection.findUnique({
        where: { id: collectionId },
        select: {
          name: true,
          collectionListings: {
            select: {
              listing: {
                select: { slug: true },
              },
            },
            orderBy: { addedAt: "desc" },
          },
        },
      });
      if (col) {
        collectionName = col.name;
        // Build prev/next navigation
        if (position && total) {
          const slugs = col.collectionListings.map((cl) => cl.listing.slug);
          const currentIndex = position - 1;
          if (currentIndex > 0) {
            prevSlug = slugs[currentIndex - 1] ?? null;
          }
          if (currentIndex < slugs.length - 1) {
            nextSlug = slugs[currentIndex + 1] ?? null;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching collection context:", error);
    }
  }

  const isLoggedIn = !!session?.user;
  const borough = formatBoroughDisplay(listing.borough);
  const daysOnMarket = calculateDaysOnMarket(new Date(listing.createdAt));
  const jsonLd = generateJsonLd(listing);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(listing);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, String.fromCharCode(92) + "u003c") }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, String.fromCharCode(92) + "u003c") }}
        suppressHydrationWarning
      />

      {/* View Count Incrementer — never count the owner's own preview views */}
      {!listing.isPreview && <ViewCountIncrementerScript listingId={listing.id} />}

      {/* Browse-mode banner — only renders when ?addToCollection=X is present */}
      <BrowseModeBanner listingId={listing.id} listingSlug={slug} />

      <div className="min-h-screen bg-background">
        {/* Preview banner — owner/admin viewing a not-yet-live listing */}
        {listing.isPreview && (
          <div className="bg-slate-900 text-white">
            <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm min-w-0">
                <Eye className="h-4 w-4 shrink-0" />
                <span className="font-medium">
                  Preview — this listing isn&apos;t live yet.
                </span>
                <span className="text-white/70 hidden sm:inline">
                  Only you can see this page. Publish it from My Listings to go live.
                </span>
              </div>
              <Link
                href={`/my-listings/${listing.id}/edit`}
                className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-white/90"
              >
                Edit listing
              </Link>
            </div>
          </div>
        )}
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
            Collection Context Bar
        ================================================================ */}
        {collectionId && collectionName && (
          <div className="bg-amber-400 text-amber-950">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
              {/* Left: Collection name */}
              <div className="flex items-center gap-2.5 text-sm min-w-0">
                <FolderOpen className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">
                  Viewing from:{" "}
                  <span className="font-bold">{collectionName}</span>
                </span>
              </div>

              {/* Center: Navigation arrows with position */}
              {position && total && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {prevSlug ? (
                    <Link
                      href={`/listings/${prevSlug}?collectionId=${collectionId}&position=${position - 1}&total=${total}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-amber-600 bg-amber-500/50 text-amber-950 hover:bg-amber-500 transition-colors"
                      title="Previous listing"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-amber-500/40 text-amber-700 opacity-50 cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" />
                    </span>
                  )}
                  <span className="px-2 text-sm font-semibold whitespace-nowrap">
                    Listing {position} of {total}
                  </span>
                  {nextSlug ? (
                    <Link
                      href={`/listings/${nextSlug}?collectionId=${collectionId}&position=${position + 1}&total=${total}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-amber-600 bg-amber-500/50 text-amber-950 hover:bg-amber-500 transition-colors"
                      title="Next listing"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-amber-500/40 text-amber-700 opacity-50 cursor-not-allowed">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              )}

              {/* Right: Back button */}
              <div className="shrink-0">
                <Link
                  href={`/collections/${collectionId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md border border-amber-600 bg-amber-500/50 hover:bg-amber-500 transition-colors"
                >
                  Back to Collection
                </Link>
              </div>
            </div>
          </div>
        )}

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
              hideAddress={listing.hideAddress}
              address={listing.hideAddress ? undefined : listing.address}
              neighborhood={listing.neighborhood}
              borough={listing.borough}
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
                  {listing.listingNumber != null && (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                      ML-{listing.listingNumber}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-teal" />
                    <span className="font-semibold text-foreground">
                      {listing.askingPrice ? formatCurrency(listing.askingPrice) : "Price TBD"}
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

              {/* ---- Location (desktop only — on mobile this renders after the sidebar) ---- */}
              <section aria-labelledby="location-heading" className="hidden lg:block">
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
                <ListingContactSidebar listing={listing} collectionId={collectionId} />
              </div>
            </aside>
          </div>

          {/* Mobile-only: Location section rendered below the sidebar */}
          <section
            aria-labelledby="location-heading-mobile"
            className="lg:hidden mt-8"
          >
            <h2
              id="location-heading-mobile"
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
      </div>

      {/* Suggested listings — bottom of every detail page */}
      <SuggestedListings
        currentListingId={listing.id}
        category={listing.category}
        borough={listing.borough}
        neighborhood={listing.neighborhood}
      />

      {/* Collection Discovery Popup */}
      <CollectionDiscoveryPopup
        isLoggedIn={isLoggedIn}
        hasCollections={false}
        listingSlug={slug}
      />
    </>
  );
}
