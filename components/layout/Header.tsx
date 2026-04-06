"use client";

import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const user = session?.user;
  const userRole = user?.role;
  const isBroker = userRole === "BROKER";
  const isAdmin = userRole === "ADMIN";
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/inquiries/unread-count");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setUnreadCount(json.data.count);
      }
    } catch {
      // Silent
    }
  }, [user]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight">
            MercatoList
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/listings" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Browse Businesses
          </Link>
          <Link href="/my-listings/new" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            {isBroker ? "List a Business" : "Sell Your Business"}
          </Link>
          <Link href="/advisors" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Find an Advisor
          </Link>
          <Link href="/blog" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Blog
          </Link>
        </nav>

        {/* Desktop Auth / Actions */}
        <div className="hidden lg:flex items-center gap-3">
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
                    <Link href="/collections" className="gap-2">
                      <FolderOpen className="h-4 w-4" /> Collections
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
                    <Link href="/profile" className="gap-2">
                      <Settings className="h-4 w-4" /> Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/public-profile" className="gap-2">
                      <Globe className="h-4 w-4" /> Public Profile
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
              <Link href="/register">
                <Button size="sm" className="bg-teal-500 text-white hover:bg-teal-600 font-semibold shadow-sm">
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 font-semibold">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 relative">
              <Menu className="h-6 w-6" />
              {user && unreadCount > 0 && (
                <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetTitle className="font-heading text-lg font-bold">MercatoList</SheetTitle>
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="/listings" className="text-lg font-medium" onClick={() => setMobileOpen(false)}>
                Browse Businesses
              </Link>
              <Link href="/my-listings/new" className="text-lg font-medium" onClick={() => setMobileOpen(false)}>
                {isBroker ? "List a Business" : "Sell Your Business"}
              </Link>
              <Link href="/advisors" className="text-lg font-medium" onClick={() => setMobileOpen(false)}>
                Find an Advisor
              </Link>
              <Link href="/blog" className="text-lg font-medium" onClick={() => setMobileOpen(false)}>
                Blog
              </Link>

              <div className="border-t pt-4 mt-2 flex flex-col gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 pb-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {isBroker && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">Advisor</Badge>
                        )}
                      </div>
                    </div>
                    <Link href="/saved" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                      Saved Listings
                    </Link>
                    <Link href="/inquiries" className="text-base font-medium flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                      Inquiries
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-[20px] justify-center px-1.5 text-[10px]">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                    <Link href="/my-listings" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                      My Listings
                    </Link>
                    <Link href="/collections" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                      Collections
                    </Link>
                    {isBroker && (
                      <Link href="/clients" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                        Clients
                      </Link>
                    )}
                    <Link href="/saved-searches" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                      Saved Searches
                    </Link>
                    <Link href="/profile" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                      Profile Settings
                    </Link>
                    <Link href="/public-profile" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                      Public Profile
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="text-base font-medium" onClick={() => setMobileOpen(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                      className="text-base font-medium text-destructive text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/register/advisor" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-amber-400 text-amber-950 hover:bg-amber-500 font-semibold shadow-sm" size="lg">
                        Register as Business Advisor
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-teal-500 text-white hover:bg-teal-600 font-semibold shadow-sm" size="lg">
                        Create Account
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full" size="lg">Sign In</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
