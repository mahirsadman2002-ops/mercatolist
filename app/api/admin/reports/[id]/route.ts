import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { adminReportUpdateSchema } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const { id } = await params;
    const body = await request.json();

    const validated = adminReportUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status, adminNotes } = validated.data;

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      adminNotes,
    };

    if (status === "DISMISSED" || status === "ACTION_TAKEN") {
      updateData.resolvedAt = new Date();
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update report" },
      { status: 500 }
    );
  }
}
