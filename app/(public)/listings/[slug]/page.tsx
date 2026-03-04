import type { Metadata } from "next";

// Components needed: ListingDetail, PhotoGallery, FinancialInfo, BusinessDetails, ListingContactSidebar, ListingMap
// import { ListingDetail } from "@/components/listings/ListingDetail";
// import { PhotoGallery } from "@/components/listings/PhotoGallery";

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  // TODO: Fetch listing data and generate dynamic metadata
  return {
    title: `Business for Sale — ${slug} | MercatoList`,
    description: `View details for this business listing in NYC.`,
  };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Listing: {slug}</h1>
      <p className="text-muted-foreground">Listing detail page — coming soon</p>
    </div>
  );
}
