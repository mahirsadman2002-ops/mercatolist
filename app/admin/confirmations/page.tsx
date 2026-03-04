import type { Metadata } from "next";

// Components needed: ConfirmationTracker
// import { ConfirmationTracker } from "@/components/admin/ConfirmationTracker";

export const metadata: Metadata = {
  title: "Listing Confirmations | Admin | MercatoList",
  description: "Track listing status confirmations from owners.",
};

export default function AdminConfirmationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Listing Status Confirmations</h1>
      <p className="text-muted-foreground">Confirmation tracking — coming soon</p>
    </div>
  );
}
