import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="mx-auto max-w-lg space-y-8 py-16 text-center">
        <p className="font-heading text-8xl font-bold text-muted-foreground/20">
          404
        </p>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            This page got lost in the subway
          </h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <SearchBar variant="compact" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/listings">
              Browse Listings
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/boroughs/manhattan">
              View Boroughs
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">
              Go Home
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
