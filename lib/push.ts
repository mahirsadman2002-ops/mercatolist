import { prisma } from "@/lib/prisma";

// Push notifications to the mobile app, sent through Expo's push service
// (which relays to Apple). Device addresses live in DeviceToken; the app
// registers one per install via /api/mobile/push-token.

interface PushMessage {
  title: string;
  body: string;
  /** Read by the app to open the right screen, e.g. { type: "inquiry", inquiryId }. */
  data?: Record<string, string>;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Best-effort: never throws, so a push problem can't fail the request that
 * triggered it. Tokens Apple reports as gone are removed.
 */
export async function sendPush(userIds: string[], message: PushMessage): Promise<void> {
  try {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) return;
    const tokens = await prisma.deviceToken.findMany({
      where: { userId: { in: ids } },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(
          batch.map((t) => ({
            to: t.token,
            sound: "default",
            title: message.title.slice(0, 100),
            body: message.body.slice(0, 180),
            data: message.data ?? {},
          }))
        ),
      });
      if (!res.ok) {
        console.error("[push] send failed:", res.status);
        continue;
      }
      const json = (await res.json().catch(() => null)) as {
        data?: { status: string; details?: { error?: string } }[];
      } | null;
      const dead = (json?.data ?? [])
        .map((ticket, idx) =>
          ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered"
            ? batch[idx].token
            : null
        )
        .filter((t): t is string => !!t);
      if (dead.length > 0) {
        await prisma.deviceToken.deleteMany({ where: { token: { in: dead } } });
      }
    }
  } catch (error) {
    console.error("[push] error:", error);
  }
}
