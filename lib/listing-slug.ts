import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * A slug for a listing title that no other listing row holds.
 *
 * Deleted listings are soft-deleted, so they keep their slug and the unique
 * index still counts them — but the soft-delete filter in lib/prisma.ts hides
 * them from ordinary lookups. A plain "is this slug taken?" check therefore
 * said "free" for the slug of a deleted listing, and the insert/update then
 * failed on the unique index (a 500 for anyone re-using the title of a
 * listing they had deleted). This checks live and deleted rows explicitly.
 */
export async function uniqueListingSlug(title: string, excludeId?: string): Promise<string> {
  // slugify drops non-ASCII characters; never return an empty slug.
  const base = slugify(title) || "listing";
  const other = excludeId ? { id: { not: excludeId } } : {};
  const [live, deleted] = await Promise.all([
    prisma.businessListing.count({ where: { slug: base, ...other } }),
    prisma.businessListing.count({
      where: { slug: base, ...other, deletedAt: { not: null } },
    }),
  ]);
  return live + deleted > 0 ? `${base}-${Date.now().toString(36)}` : base;
}
