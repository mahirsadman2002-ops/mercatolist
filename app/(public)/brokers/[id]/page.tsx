import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BrokerProfile } from "@/components/profiles/BrokerProfile";
import { notFound } from "next/navigation";

interface BrokerProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BrokerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const broker = await prisma.user.findUnique({
    where: { id, role: "BROKER" },
    select: {
      name: true,
      displayName: true,
      bio: true,
      brokerageName: true,
      receivedReviews: { select: { rating: true } },
    },
  });

  if (!broker) {
    return { title: "Advisor Not Found | MercatoList" };
  }

  const name = broker.displayName || broker.name;
  const avgRating =
    broker.receivedReviews.length > 0
      ? (
          broker.receivedReviews.reduce((s, r) => s + r.rating, 0) /
          broker.receivedReviews.length
        ).toFixed(1)
      : null;

  const description =
    broker.bio ||
    `${name}${broker.brokerageName ? ` of ${broker.brokerageName}` : ""} — NYC Business Advisor on MercatoList.${avgRating ? ` Rated ${avgRating}/5.` : ""}`;

  return {
    title: `${name} — NYC Business Advisor | MercatoList`,
    description,
    openGraph: {
      title: `${name} — NYC Business Advisor | MercatoList`,
      description,
    },
  };
}

export default async function BrokerProfilePage({
  params,
}: BrokerProfilePageProps) {
  const { id } = await params;
  const session = await auth();

  const broker = await prisma.user.findUnique({
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
    },
  });

  if (!broker) {
    notFound();
  }

  const reviews = broker.receivedReviews;
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

  const serializeListing = (l: (typeof broker.listings)[0]) => ({
    ...l,
    askingPrice: Number(l.askingPrice),
    annualRevenue: l.annualRevenue ? Number(l.annualRevenue) : null,
    cashFlowSDE: l.cashFlowSDE ? Number(l.cashFlowSDE) : null,
    soldPrice: l.soldPrice ? Number(l.soldPrice) : null,
    soldDate: l.soldDate?.toISOString() || null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  });

  const brokerData = {
    id: broker.id,
    name: broker.displayName || broker.name,
    bio: broker.bio,
    avatarUrl: broker.avatarUrl,
    phone: broker.phone,
    brokerageName: broker.brokerageName,
    brokerageWebsite: broker.brokerageWebsite,
    brokeragePhone: broker.brokeragePhone,
    instagramUrl: broker.instagramUrl,
    linkedinUrl: broker.linkedinUrl,
    twitterUrl: broker.twitterUrl,
    facebookUrl: broker.facebookUrl,
    tiktokUrl: broker.tiktokUrl,
    memberSince: broker.createdAt.toISOString(),
    stats: {
      totalListings: broker.listings.length,
      activeListings: broker.listings.filter((l) => l.status === "ACTIVE")
        .length,
      dealsClosed: broker.listings.filter((l) => l.status === "SOLD").length,
      reviewCount: reviews.length,
      avgRating,
    },
    ratingBreakdown,
    activeListings: broker.listings
      .filter((l) => l.status === "ACTIVE")
      .map(serializeListing),
    underContractListings: broker.listings
      .filter((l) => l.status === "UNDER_CONTRACT")
      .map(serializeListing),
    soldListings: broker.listings
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
    "@type": "RealEstateAgent",
    name: brokerData.name,
    description: broker.bio || undefined,
    image: broker.avatarUrl || undefined,
    telephone: broker.brokeragePhone || broker.phone || undefined,
    url: broker.brokerageWebsite || undefined,
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
      <BrokerProfile
        broker={brokerData}
        currentUserId={session?.user?.id || null}
      />
    </div>
  );
}
