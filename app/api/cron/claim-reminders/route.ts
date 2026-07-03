import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendClaimEmail } from "@/lib/claim";

// Daily reminder to managed accounts that still haven't been claimed.
// Secured with CRON_SECRET. Sends at most once/day per user (lastClaimReminderAt).
export async function POST(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;

  try {
    const now = new Date();
    const aDayAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        isManaged: true,
        claimedAt: null,
        OR: [{ lastClaimReminderAt: null }, { lastClaimReminderAt: { lt: aDayAgo } }],
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
          data: { lastClaimReminderAt: now },
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
