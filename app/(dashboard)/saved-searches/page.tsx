"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Bell,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Pause,
  Play,
  ExternalLink,
  Clock,
  Mail,
  Briefcase,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { BOROUGHS, PRICE_RANGES } from "@/lib/constants";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
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

interface SavedSearchData {
  id: string;
  name: string | null;
  criteria: {
    category?: string;
    borough?: string;
    neighborhood?: string;
    priceMin?: number;
    priceMax?: number;
    revenueMin?: number;
    revenueMax?: number;
    keyword?: string;
    clientEmail?: string;
    clientName?: string;
    clientId?: string;
  };
  checkFrequency: string;
  emailFrequency: string;
  isActive: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
}

interface ClientRecord {
  id: string;
  name: string;
  email?: string | null;
}

function buildSearchName(criteria: SavedSearchData["criteria"]): string {
  const parts: string[] = [];
  if (criteria.category) parts.push(criteria.category);
  if (criteria.borough) {
    const b = BOROUGHS.find((b) => b.value === criteria.borough);
    parts.push(b ? `in ${b.label}` : `in ${criteria.borough}`);
  }
  if (criteria.neighborhood) parts.push(criteria.neighborhood);
  if (criteria.priceMin || criteria.priceMax) {
    const r = PRICE_RANGES.find(
      (r) => r.min === criteria.priceMin && r.max === criteria.priceMax
    );
    parts.push(r ? r.label : "Custom price");
  }
  return parts.length > 0 ? parts.join(", ") : "All listings";
}

