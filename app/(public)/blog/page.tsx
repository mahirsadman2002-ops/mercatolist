import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "MercatoList Blog — Buying & Selling Businesses in NYC",
  description:
    "Expert advice, market insights, and guides for buying and selling businesses in New York City.",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function estimateReadTime(content: string): number {
  return Math.max(1, Math.round(content.length / 1000));
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "...";
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      author: {
        select: { name: true, avatarUrl: true },
      },
    },
  });

  const popularPosts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: 5,
    select: { title: true, slug: true, viewCount: true },
  });

  const featuredPost = posts[0] ?? null;
  const remainingPosts = posts.slice(1);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          The MercatoList Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights for buying and selling businesses in NYC
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">
            No blog posts yet. Check back soon for insights on buying and
            selling businesses in NYC.
          </p>
        </div>
      ) : (
        <>
          {/* Featured Post */}
          {featuredPost && (
            <Link href={`/blog/${featuredPost.slug}`} className="block mb-12">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/2 relative aspect-video md:aspect-auto md:min-h-[320px]">
                    {featuredPost.featuredImage ? (
                      <Image
                        src={featuredPost.featuredImage}
                        alt={featuredPost.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-slate-800 to-slate-600" />
                    )}
                  </div>
                  <CardContent className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                    {featuredPost.category && (
                      <Badge variant="secondary" className="w-fit mb-3">
                        {featuredPost.category}
                      </Badge>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 text-base leading-relaxed">
                      {truncate(
                        featuredPost.excerpt || featuredPost.content,
                        200
                      )}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>{featuredPost.author.name}</span>
                      {featuredPost.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(featuredPost.publishedAt)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium inline-flex items-center gap-1">
                      Read more <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </div>
              </Card>
            </Link>
          )}

          {/* Main content area with grid + sidebar */}
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Post Grid */}
            <div className="flex-1">
              {remainingPosts.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {remainingPosts.map((post: Prisma.BlogPostGetPayload<{ include: { author: { select: { name: true; avatarUrl: true } } } }>) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="block group"
                      >
                        <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                          <div className="relative aspect-video">
                            {post.featuredImage ? (
                              <Image
                                src={post.featuredImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-500" />
                            )}
                          </div>
                          <CardContent className="p-5">
                            {post.category && (
                              <Badge
                                variant="outline"
                                className="mb-2 text-xs"
                              >
                                {post.category}
                              </Badge>
                            )}
                            <h3 className="font-semibold text-lg mb-2 group-hover:underline">
                              {post.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                              {truncate(
                                post.excerpt || post.content,
                                150
                              )}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              {post.publishedAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(post.publishedAt)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {estimateReadTime(post.content)} min read
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 shrink-0 space-y-6">
              {/* Popular Posts */}
              {popularPosts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Popular Posts
                    </h3>
                    <ul className="space-y-3">
                      {popularPosts.map((post, index) => (
                        <li key={post.slug}>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-sm hover:underline flex items-start gap-2"
                          >
                            <span className="text-muted-foreground font-mono text-xs mt-0.5">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>{post.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* CTA Card */}
              <Card className="bg-slate-900 text-white">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">
                    List Your Business
                  </h3>
                  <p className="text-sm text-slate-300 mb-4">
                    Reach thousands of qualified buyers actively searching for
                    businesses in NYC.
                  </p>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/my-listings/new">Create a Listing</Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
