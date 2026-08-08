// Dry-run of ALL cron jobs: reports who WOULD get emailed, sends nothing, writes nothing
import { prisma } from "../lib/prisma";
import { CONFIRMATION_INTERVAL_DAYS } from "../lib/listing-confirmation";

async function main() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 864e5);
  const twoDaysAgo = new Date(now.getTime() - 2 * 864e5);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 864e5);
  const intervalAgo = new Date(now.getTime() - CONFIRMATION_INTERVAL_DAYS * 864e5);

  console.log("=== unread-digest (daily 8pm ET) ===");
  console.log("  Stub (TODO) — sends nothing.\n");

  console.log("=== saved-listing-alerts + collection-alerts (daily ~8-9am ET) ===");
  const statusLogs = await prisma.listingStatusLog.count({ where: { createdAt: { gte: dayAgo } } });
  console.log(`  Status changes in last 24h: ${statusLogs} → emails only if saved/in collections\n`);

  console.log("=== saved-search-match (daily 10am ET) ===");
  console.log("  (already dry-run: 1 email to mahirsadmanrealty@gmail.com)\n");

  console.log(`=== listing-status-check (daily 11am ET, cap 50/run, interval ${CONFIRMATION_INTERVAL_DAYS}d) ===`);
  const dueListings = await prisma.businessListing.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { statusConfirmationDue: { lt: now } },
        { statusConfirmationDue: null, createdAt: { lt: intervalAgo } },
      ],
    },
    select: { title: true, createdAt: true, listedBy: { select: { email: true, isManaged: true } } },
  });
  console.log(`  ${dueListings.length} listings due for "confirm your listing status" email`);
  const byOwner = new Map<string, { n: number; managed: boolean }>();
  for (const l of dueListings) {
    const e = byOwner.get(l.listedBy.email) || { n: 0, managed: l.listedBy.isManaged };
    e.n++; byOwner.set(l.listedBy.email, e);
  }
  for (const [email, v] of byOwner) console.log(`    ${email}${v.managed ? " (managed acct)" : ""}: ${v.n} listing(s)`);
  console.log("");

  console.log("=== claim-reminders (daily noon ET, cap 200, max 3 ea, 2d apart) ===");
  const claimUsers = await prisma.user.findMany({
    where: {
      isManaged: true, claimedAt: null, claimRemindersSent: { lt: 3 },
      OR: [{ lastClaimReminderAt: null }, { lastClaimReminderAt: { lt: twoDaysAgo } }],
    },
    select: { email: true, name: true, claimRemindersSent: true },
  });
  console.log(`  ${claimUsers.length} unclaimed managed accounts would get reminder #N:`);
  for (const u of claimUsers) console.log(`    ${u.email} (${u.name}) — reminders so far: ${u.claimRemindersSent}`);
  console.log("");

  console.log("=== verification-reminders (daily 1pm ET, max 2 ea, accounts 1-14d old) ===");
  const verifUsers = await prisma.user.findMany({
    where: {
      emailVerified: null, isManaged: false, hashedPassword: { not: null },
      createdAt: { lt: dayAgo, gt: fourteenDaysAgo },
      verificationRemindersSent: { lt: 2 },
      OR: [{ lastVerificationReminderAt: null }, { lastVerificationReminderAt: { lt: twoDaysAgo } }],
    },
    select: { email: true, createdAt: true },
  });
  console.log(`  ${verifUsers.length} unverified recent signups:`);
  for (const u of verifUsers) console.log(`    ${u.email} (signed up ${u.createdAt.toISOString().slice(0,10)})`);
  console.log("");

  console.log("=== marketing-nudge (MONDAYS 9am ET) ===");
  const nudgeUsers = await prisma.user.findMany({
    where: { savedListings: { some: { listing: { status: "ACTIVE" } } } },
    select: { email: true, _count: { select: { savedListings: true } } },
  });
  console.log(`  ${nudgeUsers.length} users with saved listings would get "still interested?" EVERY Monday:`);
  for (const u of nudgeUsers) console.log(`    ${u.email} (${u._count.savedListings} saved)`);
}
main().finally(() => prisma.$disconnect());
