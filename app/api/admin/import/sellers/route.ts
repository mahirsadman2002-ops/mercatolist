import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Search existing sellers/advisors for the import bookmarklet's "select from
// existing" picker. Called cross-origin from a source-site tab and authed by
// the same ADMIN_IMPORT_TOKEN as the import endpoint (not a session cookie).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const token = process.env.ADMIN_IMPORT_TOKEN;
  if (!token) {
    return json({ success: false, error: "Import is not configured." }, 503);
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return json({ success: true, data: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["USER", "BROKER"] },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      brokerageName: true,
      isManaged: true,
      claimedAt: true,
      _count: { select: { listings: true } },
    },
  });

  return json({
    success: true,
    data: users.map((u) => ({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      accountType: u.role === "BROKER" ? "ADVISOR" : "SELLER",
      brokerageName: u.brokerageName || "",
      listingCount: u._count.listings,
      // "managed" = we made it for them and they haven't set a password yet.
      status: u.claimedAt ? "active" : u.isManaged ? "unclaimed" : "active",
    })),
  });
}
