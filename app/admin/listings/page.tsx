import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Listings | Admin | MercatoList",
  description: "Admin listing management — view, edit, and manage all business listings.",
};

export default function AdminListingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Listings</h1>
      <p className="text-muted-foreground">Admin listings management with sold data entry — coming soon</p>
    </div>
  );
}
