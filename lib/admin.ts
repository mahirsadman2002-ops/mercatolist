import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      authorized: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Authoritative check: read the role from the database rather than trusting
  // the claim in the session token, which can be stale (demoted or deleted
  // admin) or, historically, client-influenced.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });

  if (!user || user.isBanned || user.role !== "ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    session,
    userId: session.user.id,
  };
}

/**
 * Page-level admin gate for server components under /admin that read
 * sensitive data themselves. The layout check alone isn't enough: Next
 * renders a page in parallel with its layout, so a page must not rely on the
 * layout to stop it. Calls notFound() for anyone who isn't a current admin.
 */
export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || user.role !== "ADMIN") notFound();
}
