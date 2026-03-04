import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find a Business Broker in NYC | MercatoList",
  description:
    "Browse verified business brokers across New York City. Find the right broker to help you buy or sell a business.",
  openGraph: {
    title: "Find a Business Broker in NYC | MercatoList",
    description:
      "Browse verified business brokers across New York City.",
  },
};

export default function BrokersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find a Business Broker in NYC</h1>
      <p className="text-muted-foreground">Broker directory — coming soon</p>
    </div>
  );
}
