import type { Metadata } from "next";

// Components needed: ListingForm (multi-step)
// import { ListingForm } from "@/components/forms/ListingForm";

export const metadata: Metadata = {
  title: "Create New Listing | MercatoList",
  description: "List your business for sale on MercatoList.",
};

export default function NewListingPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Create New Listing</h1>
      <p className="text-muted-foreground">Multi-step listing creation form — coming soon</p>
    </div>
  );
}
