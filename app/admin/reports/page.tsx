import type { Metadata } from "next";

// Components needed: ReportsList
// import { ReportsList } from "@/components/admin/ReportsList";

export const metadata: Metadata = {
  title: "Reports | Admin | MercatoList",
  description: "View and manage reported listings, reviews, deals, and users.",
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      <p className="text-muted-foreground">Reports management — coming soon</p>
    </div>
  );
}
