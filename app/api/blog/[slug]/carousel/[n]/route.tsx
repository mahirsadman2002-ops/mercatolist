import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface Slide {
  heading: string;
  text: string;
}

// GET /api/blog/[slug]/carousel/[n] → 1080x1350 PNG of slide n (1-based).
// Rendered on demand for the publish-notification email; the owner long-presses
// each image on their phone to save, then posts the set as an IG/TikTok carousel.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; n: string }> }
) {
  const { slug, n } = await params;
  const idx = parseInt(n, 10) - 1;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, carouselPoints: true, status: true },
  });
  const slides = (post?.carouselPoints as Slide[] | null) ?? [];
  if (!post || !Array.isArray(slides) || idx < 0 || idx >= slides.length) {
    return new Response("Not found", { status: 404 });
  }

  const slide = slides[idx];
  const isFirst = idx === 0;
  const isLast = idx === slides.length - 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: isFirst ? "#0d9488" : "#fafaf8",
          color: isFirst ? "#ffffff" : "#16232b",
          padding: "80px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: isFirst ? "#ffffff" : "#0d9488",
            }}
          >
            MERCATOLIST
          </div>
          <div
            style={{
              fontSize: 28,
              color: isFirst ? "rgba(255,255,255,0.7)" : "#8a9a96",
            }}
          >
            {idx + 1}/{slides.length}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <div
            style={{
              fontSize: isFirst ? 76 : 60,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {slide.heading}
          </div>
          <div
            style={{
              fontSize: 38,
              lineHeight: 1.4,
              color: isFirst ? "rgba(255,255,255,0.92)" : "#42524e",
            }}
          >
            {slide.text}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: isFirst ? "rgba(255,255,255,0.7)" : "#8a9a96",
          }}
        >
          <div style={{ display: "flex", maxWidth: 760 }}>{isFirst || isLast ? "" : post.title}</div>
          <div>{isLast ? "mercatolist.com" : "swipe →"}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
