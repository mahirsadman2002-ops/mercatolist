"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Star, Phone, LayoutList, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BOROUGHS } from "@/lib/constants";

interface BrokerData {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  brokerageName: string | null;
  brokeragePhone: string | null;
  activeListings: number;
  reviewCount: number;
  avgRating: number;
  memberSince: string;
}

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [borough, setBorough] = useState("");
  const [sort, setSort] = useState("most_reviews");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (borough && borough !== "ALL") params.set("borough", borough);

      const res = await fetch(`/api/brokers?${params}`);
      const json = await res.json();
      if (json.success) {
        setBrokers(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, borough]);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, borough, sort]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Find a Business Advisor in NYC
        </h1>
        <p className="text-muted-foreground">
          Browse verified business advisors across New York City. Find the
          right advisor to help you buy or sell a business.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or company..."
            className="pl-10"
          />
        </div>
        <Select value={borough} onValueChange={setBorough}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Boroughs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Boroughs</SelectItem>
            {BOROUGHS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="most_reviews">Most Reviews</SelectItem>
            <SelectItem value="highest_rated">Highest Rated</SelectItem>
            <SelectItem value="most_listings">Most Listings</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : brokers.length === 0 ? (
        <div className="text-center py-16">
          <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No advisors found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brokers.map((broker) => {
            const initials = broker.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={broker.id} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={broker.avatarUrl || undefined}
                        alt={broker.name}
                      />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link href={`/advisors/${broker.id}`} className="font-semibold truncate block hover:underline">
                        {broker.name}
                      </Link>
                      {broker.brokerageName && (
                        <button
                          type="button"
                          onClick={() => setSearch(broker.brokerageName!)}
                          className="text-sm text-muted-foreground truncate block hover:underline text-left"
                        >
                          {broker.brokerageName}
                        </button>
                      )}
                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1">
                        {broker.reviewCount > 0 ? (
                          <>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <=
                                    Math.round(broker.avgRating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium">
                              {broker.avgRating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({broker.reviewCount})
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No reviews yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <LayoutList className="h-3.5 w-3.5" />
                      {broker.activeListings} active
                    </div>
                    {(broker.brokeragePhone || broker.phone) && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {broker.brokeragePhone || broker.phone}
                      </div>
                    )}
                  </div>

                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/advisors/${broker.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(page - 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={pageNum === page}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(page + 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