function frequencyLabel(freq: string): string {
  switch (freq) {
    case "IMMEDIATELY": return "Immediately";
    case "DAILY_DIGEST": return "Daily digest";
    case "WEEKLY_DIGEST": return "Weekly digest";
    case "DAILY": return "Daily";
    case "WEEKLY": return "Weekly";
    default: return freq;
  }
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isBroker = userRole === "BROKER";

  const [searches, setSearches] = useState<SavedSearchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Broker client state
  const [brokerClients, setBrokerClients] = useState<ClientRecord[]>([]);
  const [assigningSearchId, setAssigningSearchId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBorough, setFormBorough] = useState("");
  const [formPriceMin, setFormPriceMin] = useState("");
  const [formPriceMax, setFormPriceMax] = useState("");
  const [formCheckFreq, setFormCheckFreq] = useState("DAILY");
  const [formEmailFreq, setFormEmailFreq] = useState("DAILY_DIGEST");

  const fetchSearches = useCallback(async () => {
    try {
      const res = await fetch("/api/saved-searches");
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setSearches(json.data);
    } catch {
      toast.error("Failed to load saved searches");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  // Fetch broker clients
  useEffect(() => {
    if (!isBroker) return;
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success) {
          setBrokerClients(
            json.data.map((c: { id: string; name: string; email?: string | null }) => ({
              id: c.id,
              name: c.name,
              email: c.email,
            }))
          );
        }
      } catch {
        // silent fail
      }
    };
    fetchClients();
  }, [isBroker]);

  // Assign saved search to a client
  const handleAssignClient = async (searchId: string, client: ClientRecord | null) => {
    setIsAssigning(true);
    try {
      const search = searches.find((s) => s.id === searchId);
      if (!search) return;

      const updatedCriteria = { ...search.criteria };
      if (client) {
        updatedCriteria.clientId = client.id;
        updatedCriteria.clientName = client.name;
        updatedCriteria.clientEmail = client.email || undefined;
      } else {
        delete updatedCriteria.clientId;
        delete updatedCriteria.clientName;
        delete updatedCriteria.clientEmail;
      }

      const res = await fetch(`/api/saved-searches/${searchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: updatedCriteria }),
      });
      if (!res.ok) throw new Error();

      setSearches((prev) =>
        prev.map((s) =>
          s.id === searchId ? { ...s, criteria: updatedCriteria } : s
        )
      );
      setAssigningSearchId(null);
      toast.success(
        client
          ? `Search assigned to ${client.name}`
          : "Client unassigned from search"
      );
    } catch {
      toast.error("Failed to assign client");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-searches/${id}/toggle`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: json.data.isActive } : s))
      );
      toast.success(json.data.isActive ? "Search activated" : "Search paused");
    } catch {
      toast.error("Failed to toggle search");
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const criteria: Record<string, unknown> = {};
      if (formCategory) criteria.category = formCategory;
      if (formBorough) criteria.borough = formBorough;
      if (formPriceMin) criteria.priceMin = parseInt(formPriceMin);
      if (formPriceMax) criteria.priceMax = parseInt(formPriceMax);

      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim() || undefined,
          criteria,
          checkFrequency: formCheckFreq,
          emailFrequency: formEmailFreq,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved search created");
      setCreateOpen(false);
      resetForm();
      fetchSearches();
    } catch {
      toast.error("Failed to create saved search");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/saved-searches/${deleteId}`, { method: "DELETE" });
      setSearches((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("Saved search deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCategory("");
    setFormBorough("");
    setFormPriceMin("");
    setFormPriceMax("");
    setFormCheckFreq("DAILY");
    setFormEmailFreq("DAILY_DIGEST");
  };

  const viewResults = (criteria: SavedSearchData["criteria"]) => {
    const params = new URLSearchParams();
    if (criteria.category) params.set("category", criteria.category);
    if (criteria.borough) params.set("borough", criteria.borough);
    if (criteria.priceMin) params.set("priceMin", String(criteria.priceMin));
    if (criteria.priceMax) params.set("priceMax", String(criteria.priceMax));
    router.push(`/listings?${params.toString()}`);
  };

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
          <h1 className="text-2xl font-bold">Saved Searches</h1>
          <p className="text-sm text-muted-foreground">
            Get notified when new listings match your criteria
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Search
        </Button>
      </div>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
          <Bell className="size-14 text-muted-foreground/30" />
          <div>
            <p className="text-lg font-semibold">No saved searches</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              Save a search to get notified when new listings match your criteria.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create Your First Search
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => {
            const displayName = search.name || buildSearchName(search.criteria);

            return (
              <Card key={search.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Switch
                    checked={search.isActive}
                    onCheckedChange={() => handleToggle(search.id)}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">
                        {displayName}
                      </h3>
                      {!search.isActive && (
                        <Badge variant="secondary" className="text-[10px]">
                          Paused
                        </Badge>
                      )}
                      {search.criteria.clientEmail && (
                        <Badge variant="outline" className="text-[10px]">
                          <Briefcase className="size-2.5 mr-0.5" />
                          {search.criteria.clientName || "Client Search"}
                        </Badge>
                      )}
                    </div>

                    {/* Criteria badges */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {search.criteria.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          {search.criteria.category}
                        </Badge>
                      )}
                      {search.criteria.borough && (
                        <Badge variant="secondary" className="text-[10px]">
                          {BOROUGHS.find((b) => b.value === search.criteria.borough)?.label || search.criteria.borough}
                        </Badge>
                      )}
                      {(search.criteria.priceMin || search.criteria.priceMax) && (
                        <Badge variant="secondary" className="text-[10px]">
                          {search.criteria.priceMin ? `$${(search.criteria.priceMin / 1000).toFixed(0)}K` : "$0"}
                          {" - "}
                          {search.criteria.priceMax ? `$${(search.criteria.priceMax / 1000).toFixed(0)}K` : "Any"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Check: {frequencyLabel(search.checkFrequency)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />
                        Email: {frequencyLabel(search.emailFrequency)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Assign to Client (broker only) */}
                    {isBroker && (
                      <div className="relative">
                        <Button
                          variant={search.criteria.clientId ? "secondary" : "outline"}
                          size="sm"
                          onClick={() =>
                            setAssigningSearchId(
                              assigningSearchId === search.id ? null : search.id
                            )
                          }
                        >
                          <Briefcase className="size-3.5" />
                          {search.criteria.clientName
                            ? search.criteria.clientName
                            : "Assign"}
                        </Button>
                        {assigningSearchId === search.id && (
                          <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border bg-popover shadow-lg z-50">
                            <div className="p-1">
                              {brokerClients.length === 0 ? (
                                <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                                  No clients yet
                                </p>
                              ) : (
                                <>
                                  {search.criteria.clientId && (
                                    <>
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent text-left text-muted-foreground"
                                        onClick={() =>
                                          handleAssignClient(search.id, null)
                                        }
                                        disabled={isAssigning}
                                      >
                                        <X className="size-3.5 shrink-0" />
                                        <span>Unassign client</span>
                                      </button>
                                      <div className="h-px bg-border my-1" />
                                    </>
                                  )}
                                  {brokerClients.map((client) => (
                                    <button
                                      key={client.id}
                                      type="button"
                                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent text-left ${
                                        search.criteria.clientId === client.id
                                          ? "bg-primary/5 text-primary font-medium"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        handleAssignClient(search.id, client)
                                      }
                                      disabled={isAssigning}
                                    >
                                      <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
                                      <div className="flex-1 min-w-0">
                                        <span className="truncate block">
                                          {client.name}
                                        </span>
                                        {client.email && (
                                          <span className="text-[10px] text-muted-foreground truncate block">
                                            {client.email}
                                          </span>
                                        )}
                                      </div>
                                      {isAssigning &&
                                        search.criteria.clientId === client.id && (
                                          <Loader2 className="size-3 animate-spin" />
                                        )}
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewResults(search.criteria)}
                    >
                      <ExternalLink className="size-3.5" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(search.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Saved Search</DialogTitle>
            <DialogDescription>
              Set your criteria and notification preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Search Name (optional)</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Restaurants in Brooklyn"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <CategoryCombobox
                  value={formCategory === "__all__" ? "" : formCategory}
                  onValueChange={(val) => setFormCategory(val || "__all__")}
                  allowAll
                  allLabel="Any Category"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Borough</Label>
                <Select value={formBorough} onValueChange={setFormBorough}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Any Borough</SelectItem>
                    {BOROUGHS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Price</Label>
                <Input
                  type="number"
                  value={formPriceMin}
                  onChange={(e) => setFormPriceMin(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Price</Label>
                <Input
                  type="number"
                  value={formPriceMax}
                  onChange={(e) => setFormPriceMax(e.target.value)}
                  placeholder="Any"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Check frequency</Label>
                <Select value={formCheckFreq} onValueChange={setFormCheckFreq}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Email frequency</Label>
                <Select value={formEmailFreq} onValueChange={setFormEmailFreq}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATELY">Immediately</SelectItem>
                    <SelectItem value="DAILY_DIGEST">Daily digest</SelectItem>
                    <SelectItem value="WEEKLY_DIGEST">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="size-4 animate-spin" />}
              Create Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll stop receiving notifications for this search.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
