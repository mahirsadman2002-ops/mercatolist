// Dashboard layout with sidebar navigation
// Components needed: DashboardSidebar
// import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30 p-6">
        <nav className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Dashboard sidebar — coming soon</p>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
