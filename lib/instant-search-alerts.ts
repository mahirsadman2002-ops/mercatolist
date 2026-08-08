import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import SavedSearchMatch from "@/emails/saved-search-match";

interface SearchCriteria {
  category?: string;
  borough?: string;
  neighborhood?: string;
  priceMin?: number;
  priceMax?: number;
  revenueMin?: number;
  revenueMax?: number;
  keyword?: string;
}

/**
 * Instant saved-search alerts: emails users whose saved search has
 * emailFrequency IMMEDIATELY the moment a matching listing goes live.
 *
 * Digest-frequency searches are untouched — the daily saved-search-match cron
 * covers those. After an instant send, the search's lastCheckedAt is bumped so
 * tomorrow's cron doesn't re-send the same listing.
 *
 * Never throws: alerting is best-effort and must not break listing creation.
 * Call via next/server after() so it runs post-response.
 */
export async function sendInstantSearchAlerts(listingId: string): Promise<void> {
  try {
    const listing = await prisma.businessListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        status: true,
        isGhostListing: true,
        title: true,
        slug: true,
        description: true,
        askingPrice: true,
        annualRevenue: true,
        category: true,
        neighborhood: true,
        borough: true,
        photos: { orderBy: { order: "asc" }, take: 1 },
      },
    });
    // Ghost listings are share-token-only and must never be broadcast.
    if (!listing || listing.status !== "ACTIVE" || listing.isGhostListing) return;

    const searches = await prisma.savedSearch.findMany({
      where: { isActive: true, emailFrequency: "IMMEDIATELY" },
      include: { user: { select: { name: true, email: true } } },
    });

    for (const search of searches) {
      const criteria = search.criteria as SearchCriteria;
      if (!matchesCriteria(listing, criteria)) continue;

      const searchName = search.name || buildSearchName(criteria);
      try {
        await sendEmail({
          to: search.user.email,
          subject: `New listing matches "${searchName}": ${listing.title}`,
          react: SavedSearchMatch({
            userName: search.user.name,
            searchName,
            matchCount: 1,
            listings: [
              {
                title: listing.title,
                slug: listing.slug,
                askingPrice: listing.askingPrice.toString(),
                category: listing.category,
                neighborhood: listing.neighborhood,
                borough: listing.borough,
                photoUrl: listing.photos[0]?.url || null,
              },
            ],
            viewAllUrl: `https://mercatolist.com/listings/${listing.slug}`,
          }),
        });
        // Prevent the daily cron from re-sending this same listing.
        await prisma.savedSearch.update({
          where: { id: search.id },
          data: { lastCheckedAt: new Date() },
        });
      } catch (err) {
        console.error(
          `[instant-search-alerts] failed to email ${search.user.email}:`,
          err
        );
      }
    }
  } catch (error) {
    console.error("[instant-search-alerts] error:", error);
  }
}

function matchesCriteria(
  listing: {
    title: string;
    description: string;
    category: string;
    neighborhood: string;
    borough: string;
    askingPrice: { toString(): string };
    annualRevenue: { toString(): string } | null;
  },
  c: SearchCriteria
): boolean {
  if (c.category && listing.category !== c.category) return false;
  if (c.borough && listing.borough !== c.borough) return false;
  if (c.neighborhood && listing.neighborhood !== c.neighborhood) return false;
  if (c.keyword) {
    const kw = c.keyword.toLowerCase();
    if (
      !listing.title.toLowerCase().includes(kw) &&
      !listing.description.toLowerCase().includes(kw)
    )
      return false;
  }
  const price = Number(listing.askingPrice.toString());
  if (c.priceMin && price < c.priceMin) return false;
  if (c.priceMax && price > c.priceMax) return false;
  if (c.revenueMin || c.revenueMax) {
    // Mirrors the cron's DB query: listings without revenue data can't
    // satisfy a revenue filter.
    if (listing.annualRevenue == null) return false;
    const revenue = Number(listing.annualRevenue.toString());
    if (c.revenueMin && revenue < c.revenueMin) return false;
    if (c.revenueMax && revenue > c.revenueMax) return false;
  }
  return true;
}

function buildSearchName(criteria: SearchCriteria): string {
  const parts: string[] = [];
  if (criteria.category) parts.push(criteria.category);
  if (criteria.borough) {
    const label =
      criteria.borough.charAt(0) +
      criteria.borough.slice(1).toLowerCase().replace("_", " ");
    parts.push(`in ${label}`);
  }
  if (criteria.neighborhood) parts.push(criteria.neighborhood);
  return parts.length > 0 ? parts.join(", ") : "All listings";
}
