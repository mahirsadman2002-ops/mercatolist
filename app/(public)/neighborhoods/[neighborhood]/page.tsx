import type { Metadata } from "next";

interface NeighborhoodPageProps {
  params: Promise<{ neighborhood: string }>;
}

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { neighborhood } = await params;
  const name = decodeURIComponent(neighborhood).replace(/-/g, " ");
  return {
    title: `Businesses for Sale in ${name}, NYC | MercatoList`,
    description: `Browse businesses for sale in ${name}. Find restaurants, retail, services, and more.`,
  };
}

export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { neighborhood } = await params;
  const name = decodeURIComponent(neighborhood).replace(/-/g, " ");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Businesses for Sale in {name}</h1>
      <p className="text-muted-foreground">Neighborhood page — coming soon</p>
    </div>
  );
}
