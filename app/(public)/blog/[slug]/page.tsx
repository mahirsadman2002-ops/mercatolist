import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostClient } from "./BlogPostClient";

export const revalidate = 3600;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      excerpt: true,
      content: true,
      featuredImage: true,
    },
  });

  if (!post) {
    return { title: "Post Not Found | MercatoList Blog" };
  }

  const description =
    post.metaDescription ||
    post.excerpt ||
    post.content.slice(0, 160).trimEnd() + "...";

  return {
    title: `${post.metaTitle || post.title} | MercatoList Blog`,
    description,
    openGraph: {
      title: post.metaTitle || post.title,
      description,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      category: post.category ?? undefined,
      id: { not: post.id },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      featuredImage: true,
      category: true,
      publishedAt: true,
    },
  });

  // Serialize dates for client component
  const serializedPost = {
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };

  const serializedRelated = relatedPosts.map((p: { title: string; slug: string; excerpt: string | null; content: string; featuredImage: string | null; category: string | null; publishedAt: Date | null }) => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.content.slice(0, 160),
    image: post.featuredImage || undefined,
    author: {
      "@type": "Person",
      name: post.author.displayName || post.author.name,
    },
    datePublished: post.publishedAt?.toISOString(),
    publisher: {
      "@type": "Organization",
      name: "MercatoList",
      url: "https://mercatolist.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient
        post={serializedPost}
        relatedPosts={serializedRelated}
      />
    </>
  );
}
