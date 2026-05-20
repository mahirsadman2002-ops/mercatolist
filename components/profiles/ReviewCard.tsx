"use client";

import { useState } from "react";
import { Star, Flag, MessageSquareReply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export type ExperienceType = "BOUGHT" | "SOLD" | "COLLABORATED";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    text: string | null;
    createdAt: string;
    experienceType?: ExperienceType | null;
    businessCategory?: string | null;
    businessName?: string | null;
    transactionYear?: number | null;
    transactionPrice?: number | string | null;
    response?: string | null;
    responseAt?: string | null;
    reviewer: {
      id: string;
      name: string;
      displayName?: string | null;
      avatarUrl?: string | null;
    };
  };
  /** Name of the broker this review is for — used in the auto sentence. */
  brokerName: string;
  brokerId: string;
  /** If true, the viewer is the broker themselves — show Respond/Report controls. */
  isOwnProfile?: boolean;
  onReport?: (reviewId: string) => void;
  onResponded?: () => void;
}

function buildExperienceSentence(
  reviewerName: string,
  brokerName: string,
  review: ReviewCardProps["review"],
): string | null {
  if (!review.experienceType) return null;

  if (review.experienceType === "COLLABORATED") {
    return `${reviewerName} collaborated with ${brokerName}.`;
  }

  const verb = review.experienceType === "BOUGHT" ? "bought" : "sold";
  const what = review.businessName
    ? review.businessName
    : review.businessCategory
      ? `a ${review.businessCategory.toLowerCase()}`
      : "a business";
  const year = review.transactionYear ? ` in ${review.transactionYear}` : "";

  return `${reviewerName} ${verb} ${what} with ${brokerName}${year}.`;
}

export function ReviewCard({
  review,
  brokerName,
  brokerId,
  isOwnProfile,
  onReport,
  onResponded,
}: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const reviewerName = review.reviewer.displayName || review.reviewer.name;
  const initials = reviewerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sentence = buildExperienceSentence(reviewerName, brokerName, review);

  const priceLabel = review.transactionPrice
    ? formatCurrency(Number(review.transactionPrice))
    : null;

  async function handleSubmitResponse() {
    if (!responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      const res = await fetch(
        `/api/advisors/${brokerId}/reviews/${review.id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: responseText.trim() }),
        },
      );
      const json = await res.json();
      if (res.ok) {
        toast.success("Response posted");
        setShowResponseForm(false);
        setResponseText("");
        onResponded?.();
      } else {
        toast.error(json.error || "Failed to post response");
      }
    } catch {
      toast.error("Failed to post response");
    } finally {
      setSubmittingResponse(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={review.reviewer.avatarUrl || undefined}
              alt={reviewerName}
            />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{reviewerName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {onReport && !isOwnProfile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onReport(review.id)}
              title="Report review"
            >
              <Flag className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Auto-generated experience sentence */}
      {sentence && (
        <p className="text-sm font-medium">
          {sentence}
          {priceLabel && (
            <span className="ml-1 text-muted-foreground">
              · Sold for {priceLabel}
            </span>
          )}
        </p>
      )}

      {/* Category tag */}
      {review.businessCategory && (
        <div>
          <Badge variant="secondary" className="text-xs font-normal">
            {review.businessCategory}
          </Badge>
        </div>
      )}

      {/* Review text */}
      {review.text && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.text}
        </p>
      )}

      {/* Broker response */}
      {review.response && (
        <div className="rounded-md border-l-4 border-primary/50 bg-muted/40 p-3 ml-4">
          <p className="text-xs font-semibold mb-1">
            Reply from {brokerName}
            {review.responseAt && (
              <span className="ml-2 font-normal text-muted-foreground">
                {new Date(review.responseAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.response}
          </p>
        </div>
      )}

      {/* Broker-only controls */}
      {isOwnProfile && !review.response && (
        <div className="flex justify-end pt-1">
          {!showResponseForm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResponseForm(true)}
            >
              <MessageSquareReply className="mr-2 h-4 w-4" />
              Respond
            </Button>
          ) : (
            <div className="w-full space-y-2">
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value.slice(0, 2000))}
                placeholder="Write a public reply to this review..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitResponse}
                  disabled={submittingResponse || !responseText.trim()}
                >
                  {submittingResponse ? "Posting..." : "Post Response"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
