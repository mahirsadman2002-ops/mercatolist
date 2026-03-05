"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import {
  LayoutList,
  MessageSquare,
  Heart,
  FolderOpen,
  Bell,
  Users,
  Settings,
  User,
  Shield,
  Search,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const mainLinks = [
  { label: "My Listings", href: "/my-listings", icon: LayoutList },
  { label: "Inquiries", href: "/inquiries", icon: MessageSquare },
  { label: "Saved Listings", href: "/saved", icon: Heart },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Saved Searches", href: "/saved-searches", icon: Search },
];

const settingsLinks = [
  { label: "Profile Settings", href: "/profile", icon: Settings },
  { label: "Public Profile", href: "/public-profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const isBroker = user.role === "BROKER";
  const isAdmin = user.role === "ADMIN";
  const initials = (user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const allLinks = [
    ...mainLinks,
    ...(isBroker
      ? [{ label: "Clients", href: "/clients", icon: Users }]
      : []),
  ];

  const adminLinks = isAdmin
    ? [{ label: "Admin Dashboard", href: "/admin", icon: Shield }]
    : [];

  function NavLink({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) {
    const isActive =
      pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        {/* User info */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <Badge
              variant="secondary"
              className="text-[10px] font-medium mt-0.5"
            >
              {user.role === "BROKER"
                ? "Broker"
                : user.role === "ADMIN"
                  ? "Admin"
                  : "Member"}
            </Badge>
          </div>
        </div>

        <Separator className="mx-3" />

        {/* Main navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {allLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}

          <Separator className="my-3" />

          {settingsLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}

          {adminLinks.length > 0 && (
            <>
              <Separator className="my-3" />
              {adminLinks.map((link) => (
                <NavLink key={link.href} {...link} />
              ))}
            </>
          )}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile: horizontal scrollable tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
        <nav className="flex overflow-x-auto px-2 py-2 gap-1 scrollbar-hide">
          {[...allLinks, ...settingsLinks].map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href + "/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-medium whitespace-nowrap transition-colors min-w-[60px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content area */}
      <main className="flex-1 p-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
}
