import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import SendListing from "@/emails/send-listing";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Button,
  Preview,
  Img,
} from "@react-email/components";
import React from "react";

// Helper to format borough label
function formatBorough(borough: string) {
  return borough.charAt(0) + borough.slice(1).toLowerCase().replace("_", " ");
}

// Helper to format price
function formatPrice(price: string) {
  return Number(price).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });
}

// POST: Send multiple listings to a client in one email
export async function POST(
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

    // Verify user is a broker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true, brokerageName: true },
    });

    if (user?.role !== "BROKER") {
      return NextResponse.json(
        { success: false, error: "Only advisors can send listings to clients" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the client
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.advisorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { listingIds, personalMessage } = body;

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "listingIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (listingIds.length > 20) {
      return NextResponse.json(
        { success: false, error: "Cannot send more than 20 listings at once" },
        { status: 400 }
      );
    }

    // Fetch all listings
    const listings = await prisma.businessListing.findMany({
      where: { id: { in: listingIds } },
      include: {
        photos: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    if (listings.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid listings found" },
        { status: 404 }
      );
    }

    // If only one listing, use the single listing template
    if (listings.length === 1) {
      const listing = listings[0];
      await sendEmail({
        to: client.email,
        subject: `${user.name} shared a listing with you: ${listing.title}`,
        react: SendListing({
          brokerName: user.name,
          brokerageName: user.brokerageName || undefined,
          clientName: client.name || undefined,
          listingTitle: listing.title,
          listingSlug: listing.slug,
          askingPrice: listing.askingPrice.toString(),
          category: listing.category,
          neighborhood: listing.neighborhood,
          borough: listing.borough,
          photoUrl: listing.photos[0]?.url || undefined,
          personalMessage: personalMessage?.trim() || undefined,
        }),
      });
    } else {
      // Build multi-listing email
      const listingElements = listings.map((listing) =>
        React.createElement(
          Section,
          {
            key: listing.id,
            style: {
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "16px",
            },
          },
          listing.photos[0]?.url
            ? React.createElement(Img, {
                src: listing.photos[0].url,
                alt: listing.title,
                width: "536",
                height: "160",
                style: { objectFit: "cover" as const, width: "100%", display: "block" },
              })
            : null,
          React.createElement(
            Section,
            { style: { padding: "16px" } },
            React.createElement(
              Text,
              { style: { fontSize: "16px", fontWeight: 600, color: "#1a1f36", margin: "0 0 4px 0" } },
              listing.title
            ),
            React.createElement(
              Text,
              { style: { fontSize: "13px", color: "#718096", margin: "0 0 8px 0" } },
              `${listing.category} \u2022 ${listing.neighborhood}, ${formatBorough(listing.borough)}`
            ),
            React.createElement(
              Text,
              { style: { fontSize: "18px", fontWeight: 700, color: "#1a1f36", margin: "0 0 12px 0" } },
              formatPrice(listing.askingPrice.toString())
            ),
            React.createElement(
              Button,
              {
                href: `https://mercatolist.com/listings/${listing.slug}`,
                style: {
                  backgroundColor: "#0d9488",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "8px 20px",
                  textDecoration: "none",
                  textAlign: "center" as const,
                  display: "inline-block",
                },
              },
              "View Details"
            )
          )
        )
      );

      const emailComponent = React.createElement(
        Html,
        null,
        React.createElement(Head, null),
        React.createElement(
          Preview,
          null,
          `${user.name} shared ${listings.length} listings with you`
        ),
        React.createElement(
          Body,
          {
            style: {
              backgroundColor: "#f6f9fc",
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
          },
          React.createElement(
            Container,
            {
              style: {
                backgroundColor: "#ffffff",
                margin: "40px auto",
                borderRadius: "8px",
                maxWidth: "600px",
                overflow: "hidden",
              },
            },
            React.createElement(
              Section,
              {
                style: {
                  backgroundColor: "#1a1f36",
                  padding: "24px 32px",
                  textAlign: "center" as const,
                },
              },
              React.createElement(
                Heading,
                {
                  style: {
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: "-0.3px",
                  },
                },
                "MercatoList"
              )
            ),
            React.createElement(
              Section,
              { style: { padding: "32px" } },
              React.createElement(
                Heading,
                {
                  as: "h2" as const,
                  style: {
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#1a1f36",
                    marginBottom: "16px",
                    marginTop: 0,
                  },
                },
                `${listings.length} listings picked for you`
              ),
              React.createElement(
                Text,
                {
                  style: {
                    fontSize: "15px",
                    lineHeight: "24px",
                    color: "#4a5568",
                    margin: "16px 0",
                  },
                },
                `Hi ${client.name || "there"}, `,
                React.createElement("strong", null, user.name),
                user.brokerageName ? ` from ${user.brokerageName}` : "",
                ` thinks you might be interested in these listings:`
              ),
              personalMessage
                ? React.createElement(
                    Section,
                    {
                      style: {
                        backgroundColor: "#f0fdfa",
                        borderRadius: "8px",
                        padding: "16px",
                        margin: "16px 0",
                        borderLeft: "3px solid #0d9488",
                      },
                    },
                    React.createElement(
                      Text,
                      {
                        style: {
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#0d9488",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.5px",
                          margin: "0 0 6px 0",
                        },
                      },
                      `Note from ${user.name}:`
                    ),
                    React.createElement(
                      Text,
                      {
                        style: {
                          fontSize: "14px",
                          color: "#4a5568",
                          fontStyle: "italic" as const,
                          lineHeight: "22px",
                          margin: 0,
                        },
                      },
                      `"${personalMessage.trim()}"`
                    )
                  )
                : null,
              ...listingElements,
              React.createElement(
                Text,
                {
                  style: {
                    fontSize: "13px",
                    color: "#718096",
                    marginTop: "16px",
                    lineHeight: "20px",
                  },
                },
                `Interested in any of these? Reply to this email to contact ${user.name} directly.`
              )
            ),
            React.createElement(Hr, { style: { borderColor: "#e2e8f0", margin: "0" } }),
            React.createElement(
              Section,
              { style: { padding: "24px 32px" } },
              React.createElement(
                Text,
                {
                  style: {
                    fontSize: "12px",
                    color: "#a0aec0",
                    margin: "4px 0",
                    textAlign: "center" as const,
                  },
                },
                `\u00A9 ${new Date().getFullYear()} MercatoList. All rights reserved.`
              ),
              React.createElement(
                Text,
                {
                  style: {
                    fontSize: "12px",
                    color: "#a0aec0",
                    margin: "4px 0",
                    textAlign: "center" as const,
                  },
                },
                "NYC's premier marketplace for buying and selling businesses."
              )
            )
          )
        )
      );

      await sendEmail({
        to: client.email,
        subject: `${user.name} shared ${listings.length} listings with you`,
        react: emailComponent,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        sentTo: client.email,
        listingCount: listings.length,
        listingIds: listings.map((l) => l.id),
      },
    });
  } catch (error) {
    console.error("Error sending listings to client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send listings to client" },
      { status: 500 }
    );
  }
}
