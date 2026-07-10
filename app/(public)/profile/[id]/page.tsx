import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { applyAddressPrivacy } from "@/lib/address-privacy";
import { PublicProfile } from "@/components/profiles/PublicProfile";
import { notFound } from "next/navigation";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, displayName: true, bio: true },
  });

  if (!user) {
    return { title: "User Not Found" };
  }

  const name = user.displayName || user.name;
  return {
    title: `${name}`,
    description:
      user.bio || `View ${name}'s profile and business listings on MercatoList.`,
    openGraph: {
      title: `${name}`,
      description:
        user.bio ||
        `View ${name}'s profile and business listings on MercatoList.`,
    },
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      role: true,
      ownedBusiness: true,
      buyBox: true,
      createdAt: true,
      listings: {
        where: { isGhostListing: false },
        orderBy: { createdAt: "desc" },
        take: 12,
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
    },
  });

  if (!user) {
    notFound();
  }

  // Redact exact address / jitter coordinates on hideAddress listings before
  // they reach the public profile.
  const privListings = user.listings.map((l) => applyAddressPrivacy(l as any));
  const activeListings = privListings.filter((l) => l.status === "ACTIVE");
  const soldListings = privListings.filter((l) => l.status === "SOLD");
  const underContractListings = privListings.filter(
    (l) => l.status === "UNDER_CONTRACT"
  );

  const profileData = {
    id: user.id,
    name: user.displayName || user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    ownedBusiness: user.ownedBusiness,
    buyBox: user.buyBox as Record<string, unknown> | null,
    memberSince: user.createdAt.toISOString(),
    activeListings: activeListings.map((l) => ({
      ...l,
      askingPrice: Number(l.askingPrice),
      annualRevenue: l.annualRevenue ? Number(l.annualRevenue) : null,
      cashFlowSDE: l.cashFlowSDE ? Number(l.cashFlowSDE) : null,
      createdAt: l.createdAt.toISOString(),
    })),
    soldListings: soldListings.map((l) => ({
      ...l,
      askingPrice: Number(l.askingPrice),
      soldPrice: l.soldPrice ? Number(l.soldPrice) : null,
      soldDate: l.soldDate?.toISOString() || null,
      createdAt: l.createdAt.toISOString(),
    })),
    underContractListings: underContractListings.map((l) => ({
      ...l,
      askingPrice: Number(l.askingPrice),
      createdAt: l.createdAt.toISOString(),
    })),
  };

  const session = await auth();

  return (
    <div className="container mx-auto px-4 py-8">
      <PublicProfile
        profile={profileData}
        currentUserId={session?.user?.id || null}
      />
    </div>
  );
}
