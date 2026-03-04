import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Businesses for Sale in Manhattan, NYC | MercatoList",
  description:
    "Browse businesses for sale in Manhattan. Restaurants, retail, services, and more available in NYC's most iconic borough.",
  openGraph: {
    title: "Businesses for Sale in Manhattan, NYC | MercatoList",
    description:
      "Browse businesses for sale in Manhattan. Restaurants, retail, services, and more available in NYC's most iconic borough.",
  },
};

export default function ManhattanPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Businesses for Sale in Manhattan</h1>
      <p className="text-muted-foreground">Manhattan borough page — coming soon</p>
    </div>
  );
}
