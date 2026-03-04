import type { Metadata } from "next";

// Components needed: InquiryList, MessageThread, Tabs
// import { MessageThread } from "@/components/forms/MessageThread";

export const metadata: Metadata = {
  title: "Inquiries | MercatoList",
  description: "View and respond to inquiries about your business listings.",
};

export default function InquiriesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inquiries</h1>
      <p className="text-muted-foreground">Unified inbox with Received + Sent tabs — coming soon</p>
    </div>
  );
}
