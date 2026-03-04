import type { Metadata } from "next";

// Components needed: Client list, CollectionManager for client assignments

export const metadata: Metadata = {
  title: "My Clients | MercatoList",
  description: "Manage your buyer clients and their collections.",
};

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Clients</h1>
      <p className="text-muted-foreground">Broker client management — coming soon</p>
    </div>
  );
}
