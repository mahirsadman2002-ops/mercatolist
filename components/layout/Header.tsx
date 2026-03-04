"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Heart, MessageSquare, ChevronDown, X } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";

// TODO: Replace with real auth state from NextAuth
const useAuth = () => ({
  user: null as null | { name: string; role: string },
  signOut: () => {},
});

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

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
          <Link
            href="/listings"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            Browse Businesses
          </Link>
          <Link
            href="/my-listings/new"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            Sell Your Business
          </Link>
          <Link
            href="/brokers"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            Find a Broker
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            Blog
          </Link>
        </nav>

        {/* Desktop Auth / Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/saved">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/inquiries" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1"
                  >
                    {user.name}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/my-listings">My Listings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/inquiries">Inquiries</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/collections">Collections</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/saved-searches">Saved Searches</Link>
                  </DropdownMenuItem>
                  {user.role === "BROKER" && (
                    <DropdownMenuItem asChild>
                      <Link href="/clients">Clients</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/register/broker"
                className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Register as Broker
              </Link>
              <Link href="/register">
                <Button
                  variant="secondary"
                  size="sm"
                  className="font-semibold"
                >
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
                >
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetTitle className="font-heading text-lg font-bold">
              MercatoList
            </SheetTitle>
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/listings"
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Browse Businesses
              </Link>
              <Link
                href="/my-listings/new"
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Sell Your Business
              </Link>
              <Link
                href="/brokers"
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Find a Broker
              </Link>
              <Link
                href="/blog"
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Blog
              </Link>

              <div className="border-t pt-4 mt-2 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link
                      href="/saved"
                      className="text-lg font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Saved Listings
                    </Link>
                    <Link
                      href="/inquiries"
                      className="text-lg font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Inquiries
                    </Link>
                    <Link
                      href="/my-listings"
                      className="text-lg font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Listings
                    </Link>
                    <Link
                      href="/collections"
                      className="text-lg font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Collections
                    </Link>
                    <Link
                      href="/profile"
                      className="text-lg font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register/broker"
                      className="text-lg font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Register as Broker
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full" size="lg">
                        Create Account
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full" size="lg">
                        Sign In
                      </Button>
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
