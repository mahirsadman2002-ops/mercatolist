"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Mail,
  FolderOpen,
  Search,
  Phone,
  Building2,
  Send,
  UserPlus,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { BUSINESS_CATEGORIES, BOROUGHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  preferredCategories: string[];
  preferredBoroughs: string[];
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  revenueRangeMin?: number | null;
  revenueRangeMax?: number | null;
  notes?: string | null;
  collectionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ListingSearchResult {
  id: string;
  title: string;
  category: string;
  neighborhood: string;
  borough: string;
  askingPrice: number;
  slug: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create/Edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formBoroughs, setFormBoroughs] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState("");

  // Delete state
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  // Send Listing modal state
  const [sendListingClientId, setSendListingClientId] = useState<string | null>(null);
  const [listingSearchQuery, setListingSearchQuery] = useState("");
  const [listingSearchResults, setListingSearchResults] = useState<ListingSearchResult[]>([]);
  const [selectedListings, setSelectedListings] = useState<ListingSearchResult[]>([]);
  const [isSearchingListings, setIsSearchingListings] = useState(false);
  const [isSendingListing, setIsSendingListing] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  // Category picker state
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [boroughPickerOpen, setBoroughPickerOpen] = useState(false);

  const isBroker = session?.user?.role === "BROKER";

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setClients(json.data);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormCompany("");
    setFormCategories([]);
    setFormBoroughs([]);
    setFormNotes("");
    setEditingClient(null);
  };

  const openCreateModal = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditModal = (client: ClientData) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormEmail(client.email);
    setFormPhone(client.phone || "");
    setFormCompany(client.company || "");
    setFormCategories(client.preferredCategories || []);
    setFormBoroughs(client.preferredBoroughs || []);
    setFormNotes(client.notes || "");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) return;
    setIsSaving(true);

    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        company: formCompany.trim() || undefined,
        preferredCategories: formCategories,
        preferredBoroughs: formBoroughs,
        notes: formNotes.trim() || undefined,
      };

      if (editingClient) {
        // Update existing client
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update client");
        }
        toast.success("Client updated");
      } else {
        // Create new client
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create client");
        }
        toast.success("Client added");
      }

      setFormOpen(false);
      resetForm();
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteClientId) return;

    try {
      const res = await fetch(`/api/clients/${deleteClientId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setClients((prev) => prev.filter((c) => c.id !== deleteClientId));
      toast.success("Client removed");
    } catch {
      toast.error("Failed to remove client");
    } finally {
      setDeleteClientId(null);
    }
  };

  // Listing search for send-listing modal
  const searchListings = useCallback(async (query: string) => {
    if (!query.trim()) {
      setListingSearchResults([]);
      return;
    }
    setIsSearchingListings(true);
    try {
      const res = await fetch(
        `/api/listings?keyword=${encodeURIComponent(query)}&limit=10&status=ACTIVE`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setListingSearchResults(
          json.data.map((l: Record<string, unknown>) => ({
            id: l.id,
            title: l.title,
            category: l.category,
            neighborhood: l.neighborhood,
            borough: l.borough,
            askingPrice: Number(l.askingPrice),
            slug: l.slug,
          }))
        );
      }
    } catch {
      // Silently fail search
    } finally {
      setIsSearchingListings(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (listingSearchQuery) searchListings(listingSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [listingSearchQuery, searchListings]);

  const toggleListingSelection = (listing: ListingSearchResult) => {
    setSelectedListings((prev) => {
      const exists = prev.find((l) => l.id === listing.id);
      if (exists) return prev.filter((l) => l.id !== listing.id);
      return [...prev, listing];
    });
  };

  const handleSendListings = async () => {
    if (!sendListingClientId || selectedListings.length === 0) return;
    setIsSendingListing(true);

    try {
      const endpoint =
        selectedListings.length === 1
          ? `/api/clients/${sendListingClientId}/send-listing`
          : `/api/clients/${sendListingClientId}/send-listings`;

      const body =
        selectedListings.length === 1
          ? {
              listingId: selectedListings[0].id,
              personalMessage: sendMessage.trim() || undefined,
            }
          : {
              listingIds: selectedListings.map((l) => l.id),
              personalMessage: sendMessage.trim() || undefined,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }

      toast.success(
        `${selectedListings.length} listing${selectedListings.length !== 1 ? "s" : ""} sent`
      );
      setSendListingClientId(null);
      setSelectedListings([]);
      setListingSearchQuery("");
      setListingSearchResults([]);
      setSendMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send listings");
    } finally {
      setIsSendingListing(false);
    }
  };

  const handleInvite = async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send invitation");
      }
      toast.success("Invitation sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  const toggleCategory = (cat: string) => {
    setFormCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleBorough = (val: string) => {
    setFormBoroughs((prev) =>
      prev.includes(val) ? prev.filter((b) => b !== val) : [...prev, val]
    );
  };

  if (!isBroker) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Users className="size-14 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          Client management is available for business advisors only.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your buyer clients and their collections
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="size-4" />
          Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
          <Users className="size-14 text-muted-foreground/30" />
          <div>
            <p className="text-lg font-semibold">No clients yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              Add clients to create collections and set up auto-searches for them.
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="size-4" />
            Add Your First Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-sm font-semibold truncate block text-left hover:underline cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                      title="View client collections"
                    >
                      {client.name}
                    </button>
                    <p className="text-xs text-muted-foreground truncate">
                      {client.email}
                    </p>
                    {client.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3" />
                        {client.phone}
                      </p>
                    )}
                    {client.company && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="size-3" />
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Collection count */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    <FolderOpen className="size-2.5 mr-0.5" />
                    {client.collectionCount} collection{client.collectionCount !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Preferred categories */}
                {client.preferredCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {client.preferredCategories.slice(0, 3).map((c) => (
                      <Badge key={c} className="text-[9px] bg-teal-50 text-teal-700 hover:bg-teal-100 border-0">
                        {c}
                      </Badge>
                    ))}
                    {client.preferredCategories.length > 3 && (
                      <Badge variant="secondary" className="text-[9px]">
                        +{client.preferredCategories.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Preferred boroughs */}
                {client.preferredBoroughs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {client.preferredBoroughs.map((b) => (
                      <Badge key={b} variant="outline" className="text-[9px]">
                        {BOROUGHS.find((br) => br.value === b)?.label || b}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Price range */}
                {(client.priceRangeMin || client.priceRangeMax) && (
                  <p className="text-[10px] text-muted-foreground">
                    Budget:{" "}
                    {client.priceRangeMin ? formatCurrency(client.priceRangeMin) : "Any"}{" "}
                    -{" "}
                    {client.priceRangeMax ? formatCurrency(client.priceRangeMax) : "Any"}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSendListingClientId(client.id)}
                  >
                    <Send className="size-3.5" />
                    Send Listing
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <span className="sr-only">More actions</span>
                        &middot;&middot;&middot;
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(client)}>
                        <Pencil className="size-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        <FolderOpen className="size-3.5 mr-2" />
                        View Collections
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleInvite(client.id)}>
                        <UserPlus className="size-3.5 mr-2" />
                        Send Invite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteClientId(client.id)}
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Client Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Update your client's details and preferences."
                : "Add a buyer client to create collections and auto-searches for them."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="(212) 555-0100"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            {/* Preferred Categories */}
            <div className="space-y-1.5">
              <Label>Preferred Categories</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setCategoryPickerOpen(!categoryPickerOpen)}
                >
                  {formCategories.length === 0 ? (
                    <span className="text-muted-foreground">Select categories...</span>
                  ) : (
                    <span className="truncate">
                      {formCategories.length} selected
                    </span>
                  )}
                </Button>
                {categoryPickerOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
                        onClick={() => toggleCategory(cat)}
                      >
                        <div
                          className={`size-4 rounded border flex items-center justify-center ${
                            formCategories.includes(cat)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input"
                          }`}
                        >
                          {formCategories.includes(cat) && <Check className="size-3" />}
                        </div>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {formCategories.map((cat) => (
                    <Badge
                      key={cat}
                      className="text-[10px] cursor-pointer bg-teal-50 text-teal-700 hover:bg-teal-100 border-0"
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                      <X className="size-2.5 ml-0.5" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Preferred Boroughs */}
            <div className="space-y-1.5">
              <Label>Preferred Boroughs</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setBoroughPickerOpen(!boroughPickerOpen)}
                >
                  {formBoroughs.length === 0 ? (
                    <span className="text-muted-foreground">Select boroughs...</span>
                  ) : (
                    <span className="truncate">
                      {formBoroughs.length} selected
                    </span>
                  )}
                </Button>
                {boroughPickerOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    {BOROUGHS.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
                        onClick={() => toggleBorough(b.value)}
                      >
                        <div
                          className={`size-4 rounded border flex items-center justify-center ${
                            formBoroughs.includes(b.value)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input"
                          }`}
                        >
                          {formBoroughs.includes(b.value) && <Check className="size-3" />}
                        </div>
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formBoroughs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {formBoroughs.map((val) => (
                    <Badge
                      key={val}
                      variant="outline"
                      className="text-[10px] cursor-pointer"
                      onClick={() => toggleBorough(val)}
                    >
                      {BOROUGHS.find((b) => b.value === val)?.label || val}
                      <X className="size-2.5 ml-0.5" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any notes about this client's preferences or situation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || !formEmail.trim() || isSaving}
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Listing Dialog */}
      <Dialog
        open={!!sendListingClientId}
        onOpenChange={(open) => {
          if (!open) {
            setSendListingClientId(null);
            setSelectedListings([]);
            setListingSearchQuery("");
            setListingSearchResults([]);
            setSendMessage("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Listings</DialogTitle>
            <DialogDescription>
              Search for listings to send to{" "}
              {clients.find((c) => c.id === sendListingClientId)?.name || "this client"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Search */}
            <div className="space-y-1.5">
              <Label>Search Listings</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={listingSearchQuery}
                  onChange={(e) => setListingSearchQuery(e.target.value)}
                  placeholder="Search by name, category, or location..."
                />
              </div>
            </div>

            {/* Search Results */}
            {isSearchingListings && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {listingSearchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-1">
                {listingSearchResults.map((listing) => {
                  const isSelected = selectedListings.some((l) => l.id === listing.id);
                  return (
                    <button
                      key={listing.id}
                      type="button"
                      className={`w-full flex items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm hover:bg-accent ${
                        isSelected ? "bg-accent" : ""
                      }`}
                      onClick={() => toggleListingSelection(listing)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {listing.category} &bull; {listing.neighborhood} &bull;{" "}
                          {formatCurrency(listing.askingPrice)}
                        </p>
                      </div>
                      <div
                        className={`size-5 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input"
                        }`}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected listings */}
            {selectedListings.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {selectedListings.length} listing{selectedListings.length !== 1 ? "s" : ""} selected
                </Label>
                <div className="flex flex-wrap gap-1">
                  {selectedListings.map((listing) => (
                    <Badge
                      key={listing.id}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => toggleListingSelection(listing)}
                    >
                      {listing.title}
                      <X className="size-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Personal message */}
            <div className="space-y-1.5">
              <Label>Personal Message (optional)</Label>
              <Textarea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder="Add a note for your client..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSendListingClientId(null);
                setSelectedListings([]);
                setListingSearchQuery("");
                setListingSearchResults([]);
                setSendMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendListings}
              disabled={selectedListings.length === 0 || isSendingListing}
            >
              {isSendingListing && <Loader2 className="size-4 animate-spin" />}
              <Mail className="size-4" />
              Send {selectedListings.length > 0 ? `(${selectedListings.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClientId} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the client record and unlink any assigned collections.
              The collections themselves will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
