import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportFormSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const validated = reportFormSchema.parse({
      ...body,
      type: "LISTING",
      listingId: id,
    });

    const report = await prisma.report.create({
      data: {
        type: validated.type,
        reason: validated.reason,
        details: validated.details,
        listingId: id,
        reporterId: session.user.id,
      },
    });

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error reporting listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to report listing" },
      { status: 500 }
    );
  }
}
