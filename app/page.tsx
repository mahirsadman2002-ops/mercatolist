import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

const PLACEHOLDER_LISTINGS = [
  {
    id: "1",
    slug: "joes-pizza-astoria",
    title: "Joe's Pizza — Astoria",
    category: "Restaurants",
    neighborhood: "Astoria",
    borough: "Queens",
    askingPrice: 450000,
    annualRevenue: 850000,
  },
  {
    id: "2",
    slug: "brooklyn-heights-laundromat",
    title: "Brooklyn Heights Laundromat",
    category: "Laundromats & Dry Cleaners",
    neighborhood: "Brooklyn Heights",
    borough: "Brooklyn",
    askingPrice: 275000,
    annualRevenue: 380000,
  },
  {
    id: "3",
    slug: "soho-boutique-fashion",
    title: "SoHo Boutique Fashion Store",
    category: "Clothing & Fashion",
    neighborhood: "SoHo",
    borough: "Manhattan",
    askingPrice: 1200000,
    annualRevenue: 1800000,
  },
  {
    id: "4",
    slug: "fordham-barbershop",
    title: "Fordham Road Barbershop",
    category: "Salons & Barbershops",
    neighborhood: "Fordham",
    borough: "Bronx",
    askingPrice: 150000,
    annualRevenue: 220000,
  },
  {
    id: "5",
    slug: "williamsburg-coffee-shop",
    title: "Williamsburg Specialty Coffee",
    category: "Cafes & Coffee Shops",
    neighborhood: "Williamsburg",
    borough: "Brooklyn",
    askingPrice: 350000,
    annualRevenue: 520000,
  },
  {
    id: "6",
    slug: "jackson-heights-grocery",
    title: "Jackson Heights Grocery & Deli",
    category: "Delis & Grocery Stores",
    neighborhood: "Jackson Heights",
    borough: "Queens",
    askingPrice: 500000,
    annualRevenue: 1100000,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
        <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Find Your Next Business
              <br />
              <span className="text-accent">in New York City</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              NYC&apos;s premier marketplace for buying and selling businesses
              across all five boroughs
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <Input
                placeholder="Search businesses..."
                className="flex-1 bg-white text-foreground border-0 h-12 text-base placeholder:text-muted-foreground"
              />
              <Select>
                <SelectTrigger className="w-full sm:w-48 bg-white text-foreground border-0 h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/listings">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 bg-accent text-accent-foreground hover:bg-teal-light font-semibold gap-2"
                >
                  <Search className="h-5 w-5" />
                  Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Featured Listings
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Explore top business opportunities across NYC
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLACEHOLDER_LISTINGS.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.slug}`}>
              <Card className="group h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden">
                <div className="aspect-[16/10] bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    Photo
                  </div>
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                    {listing.category}
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-heading text-lg font-semibold group-hover:text-accent transition-colors line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {listing.neighborhood}, {listing.borough}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Asking Price
                      </p>
                      <p className="font-heading text-xl font-bold">
                        {formatCurrency(listing.askingPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-semibold">
                        {formatCurrency(listing.annualRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/listings">
            <Button
              variant="outline"
              size="lg"
              className="font-semibold gap-2"
            >
              View All Listings
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              List Your Business for Free
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Reach thousands of qualified buyers across New York City. Create
              your listing in minutes and connect with serious prospects.
            </p>
            <Link href="/my-listings/new">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold mt-2"
              >
                Get Started — It&apos;s Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Borough Quick Links */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-10">
          Browse by Borough
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: "Manhattan", slug: "manhattan" },
            { name: "Brooklyn", slug: "brooklyn" },
            { name: "Queens", slug: "queens" },
            { name: "Bronx", slug: "bronx" },
            { name: "Staten Island", slug: "staten-island" },
          ].map((borough) => (
            <Link key={borough.slug} href={`/boroughs/${borough.slug}`}>
              <Card className="group hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <h3 className="font-heading text-lg font-semibold group-hover:text-accent transition-colors">
                    {borough.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    View listings
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
