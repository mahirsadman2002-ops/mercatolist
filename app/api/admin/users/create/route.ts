import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { findOrCreateManagedUser } from "@/lib/create-managed-user";
import { sendClaimEmail } from "@/lib/claim";

// POST: Create a managed account on someone's behalf (no listing required).
// The person gets a claim email to set their password; until then the account
// is auto-verified but "unclaimed".
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin();
    if (!adminAuth.authorized) return adminAuth.response;

    const body = await request.json();
    const { email, name, phone, accountType, brokerageName } = body || {};

    const result = await findOrCreateManagedUser({
      email,
      name,
      phone,
      accountType,
      brokerageName,
    });
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { user, created } = result;

    // A real, already-claimed account can't be "created" again — tell the admin.
    if (!created && user.claimedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "A user with this email already exists and is active.",
        },
        { status: 409 }
      );
    }

    // Send (or re-send) the claim link. sendClaimEmail is best-effort and only
    // sends for managed, unclaimed accounts, so it's safe to always call.
    const claimEmailSent = await sendClaimEmail(user, created ? "created" : "reminder");

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isManaged: user.isManaged,
        },
        created,
        claimEmailSent,
      },
    });
  } catch (error) {
    console.error("[admin/users/create] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
