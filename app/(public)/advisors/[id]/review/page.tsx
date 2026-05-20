"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/forms/ReviewForm";

export default function ReviewPage() {
  const params = useParams();
  const advisorId = params.id as string;

  const [advisorName, setAdvisorName] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/advisors/${advisorId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setAdvisorName(json.data.name);
        } else {
          setError("Advisor not found");
        }
      })
      .catch(() => setError("Failed to load advisor info"));
  }, [advisorId]);

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
          Your review for {advisorName} has been submitted.
        </p>
        <Button className="mt-6" asChild>
          <a href={`/advisors/${advisorId}`}>View Advisor Profile</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ReviewForm
        brokerId={advisorId}
        brokerName={advisorName || "this advisor"}
        onSubmitted={() => setSubmitted(true)}
      />
      <p className="text-xs text-muted-foreground text-center mt-6">
        You must be signed in to submit a review. Your review will be publicly
        visible on the advisor&apos;s profile.
      </p>
    </div>
  );
}
