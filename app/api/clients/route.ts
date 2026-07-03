import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";

// GET: List all clients for current broker from the Client model
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a broker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "BROKER") {
      return NextResponse.json(
        { success: false, error: "Only advisors can access client management" },
        { status: 403 }
      );
    }

    const clients = await prisma.client.findMany({
      where: { advisorId: session.user.id },
      include: {
        _count: {
          select: { collections: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      preferredCategories: client.preferredCategories,
      preferredBoroughs: client.preferredBoroughs,
      priceRangeMin: client.priceRangeMin ? Number(client.priceRangeMin) : null,
      priceRangeMax: client.priceRangeMax ? Number(client.priceRangeMax) : null,
      revenueRangeMin: client.revenueRangeMin ? Number(client.revenueRangeMin) : null,
      revenueRangeMax: client.revenueRangeMax ? Number(client.revenueRangeMax) : null,
      notes: client.notes,
      collectionCount: client._count.collections,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST: Create a new Client record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a broker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "BROKER") {
      return NextResponse.json(
        { success: false, error: "Only advisors can create clients" },
        { status: 403 }
      );
    }

    // Creating a client can fire an invite email to an arbitrary address.
    const limit = await rateLimit(request, "brokerEmail", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      preferredCategories,
      preferredBoroughs,
      priceRangeMin,
      priceRangeMax,
      revenueRangeMin,
      revenueRangeMax,
      notes,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Client email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check unique constraint (advisorId + email)
    const existing = await prisma.client.findUnique({
      where: {
        advisorId_email: {
          advisorId: session.user.id,
          email: email.trim().toLowerCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A client with this email already exists" },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        advisorId: session.user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : [],
        preferredBoroughs: Array.isArray(preferredBoroughs) ? preferredBoroughs : [],
        priceRangeMin: priceRangeMin != null ? priceRangeMin : null,
        priceRangeMax: priceRangeMax != null ? priceRangeMax : null,
        revenueRangeMin: revenueRangeMin != null ? revenueRangeMin : null,
        revenueRangeMax: revenueRangeMax != null ? revenueRangeMax : null,
        notes: notes?.trim() || null,
      },
    });

    // Notify the client. If they don't have a MercatoList account yet, send
    // the sign-up invite. If they do, send a "broker added you as a client"
    // heads-up so they know to expect listings/collections from this broker.
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: client.email },
        select: { id: true, name: true, displayName: true },
      });
      const broker = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, displayName: true, brokerageName: true },
      });
      const { sendEmail } = await import("@/lib/email");
      const baseUrl =
        process.env.NEXTAUTH_URL || "https://mercatolist.com";
      const brokerDisplay =
        broker?.displayName || broker?.name || "Your advisor";

      if (!existingUser) {
        const ClientInvite = (await import("@/emails/client-invite")).default;
        const joinUrl = `${baseUrl}/register?invitedClient=${client.id}&email=${encodeURIComponent(
          client.email,
        )}`;
        await sendEmail({
          to: client.email,
          subject: `${brokerDisplay} invited you to MercatoList`,
          react: ClientInvite({
            advisorName: brokerDisplay,
            advisorCompany: broker?.brokerageName || undefined,
            joinUrl,
          }),
        });
        await prisma.client.update({
          where: { id: client.id },
          data: { invitedToPlatformAt: new Date() },
        });
      } else {
        const ClientAddedByBroker = (
          await import("@/emails/client-added-by-broker")
        ).default;
        await sendEmail({
          to: client.email,
          subject: `${brokerDisplay} added you as a client on MercatoList`,
          react: ClientAddedByBroker({
            recipientName:
              existingUser.displayName || existingUser.name || "there",
            brokerName: brokerDisplay,
            brokerageName: broker?.brokerageName || undefined,
            dashboardUrl: `${baseUrl}/saved`,
          }),
        });
      }
    } catch (inviteError) {
      console.error("Client notification email failed:", inviteError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          preferredCategories: client.preferredCategories,
          preferredBoroughs: client.preferredBoroughs,
          priceRangeMin: client.priceRangeMin ? Number(client.priceRangeMin) : null,
          priceRangeMax: client.priceRangeMax ? Number(client.priceRangeMax) : null,
          revenueRangeMin: client.revenueRangeMin ? Number(client.revenueRangeMin) : null,
          revenueRangeMax: client.revenueRangeMax ? Number(client.revenueRangeMax) : null,
          notes: client.notes,
          createdAt: client.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create client" },
      { status: 500 }
    );
  }
}
