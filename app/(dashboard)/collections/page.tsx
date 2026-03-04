import type { Metadata } from "next";

// Components needed: CollectionCard, CollectionManager
// import { CollectionCard } from "@/components/collections/CollectionCard";

export const metadata: Metadata = {
  title: "Collections | MercatoList",
  description: "Organize saved businesses into collections.",
};

export default function CollectionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Collections</h1>
      <p className="text-muted-foreground">Collections management — coming soon</p>
    </div>
  );
}
