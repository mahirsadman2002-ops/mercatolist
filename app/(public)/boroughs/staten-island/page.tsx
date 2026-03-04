import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Businesses for Sale in Staten Island, NYC | MercatoList",
  description:
    "Browse businesses for sale in Staten Island. Restaurants, retail, services, and more available in NYC's greenest borough.",
  openGraph: {
    title: "Businesses for Sale in Staten Island, NYC | MercatoList",
    description:
      "Browse businesses for sale in Staten Island. Restaurants, retail, services, and more available in NYC's greenest borough.",
  },
};

export default function StatenIslandPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Businesses for Sale in Staten Island</h1>
      <p className="text-muted-foreground">Staten Island borough page — coming soon</p>
    </div>
  );
}
