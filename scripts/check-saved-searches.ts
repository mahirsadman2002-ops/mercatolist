import { prisma } from "../lib/prisma";

async function main() {
  const searches = await prisma.savedSearch.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  console.log(`Total saved searches: ${searches.length}`);
  for (const s of searches) {
    console.log(JSON.stringify({
      id: s.id,
      user: s.user.email,
      name: s.name,
      criteria: s.criteria,
      isActive: s.isActive,
      checkFrequency: s.checkFrequency,
      emailFrequency: s.emailFrequency,
      lastCheckedAt: s.lastCheckedAt,
      createdAt: s.createdAt,
    }));
  }
  const recentListings = await prisma.businessListing.count({
    where: { status: "ACTIVE", createdAt: { gt: new Date(Date.now() - 7 * 864e5) } },
  });
  console.log(`\nActive listings created in last 7 days: ${recentListings}`);
}
main().finally(() => prisma.$disconnect());
