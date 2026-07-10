"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  Heart,
  MessageSquare,
  ChevronDown,
  LogOut,
  User,
  FileText,
  FolderOpen,
  Search,
  Users,
  Shield,
  Settings,
  Globe,
  LayoutList,
  Building2,
  Compass,
  PlusCircle,
  Eye,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BADGE_REFRESH_EVENT } from "@/lib/badge-events";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user;
  const userRole = user?.role;
  const isBroker = userRole === "BROKER";

  // Build a callbackUrl from the current pathname so login returns the user
  // to where they were. We skip useSearchParams() here because reading query
  // strings at the top of Header forces every page into dynamic rendering.
  // Skip on auth pages themselves to avoid loops.
  const isAuthPage =
    pathname === "/login" ||
    pathname?.startsWith("/register") ||
    pathname === "/signup-prompt";
  const currentUrl = pathname && !isAuthPage ? pathname : null;
  const loginHref = currentUrl
    ? `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
    : "/login";
  const registerHref = currentUrl
    ? `/register?callbackUrl=${encodeURIComponent(currentUrl)}`
    : "/register";
  const isAdmin = userRole === "ADMIN";
  const [unreadCount, setUnreadCount] = useState(0);
  const [collectionBadge, setCollectionBadge] = useState(0);

  // Fetch unread count + collection stats
  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const [inqRes, statsRes] = await Promise.all([
        fetch("/api/inquiries/unread-count"),
        fetch("/api/user/collection-stats"),
      ]);
      if (inqRes.ok) {
        const json = await inqRes.json();
        if (json.success) setUnreadCount(json.data.count);
      }
      if (statsRes.ok) {
        const json = await statsRes.json();
        if (json.success) {
          setCollectionBadge(
            (json.data.unreadNotes || 0) + (json.data.pendingRequests || 0),
          );
        }
      }
    } catch {
      // Silent
    }
  }, [user]);

  // Initial fetch + polling every 30s, plus immediate refresh whenever
  // something marks messages read (so the red badge clears right away).
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    window.addEventListener(BADGE_REFRESH_EVENT, fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener(BADGE_REFRESH_EVENT, fetchUnread);
    };
  }, [fetchUnread]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight">
            Mercato<span className="text-accent">List</span>
          </span>
          <span className="rounded-full border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-accent">
            Beta
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/listings" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Browse Businesses
          </Link>
          <Link
            href={user ? "/my-listings/new" : "/list-your-business"}
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            {isBroker ? "List a Business" : "Sell Your Business"}
          </Link>
          <Link href="/advisors" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Find an Advisor
          </Link>
          <Link href="/research" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Research
          </Link>
          <Link href="/blog" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Blog
          </Link>
        </nav>

        {/* Desktop Auth / Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle className="text-primary-foreground/80 hover:text-primary-foreground" />
          {user ? (
            <>
              <Link href="/saved">
                <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/inquiries" className="relative">
                <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  <MessageSquare className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-[20px] justify-center px-1 text-[10px] font-bold"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate text-sm">{user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {isBroker && (
                        <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0">Advisor</Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-listings" className="gap-2">
                      <FileText className="h-4 w-4" /> My Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/inquiries" className="gap-2">
                      <MessageSquare className="h-4 w-4" /> Inquiries
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-[10px]"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/saved" className="gap-2">
                      <Heart className="h-4 w-4" /> Saved Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/collections" className="gap-2">
                      <FolderOpen className="h-4 w-4" /> Collections
                      {collectionBadge > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-[10px]"
                        >
                          {collectionBadge > 99 ? "99+" : collectionBadge}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  {isBroker && (
                    <DropdownMenuItem asChild>
                      <Link href="/clients" className="gap-2">
                        <Users className="h-4 w-4" /> Clients
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/saved-searches" className="gap-2">
                      <Search className="h-4 w-4" /> Saved Searches
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="gap-2">
                        <Shield className="h-4 w-4" /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="gap-2">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={isBroker ? `/advisors/${user.id}` : `/profile/${user.id}`}
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" /> View Public Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/register/advisor">
                <Button size="sm" className="bg-amber-400 text-amber-950 hover:bg-amber-500 font-semibold shadow-sm">
                  Register as Business Advisor
                </Button>
              </Link>
              <Link href={registerHref}>
                <Button size="sm" className="bg-teal-500 text-white hover:bg-teal-600 font-semibold shadow-sm">
                  Create Account
                </Button>
              </Link>
              <Link href={loginHref}>
                <Button variant="outline" size="sm" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 font-semibold">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions: Messages icon + Hamburger */}
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle className="text-primary-foreground/80 hover:text-primary-foreground" />
          {user && (
            <Link href="/inquiries" aria-label="Messages">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10 relative"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 relative">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[88vw] sm:w-[400px] p-0 flex flex-col"
          >
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>

            {/* Header / Brand */}
            <div className="border-b px-5 pt-6 pb-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="font-heading text-xl font-bold tracking-tight"
              >
                Mercato<span className="text-accent">List</span>
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                NYC&apos;s business marketplace
              </p>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {user && (
                <div className="px-5 py-4 border-b bg-muted/30">
                  <Link
                    href={
                      isBroker
                        ? `/advisors/${user.id}`
                        : `/profile/${user.id}`
                    }
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-base">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate group-hover:underline">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {isBroker && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Advisor
                          </Badge>
                        )}
                        {isAdmin && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-800">
                            Admin
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          View profile
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* CTAs for logged-out users — sit prominently up top */}
              {!user && (
                <div className="px-5 py-4 border-b space-y-2">
                  <Link href={registerHref} onClick={() => setMobileOpen(false)} className="block">
                    <Button className="w-full bg-teal-500 text-white hover:bg-teal-600 font-semibold shadow-sm h-11">
                      Create Account
                    </Button>
                  </Link>
                  <Link href={loginHref} onClick={() => setMobileOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-11">Sign In</Button>
                  </Link>
                  <Link href="/register/advisor" onClick={() => setMobileOpen(false)} className="block">
                    <Button className="w-full bg-amber-400 text-amber-950 hover:bg-amber-500 font-semibold shadow-sm h-11">
                      Register as Business Advisor
                    </Button>
                  </Link>
                </div>
              )}

              {/* Explore section */}
              <nav className="px-3 py-3">
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Explore
                </p>
                <MobileNavLink
                  href="/listings"
                  icon={Compass}
                  label="Browse Businesses"
                  onClick={() => setMobileOpen(false)}
                />
                <MobileNavLink
                  href="/advisors"
                  icon={Users}
                  label="Find an Advisor"
                  onClick={() => setMobileOpen(false)}
                />
                <MobileNavLink
                  href={user ? "/my-listings/new" : "/list-your-business"}
                  icon={PlusCircle}
                  label={isBroker ? "List a Business" : "Sell Your Business"}
                  onClick={() => setMobileOpen(false)}
                />
                <MobileNavLink
                  href="/research"
                  icon={BarChart3}
                  label="Research"
                  onClick={() => setMobileOpen(false)}
                />
                <MobileNavLink
                  href="/blog"
                  icon={FileText}
                  label="Blog"
                  onClick={() => setMobileOpen(false)}
                />
              </nav>

              {/* My Activity — only when logged in */}
              {user && (
                <nav className="px-3 py-3 border-t">
                  <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    My Activity
                  </p>
                  <MobileNavLink
                    href="/inquiries"
                    icon={MessageSquare}
                    label="Inquiries"
                    badge={unreadCount > 0 ? unreadCount : undefined}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileNavLink
                    href="/saved"
                    icon={Heart}
                    label="Saved Listings"
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileNavLink
                    href="/my-listings"
                    icon={LayoutList}
                    label="My Listings"
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileNavLink
                    href="/collections"
                    icon={FolderOpen}
                    label="Collections"
                    badge={collectionBadge > 0 ? collectionBadge : undefined}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileNavLink
                    href="/saved-searches"
                    icon={Search}
                    label="Saved Searches"
                    onClick={() => setMobileOpen(false)}
                  />
                  {isBroker && (
                    <MobileNavLink
                      href="/clients"
                      icon={Building2}
                      label="Clients"
                      onClick={() => setMobileOpen(false)}
                    />
                  )}
                </nav>
              )}

              {/* Account */}
              {user && (
                <nav className="px-3 py-3 border-t">
                  <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Account
                  </p>
                  <MobileNavLink
                    href="/settings"
                    icon={Settings}
                    label="Settings"
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileNavLink
                    href={isBroker ? `/advisors/${user.id}` : `/profile/${user.id}`}
                    icon={Eye}
                    label="View Public Profile"
                    onClick={() => setMobileOpen(false)}
                  />
                  {isAdmin && (
                    <MobileNavLink
                      href="/admin"
                      icon={Shield}
                      label="Admin Dashboard"
                      onClick={() => setMobileOpen(false)}
                    />
                  )}
                </nav>
              )}
            </div>

            {/* Footer — Sign Out anchored at bottom for logged-in users */}
            {user && (
              <div className="border-t px-3 py-3">
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  );
}

interface MobileNavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  onClick?: () => void;
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  badge,
  onClick,
}: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium hover:bg-accent transition-colors"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="h-5 min-w-[20px] justify-center px-1.5 text-[10px]">
          {badge}
        </Badge>
      )}
    </Link>
  );
}
