// Gathers real marketplace stats + existing blog slugs for article-writing briefs.
import { prisma } from "../lib/prisma";

async function main() {
  const listings = await prisma.businessListing.findMany({
    where: { status: "ACTIVE", isGhostListing: false },
    select: { category: true, borough: true, askingPrice: true, annualRevenue: true, cashFlowSDE: true, monthlyRent: true },
  });
  const byCat = new Map<string, { asks: number[]; revs: number[]; sdes: number[] }>();
  for (const l of listings) {
    const e = byCat.get(l.category) || { asks: [], revs: [], sdes: [] };
    e.asks.push(Number(l.askingPrice));
    if (l.annualRevenue) e.revs.push(Number(l.annualRevenue));
    if (l.cashFlowSDE) e.sdes.push(Number(l.cashFlowSDE));
    byCat.set(l.category, e);
  }
  const med = (a: number[]) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const stats: Record<string, unknown> = { totalActive: listings.length, categories: {} };
  for (const [cat, e] of byCat) {
    (stats.categories as Record<string, unknown>)[cat] = {
      count: e.asks.length,
      medianAsking: med(e.asks), minAsking: Math.min(...e.asks), maxAsking: Math.max(...e.asks),
      medianRevenue: med(e.revs), medianSDE: med(e.sdes),
      withRevenueDisclosed: e.revs.length, withSDEDisclosed: e.sdes.length,
    };
  }
  const posts = await prisma.blogPost.findMany({ select: { title: true, slug: true, status: true } });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  console.log(JSON.stringify({ stats, existingPosts: posts, admin }, null, 1));
}
main().finally(() => prisma.$disconnect());
