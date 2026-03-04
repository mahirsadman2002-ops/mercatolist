import type { Metadata } from "next";

interface BrokerProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BrokerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Broker Profile | MercatoList`,
    description: `View broker profile, listings, reviews, and deal history.`,
  };
}

export default async function BrokerProfilePage({ params }: BrokerProfilePageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Broker Profile</h1>
      <p className="text-muted-foreground">Broker profile page for {id} — coming soon</p>
    </div>
  );
}
