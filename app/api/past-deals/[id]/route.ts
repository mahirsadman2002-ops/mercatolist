import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: Update a past deal (only if owned by current user)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.pastDeal.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Past deal not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { businessName, category, borough, neighborhood, salePrice, dateSold, notes } =
      body;

    const updated = await prisma.pastDeal.update({
      where: { id },
      data: {
        ...(businessName !== undefined && { businessName: businessName.trim() }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(borough !== undefined && { borough: borough?.trim() || null }),
        ...(neighborhood !== undefined && {
          neighborhood: neighborhood?.trim() || null,
        }),
        ...(salePrice !== undefined && {
          salePrice: salePrice != null ? salePrice : null,
        }),
        ...(dateSold !== undefined && {
          dateSold: dateSold ? new Date(dateSold) : null,
        }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/past-deals/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update past deal" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a past deal (only if owned by current user)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.pastDeal.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Past deal not found" },
        { status: 404 }
      );
    }

    await prisma.pastDeal.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("DELETE /api/past-deals/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete past deal" },
      { status: 500 }
    );
  }
}
