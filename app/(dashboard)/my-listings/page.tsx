"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency, calculateDaysOnMarket } from "@/lib/utils";

interface ListingData {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  askingPrice: number | string;
  neighborhood: string;
  borough: string;
  viewCount: number;
  saveCount: number;
  shareCount: number;
  createdAt: string;
  soldPrice: number | string | null;
  soldDate: string | null;
  photo: string | null;
  inquiryCount: number;
  unreadInquiries: number;
  savedCount: number;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UNDER_CONTRACT: "bg-amber-100 text-amber-800 border-amber-200",
  SOLD: "bg-blue-100 text-blue-800 border-blue-200",
  OFF_MARKET: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  UNDER_CONTRACT: "Under Contract",
  SOLD: "Sold",
  OFF_MARKET: "Off Market",
};

function formatBorough(borough: string): string {
  return borough
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    id: string;
    currentStatus: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [soldPrice, setSoldPrice] = useState("");
  const [soldDate, setSoldDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "ALL" ? `?status=${filter}` : "";
      const res = await fetch(`/api/listings/mine${params}`);
      const json = await res.json();
      if (json.success) {
        setListings(json.data);
      }
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleStatusChange = async () => {
    if (!statusDialog || !newStatus) return;
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === "SOLD") {
        if (soldPrice) body.soldPrice = parseFloat(soldPrice);
        if (soldDate) body.soldDate = soldDate;
      }
      const res = await fetch(`/api/listings/${statusDialog.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Status updated");
        setStatusDialog(null);
        setNewStatus("");
        setSoldPrice("");
        setSoldDate("");
        fetchListings();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Listing duplicated");
        fetchListings();
      } else {
        toast.error("Failed to duplicate listing");
      }
    } catch {
      toast.error("Failed to duplicate listing");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/listings/${deleteDialog}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Listing deleted");
        setDeleteDialog(null);
        fetchListings();
      } else {
        toast.error("Failed to delete listing");
      }
    } catch {
      toast.error("Failed to delete listing");
    } finally {
      setActionLoading(false);
    }
  };

  const tabCounts = {
    ALL: listings.length,
    ACTIVE: 0,
    UNDER_CONTRACT: 0,
    SOLD: 0,
    OFF_MARKET: 0,
  };

  // We count from unfiltered data when filter is ALL, otherwise show current count
  if (filter === "ALL") {
    listings.forEach((l) => {
      const key = l.status as keyof typeof tabCounts;
      if (key in tabCounts) tabCounts[key]++;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Button asChild>
          <Link href="/my-listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Listing
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="UNDER_CONTRACT">Under Contract</TabsTrigger>
          <TabsTrigger value="SOLD">Sold</TabsTrigger>
          <TabsTrigger value="OFF_MARKET">Off Market</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Listings */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first business listing to get started.
          </p>
          <Button asChild>
            <Link href="/my-listings/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Listing
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const isExpanded = expandedId === listing.id;
            const daysOnMarket = calculateDaysOnMarket(
              new Date(listing.createdAt)
            );
            const price =
              typeof listing.askingPrice === "string"
                ? parseFloat(listing.askingPrice)
                : listing.askingPrice;

            return (
              <div key={listing.id} className="rounded-lg border bg-card">
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Photo */}
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {listing.photo ? (
                      <Image
                        src={listing.photo}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="text-sm font-semibold truncate hover:underline"
                      >
                        {listing.title}
                      </Link>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${STATUS_STYLES[listing.status] || ""}`}
                      >
                        {STATUS_LABELS[listing.status] || listing.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatCurrency(price)}
                      </span>
                      <span>{listing.category}</span>
                      <span>
                        {listing.neighborhood},{" "}
                        {formatBorough(listing.borough)}
                      </span>
                      <span>{daysOnMarket}d on market</span>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Views">
                      <Eye className="h-3.5 w-3.5" />
                      {listing.viewCount}
                    </div>
                    <div className="flex items-center gap-1" title="Saves">
                      <Heart className="h-3.5 w-3.5" />
                      {listing.savedCount}
                    </div>
                    <div
                      className="flex items-center gap-1"
                      title="Inquiries"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {listing.inquiryCount}
                      {listing.unreadInquiries > 0 && (
                        <Badge className="h-4 px-1 text-[9px] bg-primary">
                          {listing.unreadInquiries}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : listing.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/my-listings/${listing.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/listings/${listing.slug}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Listing
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setStatusDialog({
                            id: listing.id,
                            currentStatus: listing.status,
                          })
                        }
                      >
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Change Status
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(listing.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteDialog(listing.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Expanded analytics panel */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 bg-muted/30">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Eye className="h-3.5 w-3.5" />
                          Total Views
                        </div>
                        <p className="text-2xl font-bold">
                          {listing.viewCount}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Heart className="h-3.5 w-3.5" />
                          Saves
                        </div>
                        <p className="text-2xl font-bold">
                          {listing.savedCount}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Inquiries
                        </div>
                        <p className="text-2xl font-bold">
                          {listing.inquiryCount}
                        </p>
                        {listing.unreadInquiries > 0 && (
                          <p className="text-xs text-primary mt-0.5">
                            {listing.unreadInquiries} unread
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Share2 className="h-3.5 w-3.5" />
                          Shares
                        </div>
                        <p className="text-2xl font-bold">
                          {listing.shareCount}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Listed on{" "}
                      {new Date(listing.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}{" "}
                      &middot; {daysOnMarket} days on market
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status Change Dialog */}
      <Dialog
        open={!!statusDialog}
        onOpenChange={() => {
          setStatusDialog(null);
          setNewStatus("");
          setSoldPrice("");
          setSoldDate("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Listing Status</DialogTitle>
            <DialogDescription>
              Update the status of your listing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="UNDER_CONTRACT">
                    Under Contract
                  </SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="OFF_MARKET">Off Market</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === "SOLD" && (
              <>
                <div className="space-y-2">
                  <Label>Sold Price (optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500000"
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sold Date (optional)</Label>
                  <Input
                    type="date"
                    value={soldDate}
                    onChange={(e) => setSoldDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || actionLoading}
            >
              {actionLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
