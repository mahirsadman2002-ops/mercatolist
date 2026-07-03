"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Ban, ShieldCheck, ChevronDown, ChevronUp, Pencil, ExternalLink, Building2, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface UserListing {
  id: string;
  slug: string;
  title: string;
  status: string;
  askingPrice: number;
  borough: string;
  neighborhood: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  _count: { listings: number };
}

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-gray-100 text-gray-700",
  BROKER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sellersOnly, setSellersOnly] = useState(false);

  // Per-user listing drill-down (expand a row to see + edit their listings).
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [listingsByUser, setListingsByUser] = useState<Record<string, UserListing[]>>({});
  const [listingsLoading, setListingsLoading] = useState<string | null>(null);

  // Create-user (managed account) dialog.
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    accountType: "SELLER" as "SELLER" | "ADVISOR",
    brokerageName: "",
  });

  // Modals
  const [roleModal, setRoleModal] = useState<{ user: User; newRole: string } | null>(null);
  const [banModal, setBanModal] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (sellersOnly) params.set("hasListings", "true");

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUsers(res.data);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, sellersOnly]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleExpand = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(userId);
    // Fetch this user's listings once, then cache.
    if (!listingsByUser[userId]) {
      setListingsLoading(userId);
      try {
        const res = await fetch(`/api/admin/listings?userId=${userId}&limit=100`);
        const data = await res.json();
        if (data.success) {
          setListingsByUser((prev) => ({ ...prev, [userId]: data.data }));
        }
      } catch {
        toast.error("Failed to load listings");
      } finally {
        setListingsLoading(null);
      }
    }
  };

  const handleRoleChange = async () => {
    if (!roleModal) return;
    try {
      const res = await fetch(`/api/admin/users/${roleModal.user.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleModal.newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Role updated");
        setRoleModal(null);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch { toast.error("Failed to update role"); }
  };

  const handleBan = async () => {
    if (!banModal) return;
    try {
      const res = await fetch(`/api/admin/users/${banModal.id}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannedReason: banReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User banned");
        setBanModal(null);
        setBanReason("");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to ban user");
      }
    } catch { toast.error("Failed to ban user"); }
  };

  const handleUnban = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unban`, { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        toast.success("User unbanned");
        fetchUsers();
      }
    } catch { toast.error("Failed to unban user"); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteDialog.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        setDeleteDialog(null);
        fetchUsers();
      }
    } catch { toast.error("Failed to delete user"); }
  };

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        const { created, claimEmailSent } = data.data;
        toast.success(
          created
            ? claimEmailSent
              ? "Account created — a claim link was emailed so they can set a password."
              : "Account created (claim email couldn't be sent)."
            : claimEmailSent
              ? "That account already existed and is unclaimed — resent the claim link."
              : "That account already exists."
        );
        setCreateOpen(false);
        setNewUser({ name: "", email: "", phone: "", accountType: "SELLER", brokerageName: "" });
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch {
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total users</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Create user
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="USER">Sellers &amp; Buyers</SelectItem>
                <SelectItem value="BROKER">Brokers / Advisors</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={sellersOnly ? "default" : "outline"}
              onClick={() => { setSellersOnly((v) => !v); setPage(1); }}
              className="gap-1.5"
            >
              <Building2 className="h-4 w-4" />
              With listings
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
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Listings</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isExpanded = expandedId === user.id;
                  const canExpand = user._count.listings > 0;
                  const userListings = listingsByUser[user.id] || [];
                  return (
                  <Fragment key={user.id}>
                  <TableRow className={isExpanded ? "border-b-0" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[user.role] || ""}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canExpand ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(user.id)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-muted"
                        >
                          {user._count.listings}
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {["USER", "BROKER", "ADMIN"]
                            .filter((r) => r !== user.role)
                            .map((r) => (
                              <DropdownMenuItem key={r} onClick={() => setRoleModal({ user, newRole: r })}>
                                <ShieldCheck className="h-4 w-4 mr-2" /> Set {r}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          {user.isBanned ? (
                            <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                              <ShieldCheck className="h-4 w-4 mr-2" /> Unban
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => { setBanModal(user); setBanReason(""); }}>
                              <Ban className="h-4 w-4 mr-2" /> Ban
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog(user)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Expanded: this user's listings, each editable by admin */}
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={7} className="p-0">
                        <div className="px-6 py-4">
                          {listingsLoading === user.id ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading listings…
                            </div>
                          ) : userListings.length === 0 ? (
                            <p className="py-3 text-sm text-muted-foreground">No listings for this user.</p>
                          ) : (
                            <div className="space-y-1.5">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {user.name}&apos;s listings ({userListings.length})
                              </p>
                              {userListings.map((l) => (
                                <div
                                  key={l.id}
                                  className="flex items-center gap-3 rounded-md border bg-background px-3 py-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate text-sm font-medium">{l.title}</span>
                                      <Badge variant="outline" className="shrink-0 text-[10px]">
                                        {l.status.replace("_", " ")}
                                      </Badge>
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                      ${Number(l.askingPrice).toLocaleString()} · {l.neighborhood}, {l.borough.replace("_", " ")}
                                    </p>
                                  </div>
                                  <Button asChild variant="ghost" size="sm" className="h-8 gap-1">
                                    <a href={`/listings/${l.slug}`} target="_blank" rel="noreferrer">
                                      <ExternalLink className="h-3.5 w-3.5" /> View
                                    </a>
                                  </Button>
                                  <Button asChild variant="outline" size="sm" className="h-8 gap-1">
                                    <Link href={`/my-listings/${l.id}/edit`}>
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </Fragment>
                  );
                })
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

      {/* Role Change Dialog */}
      <AlertDialog open={!!roleModal} onOpenChange={(open) => !open && setRoleModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change {roleModal?.user.name}&apos;s role to {roleModal?.newRole}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Dialog */}
      <Dialog open={!!banModal} onOpenChange={(open) => !open && setBanModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Provide a reason for banning {banModal?.name}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason</Label>
            <Textarea
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBan} disabled={!banReason.trim()}>Ban User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteDialog?.name}&apos;s account and all associated data. This cannot be undone.
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

      {/* Create user (managed account) */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a user</DialogTitle>
            <DialogDescription>
              Sets up an account on their behalf. They&apos;ll get an email with a
              link to set a password and claim it — until then it&apos;s a managed,
              unclaimed account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cu-name">Full name</Label>
              <Input
                id="cu-name"
                value={newUser.name}
                onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email</Label>
              <Input
                id="cu-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                placeholder="jane@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cu-phone">Phone (optional)</Label>
                <Input
                  id="cu-phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser((u) => ({ ...u, phone: e.target.value }))}
                  placeholder="(212) 555-0100"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Account type</Label>
                <Select
                  value={newUser.accountType}
                  onValueChange={(v) =>
                    setNewUser((u) => ({ ...u, accountType: v as "SELLER" | "ADVISOR" }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELLER">Seller / Buyer</SelectItem>
                    <SelectItem value="ADVISOR">Broker / Advisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newUser.accountType === "ADVISOR" && (
              <div className="space-y-1.5">
                <Label htmlFor="cu-brokerage">Brokerage (optional)</Label>
                <Input
                  id="cu-brokerage"
                  value={newUser.brokerageName}
                  onChange={(e) => setNewUser((u) => ({ ...u, brokerageName: e.target.value }))}
                  placeholder="Acme Business Brokers"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & send claim link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
