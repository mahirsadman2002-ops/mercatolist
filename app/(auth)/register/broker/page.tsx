import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register as a Broker | MercatoList",
  description: "Join MercatoList as a business broker. List businesses, connect with buyers, and grow your practice.",
};

export default function BrokerRegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Register as a Broker</h1>
          <p className="text-muted-foreground mt-2">Join NYC&apos;s premier business marketplace as a broker</p>
        </div>
        <p className="text-muted-foreground text-center">Broker registration form — coming soon</p>
      </div>
    </div>
  );
}
