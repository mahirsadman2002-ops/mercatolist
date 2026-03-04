import type { Metadata } from "next";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `User Profile | MercatoList`,
    description: `View user profile and business listings.`,
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <p className="text-muted-foreground">User profile for {id} — coming soon</p>
    </div>
  );
}
