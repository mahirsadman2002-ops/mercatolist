import type { Metadata } from "next";

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Collection | MercatoList",
  description: "View collection details and listings.",
};

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Collection</h1>
      <p className="text-muted-foreground">Collection {id} — coming soon</p>
    </div>
  );
}
