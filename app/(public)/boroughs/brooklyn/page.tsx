import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Businesses for Sale in Brooklyn, NYC | MercatoList",
  description:
    "Browse businesses for sale in Brooklyn. Restaurants, retail, services, and more available in NYC's most diverse borough.",
  openGraph: {
    title: "Businesses for Sale in Brooklyn, NYC | MercatoList",
    description:
      "Browse businesses for sale in Brooklyn. Restaurants, retail, services, and more available in NYC's most diverse borough.",
  },
};

export default function BrooklynPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Businesses for Sale in Brooklyn</h1>
      <p className="text-muted-foreground">Brooklyn borough page — coming soon</p>
    </div>
  );
}
