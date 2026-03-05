"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Search, Star, StarOff, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  borough: string;
  askingPrice: number;
  viewCount: number;
  isFeatured: boolean;
  adminNotes: string | null;
  createdAt: string;
  listedBy: { id: string; name: string; email: string };
  photos: { url: string }[];
  _count: { inquiries: number };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  UNDER_CONTRACT: "bg-yellow-100 text-yellow-700",
  SOLD: "bg-blue-100 text-blue-700",
  OFF_MARKET: "bg-gray-100 text-gray-700",
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals
  const [statusModal, setStatusModal] = useState<{ listing: Listing; newStatus: string } | null>(null);
  const [soldModal, setSoldModal] = useState<Listing | null>(null);
  const [notesModal, setNotesModal] = useState<Listing | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Listing | null>(null);

  // Form state
  const [soldPrice, setSoldPrice] = useState("");
  const [soldDate, setSoldDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchListings = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "25",
      sort: sortBy,
      order: sortOrder,
    });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/admin/listings?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setListings(res.data);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleStatusChange = async () => {
    if (!statusModal) return;
    try {
      const res = await fetch(`/api/admin/listings/${statusModal.listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusModal.newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Status updated");
        setStatusModal(null);
        fetchListings();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch { toast.error("Failed to update status"); }
  };

  const handleToggleFeatured = async (listing: Listing) => {
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}/feature`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.data.isFeatured ? "Listing featured" : "Listing unfeatured");
        fetchListings();
      }
    } catch { toast.error("Failed to toggle featured"); }
  };

  const handleSoldData = async () => {
    if (!soldModal) return;
    try {
      const res = await fetch(`/api/admin/listings/${soldModal.id}/sold-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soldPrice: Number(soldPrice),
          soldDate: soldDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sold data saved");
        setSoldModal(null);
        setSoldPrice("");
        setSoldDate("");
        fetchListings();
      } else {
        toast.error(data.error || "Failed to save sold data");
      }
    } catch { toast.error("Failed to save sold data"); }
  };

  const handleNotes = async () => {
    if (!notesModal) return;
    try {
      const res = await fetch(`/api/admin/listings/${notesModal.id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Notes saved");
        setNotesModal(null);
        setAdminNotes("");
        fetchListings();
      }
    } catch { toast.error("Failed to save notes"); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      const res = await fetch(`/api/admin/listings/${deleteDialog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Listing deleted");
        setDeleteDialog(null);
        fetchListings();
      }
    } catch { toast.error("Failed to delete listing"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total listings</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="UNDER_CONTRACT">Under Contract</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="OFF_MARKET">Off Market</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="askingPrice">Price</SelectItem>
                <SelectItem value="viewCount">Views</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Borough</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Listed By</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Inquiries</TableHead>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(11)].map((_, j) => (
                      <TableCell key={j}><div className="h-4 animate-pulse rounded bg-muted" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No listings found
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      {listing.photos?.[0] ? (
                        <img
                          src={listing.photos[0].url}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{listing.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{listing.category}</TableCell>
                    <TableCell className="text-sm">{listing.borough.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[listing.status] || ""}>
                        {listing.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(listing.askingPrice).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{listing.listedBy.name}</TableCell>
                    <TableCell className="text-right">{listing.viewCount}</TableCell>
                    <TableCell className="text-right">{listing._count.inquiries}</TableCell>
                    <TableCell>
                      {listing.isFeatured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/listings/${listing.slug}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" /> View
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {["ACTIVE", "UNDER_CONTRACT", "SOLD", "OFF_MARKET"]
                            .filter((s) => s !== listing.status)
                            .map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => setStatusModal({ listing, newStatus: s })}
                              >
                                Set {s.replace("_", " ")}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleFeatured(listing)}>
                            {listing.isFeatured ? (
                              <><StarOff className="h-4 w-4 mr-2" /> Unfeature</>
                            ) : (
                              <><Star className="h-4 w-4 mr-2" /> Feature</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSoldModal(listing); setSoldPrice(""); setSoldDate(""); }}>
                            Sold Data
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setNotesModal(listing); setAdminNotes(listing.adminNotes || ""); }}>
                            Admin Notes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog(listing)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      <AlertDialog open={!!statusModal} onOpenChange={(open) => !open && setStatusModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Listing Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change &ldquo;{statusModal?.listing.title}&rdquo; to {statusModal?.newStatus?.replace("_", " ")}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sold Data Dialog */}
      <Dialog open={!!soldModal} onOpenChange={(open) => !open && setSoldModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sold Data</DialogTitle>
            <DialogDescription>Enter the sale details for &ldquo;{soldModal?.title}&rdquo;</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sold Price</Label>
              <Input type="number" placeholder="500000" value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} />
            </div>
            <div>
              <Label>Sold Date</Label>
              <Input type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoldModal(null)}>Cancel</Button>
            <Button onClick={handleSoldData}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      <Dialog open={!!notesModal} onOpenChange={(open) => !open && setNotesModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>Internal notes for &ldquo;{notesModal?.title}&rdquo;</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add admin notes..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesModal(null)}>Cancel</Button>
            <Button onClick={handleNotes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteDialog?.title}&rdquo;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
