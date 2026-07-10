import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { applyAddressPrivacyToList } from "@/lib/address-privacy";
import ListingsClient from "./ListingsClient";

// Server wrapper for the browse page. The page itself is interactive (filters,
// map, pagination — all client-side, unchanged), but we render the FIRST page
// of default results on the server so the initial HTML contains real listings:
// crawlers index actual content instead of a skeleton, and visitors see cards
// immediately. Filtered/paginated views (any query param) skip the server
// query and fetch client-side exactly as before, so cost stays flat — the one
// DB round-trip just moves from /api/listings into this render.

export const metadata: Metadata = {
  title: "Businesses for Sale in NYC — Browse All Listings",
  description:
    "Browse businesses for sale across New York City — restaurants, retail, laundromats, salons, services and more in Manhattan, Brooklyn, Queens, the Bronx, and Staten Island.",
  alternates: {
    canonical: "https://mercatolist.com/listings",
  },
  openGraph: {
    title: "Businesses for Sale in NYC — Browse All Listings | MercatoList",
    description:
      "Browse businesses for sale across all five NYC boroughs. Restaurants, retail, services and more.",
    url: "https://mercatolist.com/listings",
  },
};

const DEFAULT_LIMIT = 20;

async function getDefaultFirstPage() {
  try {
    const [listings, total] = await Promise.all([
      prisma.businessListing.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: DEFAULT_LIMIT,
        include: {
          photos: { orderBy: { order: "asc" }, take: 1 },
          listedBy: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
              role: true,
              brokerageName: true,
            },
          },
        },
      }),
      prisma.businessListing.count({ where: { status: "ACTIVE" } }),
    ]);

    const sanitized = applyAddressPrivacyToList(listings as any[]);
    // Match the API's wire format exactly (Decimal→string, Date→ISO) so the
    // client component can't tell the difference.
    const serialized = JSON.parse(JSON.stringify(sanitized));

    return {
      initialListings: serialized,
      initialPagination: {
        page: 1,
        limit: DEFAULT_LIMIT,
        total,
        totalPages: Math.ceil(total / DEFAULT_LIMIT),
      },
    };
  } catch (e) {
    // Never let a DB hiccup break the page — the client falls back to
    // fetching from /api/listings as it always did.
    console.error("[listings] server-side first page failed:", e);
    return { initialListings: null, initialPagination: null };
  }
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Only pre-fetch for the default view. Any query param (filters, sort, page,
  // view mode, addToCollection) means the client will fetch its own results.
  const isDefaultView = Object.keys(params).length === 0;
  const { initialListings, initialPagination } = isDefaultView
    ? await getDefaultFirstPage()
    : { initialListings: null, initialPagination: null };

  return (
    <ListingsClient
      initialListings={initialListings}
      initialPagination={initialPagination}
    />
  );
}
