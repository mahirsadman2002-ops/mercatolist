import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MercatoList | NYC Business Marketplace",
  description:
    "MercatoList is New York City's premier marketplace for buying and selling businesses. Learn about our mission and story.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">About MercatoList</h1>
      <p className="text-muted-foreground">About page — coming soon</p>
    </div>
  );
}
