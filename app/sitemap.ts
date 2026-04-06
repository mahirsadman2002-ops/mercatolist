import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BOROUGHS, NEIGHBORHOODS, BUSINESS_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/listings`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brokers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Borough pages
  const boroughPages: MetadataRoute.Sitemap = BOROUGHS.map((b) => ({
    url: `${BASE_URL}/boroughs/${b.label.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Neighborhood pages
  const neighborhoodPages: MetadataRoute.Sitemap = Object.values(NEIGHBORHOODS)
    .flat()
    .map((n) => ({
      url: `${BASE_URL}/neighborhoods/${slugify(n)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = BUSINESS_CATEGORIES.map((c) => ({
    url: `${BASE_URL}/categories/${slugify(c)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic pages from database
  const [listings, blogPosts, brokers, users] = await Promise.all([
    prisma.businessListing.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true, borough: true, category: true, neighborhood: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.user.findMany({
      where: { role: "BROKER" },
      select: { id: true, updatedAt: true },
    }),
    prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      select: { id: true, updatedAt: true },
    }),
  ]);

  // Listing pages
  const listingPages: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${BASE_URL}/listings/${l.slug}`,
    lastModified: l.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Broker profile pages
  const brokerPages: MetadataRoute.Sitemap = brokers.map((b) => ({
    url: `${BASE_URL}/advisors/${b.id}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // User profile pages
  const profilePages: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${BASE_URL}/profile/${u.id}`,
    lastModified: u.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Borough + Category combo pages (only combos with listings)
  const boroughCategoryCombos = new Set<string>();
  const neighborhoodCategoryCombos = new Set<string>();

  for (const l of listings) {
    const boroughSlug = l.borough.toLowerCase().replace(/_/g, "-");
    const categorySlug = slugify(l.category);
    boroughCategoryCombos.add(`${boroughSlug}/${categorySlug}`);

    const neighborhoodSlug = slugify(l.neighborhood);
    neighborhoodCategoryCombos.add(`${neighborhoodSlug}/${categorySlug}`);
  }

  const comboPages: MetadataRoute.Sitemap = Array.from(boroughCategoryCombos).map((combo) => ({
    url: `${BASE_URL}/boroughs/${combo}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const neighborhoodComboPages: MetadataRoute.Sitemap = Array.from(neighborhoodCategoryCombos).map(
    (combo) => ({
      url: `${BASE_URL}/neighborhoods/${combo}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  return [
    ...staticPages,
    ...boroughPages,
    ...neighborhoodPages,
    ...categoryPages,
    ...listingPages,
    ...blogPages,
    ...brokerPages,
    ...profilePages,
    ...comboPages,
    ...neighborhoodComboPages,
  ];
}
