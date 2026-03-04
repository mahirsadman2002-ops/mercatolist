import type { Metadata } from "next";

// Components needed: BrokerDetailsForm with brokerage info fields
// import { BrokerDetailsForm } from "@/components/forms/BrokerDetailsForm";

export const metadata: Metadata = {
  title: "Broker Details | MercatoList",
  description: "Complete your broker profile with brokerage information.",
};

export default function BrokerDetailsPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Broker Details</h1>
          <p className="text-muted-foreground mt-2">Tell us about your brokerage</p>
        </div>
        <p className="text-muted-foreground text-center">Broker details form — coming soon</p>
      </div>
    </div>
  );
}
