import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | MercatoList",
  description: "Get in touch with the MercatoList team. We're here to help with questions about buying or selling businesses in NYC.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <p className="text-muted-foreground">Contact page — coming soon</p>
    </div>
  );
}
