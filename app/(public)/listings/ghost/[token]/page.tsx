import type { Metadata } from "next";

interface GhostListingPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Private Listing | MercatoList",
  description: "View a private business listing shared with you.",
  robots: { index: false, follow: false },
};

export default async function GhostListingPage({ params }: GhostListingPageProps) {
  const { token } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Private Listing</h1>
      <p className="text-muted-foreground">Ghost listing page for token: {token} — coming soon</p>
    </div>
  );
}
