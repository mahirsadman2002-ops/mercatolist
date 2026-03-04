import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Businesses for Sale in Queens, NYC | MercatoList",
  description:
    "Browse businesses for sale in Queens. Restaurants, retail, services, and more available in NYC's most ethnically diverse borough.",
  openGraph: {
    title: "Businesses for Sale in Queens, NYC | MercatoList",
    description:
      "Browse businesses for sale in Queens. Restaurants, retail, services, and more available in NYC's most ethnically diverse borough.",
  },
};

export default function QueensPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Businesses for Sale in Queens</h1>
      <p className="text-muted-foreground">Queens borough page — coming soon</p>
    </div>
  );
}
