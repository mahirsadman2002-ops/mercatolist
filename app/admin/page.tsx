import type { Metadata } from "next";

// Components needed: AnalyticsDashboard with charts and metrics
// import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | MercatoList",
  description: "MercatoList admin dashboard with analytics and site overview.",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">Admin analytics overview — coming soon</p>
    </div>
  );
}
