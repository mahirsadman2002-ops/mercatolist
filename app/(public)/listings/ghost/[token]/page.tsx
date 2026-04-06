import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Copy, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, calculateDaysOnMarket } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PhotoGallery } from "@/components/listings/PhotoGallery";
import { FinancialInfo } from "@/components/listings/FinancialInfo";
import { BusinessDetails } from "@/components/listings/BusinessDetails";
import { ListingMap } from "@/components/listings/ListingMap";
import { ListingStatusBadge } from "@/components/listings/ListingStatusBadge";

interface GhostListingPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Private Listing | MercatoList",
  description: "View a private business listing shared with you.",
  robots: { index: false, follow: false },
};

export default async function GhostListingPage({ params }: GhostListingPageProps) {
  const { token } = await params;

  const listing = await prisma.businessListing.findFirst({
    where: { shareToken: token, isGhostListing: true },
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
    },
  });

  if (!listing) {
    notFound();
  }

  const daysOnMarket = calculateDaysOnMarket(listing.createdAt);
  const photos = listing.photos.map((p) => ({ id: p.id, url: p.url, order: p.order }));
  const listedByName = listing.listedBy.displayName || listing.listedBy.name;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Private listing banner */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
        <Lock className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            This is a private listing
          </p>
          <p className="text-sm text-amber-700">
            It is only visible to people with this link. It will not appear in search results or on the browse page.
          </p>
        </div>
      </div>

      {/* Photo gallery or map fallback */}
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} title={listing.title} />
      ) : (
        <div className="rounded-lg overflow-hidden mb-6">
          <ListingMap
            latitude={Number(listing.latitude)}
            longitude={Number(listing.longitude)}
            hideAddress={listing.hideAddress}
            address={listing.address}
            neighborhood={listing.neighborhood}
            borough={listing.borough}
          />
        </div>
      )}

      {/* Title & Quick Info */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <ListingStatusBadge status={listing.status} />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">{formatCurrency(Number(listing.askingPrice))}</Badge>
          {!listing.hideAddress && listing.address && (
            <Badge variant="outline">{listing.address}</Badge>
          )}
          <Badge variant="outline">{listing.neighborhood}, {listing.borough.split("_").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}</Badge>
          <Badge variant="outline">{listing.category}</Badge>
          <Badge variant="outline">{daysOnMarket} days on market</Badge>
        </div>
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>About This Business</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
        </CardContent>
      </Card>

      {/* Financials */}
      <div className="mb-6">
        <FinancialInfo listing={listing as any} />
      </div>

      {/* Business Details */}
      <div className="mb-6">
        <BusinessDetails listing={listing as any} />
      </div>

      {/* Listed By */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Listed By</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{listedByName}</p>
          {listing.listedBy.brokerageName && (
            <p className="text-sm text-muted-foreground">{listing.listedBy.brokerageName}</p>
          )}
          {listing.listedBy.email && (
            <a href={`mailto:${listing.listedBy.email}`} className="text-sm text-primary hover:underline block mt-1">
              {listing.listedBy.email}
            </a>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      {photos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Location</h2>
          <div className="rounded-lg overflow-hidden">
            <ListingMap
              latitude={Number(listing.latitude)}
              longitude={Number(listing.longitude)}
              hideAddress={listing.hideAddress}
              address={listing.address}
              neighborhood={listing.neighborhood}
              borough={listing.borough}
            />
          </div>
          {listing.hideAddress && (
            <p className="text-sm text-muted-foreground mt-2">
              Exact address is hidden. Contact the advisor for location details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
