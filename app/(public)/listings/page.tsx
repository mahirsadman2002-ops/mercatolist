"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  MapPin,
  Search,
  CheckSquare,
  FolderPlus,
  Send,
  Loader2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { ViewToggle } from "@/components/search/ViewToggle";
import { ListingCard } from "@/components/listings/ListingCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "grid" | "map" | "split";
type SortOption = "newest" | "price_asc" | "price_desc" | "revenue_desc";

interface ListingData {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  askingPrice: number | string;
  annualRevenue?: number | string | null;
  cashFlowSDE?: number | string | null;
  neighborhood: string;
  borough: string;
  createdAt: string | Date;
  viewCount: number;
  saveCount: number;
  isGhostListing: boolean;
  photos: { url: string; order: number }[];
  listedBy: {
    name: string;
    displayName?: string | null;
    role: string;
    brokerageName?: string | null;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Mock data (fallback when API is unavailable)
// ---------------------------------------------------------------------------

const MOCK_LISTINGS: ListingData[] = [
  {
    id: "1",
    slug: "joes-pizza-astoria",
    title: "Joe's Pizza -- Established Neighborhood Pizzeria",
    category: "Restaurants",
    status: "ACTIVE",
    askingPrice: 450000,
    annualRevenue: 850000,
    cashFlowSDE: 180000,
    neighborhood: "Astoria",
    borough: "QUEENS",
    createdAt: "2026-01-15T00:00:00Z",
    viewCount: 342,
    saveCount: 28,
    isGhostListing: false,
    photos: [],
    listedBy: {
      name: "Michael Torres",
      displayName: null,
      role: "BROKER",
      brokerageName: "NYC Business Sales",
    },
  },
  {
    id: "2",
    slug: "brooklyn-heights-laundromat",
    title: "Brooklyn Heights Laundromat -- Semi-Absentee",
    category: "Laundromats & Dry Cleaners",
    status: "ACTIVE",
    askingPrice: 275000,
    annualRevenue: 380000,
    cashFlowSDE: 120000,
    neighborhood: "Brooklyn Heights",
    borough: "BROOKLYN",
    createdAt: "2026-02-03T00:00:00Z",
    viewCount: 187,
    saveCount: 15,
    isGhostListing: false,
    photos: [],
    listedBy: {
      name: "Sarah Kim",
      displayName: null,
      role: "USER",
      brokerageName: null,
    },
  },
  {
    id: "3",
    slug: "soho-boutique-fashion",
    title: "SoHo Boutique Fashion Store -- Prime Location",
    category: "Clothing & Fashion",
    status: "ACTIVE",
    askingPrice: 1200000,
    annualRevenue: 1800000,
    cashFlowSDE: 320000,
    neighborhood: "SoHo",
    borough: "MANHATTAN",
    createdAt: "2026-01-28T00:00:00Z",
    viewCount: 523,
    saveCount: 47,
    isGhostListing: false,
    photos: [],
    listedBy: {
      name: "David Chen",
      displayName: "David C.",
      role: "BROKER",
      brokerageName: "Manhattan Biz Advisors",
    },
  },
  {
    id: "4",
    slug: "fordham-barbershop",
    title: "Fordham Road Barbershop -- Loyal Clientele",
    category: "Salons & Barbershops",
    status: "ACTIVE",
    askingPrice: 150000,
    annualRevenue: 220000,
    cashFlowSDE: 85000,
    neighborhood: "Fordham",
    borough: "BRONX",
    createdAt: "2026-02-10T00:00:00Z",
    viewCount: 98,
    saveCount: 8,
    isGhostListing: false,
    photos: [],
    listedBy: {
      name: "James Wright",
      displayName: null,
      role: "USER",
      brokerageName: null,
    },
  },
  {
    id: "5",
    slug: "williamsburg-coffee-shop",
    title: "Williamsburg Specialty Coffee -- Turnkey Operation",
    category: "Cafes & Coffee Shops",
    status: "ACTIVE",
    askingPrice: 350000,
    annualRevenue: 520000,
    cashFlowSDE: 140000,
    neighborhood: "Williamsburg",
    borough: "BROOKLYN",
    createdAt: "2026-02-18T00:00:00Z",
    viewCount: 276,
    saveCount: 31,
    isGhostListing: false,
    photos: [],
    listedBy: {
      name: "Elena Vasquez",
      displayName: null,
      role: "BROKER",
      brokerageName: "BK Business Group",
    },
  },
  {
    id: "6",
    slug: "jackson-heights-grocery",
    title: "Jackson Heights Grocery & Deli -- High Traffic",
    category: "Delis & Grocery Stores",
    status: "ACTIVE",
    askingPrice: 500000,
    annualRevenue: 1100000,
    cashFlowSDE: 195000,
    neighborhood: "Jackson Heights",
    borough: "QUEENS",
    createdAt: "2026-01-05T00:00:00Z",
    viewCount: 412,
    saveCount: 36,
    isGhostListing: false,
    photos: [],
    listedBy: {
      name: "Raj Patel",
      displayName: null,
      role: "USER",
      brokerageName: null,
    },
  },
];

// ---------------------------------------------------------------------------
// Skeleton component for loading state
// ---------------------------------------------------------------------------

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-px w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map Placeholder component
// ---------------------------------------------------------------------------

function MapPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#1a1f36] rounded-xl ${className ?? ""}`}
    >
      <MapPin className="h-12 w-12 text-white/30 mb-3" strokeWidth={1.5} />
      <p className="text-white/50 text-sm font-medium">
        Map view requires Mapbox token
      </p>
      <p className="text-white/30 text-xs mt-1">
        Configure NEXT_PUBLIC_MAPBOX_TOKEN to enable
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort option labels
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "revenue_desc", label: "Revenue: High to Low" },
];

