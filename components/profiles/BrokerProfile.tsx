"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Globe,
  Phone,
  Instagram,
  Linkedin,
  ExternalLink,
  LayoutList,
  Handshake,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ListingCard } from "@/components/listings/ListingCard";
import { ReviewCard } from "@/components/profiles/ReviewCard";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface BrokerProfileProps {
  broker: {
    id: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    phone: string | null;
    brokerageName: string | null;
    brokerageWebsite: string | null;
    brokeragePhone: string | null;
    instagramUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    facebookUrl: string | null;
    tiktokUrl: string | null;
    memberSince: string;
    stats: {
      totalListings: number;
      activeListings: number;
      dealsClosed: number;
      reviewCount: number;
      avgRating: number;
    };
    ratingBreakdown: { rating: number; count: number }[];
    activeListings: any[];
    underContractListings: any[];
    soldListings: any[];
    reviews: any[];
  };
  currentUserId?: string | null;
}

export function BrokerProfile({ broker, currentUserId }: BrokerProfileProps) {
  const [activeTab, setActiveTab] = useState("active");

  const initials = broker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOwnProfile = currentUserId === broker.id;
  const isLoggedIn = !!currentUserId;
  const canReview = isLoggedIn && !isOwnProfile;
  const loginCallback = `/login?callbackUrl=${encodeURIComponent(`/advisors/${broker.id}#reviews`)}`;

  function jumpToReviews() {
    setActiveTab("reviews");
    // Scroll the tab content into view in case of a long page
    setTimeout(() => {
      document
        .getElementById("reviews-tab-anchor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function handleReport(reviewId: string) {
    if (!isLoggedIn) {
      toast.error("Please sign in to report a review");
      return;
    }
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REVIEW",
          reason: "OTHER",
          reviewId,
        }),
      });
      if (res.ok) {
        toast.success("Review reported. Our team will look into it.");
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to report review");
      }
    } catch {
      toast.error("Failed to report review");
    }
  }

  const memberDate = new Date(broker.memberSince);
  const monthsOnPlatform = Math.max(
    1,
    Math.floor(
      (Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    ),
  );

  const LeaveReviewButton = (() => {
    if (isOwnProfile) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" disabled>
                  <Star className="mr-2 h-4 w-4" />
                  Leave a Review
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>You can&apos;t review your own profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (!isLoggedIn) {
      return (
        <Button asChild variant="default">
          <Link href={loginCallback}>
            <Star className="mr-2 h-4 w-4" />
            Sign in to Leave a Review
          </Link>
        </Button>
      );
    }
    return (
      <Button onClick={jumpToReviews}>
        <Star className="mr-2 h-4 w-4" />
        Leave a Review
      </Button>
    );
  })();

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <Avatar className="h-24 w-24 md:h-32 md:w-32">
          <AvatarImage src={broker.avatarUrl || undefined} alt={broker.name} />
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{broker.name}</h1>
              <Badge className="bg-teal-600 text-white">Business Advisor</Badge>
            </div>
            <div className="flex items-center gap-2">{LeaveReviewButton}</div>
          </div>

          {broker.brokerageName && (
            <p className="text-lg text-muted-foreground">
              {broker.brokerageName}
            </p>
          )}

          {/* Rating — clickable, jumps to Reviews tab */}
          {broker.stats.reviewCount > 0 ? (
            <button
              type="button"
              onClick={jumpToReviews}
              className="flex items-center gap-2 rounded-md -ml-1 px-1 py-0.5 transition-colors hover:bg-muted text-left"
              aria-label={`View ${broker.stats.reviewCount} reviews`}
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(broker.stats.avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{broker.stats.avgRating}</span>
              <span className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                ({broker.stats.reviewCount} review
                {broker.stats.reviewCount !== 1 ? "s" : ""})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={jumpToReviews}
              className="text-sm text-muted-foreground hover:underline -ml-1 px-1 py-0.5"
            >
              No reviews yet — be the first
            </button>
          )}

          {/* Contact info */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {(broker.brokeragePhone || broker.phone) && (
              <a
                href={`tel:${broker.brokeragePhone || broker.phone}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                {broker.brokeragePhone || broker.phone}
              </a>
            )}
            {broker.brokerageWebsite && (
              <a
                href={broker.brokerageWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                Website
              </a>
            )}
            {broker.instagramUrl && (
              <a
                href={broker.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {broker.linkedinUrl && (
              <a
                href={broker.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
          </div>

          {broker.bio && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {broker.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <LayoutList className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{broker.stats.totalListings}</p>
          <p className="text-xs text-muted-foreground">Total Listings</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <ExternalLink className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{broker.stats.activeListings}</p>
          <p className="text-xs text-muted-foreground">Active Listings</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <Handshake className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{broker.stats.dealsClosed}</p>
          <p className="text-xs text-muted-foreground">Deals Closed</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{broker.stats.reviewCount}</p>
          <p className="text-xs text-muted-foreground">Reviews</p>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({broker.activeListings.length})
          </TabsTrigger>
          <TabsTrigger value="under-contract">
            Under Contract ({broker.underContractListings.length})
          </TabsTrigger>
          <TabsTrigger value="sold">
            Sold ({broker.soldListings.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({broker.stats.reviewCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {broker.activeListings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active listings at this time.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {broker.activeListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="under-contract" className="mt-6">
          {broker.underContractListings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No listings under contract.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {broker.underContractListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sold" className="mt-6">
          {broker.soldListings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No completed deals yet.
            </p>
          ) : (
            <div className="space-y-4">
              {broker.soldListings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {listing.neighborhood},{" "}
                      {listing.borough
                        .split("_")
                        .map(
                          (w: string) =>
                            w.charAt(0).toUpperCase() +
                            w.slice(1).toLowerCase(),
                        )
                        .join(" ")}
                    </p>
                  </div>
                  <div className="text-right">
                    {listing.soldPrice && (
                      <p className="font-semibold">
                        {formatCurrency(Number(listing.soldPrice))}
                      </p>
                    )}
                    {listing.soldDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(listing.soldDate).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div id="reviews-tab-anchor" className="space-y-6">
            {/* Rating breakdown */}
            {broker.stats.reviewCount > 0 && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold">
                    {broker.stats.avgRating}
                  </span>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(broker.stats.avgRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {broker.stats.reviewCount} review
                      {broker.stats.reviewCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {broker.ratingBreakdown.map(({ rating, count }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width:
                            broker.stats.reviewCount > 0
                              ? `${(count / broker.stats.reviewCount) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              {broker.reviews.map((review: any) => (
                <ReviewCard
                  key={review.id}
                  review={{
                    ...review,
                    createdAt:
                      typeof review.createdAt === "string"
                        ? review.createdAt
                        : new Date(review.createdAt).toISOString(),
                  }}
                  brokerName={broker.name}
                  brokerId={broker.id}
                  isOwnProfile={isOwnProfile}
                  onReport={isLoggedIn ? handleReport : undefined}
                  onResponded={() => window.location.reload()}
                />
              ))}
            </div>

            {broker.reviews.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No reviews yet.
              </p>
            )}

            {/* Leave a Review form (inline) */}
            {canReview && (
              <ReviewForm brokerId={broker.id} brokerName={broker.name} />
            )}

            {!isLoggedIn && (
              <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to share your experience with this advisor.
                </p>
                <Button asChild>
                  <Link href={loginCallback}>Sign in to Leave a Review</Link>
                </Button>
              </div>
            )}

            {isOwnProfile && (
              <p className="text-center text-xs text-muted-foreground">
                You can&apos;t review your own profile, but you can respond to
                reviews above.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
