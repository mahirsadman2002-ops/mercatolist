"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  type: string;
  reason: string;
  details: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  listingId: string | null;
  reviewId: string | null;
  userId: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  LISTING: "bg-blue-100 text-blue-700",
  REVIEW: "bg-purple-100 text-purple-700",
  DEAL: "bg-amber-100 text-amber-700",
  USER: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  REVIEWED: "bg-blue-100 text-blue-700",
  DISMISSED: "bg-gray-100 text-gray-700",
  ACTION_TAKEN: "bg-green-100 text-green-700",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Update modal
  const [updateModal, setUpdateModal] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchReports = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/admin/reports?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setReports(res.data);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpdate = async () => {
    if (!updateModal || !newStatus) return;
    try {
      const res = await fetch(`/api/admin/reports/${updateModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNotes: adminNotes || null }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Report updated");
        setUpdateModal(null);
        fetchReports();
      } else {
        toast.error(data.error || "Failed to update report");
      }
    } catch { toast.error("Failed to update report"); }
  };

  const quickAction = async (report: Report, status: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Report ${status.toLowerCase().replace("_", " ")}`);
        fetchReports();
      }
    } catch { toast.error("Failed to update report"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} total reports</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LISTING">Listing</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="DEAL">Deal</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
                <SelectItem value="ACTION_TAKEN">Action Taken</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}><div className="h-4 animate-pulse rounded bg-muted" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge className={TYPE_COLORS[report.type] || ""}>{report.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{report.reason.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{report.reporter.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {report.details || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[report.status] || ""}>{report.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {report.adminNotes || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => quickAction(report, "REVIEWED")}>
                            Mark Reviewed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => quickAction(report, "DISMISSED")}>
                            Dismiss
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => quickAction(report, "ACTION_TAKEN")}>
                            Action Taken
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setUpdateModal(report);
                              setNewStatus(report.status);
                              setAdminNotes(report.adminNotes || "");
                            }}
                          >
                            Add Notes
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

      {/* Update Dialog */}
      <Dialog open={!!updateModal} onOpenChange={(open) => !open && setUpdateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Report</DialogTitle>
            <DialogDescription>
              {updateModal?.type} report — {updateModal?.reason}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  <SelectItem value="ACTION_TAKEN">Action Taken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this report..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateModal(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
