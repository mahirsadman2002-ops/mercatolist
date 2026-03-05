import { NextResponse } from "next/server";
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
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        const daysSinceCheck = Math.floor(
          (Date.now() - search.lastCheckedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (search.checkFrequency === "WEEKLY" && daysSinceCheck < 7) continue;
        if (search.checkFrequency === "DAILY" && daysSinceCheck < 1) continue;
      }

      const criteria = search.criteria as SearchCriteria;
      const sinceDate = search.lastCheckedAt || search.createdAt;

      // Build Prisma where clause from criteria
      const where: Record<string, unknown> = {
        status: "ACTIVE",
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
