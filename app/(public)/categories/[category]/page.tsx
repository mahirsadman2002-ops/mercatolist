import type { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const name = decodeURIComponent(category).replace(/-/g, " ");
  return {
    title: `${name} for Sale in NYC | MercatoList`,
    description: `Browse ${name.toLowerCase()} businesses for sale across all five NYC boroughs.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const name = decodeURIComponent(category).replace(/-/g, " ");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{name} for Sale in NYC</h1>
      <p className="text-muted-foreground">Category page — coming soon</p>
    </div>
  );
}
