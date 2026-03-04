// Admin layout with admin-specific sidebar navigation
// Components needed: AdminSidebar
// import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden md:flex w-64 flex-col border-r bg-neutral-950 text-white p-6">
        <h2 className="text-lg font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <p className="text-sm text-neutral-400">Admin sidebar — coming soon</p>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
