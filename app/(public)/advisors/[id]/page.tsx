import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BrokerProfile } from "@/components/profiles/BrokerProfile";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface AdvisorProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdvisorProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const advisor = await prisma.user.findUnique({
    where: { id, role: "BROKER" },
    select: {
      name: true,
      displayName: true,
      bio: true,
      brokerageName: true,
      receivedReviews: { select: { rating: true } },
    },
  });

  if (!advisor) {
    return { title: "Advisor Not Found | MercatoList" };
  }

  const name = advisor.displayName || advisor.name;
  const avgRating =
    advisor.receivedReviews.length > 0
      ? (
          advisor.receivedReviews.reduce((s, r) => s + r.rating, 0) /
          advisor.receivedReviews.length
        ).toFixed(1)
      : null;

  const description =
    advisor.bio ||
    `${name}${advisor.brokerageName ? ` of ${advisor.brokerageName}` : ""} — NYC Business Advisor on MercatoList.${avgRating ? ` Rated ${avgRating}/5.` : ""}`;

  return {
    title: `${name} — NYC Business Advisor | MercatoList`,
    description,
    openGraph: {
      title: `${name} — NYC Business Advisor | MercatoList`,
      description,
    },
  };
}

export default async function AdvisorProfilePage({
  params,
}: AdvisorProfilePageProps) {
  const { id } = await params;
  const session = await auth();

  const advisor = await prisma.user.findUnique({
    where: { id, role: "BROKER" },
    select: {
      id: true,
      name: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      phone: true,
      brokerageName: true,
      brokerageWebsite: true,
      brokeragePhone: true,
      boroughsServed: true,
      specialties: true,
      instagramUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      facebookUrl: true,
      tiktokUrl: true,
      createdAt: true,
      listings: {
        where: { isGhostListing: false },
        orderBy: { createdAt: "desc" },
        include: {
          photos: { orderBy: { order: "asc" }, take: 1 },
          listedBy: {
            select: {
              id: true,
              name: true,
              displayName: true,
              role: true,
              brokerageName: true,
            },
          },
        },
      },
      receivedReviews: {
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      licenses: {
        where: { isVerified: true },
        orderBy: { createdAt: "desc" },
      },
      pastDeals: {
        orderBy: { dateSold: "desc" },
      },
    },
  });

  if (!advisor) {
    notFound();
  }

  const reviews = advisor.receivedReviews;
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));

  const serializeListing = (l: (typeof advisor.listings)[0]) => ({
    ...l,
    askingPrice: Number(l.askingPrice),
    annualRevenue: l.annualRevenue ? Number(l.annualRevenue) : null,
    cashFlowSDE: l.cashFlowSDE ? Number(l.cashFlowSDE) : null,
    soldPrice: l.soldPrice ? Number(l.soldPrice) : null,
    soldDate: l.soldDate?.toISOString() || null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  });

  // Past deals summary stats
  const pastDeals = advisor.pastDeals;
  const totalDealVolume = pastDeals.reduce(
    (sum, d) => sum + (d.salePrice ? Number(d.salePrice) : 0),
    0
  );
  const avgDealSize =
    pastDeals.length > 0 ? totalDealVolume / pastDeals.length : 0;

  const advisorData = {
    id: advisor.id,
    name: advisor.displayName || advisor.name,
    bio: advisor.bio,
    avatarUrl: advisor.avatarUrl,
    phone: advisor.phone,
    brokerageName: advisor.brokerageName,
    brokerageWebsite: advisor.brokerageWebsite,
    brokeragePhone: advisor.brokeragePhone,
    instagramUrl: advisor.instagramUrl,
    linkedinUrl: advisor.linkedinUrl,
    twitterUrl: advisor.twitterUrl,
    facebookUrl: advisor.facebookUrl,
    tiktokUrl: advisor.tiktokUrl,
    memberSince: advisor.createdAt.toISOString(),
    stats: {
      totalListings: advisor.listings.length,
      activeListings: advisor.listings.filter((l) => l.status === "ACTIVE")
        .length,
      dealsClosed: advisor.listings.filter((l) => l.status === "SOLD").length,
      reviewCount: reviews.length,
      avgRating,
    },
    ratingBreakdown,
    activeListings: advisor.listings
      .filter((l) => l.status === "ACTIVE")
      .map(serializeListing),
    underContractListings: advisor.listings
      .filter((l) => l.status === "UNDER_CONTRACT")
      .map(serializeListing),
    soldListings: advisor.listings
      .filter((l) => l.status === "SOLD")
      .map(serializeListing),
    reviews: reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: advisorData.name,
    description: advisor.bio || undefined,
    image: advisor.avatarUrl || undefined,
    telephone: advisor.brokeragePhone || advisor.phone || undefined,
    url: advisor.brokerageWebsite || undefined,
    areaServed: advisor.boroughsServed?.map((b) => ({
      "@type": "City",
      name: b.replace("_", " "),
    })),
    aggregateRating:
      reviews.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: reviews.length,
          }
        : undefined,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Boroughs served & specialties badges */}
      {(advisor.boroughsServed.length > 0 || advisor.specialties.length > 0) && (
        <div className="mb-6 space-y-3">
          {advisor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-1">
                Specialties:
              </span>
              {advisor.specialties.map((spec) => (
                <Badge key={spec} variant="secondary">
                  {spec}
                </Badge>
              ))}
            </div>
          )}
          {advisor.boroughsServed.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-1">
                Boroughs Served:
              </span>
              {advisor.boroughsServed.map((b) => (
                <Badge key={b} variant="outline">
                  {b.replace("_", " ")}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Licenses section */}
      {advisor.licenses.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <h3 className="text-sm font-semibold mb-3">Verified Licenses</h3>
          <div className="space-y-2">
            {advisor.licenses.map((license) => (
              <div
                key={license.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{license.name}</span>
                  {license.issuingAuthority && (
                    <span className="text-muted-foreground ml-1">
                      ({license.issuingAuthority})
                    </span>
                  )}
                </div>
                {license.licenseNumber && (
                  <span className="text-muted-foreground text-xs">
                    #{license.licenseNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past deals section */}
      {pastDeals.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <h3 className="text-sm font-semibold mb-3">Past Deals</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{pastDeals.length}</p>
              <p className="text-xs text-muted-foreground">Total Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                ${totalDealVolume >= 1000000
                  ? `${(totalDealVolume / 1000000).toFixed(1)}M`
                  : totalDealVolume >= 1000
                    ? `${(totalDealVolume / 1000).toFixed(0)}K`
                    : totalDealVolume.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                ${avgDealSize >= 1000000
                  ? `${(avgDealSize / 1000000).toFixed(1)}M`
                  : avgDealSize >= 1000
                    ? `${(avgDealSize / 1000).toFixed(0)}K`
                    : avgDealSize.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Avg Deal Size</p>
            </div>
          </div>
          <div className="space-y-2">
            {pastDeals.slice(0, 5).map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between text-sm border-t pt-2"
              >
                <div>
                  <span className="font-medium">{deal.businessName}</span>
                  {deal.category && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({deal.category})
                    </span>
                  )}
                </div>
                <div className="text-right text-muted-foreground text-xs">
                  {deal.salePrice && (
                    <span className="font-medium text-foreground mr-2">
                      ${Number(deal.salePrice).toLocaleString()}
                    </span>
                  )}
                  {deal.borough && (
                    <span>{deal.borough.replace("_", " ")}</span>
                  )}
                </div>
              </div>
            ))}
            {pastDeals.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{pastDeals.length - 5} more deals
              </p>
            )}
          </div>
        </div>
      )}

      <BrokerProfile
        broker={advisorData}
        currentUserId={session?.user?.id || null}
      />
    </div>
  );
}
