import type { Metadata } from "next";

// Components needed: ListingCard, ListingGrid
// import { ListingGrid } from "@/components/listings/ListingGrid";

export const metadata: Metadata = {
  title: "Saved Listings | MercatoList",
  description: "View your saved business listings.",
};

export default function SavedListingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Saved Listings</h1>
      <p className="text-muted-foreground">Saved listings page — coming soon</p>
    </div>
  );
}
