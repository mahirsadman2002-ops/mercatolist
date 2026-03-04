import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Searches | MercatoList",
  description: "Manage your saved searches and listing alerts.",
};

export default function SavedSearchesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Saved Searches</h1>
      <p className="text-muted-foreground">Saved searches and alerts management — coming soon</p>
    </div>
  );
}
