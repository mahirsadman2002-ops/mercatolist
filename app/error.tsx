"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const truncatedMessage =
    error.message.length > 200
      ? error.message.slice(0, 200) + "..."
      : error.message;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="mx-auto max-w-md space-y-6 py-16 text-center">
        <p className="font-heading text-2xl font-bold">MercatoList</p>

        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again or return to
            the homepage.
          </p>
        </div>

        {truncatedMessage && (
          <p className="text-sm text-muted-foreground/70">{truncatedMessage}</p>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
