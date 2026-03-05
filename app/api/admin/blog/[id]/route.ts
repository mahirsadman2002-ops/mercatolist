import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { blogPostUpdateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const { id } = await params;
    const body = await request.json();

    const validated = blogPostUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    const data = validated.data;
    const updateData: Record<string, unknown> = { ...data };

    // Handle slug regeneration if title changed
    if (data.title && data.title !== existing.title) {
      let slug = slugify(data.title);

      const existingSlug = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (existingSlug && existingSlug.id !== id) {
        const randomChars = Math.random().toString(36).substring(2, 6);
        slug = `${slug}-${randomChars}`;
      }

      updateData.slug = slug;
    }

    // Set publishedAt if transitioning to PUBLISHED
    if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: updateData as any,
    });

    return NextResponse.json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const { id } = await params;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: "Blog post deleted" },
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
