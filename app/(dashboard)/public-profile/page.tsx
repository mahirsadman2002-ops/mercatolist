import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Profile | MercatoList",
  description: "Edit your public-facing profile on MercatoList.",
};

export default function PublicProfilePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Edit Public Profile</h1>
      <p className="text-muted-foreground">Public profile editor — coming soon</p>
    </div>
  );
}
