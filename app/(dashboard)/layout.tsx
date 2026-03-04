import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Heart,
  FolderOpen,
  Search,
  User,
  Bell,
} from "lucide-react";

const sidebarLinks = [
  { label: "My Listings", href: "/my-listings", icon: FileText },
  { label: "Inquiries", href: "/inquiries", icon: MessageSquare },
  { label: "Saved Listings", href: "/saved", icon: Heart },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Saved Searches", href: "/saved-searches", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-6">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
