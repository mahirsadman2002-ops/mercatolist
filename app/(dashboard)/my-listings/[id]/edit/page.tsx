import type { Metadata } from "next";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Listing | MercatoList",
  description: "Edit your business listing on MercatoList.",
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Edit Listing</h1>
      <p className="text-muted-foreground">Edit listing {id} — coming soon</p>
    </div>
  );
}
