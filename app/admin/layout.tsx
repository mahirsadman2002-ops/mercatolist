"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Users,
  Flag,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BadgeCounts {
  pendingReports: number;
  overdueConfirmations: number;
}

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/listings", label: "Listings", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: Flag, badgeKey: "pendingReports" as const },
  { href: "/admin/confirmations", label: "Confirmations", icon: CheckCircle2, badgeKey: "overdueConfirmations" as const },
  { href: "/admin/blog", label: "Blog", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({ pendingReports: 0, overdueConfirmations: 0 });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetch("/api/admin/analytics/overview")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBadges({
            pendingReports: data.data?.pendingReports ?? 0,
            overdueConfirmations: data.data?.overdueConfirmations ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (status === "loading" || !session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="text-lg font-bold text-white tracking-tight">MercatoList</span>
        <Badge variant="secondary" className="bg-teal-600/20 text-teal-400 text-[10px] uppercase tracking-wider border-0">
          Admin
        </Badge>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                  {badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-800 px-3 py-3 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site
        </Link>
        <Link
          href="/my-listings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="border-t border-neutral-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback className="bg-neutral-700 text-xs text-white">
              {session.user.name?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{session.user.name}</p>
            <p className="truncate text-xs text-neutral-500">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-neutral-950 border-r border-neutral-800 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-neutral-950 p-0 border-neutral-800">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Admin Panel</span>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50/50 p-6">{children}</main>
      </div>
    </div>
  );
}