// ---------------------------------------------------------------------------
// Inner page component (uses useSearchParams)
// ---------------------------------------------------------------------------

interface ClientItem {
  id: string;
  name: string;
  email: string;
}

interface CollectionItem {
  id: string;
  name: string;
}

function ListingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isBroker = userRole === "BROKER";

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );
  const [page, setPage] = useState<number>(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "sort" && key !== "page" && key !== "limit") {
        initial[key] = value;
      }
    });
    return initial;
  });
  const [listings, setListings] = useState<ListingData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Multi-select state (BROKER only)
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [brokerCollections, setBrokerCollections] = useState<CollectionItem[]>([]);
  const [brokerClients, setBrokerClients] = useState<ClientItem[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSendingToCollection, setIsSendingToCollection] = useState(false);
  const [isSendingToClient, setIsSendingToClient] = useState(false);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewEmailInput, setShowNewEmailInput] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [clientPersonalMessage, setClientPersonalMessage] = useState("");

  // Toggle selection for a listing
  const handleSelectToggle = useCallback((listingId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  }, []);

  // Exit select mode
  const handleExitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowCollectionDropdown(false);
    setShowClientDropdown(false);
    setShowNewEmailInput(false);
    setNewClientEmail("");
    setClientPersonalMessage("");
  }, []);

  // Fetch broker collections
  const fetchBrokerCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setBrokerCollections(data.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  // Fetch broker clients
  const fetchBrokerClients = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setBrokerClients(data.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  // Add selected listings to a collection
  const handleAddToCollection = useCallback(
    async (collectionId: string, collectionName: string) => {
      setIsSendingToCollection(true);
      try {
        const listingIds = Array.from(selectedIds);
        const results = await Promise.allSettled(
          listingIds.map((listingId) =>
            fetch(`/api/collections/${collectionId}/listings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listingId }),
            })
          )
        );
        const successCount = results.filter(
          (r) => r.status === "fulfilled" && (r.value as Response).ok
        ).length;
        toast.success(
          `Added ${successCount} listing${successCount !== 1 ? "s" : ""} to "${collectionName}"`
        );
        setShowCollectionDropdown(false);
      } catch {
        toast.error("Failed to add listings to collection.");
      } finally {
        setIsSendingToCollection(false);
      }
    },
    [selectedIds]
  );

  // Send selected listings to a client
  const handleSendToClient = useCallback(
    async (clientId: string, clientName: string) => {
      setIsSendingToClient(true);
      try {
        const listingIds = Array.from(selectedIds);
        const res = await fetch(`/api/clients/${clientId}/send-listings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingIds,
            personalMessage: clientPersonalMessage.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error("Failed to send");
        toast.success(
          `Sent ${listingIds.length} listing${listingIds.length !== 1 ? "s" : ""} to ${clientName}`
        );
        setShowClientDropdown(false);
        setClientPersonalMessage("");
      } catch {
        toast.error("Failed to send listings to client.");
      } finally {
        setIsSendingToClient(false);
      }
    },
    [selectedIds, clientPersonalMessage]
  );

  // Send selected listings to a new email via mailto
  const handleSendToNewEmail = useCallback(() => {
    if (!newClientEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    const listingIds = Array.from(selectedIds);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mercatolist.com";
    const listingLinks = listingIds
      .map((id) => {
        const listing = listings.find((l) => l.id === id);
        return listing
          ? `${listing.title}: ${baseUrl}/listings/${listing.slug}`
          : "";
      })
      .filter(Boolean)
      .join("\n");
    const subject = encodeURIComponent(
      `${listingIds.length} Business Listing${listingIds.length !== 1 ? "s" : ""} from MercatoList`
    );
    const body = encodeURIComponent(
      `${clientPersonalMessage.trim() ? clientPersonalMessage.trim() + "\n\n" : ""}I wanted to share these listings with you:\n\n${listingLinks}\n\nView all listings at ${baseUrl}/listings`
    );
    window.open(`mailto:${newClientEmail.trim()}?subject=${subject}&body=${body}`, "_blank");
    setShowClientDropdown(false);
    setShowNewEmailInput(false);
    setNewClientEmail("");
    setClientPersonalMessage("");
    toast.success("Email client opened");
  }, [selectedIds, newClientEmail, clientPersonalMessage, listings]);

  // -----------------------------------------------------------------------
  // Build URL search params from current state
  // -----------------------------------------------------------------------
  const buildSearchParams = useCallback(
    (
      currentFilters: Record<string, string>,
      currentSort: SortOption,
      currentPage: number
    ) => {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      if (currentSort !== "newest") params.set("sort", currentSort);
      if (currentPage > 1) params.set("page", currentPage.toString());
      return params;
    },
    []
  );

  // -----------------------------------------------------------------------
  // Sync state to URL
  // -----------------------------------------------------------------------
  const syncURL = useCallback(
    (
      currentFilters: Record<string, string>,
      currentSort: SortOption,
      currentPage: number
    ) => {
      const params = buildSearchParams(currentFilters, currentSort, currentPage);
      const qs = params.toString();
      router.push(`/listings${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, buildSearchParams]
  );

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set("page", page.toString());
      params.set("limit", "20");
      params.set("sort", sort);

      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setListings(data.data);
        setPagination(data.pagination);
      } else {
        // API returned an error response, use mock data
        setListings(MOCK_LISTINGS);
        setPagination({
          page: 1,
          limit: 20,
          total: MOCK_LISTINGS.length,
          totalPages: 1,
        });
      }
    } catch {
      // API is unavailable, fall back to mock data
      setListings(MOCK_LISTINGS);
      setPagination({
        page: 1,
        limit: 20,
        total: MOCK_LISTINGS.length,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, sort]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleFiltersChange = useCallback(
    (newFilters: Record<string, string>) => {
      setFilters(newFilters);
      setPage(1);
      syncURL(newFilters, sort, 1);
    },
    [sort, syncURL]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const newSort = value as SortOption;
      setSort(newSort);
      setPage(1);
      syncURL(filters, newSort, 1);
    },
    [filters, syncURL]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      syncURL(filters, sort, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [filters, sort, syncURL]
  );

  const handleSearchFromBar = useCallback(
    (keyword: string, category: string) => {
      const newFilters = { ...filters };
      if (keyword.trim()) {
        newFilters.keyword = keyword.trim();
      } else {
        delete newFilters.keyword;
      }
      if (category && category !== "all") {
        newFilters.category = category;
      } else {
        delete newFilters.category;
      }
      setFilters(newFilters);
      setPage(1);
      syncURL(newFilters, sort, 1);
    },
    [filters, sort, syncURL]
  );

  // -----------------------------------------------------------------------
  // Active filter count for mobile badge
  // -----------------------------------------------------------------------
  const activeFilterCount = useMemo(
    () => Object.keys(filters).length,
    [filters]
  );

  // -----------------------------------------------------------------------
  // Pagination page numbers
  // -----------------------------------------------------------------------
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const { totalPages } = pagination;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push(-1); // ellipsis
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push(-2); // ellipsis
      pages.push(totalPages);
    }
    return pages;
  }, [page, pagination]);

  // -----------------------------------------------------------------------
  // Render: Listing Grid
  // -----------------------------------------------------------------------
  const renderListingGrid = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (listings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            No businesses found
          </h3>
          <p className="mt-2 max-w-md text-muted-foreground">
            Try adjusting your filters, broadening your search area, or
            removing some criteria to see more results.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setPage(1);
                  syncURL({}, sort, 1);
                }}
              >
                <X className="mr-1.5 h-4 w-4" />
                Clear all filters
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setSort("newest");
                setFilters({});
                setPage(1);
                syncURL({}, "newest", 1);
              }}
            >
              Browse all listings
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          className={`grid grid-cols-1 gap-6 ${
            viewMode === "split"
              ? "sm:grid-cols-1 lg:grid-cols-2"
              : "sm:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              selectable={selectMode}
              isSelected={selectedIds.has(listing.id)}
              onSelectToggle={handleSelectToggle}
            />
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-1"
            aria-label="Pagination"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {pageNumbers.map((p, idx) =>
                p < 0 ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-sm text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="min-w-[36px]"
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </nav>
        )}
      </>
    );
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* ================================================================= */}
      {/* Search Bar - Compact                                              */}
      {/* ================================================================= */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <SearchBar
            variant="compact"
            initialKeyword={filters.keyword || ""}
            initialCategory={filters.category || ""}
            onSearch={handleSearchFromBar}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* Top Bar (sticky below header)                                     */}
      {/* ================================================================= */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Left: Result count */}
            <div className="flex items-center gap-3 min-w-0">
              {loading ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                <p className="text-sm font-medium text-foreground truncate">
                  <span className="font-bold">{pagination.total}</span>{" "}
                  {pagination.total === 1
                    ? "business for sale"
                    : "businesses for sale"}
                </p>
              )}
            </div>

            {/* Right: Sort + View Toggle + Mobile Filter Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sort Dropdown */}
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="h-9 w-[180px] hidden sm:flex">
                  <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort - Mobile (smaller trigger) */}
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="h-9 w-9 sm:hidden px-0 justify-center">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Select Toggle - BROKER only */}
              {isBroker && (
                <Button
                  variant={selectMode ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5 hidden sm:flex"
                  onClick={() => {
                    if (selectMode) {
                      handleExitSelectMode();
                    } else {
                      setSelectMode(true);
                      fetchBrokerCollections();
                      fetchBrokerClients();
                    }
                  }}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>{selectMode ? "Exit Select" : "Select"}</span>
                </Button>
              )}

              {/* View Toggle - Hidden on mobile */}
              <div className="hidden md:block">
                <ViewToggle activeView={viewMode} onViewChange={setViewMode} />
              </div>

              {/* Separator */}
              <Separator orientation="vertical" className="h-6 hidden md:block" />

              {/* Mobile Filter Button */}
              <Sheet
                open={mobileFiltersOpen}
                onOpenChange={setMobileFiltersOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden h-9 gap-1.5"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] sm:w-[360px] p-0">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                      <SheetTitle className="text-lg font-semibold">
                        Filters
                      </SheetTitle>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      <FilterSidebar
                        initialFilters={filters}
                        onFiltersChange={(newFilters) => {
                          handleFiltersChange(newFilters);
                          setMobileFiltersOpen(false);
                        }}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Main Content Area                                                 */}
      {/* ================================================================= */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* ------------------------------------------------------------- */}
          {/* Grid View                                                     */}
          {/* ------------------------------------------------------------- */}
          {viewMode === "grid" && (
            <div className="flex gap-8">
              {/* Desktop Filter Sidebar */}
              <aside className="hidden lg:block w-72 shrink-0">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
                  <FilterSidebar
                    initialFilters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              </aside>

              {/* Listing Grid */}
              <div className="flex-1 min-w-0">{renderListingGrid()}</div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* Map View                                                      */}
          {/* ------------------------------------------------------------- */}
          {viewMode === "map" && (
            <MapPlaceholder className="h-[calc(100vh-12rem)] w-full" />
          )}

          {/* ------------------------------------------------------------- */}
          {/* Split View (default)                                          */}
          {/* ------------------------------------------------------------- */}
          {viewMode === "split" && (
            <div className="flex gap-6">
              {/* Desktop Filter Sidebar */}
              <aside className="hidden lg:block w-72 shrink-0">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
                  <FilterSidebar
                    initialFilters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              </aside>

              {/* Left: Scrollable listing grid (~60%) */}
              <div className="flex-1 min-w-0">{renderListingGrid()}</div>

              {/* Right: Sticky map placeholder (~40%) */}
              <div className="hidden md:block w-[40%] shrink-0">
                <div className="sticky top-20 h-[calc(100vh-6rem)]">
                  <MapPlaceholder className="h-full w-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* Floating Multi-Select Action Bar (BROKER only)                    */}
      {/* ================================================================= */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl border bg-background/95 px-5 py-3 shadow-2xl backdrop-blur-sm">
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {selectedIds.size} selected
            </span>

            <Separator orientation="vertical" className="h-6" />

            {/* Add to Collection */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isSendingToCollection}
                onClick={() => {
                  setShowClientDropdown(false);
                  setShowCollectionDropdown((prev) => !prev);
                }}
              >
                {isSendingToCollection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderPlus className="h-4 w-4" />
                )}
                Add to Collection
              </Button>
              {showCollectionDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border bg-popover p-1 shadow-lg">
                  {isLoadingCollections ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : brokerCollections.length === 0 ? (
                    <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                      No collections yet
                    </p>
                  ) : (
                    brokerCollections.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent text-left"
                        onClick={() => handleAddToCollection(col.id, col.name)}
                      >
                        <FolderPlus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{col.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Send to Client */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isSendingToClient}
                onClick={() => {
                  setShowCollectionDropdown(false);
                  setShowClientDropdown((prev) => !prev);
                }}
              >
                {isSendingToClient ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send to Client
              </Button>
              {showClientDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border bg-popover shadow-lg">
                  {/* Personal message textarea */}
                  <div className="p-2 border-b">
                    <Textarea
                      value={clientPersonalMessage}
                      onChange={(e) => setClientPersonalMessage(e.target.value)}
                      placeholder="Add a personal message (optional)..."
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="p-1">
                    {isLoadingClients ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : brokerClients.length === 0 ? (
                      <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                        No clients yet
                      </p>
                    ) : (
                      brokerClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent text-left"
                          onClick={() =>
                            handleSendToClient(client.id, client.name)
                          }
                        >
                          <Send className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{client.name}</span>
                        </button>
                      ))
                    )}

                    {/* Divider */}
                    <div className="h-px bg-border my-1" />

                    {/* Send to new email */}
                    {showNewEmailInput ? (
                      <div className="px-3 py-2 space-y-2">
                        <Input
                          type="email"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          placeholder="Enter email address..."
                          className="h-8 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendToNewEmail();
                            if (e.key === "Escape") {
                              setShowNewEmailInput(false);
                              setNewClientEmail("");
                            }
                          }}
                        />
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={handleSendToNewEmail}
                          >
                            <Mail className="h-3 w-3" />
                            Send
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setShowNewEmailInput(false);
                              setNewClientEmail("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent text-left text-muted-foreground"
                        onClick={() => setShowNewEmailInput(true)}
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>Send to new email</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Clear */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense boundary for useSearchParams
// ---------------------------------------------------------------------------

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          {/* Search Bar Skeleton */}
          <div className="border-b bg-background">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-[180px]" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
          {/* Top Bar Skeleton */}
          <div className="border-b bg-background">
            <div className="container mx-auto px-4">
              <div className="flex h-14 items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-[180px]" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>
          </div>
          {/* Content Skeleton */}
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ListingsPageContent />
    </Suspense>
  );
}
