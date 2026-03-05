"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Star, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const brokerId = params.id as string;
  const token = searchParams.get("token");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [brokerName, setBrokerName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch broker info
    fetch(`/api/brokers/${brokerId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBrokerName(json.data.name);
        } else {
          setError("Broker not found");
        }
      })
      .catch(() => setError("Failed to load broker info"));
  }, [brokerId]);

  async function handleSubmit() {
    if (!rating || text.length < 20) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brokers/${brokerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text, token }),
      });
      const json = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        toast.error(json.error || "Failed to submit review");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
        <p className="text-muted-foreground">
          Your review for {brokerName} has been submitted.
        </p>
        <Button className="mt-6" asChild>
          <a href={`/brokers/${brokerId}`}>View Broker Profile</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>
            {brokerName
              ? `Review ${brokerName}`
              : "Leave a Review"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Your Review ({text.length}/2000)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 2000))}
              placeholder="Share your experience working with this broker... (minimum 20 characters)"
              rows={6}
            />
            {text.length > 0 && text.length < 20 && (
              <p className="text-xs text-muted-foreground">
                {20 - text.length} more characters needed
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !rating || text.length < 20}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You must be signed in to submit a review. Your review will be
            publicly visible on the broker&apos;s profile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
