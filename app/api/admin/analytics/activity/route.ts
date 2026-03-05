import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    // Fetch recent items from each entity type in parallel
    const [recentListings, recentUsers, recentInquiries, recentReports] =
      await Promise.all([
        // Recent listings created
        prisma.businessListing.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            borough: true,
            askingPrice: true,
            createdAt: true,
            listedBy: { select: { id: true, name: true, email: true } },
          },
        }),

        // Recent user registrations
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),

        // Recent inquiries sent
        prisma.inquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            createdAt: true,
            listing: { select: { id: true, title: true, slug: true } },
            sender: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } },
            senderName: true,
          },
        }),

        // Recent reports filed
        prisma.report.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            reason: true,
            status: true,
            details: true,
            createdAt: true,
            reporter: { select: { id: true, name: true } },
            listingId: true,
            reviewId: true,
            userId: true,
          },
        }),
      ]);

    // Merge all activities into a unified format
    const activities = [
      ...recentListings.map((listing) => ({
        id: listing.id,
        type: "listing_created" as const,
        description: `"${listing.title}" listed in ${listing.category} (${listing.borough})`,
        timestamp: listing.createdAt,
        metadata: {
          slug: listing.slug,
          category: listing.category,
          borough: listing.borough,
          askingPrice: Number(listing.askingPrice),
          listedBy: listing.listedBy,
        },
      })),
      ...recentUsers.map((user) => ({
        id: user.id,
        type: "user_registered" as const,
        description: `${user.name} joined as ${user.role.toLowerCase()}`,
        timestamp: user.createdAt,
        metadata: {
          email: user.email,
          role: user.role,
        },
      })),
      ...recentInquiries.map((inquiry) => ({
        id: inquiry.id,
        type: "inquiry_sent" as const,
        description: `${inquiry.sender?.name || inquiry.senderName || "Anonymous"} inquired about "${inquiry.listing.title}"`,
        timestamp: inquiry.createdAt,
        metadata: {
          inquiryType: inquiry.type,
          listingId: inquiry.listing.id,
          listingSlug: inquiry.listing.slug,
          listingTitle: inquiry.listing.title,
          senderId: inquiry.sender?.id ?? null,
          receiverId: inquiry.receiver.id,
          receiverName: inquiry.receiver.name,
        },
      })),
      ...recentReports.map((report) => ({
        id: report.id,
        type: "report_filed" as const,
        description: `${report.reporter.name} reported a ${report.type.toLowerCase()} (${report.reason.toLowerCase()})`,
        timestamp: report.createdAt,
        metadata: {
          reportType: report.type,
          reason: report.reason,
          status: report.status,
          details: report.details,
          reporterId: report.reporter.id,
          targetListingId: report.listingId,
          targetReviewId: report.reviewId,
          targetUserId: report.userId,
        },
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        activities,
      },
    });
  } catch (error) {
    console.error("Admin analytics activity error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
}
