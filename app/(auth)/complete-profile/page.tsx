import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile | MercatoList",
  description: "Complete your profile setup to start using MercatoList.",
};

export default function CompleteProfilePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">Just a few more details to get started</p>
        </div>
        <p className="text-muted-foreground text-center">Profile completion form — coming soon</p>
      </div>
    </div>
  );
}
