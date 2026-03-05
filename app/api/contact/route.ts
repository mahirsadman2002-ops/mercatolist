import { NextResponse } from "next/server";
import React from "react";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (
      !name ||
      typeof name !== "string" ||
      !name.trim() ||
      !email ||
      typeof email !== "string" ||
      !email.trim() ||
      !subject ||
      typeof subject !== "string" ||
      !subject.trim() ||
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@mercatolist.com";

    await sendEmail({
      to: adminEmail,
      subject: `Contact Form: ${subject} — from ${name}`,
      react: React.createElement(
        "div",
        null,
        React.createElement(
          "p",
          null,
          `From: ${name.trim()} (${email.trim()})`
        ),
        React.createElement("p", null, `Subject: ${subject.trim()}`),
        React.createElement("hr"),
        React.createElement(
          "p",
          { style: { whiteSpace: "pre-wrap" } },
          message.trim()
        )
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
