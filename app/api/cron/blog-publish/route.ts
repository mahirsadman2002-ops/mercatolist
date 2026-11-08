import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import BlogPublished from "@/emails/blog-published";

interface Slide {
  heading: string;
  text: string;
}

const SITE = "https://mercatolist.com";

// Daily (13:00 UTC — Vercel Hobby only allows daily crons): publish SCHEDULED blog posts whose time has come, then email the
// owner a ready-to-post social carousel (slide image links + caption).
async function handler(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;

  try {
    const due = await prisma.blogPost.findMany({
      where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
      select: { id: true, slug: true, title: true, excerpt: true, carouselPoints: true },
    });

    const notifyTo =
      process.env.BLOG_PUBLISH_NOTIFY_EMAIL || "sadman.samlall.2025@gmail.com";
    let published = 0;
    let emailsSent = 0;

    for (const post of due) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      published++;

      const slides = (post.carouselPoints as Slide[] | null) ?? [];
      if (!Array.isArray(slides) || slides.length === 0) continue;

      const slideUrls = slides.map(
        (_, i) => `${SITE}/api/blog/${post.slug}/carousel/${i + 1}`
      );
      // Caption: hook line + middle-slide points as a bullet list + link.
      const middle = slides.slice(1, -1);
      const caption = [
        slides[0].heading + " — " + slides[0].text,
        "",
        ...middle.map((s) => `• ${s.heading}: ${s.text}`),
        "",
        `Full breakdown: ${SITE}/blog/${post.slug}`,
        "",
        "#nycsmallbusiness #buyabusiness #nycentrepreneur #businessforsale #nyc",
      ].join("\n");

      try {
        await sendEmail({
          to: notifyTo,
          subject: `🚀 Published: ${post.title} — carousel ready to post`,
          react: BlogPublished({
            postTitle: post.title,
            postUrl: `${SITE}/blog/${post.slug}`,
            slideUrls,
            caption,
          }),
        });
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send carousel email for ${post.slug}:`, err);
      }
    }

    return NextResponse.json({ success: true, published, emailsSent });
  } catch (error) {
    console.error("Blog publish cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

// Vercel Cron invokes with GET; POST kept for manual triggering
export { handler as GET, handler as POST };
