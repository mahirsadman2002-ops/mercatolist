import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
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

// POST: Check for new listings matching saved searches
// Runs on the configured frequency (daily/weekly) and emails users about new matches.
async function handler(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;

  try {
    // Get all active saved searches that are due for checking
    const searches = await prisma.savedSearch.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    let emailsSent = 0;
    let searchesProcessed = 0;

    for (const search of searches) {
      // Check frequency: skip weekly searches that were checked less than 7 days ago
      if (search.lastCheckedAt) {
        // Compared in hours with some slack: the cron doesn't fire at the
        // exact same second each day, and a whole-day floor made a DAILY
        // search skip a day whenever today's run was slightly early.
        const hoursSinceCheck =
          (Date.now() - search.lastCheckedAt.getTime()) / (1000 * 60 * 60);
        if (search.checkFrequency === "WEEKLY" && hoursSinceCheck < 6.5 * 24) continue;
        if (search.checkFrequency === "DAILY" && hoursSinceCheck < 23) continue;
      }

      // Criteria are user-supplied JSON. Coerce every value to the type the
      // query expects so one malformed saved search can't throw inside Prisma
      // and abort the run for everyone after it.
      const raw = (search.criteria ?? {}) as Record<string, unknown>;
      const str = (v: unknown) =>
        typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined;
      const num = (v: unknown) => {
        const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
        return Number.isFinite(n) && n >= 0 ? n : undefined;
      };
      const BOROUGHS = ["MANHATTAN", "BROOKLYN", "QUEENS", "BRONX", "STATEN_ISLAND"];
      const rawBorough = str(raw.borough);
      // A borough that isn't a real one can never match a listing.
      if (rawBorough && !BOROUGHS.includes(rawBorough)) continue;
      const criteria = {
        ...(raw as SearchCriteria),
        category: str(raw.category),
        borough: rawBorough,
        neighborhood: str(raw.neighborhood),
        keyword: str(raw.keyword),
        priceMin: num(raw.priceMin),
        priceMax: num(raw.priceMax),
        revenueMin: num(raw.revenueMin),
        revenueMax: num(raw.revenueMax),
      } as SearchCriteria;
      const sinceDate = search.lastCheckedAt || search.createdAt;

      // Build Prisma where clause from criteria
      const where: Record<string, unknown> = {
        status: "ACTIVE",
        isGhostListing: false,
        createdAt: { gt: sinceDate },
      };

      if (criteria.category) where.category = criteria.category;
      if (criteria.borough) where.borough = criteria.borough;
      if (criteria.neighborhood) where.neighborhood = criteria.neighborhood;
      if (criteria.keyword) {
        where.OR = [
          { title: { contains: criteria.keyword, mode: "insensitive" } },
          { description: { contains: criteria.keyword, mode: "insensitive" } },
        ];
      }
      if (criteria.priceMin || criteria.priceMax) {
        where.askingPrice = {};
        if (criteria.priceMin)
          (where.askingPrice as Record<string, unknown>).gte = criteria.priceMin;
        if (criteria.priceMax)
          (where.askingPrice as Record<string, unknown>).lte = criteria.priceMax;
      }
      if (criteria.revenueMin || criteria.revenueMax) {
        where.annualRevenue = {};
        if (criteria.revenueMin)
          (where.annualRevenue as Record<string, unknown>).gte = criteria.revenueMin;
        if (criteria.revenueMax)
          (where.annualRevenue as Record<string, unknown>).lte = criteria.revenueMax;
      }

      // Find matching listings
      const matchingListings = await prisma.businessListing.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          askingPrice: true,
          category: true,
          neighborhood: true,
          borough: true,
          photos: {
            orderBy: { order: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Update lastCheckedAt regardless of matches
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastCheckedAt: new Date() },
      });

      searchesProcessed++;

      // Send email if there are matches
      if (matchingListings.length > 0) {
        const searchName =
          search.name || buildSearchName(criteria);

        // Build view-all URL from criteria
        const params = new URLSearchParams();
        if (criteria.category) params.set("category", criteria.category);
        if (criteria.borough) params.set("borough", criteria.borough);
        if (criteria.priceMin) params.set("priceMin", String(criteria.priceMin));
        if (criteria.priceMax) params.set("priceMax", String(criteria.priceMax));
        const viewAllUrl = `https://mercatolist.com/listings?${params.toString()}`;

        try {
          await sendEmail({
            to: search.user.email,
            subject: `${matchingListings.length} new listing${matchingListings.length !== 1 ? "s" : ""} match "${searchName}"`,
            react: SavedSearchMatch({
              userName: search.user.name,
              searchName,
              matchCount: matchingListings.length,
              listings: matchingListings.map((l) => ({
                title: l.title,
                slug: l.slug,
                askingPrice: l.askingPrice.toString(),
                category: l.category,
                neighborhood: l.neighborhood,
                borough: l.borough,
                photoUrl: l.photos[0]?.url || null,
              })),
              viewAllUrl,
            }),
          });
          emailsSent++;
        } catch (err) {
          console.error(
            `Failed to send search match email to ${search.user.email}:`,
            err
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: searchesProcessed,
      emailsSent,
    });
  } catch (error) {
    console.error("Saved search match cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
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

// Vercel Cron invokes with GET; POST kept for manual triggering
export { handler as GET, handler as POST };
