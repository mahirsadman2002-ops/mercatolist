import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Account Type | MercatoList",
  description: "Select your account type — Buyer/Seller or Broker.",
};

export default function AccountTypePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">How will you use MercatoList?</h1>
          <p className="text-muted-foreground mt-2">Choose your account type</p>
        </div>
        <p className="text-muted-foreground text-center">Account type selection — coming soon</p>
      </div>
    </div>
  );
}
