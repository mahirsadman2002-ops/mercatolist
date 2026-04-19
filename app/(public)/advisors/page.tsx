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
import { BOROUGHS, BUSINESS_CATEGORIES } from "@/lib/constants";
import { CategoryCombobox } from "@/components/ui/category-combobox";

interface AdvisorData {
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
  boroughsServed: string[];
  specialties: string[];
}

export default function AdvisorsPage() {
  const [advisors, setAdvisors] = useState<AdvisorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [borough, setBorough] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [sort, setSort] = useState("most_reviews");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAdvisors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (borough && borough !== "ALL") params.set("borough", borough);
      if (specialty && specialty !== "ALL") params.set("specialty", specialty);

      const res = await fetch(`/api/advisors?${params}`);
      const json = await res.json();
      if (json.success) {
        setAdvisors(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, borough, specialty]);

  useEffect(() => {
    fetchAdvisors();
  }, [fetchAdvisors]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, borough, specialty, sort]);

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
        <div className="w-full sm:w-52">
          <CategoryCombobox
            value={specialty === "ALL" ? "" : specialty}
            onValueChange={(val) => setSpecialty(val || "ALL")}
            allowAll
            allLabel="All Specialties"
          />
        </div>
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
      ) : advisors.length === 0 ? (
        <div className="text-center py-16">
          <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No advisors found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advisors.map((advisor) => {
            const initials = advisor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={advisor.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={advisor.avatarUrl || undefined}
                        alt={advisor.name}
                      />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/advisors/${advisor.id}`}
                        className="font-semibold truncate block hover:underline text-teal-600 dark:text-teal-400"
                      >
                        {advisor.name}
                      </Link>
                      {advisor.brokerageName && (
                        <button
                          type="button"
                          onClick={() => setSearch(advisor.brokerageName!)}
                          className="text-sm text-muted-foreground truncate block hover:underline text-left"
                        >
                          {advisor.brokerageName}
                        </button>
                      )}
                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1">
                        {advisor.reviewCount > 0 ? (
                          <>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <=
                                    Math.round(advisor.avgRating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium">
                              {advisor.avgRating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({advisor.reviewCount})
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

                  {/* Specialties badges */}
                  {advisor.specialties && advisor.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {advisor.specialties.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {advisor.specialties.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{advisor.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Boroughs served badges */}
                  {advisor.boroughsServed && advisor.boroughsServed.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {advisor.boroughsServed.map((b) => {
                        const label = BOROUGHS.find((br) => br.value === b)?.label || b;
                        return (
                          <Badge key={b} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <LayoutList className="h-3.5 w-3.5" />
                      {advisor.activeListings} active
                    </div>
                    {(advisor.brokeragePhone || advisor.phone) && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {advisor.brokeragePhone || advisor.phone}
                      </div>
                    )}
                  </div>

                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/advisors/${advisor.id}`}>
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
