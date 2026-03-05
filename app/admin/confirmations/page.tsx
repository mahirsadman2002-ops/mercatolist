"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ConfirmationListing {
  id: string;
  title: string;
  slug: string;
  status: string;
  lastStatusConfirmation: string | null;
  statusConfirmationDue: string | null;
  createdAt: string;
  listedBy: { name: string; email: string };
  confirmationStatus: string;
  daysSinceConfirmation: number | null;
}

const CONFIRMATION_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  due_soon: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  never_confirmed: "bg-gray-100 text-gray-700",
};

export default function AdminConfirmationsPage() {
  const [listings, setListings] = useState<ConfirmationListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const fetchListings = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25", filter });

    fetch(`/api/admin/confirmations?${params}`)
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
  }, [page, filter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleReminder = async (id: string) => {
    setSendingReminder(id);
    try {
      const res = await fetch(`/api/admin/confirmations/${id}/remind`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Reminder sent");
      } else {
        toast.error("Failed to send reminder");
      }
    } catch {
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleConfirm = async (id: string) => {
    setConfirming(id);
    try {
      const res = await fetch(`/api/admin/confirmations/${id}/confirm`, { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        toast.success("Listing confirmed");
        fetchListings();
      } else {
        toast.error("Failed to confirm listing");
      }
    } catch {
      toast.error("Failed to confirm listing");
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Listing Status Confirmations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track 7-day listing status confirmations from owners
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="due_soon">Due Soon</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Listed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Confirmed</TableHead>
                <TableHead>Days Since</TableHead>
                <TableHead>Confirmation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><div className="h-4 animate-pulse rounded bg-muted" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No listings found
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">{listing.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{listing.listedBy.name}</p>
                        <p className="text-xs text-muted-foreground">{listing.listedBy.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{listing.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {listing.lastStatusConfirmation
                        ? new Date(listing.lastStatusConfirmation).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {listing.daysSinceConfirmation !== null
                        ? `${listing.daysSinceConfirmation}d`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={CONFIRMATION_COLORS[listing.confirmationStatus] || ""}>
                        {listing.confirmationStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sendingReminder === listing.id}
                          onClick={() => handleReminder(listing.id)}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          {sendingReminder === listing.id ? "Sending..." : "Remind"}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={confirming === listing.id}
                          onClick={() => handleConfirm(listing.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {confirming === listing.id ? "..." : "Confirm"}
                        </Button>
                      </div>
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
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
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
    </div>
  );
}
