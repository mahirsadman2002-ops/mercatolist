"use client";

import { useState } from "react";
import { Star, ShoppingBag, Briefcase, Handshake, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ExperienceType = "BOUGHT" | "SOLD" | "COLLABORATED";

interface ReviewFormProps {
  brokerId: string;
  brokerName: string;
  /** When true, hides the surrounding card chrome (caller renders its own). */
  embedded?: boolean;
  /** Called after successful submit. */
  onSubmitted?: () => void;
}

const EXPERIENCE_OPTIONS: {
  value: ExperienceType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "BOUGHT",
    label: "I bought a business",
    description: "Purchased through this advisor",
    icon: ShoppingBag,
  },
  {
    value: "SOLD",
    label: "I sold a business",
    description: "Listed and sold with this advisor",
    icon: Briefcase,
  },
  {
    value: "COLLABORATED",
    label: "We collaborated",
    description: "Worked together in another capacity",
    icon: Handshake,
  },
];

export function ReviewForm({
  brokerId,
  brokerName,
  embedded,
  onSubmitted,
}: ReviewFormProps) {
  const [experienceType, setExperienceType] = useState<ExperienceType | null>(
    null,
  );
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [transactionYear, setTransactionYear] = useState("");
  const [transactionPrice, setTransactionPrice] = useState("");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isTransaction =
    experienceType === "BOUGHT" || experienceType === "SOLD";

  const hasOptionalTransactionDetails =
    isTransaction &&
    (businessName.trim() ||
      businessAddress.trim() ||
      transactionYear.trim() ||
      transactionPrice.trim());

  const disabledReason = (() => {
    if (!experienceType) return "Select your experience type";
    if (!rating) return "Select a rating";
    if (isTransaction && !businessCategory)
      return "Select the type of business";
    return null;
  })();

  async function handleSubmit() {
    if (disabledReason) return;
    setSubmitting(true);
    try {
      const payload = {
        rating,
        text: text || undefined,
        experienceType,
        businessCategory: isTransaction ? businessCategory : undefined,
        businessName: businessName.trim() || undefined,
        businessAddress: businessAddress.trim() || undefined,
        transactionYear: transactionYear ? parseInt(transactionYear) : undefined,
        transactionPrice: transactionPrice
          ? parseFloat(transactionPrice)
          : undefined,
      };

      const res = await fetch(`/api/advisors/${brokerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok) {
        toast.success("Review submitted");
        if (onSubmitted) {
          onSubmitted();
        } else {
          window.location.reload();
        }
      } else {
        toast.error(json.error || "Failed to submit review");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <div
      className={cn(
        "space-y-6",
        !embedded && "rounded-lg border bg-card p-6",
      )}
    >
      {!embedded && (
        <div>
          <h2 className="text-xl font-semibold">
            Leave a Review for {brokerName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Share your experience to help other buyers and sellers.
          </p>
        </div>
      )}

      {/* Experience type */}
      <div className="space-y-3">
        <Label>Your experience</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {EXPERIENCE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = experienceType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExperienceType(opt.value)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction fields — shown for BOUGHT or SOLD */}
      {isTransaction && (
        <div className="space-y-4 rounded-md border border-dashed p-4">
          <div className="space-y-2">
            <Label>
              Type of business <span className="text-destructive">*</span>
            </Label>
            <CategoryCombobox
              value={businessCategory}
              onValueChange={setBusinessCategory}
              placeholder="Search or select a category"
            />
            <p className="text-xs text-muted-foreground">
              Required. E.g. Deli, Medical Practice, Salon.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Business name (optional)</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Joe's Pizza"
              />
            </div>
            <div className="space-y-2">
              <Label>Year of transaction (optional)</Label>
              <Input
                type="number"
                min="1900"
                max={currentYear + 1}
                value={transactionYear}
                onChange={(e) => setTransactionYear(e.target.value)}
                placeholder={String(currentYear)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address (optional)</Label>
              <Input
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Brooklyn, NY"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Sale price (optional, USD)</Label>
              <Input
                type="number"
                min="0"
                value={transactionPrice}
                onChange={(e) => setTransactionPrice(e.target.value)}
                placeholder="e.g. 250000"
              />
            </div>
          </div>

          {hasOptionalTransactionDetails && (
            <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Adding these details may add this business to MercatoList&apos;s
                sold-listings database after our team verifies the transaction.
                You&apos;ll be contacted to confirm before anything is
                published.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      <div className="space-y-2">
        <Label>
          Rating <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <Label>Your review (optional)</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          placeholder="Tell others what stood out about working with this advisor..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          {text.length}/2000 characters. Reviews with detail tend to be more
          helpful — but text is optional.
        </p>
      </div>

      {/* Submit */}
      <div className="space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !!disabledReason}
          className="w-full"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
        {disabledReason && !submitting && (
          <p className="text-center text-xs text-muted-foreground">
            {disabledReason}
          </p>
        )}
      </div>
    </div>
  );
}
