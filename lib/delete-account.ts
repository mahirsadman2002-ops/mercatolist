import { prisma } from "@/lib/prisma";
import { revokeAppleToken } from "@/lib/apple";

/**
 * Delete a user's account.
 *
 * A plain `prisma.user.delete` only works for accounts with no history:
 * listings, inquiries, messages, reviews, reports, status logs, blog posts and
 * collection notes all reference the user without a cascade, so the database
 * refuses the delete (this is why "Delete account" returned a 500 for anyone
 * who had used the site).
 *
 * So: try the real delete first. If the account has history, erase everything
 * that is the user's own and strip every personal detail from the user row,
 * leaving an anonymous placeholder ("Deleted User") that the other side of an
 * existing conversation or review still points at. The placeholder is banned,
 * which ends every live session and blocks sign-in, and its email is replaced,
 * which frees the original address to register again.
 */
export async function deleteUserAccount(userId: string): Promise<"deleted" | "anonymized"> {
  // Apple asks apps to revoke "Sign in with Apple" when an account is deleted.
  const appleLinks = await prisma.account.findMany({
    where: { userId, provider: "apple", refresh_token: { not: null } },
    select: { refresh_token: true },
  });
  for (const link of appleLinks) {
    if (link.refresh_token) await revokeAppleToken(link.refresh_token);
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return "deleted";
  } catch (error) {
    // P2003 / P2014: blocked by a foreign key — fall through and anonymize.
    const code = (error as { code?: string })?.code;
    if (code !== "P2003" && code !== "P2014") throw error;
  }

  const saved = await prisma.savedListing.findMany({
    where: { userId },
    select: { listingId: true },
  });
  const savedIds = saved.map((s) => s.listingId);
  const coListings = await prisma.businessListing.findMany({
    where: { coBrokers: { some: { id: userId } } },
    select: { id: true },
  });

  await prisma.$transaction([
    // Their listings come off the site (soft delete keeps other people's
    // inquiry history intact).
    prisma.businessListing.updateMany({
      where: { listedById: userId, deletedAt: null },
      data: { deletedAt: new Date(), isFeatured: false },
    }),
    ...coListings.map((l) =>
      prisma.businessListing.update({
        where: { id: l.id },
        data: { coBrokers: { disconnect: { id: userId } } },
      })
    ),
    // Things that belong only to them.
    prisma.savedListing.deleteMany({ where: { userId } }),
    prisma.businessListing.updateMany({
      where: { id: { in: savedIds }, saveCount: { gt: 0 } },
      data: { saveCount: { decrement: 1 } },
    }),
    prisma.savedSearch.deleteMany({ where: { userId } }),
    prisma.collection.deleteMany({ where: { userId } }),
    prisma.collectionCollaborator.deleteMany({ where: { userId } }),
    prisma.collectionAccessRequest.deleteMany({ where: { userId } }),
    prisma.client.deleteMany({ where: { advisorId: userId } }),
    prisma.license.deleteMany({ where: { userId } }),
    prisma.pastDeal.deleteMany({ where: { userId } }),
    prisma.reviewToken.deleteMany({ where: { brokerId: userId } }),
    // Reviews written about them go with their profile; reviews they wrote
    // about others stay, attributed to the anonymous placeholder.
    prisma.review.deleteMany({ where: { brokerId: userId } }),
    prisma.searchLog.updateMany({ where: { userId }, data: { userId: null } }),
    // Sign-in methods and tokens.
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    // Strip the person out of the row that remains.
    prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.mercatolist.invalid`,
        emailVerified: null,
        hashedPassword: null,
        name: "Deleted User",
        displayName: null,
        bio: null,
        avatarUrl: null,
        phone: null,
        website: null,
        ownedBusiness: null,
        role: "USER",
        brokerageName: null,
        brokerageWebsite: null,
        brokeragePhone: null,
        boroughsServed: [],
        specialties: [],
        yearsOfExperience: null,
        hasLicenses: false,
        profileCompleteness: 0,
        instagramUrl: null,
        linkedinUrl: null,
        twitterUrl: null,
        facebookUrl: null,
        tiktokUrl: null,
        isManaged: false,
        isBanned: true,
        bannedReason: "Account deleted",
      },
    }),
  ]);
  // buyBox is Json?: clear it separately (Prisma needs the JsonNull sentinel).
  await prisma.$executeRaw`UPDATE "User" SET "buyBox" = NULL WHERE id = ${userId}`;

  return "anonymized";
}
