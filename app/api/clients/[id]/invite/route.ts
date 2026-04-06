import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
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
} from "@react-email/components";
import React from "react";

// POST: Send invitation email to a client to join MercatoList
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
        { success: false, error: "Only advisors can invite clients" },
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

    const body = await request.json().catch(() => ({}));
    const personalMessage = body?.personalMessage?.trim() || null;

    const registerUrl = "https://mercatolist.com/register";

    const emailComponent = React.createElement(
      Html,
      null,
      React.createElement(Head, null),
      React.createElement(
        Preview,
        null,
        `${user.name} invited you to join MercatoList`
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
              "You're invited to MercatoList"
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
              " has invited you to join MercatoList — NYC's premier marketplace for buying and selling businesses."
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
              "With a MercatoList account, you can:"
            ),
            React.createElement(
              Text,
              {
                style: {
                  fontSize: "14px",
                  lineHeight: "26px",
                  color: "#4a5568",
                  margin: "0 0 16px 0",
                  paddingLeft: "16px",
                },
              },
              "\u2022 Browse curated business listings across all five NYC boroughs\n",
              "\u2022 Save listings and create collections\n",
              "\u2022 Receive alerts when new listings match your criteria\n",
              "\u2022 Communicate directly with your advisor"
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
                    `"${personalMessage}"`
                  )
                )
              : null,
            React.createElement(
              Section,
              {
                style: {
                  textAlign: "center" as const,
                  margin: "24px 0",
                },
              },
              React.createElement(
                Button,
                {
                  href: registerUrl,
                  style: {
                    backgroundColor: "#0d9488",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 600,
                    padding: "12px 32px",
                    textDecoration: "none",
                    textAlign: "center" as const,
                    display: "inline-block",
                  },
                },
                "Create Your Free Account"
              )
            ),
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
              `Have questions? Reply to this email to reach ${user.name} directly.`
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
      subject: `${user.name} invited you to join MercatoList`,
      react: emailComponent,
    });

    return NextResponse.json({
      success: true,
      data: {
        sentTo: client.email,
        clientName: client.name,
      },
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
