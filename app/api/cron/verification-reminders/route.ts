import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { requireCron } from "@/lib/cron-auth";

// Gentle, capped reminder for self-signups who registered with a password but
// never verified their email. Sends at most 2 total, ≥2 days apart, only for
// accounts 1–14 days old. Managed/imported accounts are handled separately by
// the claim-reminders cron and are excluded here.
const MAX_REMINDERS = 2;

async function handler(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;

  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        emailVerified: null,
        isManaged: false,
        hashedPassword: { not: null }, // has a password → a real credentials signup
        createdAt: { lt: oneDayAgo, gt: fourteenDaysAgo },
        verificationRemindersSent: { lt: MAX_REMINDERS },
        OR: [
          { lastVerificationReminderAt: null },
          { lastVerificationReminderAt: { lt: twoDaysAgo } },
        ],
      },
      select: { id: true, email: true, name: true },
      take: 200,
    });

    let sent = 0;
    for (const user of users) {
      try {
        // Fresh 24h token (clear any stale ones first).
        await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
        const token = uuidv4();
        await prisma.emailVerificationToken.create({
          data: {
            token,
            userId: user.id,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });

        const { sendEmail } = await import("@/lib/email");
        const VerifyEmail = (await import("@/emails/verify-email")).default;
        const base = process.env.NEXTAUTH_URL || "https://mercatolist.com";
        await sendEmail({
          to: user.email,
          subject: "Reminder: verify your MercatoList email",
          react: VerifyEmail({
            name: user.name,
            verificationUrl: `${base}/verify-email?token=${token}`,
          }),
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationRemindersSent: { increment: 1 },
            lastVerificationReminderAt: now,
          },
        });
        sent++;
      } catch (e) {
        // One bad send never blocks the rest of the batch.
        console.error("[cron/verification-reminders] failed for", user.email, e);
      }
    }

    return NextResponse.json({ success: true, candidates: users.length, sent });
  } catch (error) {
    console.error("[cron/verification-reminders] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run verification reminders" },
      { status: 500 }
    );
  }
}

// Vercel Cron invokes with GET; POST kept for manual triggering
export { handler as GET, handler as POST };
