import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendClaimEmail } from "@/lib/claim";

// Reminder to managed accounts that still haven't been claimed.
// Secured with CRON_SECRET. Capped at MAX_REMINDERS total per user, spaced
// ≥2 days apart. After the cap, admin can still resend manually (resend-invite).
const MAX_REMINDERS = 3;

async function handler(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;

  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        isManaged: true,
        claimedAt: null,
        claimRemindersSent: { lt: MAX_REMINDERS },
        OR: [{ lastClaimReminderAt: null }, { lastClaimReminderAt: { lt: twoDaysAgo } }],
      },
      select: { id: true, email: true, name: true, isManaged: true, claimedAt: true },
      take: 200,
    });

    let sent = 0;
    for (const user of users) {
      const ok = await sendClaimEmail(user, "reminder");
      if (ok) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastClaimReminderAt: now,
            claimRemindersSent: { increment: 1 },
          },
        });
        sent++;
      }
    }

    return NextResponse.json({ success: true, sent, candidates: users.length });
  } catch (error) {
    console.error("Claim reminders cron error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Vercel Cron invokes with GET; POST kept for manual triggering
export { handler as GET, handler as POST };
