import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Businesses for Sale in the Bronx, NYC | MercatoList",
  description:
    "Browse businesses for sale in the Bronx. Restaurants, retail, services, and more available in NYC's northernmost borough.",
  openGraph: {
    title: "Businesses for Sale in the Bronx, NYC | MercatoList",
    description:
      "Browse businesses for sale in the Bronx. Restaurants, retail, services, and more available in NYC's northernmost borough.",
  },
};

export default function BronxPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Businesses for Sale in the Bronx</h1>
      <p className="text-muted-foreground">Bronx borough page — coming soon</p>
    </div>
  );
}
