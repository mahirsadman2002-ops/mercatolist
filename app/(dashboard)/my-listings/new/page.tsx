import type { Metadata } from "next";
import { ListingForm } from "@/components/forms/ListingForm";

export const metadata: Metadata = {
  title: "Create New Listing | MercatoList",
  description: "List your NYC business for sale on MercatoList.",
};

export default function NewListingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Create New Listing</h1>
        <p className="mt-2 text-muted-foreground">
          List your business for sale. Fill out the details below to get started.
        </p>
      </div>
      <ListingForm mode="create" />
    </div>
  );
}
