"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

interface SharedListingInterestProps {
  collectionId: string;
  listingId: string;
  initialInterest: boolean | null;
  sharedToken: string;
}

export function SharedListingInterest({
  collectionId,
  listingId,
  initialInterest,
  sharedToken,
}: SharedListingInterestProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;
  const [interest, setInterest] = useState<boolean | null>(initialInterest);
  const [isLoading, setIsLoading] = useState(false);

  const handleInterest = async (interested: boolean) => {
    if (!isLoggedIn) {
      router.push(
        `/signup-prompt?action=collection-interact&callbackUrl=${encodeURIComponent(`/collections/shared/${sharedToken}`)}`
      );
      return;
    }

    // Toggle off if clicking same button
    const newValue = interest === interested ? null : interested;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/listings/${listingId}/interest`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interested: newValue ?? false }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update interest");
      }

      setInterest(newValue);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update interest"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 pt-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleInterest(true);
        }}
        disabled={isLoading}
        className={`inline-flex items-center justify-center h-8 w-8 rounded-full border transition-colors ${
          interest === true
            ? "bg-emerald-100 border-emerald-300 text-emerald-600"
            : "bg-white border-border/60 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
        }`}
        title="Interested"
      >
        <ThumbsUp className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleInterest(false);
        }}
        disabled={isLoading}
        className={`inline-flex items-center justify-center h-8 w-8 rounded-full border transition-colors ${
          interest === false
            ? "bg-red-100 border-red-300 text-red-600"
            : "bg-white border-border/60 text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        }`}
        title="Not interested"
      >
        <ThumbsDown className="size-3.5" />
      </button>
    </div>
  );
}
