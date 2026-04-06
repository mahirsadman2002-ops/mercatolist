import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ALL_NEIGHBORHOODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Users,
  MapPin,
  LayoutGrid,
  Target,
  ShoppingBag,
  Briefcase,
  Handshake,
  MapPinned,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About MercatoList — NYC's Business Marketplace",
  description:
    "MercatoList is the modern marketplace for buying and selling businesses in New York City.",
};

export default async function AboutPage() {
  const [activeListings, registeredUsers] = await Promise.all([
    prisma.businessListing.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
  ]);

  const neighborhoodCount = ALL_NEIGHBORHOODS.length;

  const stats = [
    {
      label: "Active Listings",
      value: activeListings.toLocaleString(),
      icon: LayoutGrid,
    },
    {
      label: "Boroughs Covered",
      value: "5",
      icon: MapPin,
    },
    {
      label: "Neighborhoods",
      value: neighborhoodCount.toLocaleString(),
      icon: MapPinned,
    },
    {
      label: "Registered Users",
      value: registeredUsers.toLocaleString(),
      icon: Users,
    },
  ];

  const sections = [
    {
      icon: Target,
      title: "Our Mission",
      content:
        "We believe business ownership should be accessible to everyone. MercatoList brings transparency, modern tools, and a trusted community to the process of buying and selling businesses in New York City. No more outdated listings, hidden fees, or opaque negotiations.",
    },
    {
      icon: ShoppingBag,
      title: "For Buyers",
      content:
        "Whether you're a first-time entrepreneur or an experienced operator, MercatoList gives you the tools to find your next opportunity. Browse verified listings across all five boroughs, filter by category, price range, and neighborhood, and connect directly with sellers and advisors.",
    },
    {
      icon: Briefcase,
      title: "For Sellers",
      content:
        "Listing your business on MercatoList means reaching thousands of qualified buyers actively searching in the NYC market. Our platform helps you present your business professionally with detailed financials, photos, and location data — all designed to attract serious inquiries.",
    },
    {
      icon: Handshake,
      title: "For Advisors",
      content:
        "MercatoList is built with business advisors in mind. Manage multiple listings, organize buyers into collections, share curated opportunities with clients, and build your reputation through verified reviews. Our advisor tools help you close more deals, faster.",
    },
    {
      icon: Building2,
      title: "Why NYC",
      content:
        "New York City is the world's greatest business market. With over 200,000 small businesses across five boroughs, the opportunities are endless — but finding them shouldn't be hard. We focus exclusively on NYC because this market deserves a dedicated platform that understands its unique neighborhoods, regulations, and culture.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          About MercatoList
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          We&apos;re building the most trusted marketplace for buying and
          selling businesses in New York City.
        </p>
      </div>

      {/* Mission Sections */}
      <div className="max-w-3xl mx-auto space-y-12 mb-20">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className="flex gap-5">
              <div className="shrink-0 mt-1">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {section.content}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6 text-center">
                <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center py-12 border-t">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to get started?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Whether you&apos;re looking to buy your first business or list one for
          sale, MercatoList is here to help.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/listings">Browse Listings</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/my-listings/new">List Your Business</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
