import type { Metadata } from "next";

// Components needed: ListingCard with edit/analytics, ListingStatusBadge
// import { ListingCard } from "@/components/listings/ListingCard";

export const metadata: Metadata = {
  title: "My Listings | MercatoList",
  description: "Manage your business listings on MercatoList.",
};

export default function MyListingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Listings</h1>
      </div>
      <p className="text-muted-foreground">My listings management page — coming soon</p>
    </div>
  );
}
