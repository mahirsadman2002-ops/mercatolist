// Dry-run of the saved-search-match cron: reports what WOULD match/send, no emails, no writes
import { prisma } from "../lib/prisma";

interface SearchCriteria {
  category?: string; borough?: string; neighborhood?: string;
  priceMin?: number; priceMax?: number; revenueMin?: number; revenueMax?: number; keyword?: string;
}

async function main() {
  const searches = await prisma.savedSearch.findMany({
    where: { isActive: true },
    include: { user: { select: { email: true } } },
  });
  const distinctCategories = await prisma.businessListing.groupBy({
    by: ["category"], where: { status: "ACTIVE" }, _count: true,
  });
  console.log("Active listing categories:", distinctCategories.map(c => `${c.category}(${c._count})`).join(", "));
  console.log("");

  for (const s of searches) {
    const c = s.criteria as SearchCriteria;
    const sinceDate = s.lastCheckedAt || s.createdAt;
    const where: Record<string, unknown> = { status: "ACTIVE", createdAt: { gt: sinceDate } };
    if (c.category) where.category = c.category;
    if (c.borough) where.borough = c.borough;
    if (c.neighborhood) where.neighborhood = c.neighborhood;
    if (c.keyword) where.OR = [
      { title: { contains: c.keyword, mode: "insensitive" } },
      { description: { contains: c.keyword, mode: "insensitive" } },
    ];
    const count = await prisma.businessListing.count({ where });
    // Also: does this category exist at ALL (ignoring date)?
    const catTotal = c.category
      ? await prisma.businessListing.count({ where: { category: c.category } })
      : null;
    console.log(`[${s.user.email}] "${s.name ?? "unnamed"}" ${JSON.stringify(c)}`);
    console.log(`  since ${sinceDate.toISOString().slice(0,10)}: ${count} new match(es) → would ${count > 0 ? "SEND EMAIL" : "send nothing"}${catTotal !== null ? ` | category exists in DB (all-time): ${catTotal}` : ""}`);
  }
}
main().finally(() => prisma.$disconnect());
