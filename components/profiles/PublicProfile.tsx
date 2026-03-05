"use client";

import Link from "next/link";
import { Calendar, Briefcase, Tag, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ListingCard } from "@/components/listings/ListingCard";
import { formatCurrency } from "@/lib/utils";

interface PublicProfileProps {
  profile: {
    id: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    role: string;
    ownedBusiness: string | null;
    buyBox: Record<string, unknown> | null;
    memberSince: string;
    activeListings: any[];
    soldListings: any[];
    underContractListings: any[];
  };
}

function formatBorough(borough: string): string {
  return borough
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function PublicProfile({ profile }: PublicProfileProps) {
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const buyBox = profile.buyBox as {
    categories?: string[];
    boroughs?: string[];
    priceMin?: number | null;
    priceMax?: number | null;
  } | null;

  const isBroker = profile.role === "BROKER";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={profile.avatarUrl || undefined}
            alt={profile.name}
          />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            {isBroker && (
              <Badge className="bg-teal-600 text-white">Broker</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Member since{" "}
            {new Date(profile.memberSince).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>
          {profile.bio && (
            <p className="text-muted-foreground max-w-xl">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Business Ownership */}
      {profile.ownedBusiness && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Business Owner</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {profile.ownedBusiness}
          </p>
        </div>
      )}

      {/* Buy Box */}
      {buyBox &&
        ((buyBox.categories && buyBox.categories.length > 0) ||
          (buyBox.boroughs && buyBox.boroughs.length > 0)) && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Looking For</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {buyBox.categories?.map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {buyBox.boroughs?.map((b) => (
                <Badge key={b} variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {formatBorough(b)}
                </Badge>
              ))}
            </div>
            {(buyBox.priceMin || buyBox.priceMax) && (
              <p className="text-xs text-muted-foreground">
                Price range:{" "}
                {buyBox.priceMin ? formatCurrency(buyBox.priceMin) : "Any"} -{" "}
                {buyBox.priceMax ? formatCurrency(buyBox.priceMax) : "Any"}
              </p>
            )}
          </div>
        )}

      {/* Active Listings */}
      {profile.activeListings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Active Listings</h2>
            {profile.activeListings.length > 6 && (
              <Link
                href={`/listings?listedBy=${profile.id}`}
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.activeListings.slice(0, 6).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Deal History */}
      {(profile.soldListings.length > 0 ||
        profile.underContractListings.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Deal History</h2>
          <div className="space-y-3">
            {profile.underContractListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
                      Under Contract
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {listing.neighborhood},{" "}
                    {formatBorough(listing.borough)}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(Number(listing.askingPrice))}
                </p>
              </div>
            ))}
            {profile.soldListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">
                      Sold
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {listing.neighborhood},{" "}
                    {formatBorough(listing.borough)}
                  </p>
                </div>
                <div className="text-right">
                  {listing.soldPrice && (
                    <p className="font-semibold">
                      {formatCurrency(Number(listing.soldPrice))}
                    </p>
                  )}
                  {listing.soldDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(listing.soldDate).toLocaleDateString(
                        "en-US",
                        { month: "short", year: "numeric" }
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {profile.activeListings.length === 0 &&
        profile.soldListings.length === 0 &&
        profile.underContractListings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No listings to display.
            </p>
          </div>
        )}
    </div>
  );
}
