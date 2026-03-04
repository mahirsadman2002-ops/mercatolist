import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Admin | MercatoList",
  description: "Detailed site analytics — views, engagement, marketplace health.",
};

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Detailed Analytics</h1>
      <p className="text-muted-foreground">Detailed analytics with charts — coming soon</p>
    </div>
  );
}
