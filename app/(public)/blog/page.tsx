import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Buying & Selling Businesses in NYC | MercatoList",
  description:
    "Expert insights on buying and selling businesses in New York City. Market trends, guides, and success stories.",
};

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">MercatoList Blog</h1>
      <p className="text-muted-foreground">Blog index — coming soon</p>
    </div>
  );
}
