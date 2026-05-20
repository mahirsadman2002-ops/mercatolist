import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listings/ListingCard";

interface SuggestedListingsProps {
  currentListingId: string;
  category: string;
  borough: string;
  neighborhood: string;
  /** Soft cap on how many to surface. */
  limit?: number;
}

interface SuggestedListing {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  askingPrice: number;
  annualRevenue: number | null;
  cashFlowSDE: number | null;
  neighborhood: string;
  borough: string;
  createdAt: string;
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
}

/**
 * Server component that surfaces other listings a viewer might also be interested in.
 *
 * Ranking, in order:
 *   1. Same category, same neighborhood
 *   2. Same category, same borough
 *   3. Any category, same neighborhood
 *   4. Any category, same borough
 *   5. Most recent active listings (fallback)
 *
 * Pads up to `limit` without duplicates, only includes ACTIVE listings, excludes the
 * current listing. Renders as a horizontal carousel on mobile, 3-up grid on desktop.
 */
export async function SuggestedListings({
  currentListingId,
  category,
  borough,
  neighborhood,
  limit = 12,
}: SuggestedListingsProps) {
  const seen = new Set<string>([currentListingId]);
  const results: SuggestedListing[] = [];

  const baseSelect = {
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
    photos: { orderBy: { order: "asc" as const }, take: 1 },
    listedBy: {
      select: {
        name: true,
        displayName: true,
        role: true,
        brokerageName: true,
      },
    },
  };

  type Row = {
    id: string;
    slug: string;
    title: string;
    category: string;
    status: string;
    askingPrice: { toString(): string } | number;
    annualRevenue: { toString(): string } | number | null;
    cashFlowSDE: { toString(): string } | number | null;
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
  };

  const serialize = (l: Row): SuggestedListing => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    category: l.category,
    status: l.status,
    askingPrice: Number(l.askingPrice),
    annualRevenue: l.annualRevenue ? Number(l.annualRevenue) : null,
    cashFlowSDE: l.cashFlowSDE ? Number(l.cashFlowSDE) : null,
    neighborhood: l.neighborhood,
    borough: l.borough,
    createdAt: l.createdAt.toISOString(),
    viewCount: l.viewCount,
    saveCount: l.saveCount,
    isGhostListing: l.isGhostListing,
    photos: l.photos,
    listedBy: l.listedBy,
  });

  const pullBatch = async (
    where: Record<string, unknown>,
    take: number,
  ) => {
    if (results.length >= limit || take <= 0) return;
    const batch = await prisma.businessListing.findMany({
      where: {
        ...where,
        status: "ACTIVE",
        isGhostListing: false,
        id: { notIn: Array.from(seen) },
      },
      orderBy: { createdAt: "desc" },
      take,
      select: baseSelect,
    });
    for (const item of batch) {
      if (results.length >= limit) break;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      results.push(serialize(item));
    }
  };

  // 1. Same category + same neighborhood
  await pullBatch({ category, neighborhood }, limit);

  // 2. Same category + same borough (different neighborhood)
  if (results.length < limit) {
    await pullBatch(
      {
        category,
        borough,
        neighborhood: { not: neighborhood },
      },
      limit - results.length,
    );
  }

  // 3. Any category + same neighborhood
  if (results.length < limit) {
    await pullBatch(
      {
        neighborhood,
        category: { not: category },
      },
      limit - results.length,
    );
  }

  // 4. Any category + same borough
  if (results.length < limit) {
    await pullBatch(
      {
        borough,
        category: { not: category },
        neighborhood: { not: neighborhood },
      },
      limit - results.length,
    );
  }

  // 5. Fallback: most recent active anywhere
  if (results.length < limit) {
    await pullBatch({}, limit - results.length);
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="suggested-listings-heading"
      className="container mx-auto px-4 py-10 border-t mt-10"
    >
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2
            id="suggested-listings-heading"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            You might also like
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Similar listings in {neighborhood} and nearby.
          </p>
        </div>
      </div>

      {/* Mobile: horizontal scroll carousel */}
      <div className="md:hidden -mx-4 overflow-x-auto snap-x snap-mandatory">
        <div className="flex gap-4 px-4 pb-2">
          {results.map((listing) => (
            <div
              key={listing.id}
              className="w-[78vw] max-w-[320px] shrink-0 snap-start"
            >
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: 3-up grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.slice(0, 9).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
