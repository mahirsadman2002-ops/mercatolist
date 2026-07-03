/**
 * Deletes all seeded test data (fake brokers, sellers, buyers, and their
 * listings) from the database. Every seed account uses an "@example.com"
 * email, which is how we identify them — real signups are never touched.
 *
 * The real admin account (admin@mercatolist.com) is explicitly KEPT.
 *
 * Usage:
 *   npx tsx scripts/cleanup-seed-data.ts            # DRY RUN — prints what would be deleted, changes nothing
 *   npx tsx scripts/cleanup-seed-data.ts --confirm  # actually deletes
 *
 * Deletion order matters: a few relations are Restrict (not cascade), so we
 * clear listings + those child rows before deleting the users themselves.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CONFIRM = process.argv.includes("--confirm");
// Emails matching this are treated as seed/test data.
const SEED_EMAIL_PATTERN = { endsWith: "@example.com" };
// Never delete these, even if they somehow matched.
const KEEP_EMAILS = ["admin@mercatolist.com"];

async function main() {
  console.log(
    CONFIRM
      ? "⚠️  RUNNING IN --confirm MODE — data WILL be deleted.\n"
      : "🔍 DRY RUN — nothing will be deleted. Re-run with --confirm to execute.\n"
  );

  const seedUsers = await prisma.user.findMany({
    where: {
      email: SEED_EMAIL_PATTERN,
      NOT: { email: { in: KEEP_EMAILS } },
    },
    select: { id: true, email: true, name: true, role: true },
  });

  if (seedUsers.length === 0) {
    console.log("No @example.com seed users found. Nothing to do.");
    return;
  }

  const ids = seedUsers.map((u) => u.id);

  const listingCount = await prisma.businessListing.count({
    where: { listedById: { in: ids } },
  });

  console.log(`Found ${seedUsers.length} seed user(s):`);
  for (const u of seedUsers) {
    console.log(`  • ${u.email}  (${u.role})  ${u.name}`);
  }
  console.log(`\nThey own ${listingCount} listing(s), which will also be removed.`);
  console.log(`Keeping: ${KEEP_EMAILS.join(", ")}\n`);

  if (!CONFIRM) {
    console.log("Dry run complete. Re-run with --confirm to delete the above.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Listings owned by seed users. Cascades: photos, inquiries (+ their
    //    messages), savedListings, listingStatusLogs, collectionListings.
    const l = await tx.businessListing.deleteMany({
      where: { listedById: { in: ids } },
    });
    console.log(`Deleted ${l.count} listing(s).`);

    // 2. Restrict relations that a user delete would otherwise block.
    const reviews = await tx.review.deleteMany({
      where: { OR: [{ reviewerId: { in: ids } }, { brokerId: { in: ids } }] },
    });
    console.log(`Deleted ${reviews.count} review(s).`);

    const reports = await tx.report.deleteMany({
      where: { reporterId: { in: ids } },
    });
    console.log(`Deleted ${reports.count} report(s).`);

    const posts = await tx.blogPost.deleteMany({
      where: { authorId: { in: ids } },
    });
    console.log(`Deleted ${posts.count} blog post(s).`);

    const msgs = await tx.message.deleteMany({
      where: { senderId: { in: ids } },
    });
    console.log(`Deleted ${msgs.count} leftover message(s).`);

    const logs = await tx.listingStatusLog.deleteMany({
      where: { confirmedById: { in: ids } },
    });
    console.log(`Deleted ${logs.count} leftover status log(s).`);

    const inq = await tx.inquiry.deleteMany({
      where: { OR: [{ receiverId: { in: ids } }, { senderId: { in: ids } }] },
    });
    console.log(`Deleted ${inq.count} leftover inquiry/inquiries.`);

    // 3. Finally the users. Cascades: accounts, sessions, savedListings,
    //    collections, savedSearches, clients, tokens, licenses, etc.
    const u = await tx.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`Deleted ${u.count} user(s).`);
  });

  console.log("\n✅ Cleanup complete.");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
