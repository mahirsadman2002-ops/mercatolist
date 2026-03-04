import type { Metadata } from "next";

interface BoroughCategoryPageProps {
  params: Promise<{ borough: string; category: string }>;
}

export async function generateMetadata({ params }: BoroughCategoryPageProps): Promise<Metadata> {
  const { borough, category } = await params;
  const boroughName = decodeURIComponent(borough).replace(/-/g, " ");
  const categoryName = decodeURIComponent(category).replace(/-/g, " ");
  return {
    title: `${categoryName} for Sale in ${boroughName}, NYC | MercatoList`,
    description: `Browse ${categoryName.toLowerCase()} businesses for sale in ${boroughName}, New York City.`,
  };
}

export default async function BoroughCategoryPage({ params }: BoroughCategoryPageProps) {
  const { borough, category } = await params;
  const boroughName = decodeURIComponent(borough).replace(/-/g, " ");
  const categoryName = decodeURIComponent(category).replace(/-/g, " ");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{categoryName} for Sale in {boroughName}</h1>
      <p className="text-muted-foreground">Borough + category combo page — coming soon</p>
    </div>
  );
}
