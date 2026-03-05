"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Link2,
  Share2,
  ArrowRight,
} from "lucide-react";

interface Author {
  id: string;
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: string | null;
  tags: string[];
  status: string;
  authorId: string;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

interface RelatedPost {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  category: string | null;
  publishedAt: string | null;
}

interface BlogPostClientProps {
  post: Post;
  relatedPosts: RelatedPost[];
}

function formatDate(date: string): string {
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

export function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const [copied, setCopied] = useState(false);
  const authorName = post.author.displayName || post.author.name;
  const readTime = estimateReadTime(post.content);

  useEffect(() => {
    // Increment view count on mount (fire-and-forget)
    fetch(`/api/blog/${post.slug}/view`, { method: "POST" }).catch(() => {
      // Silently ignore errors
    });
  }, [post.slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const breadcrumbItems = [
    { label: "Blog", href: "/blog" },
    ...(post.category ? [{ label: post.category }] : []),
    { label: post.title },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />

      <article className="max-w-3xl mx-auto">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative w-full aspect-video max-h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Category + Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.category && (
            <Badge variant="secondary">{post.category}</Badge>
          )}
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {post.title}
        </h1>

        {/* Author info + meta */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={authorName}
              width={44}
              height={44}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{authorName}</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {post.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {readTime} min read
              </span>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none mb-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-3 py-6 border-t border-b mb-10">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            Share
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareTwitter}
            className="gap-1.5"
          >
            X / Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareLinkedIn}
            className="gap-1.5"
          >
            LinkedIn
          </Button>
        </div>

        {/* Author Bio Card */}
        <Card className="mb-10">
          <CardContent className="p-6 flex items-start gap-4">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={authorName}
                width={64}
                height={64}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xl font-semibold shrink-0">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Written by
              </p>
              <p className="font-bold text-lg">{authorName}</p>
              {post.author.bio && (
                <p className="text-muted-foreground text-sm mt-1">
                  {post.author.bio}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    <div className="relative aspect-video">
                      {related.featuredImage ? (
                        <Image
                          src={related.featuredImage}
                          alt={related.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-500" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      {related.category && (
                        <Badge
                          variant="outline"
                          className="mb-2 text-xs"
                        >
                          {related.category}
                        </Badge>
                      )}
                      <h3 className="font-semibold group-hover:underline mb-1">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {truncate(
                          related.excerpt || related.content,
                          100
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">
              Looking to buy or sell a business?
            </h2>
            <p className="text-muted-foreground mb-4">
              Browse listings on MercatoList
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild>
                <Link href="/listings">
                  Browse Listings
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/my-listings/new">List Your Business</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
