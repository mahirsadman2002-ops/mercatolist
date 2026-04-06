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
  MapPin,
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

interface ClientData {
  clientEmail: string;
  clientName: string;
  clientPhone?: string | null;
  clientBuyBox?: Record<string, unknown> | null;
  collectionCount: number;
  collections: { id: string; name: string; _count: { listings: number } }[];
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

export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

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

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formName.trim(),
          clientEmail: formEmail.trim(),
          clientPhone: formPhone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create client");
      }
      toast.success("Client added");
      setCreateOpen(false);
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmail) return;
    // Find a collection ID for this client
    const client = clients.find((c) => c.clientEmail === deleteEmail);
    if (!client || !client.collections[0]) return;

    try {
      await fetch(`/api/clients/${client.collections[0].id}`, {
        method: "DELETE",
      });
      setClients((prev) => prev.filter((c) => c.clientEmail !== deleteEmail));
      toast.success("Client removed");
    } catch {
      toast.error("Failed to remove client");
    } finally {
      setDeleteEmail(null);
    }
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
        <Button onClick={() => setCreateOpen(true)}>
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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add Your First Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.clientEmail}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{getInitials(client.clientName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate">
                      {client.clientName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {client.clientEmail}
                    </p>
                    {client.clientPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3" />
                        {client.clientPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Collections */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    <FolderOpen className="size-2.5 mr-0.5" />
                    {client.collectionCount} collection{client.collectionCount !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Buy box */}
                {client.clientBuyBox && (
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray((client.clientBuyBox as Record<string, unknown>).categories) &&
                      ((client.clientBuyBox as Record<string, unknown>).categories as string[]).slice(0, 2).map((c: string) => (
                        <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>
                      ))}
                    {Array.isArray((client.clientBuyBox as Record<string, unknown>).boroughs) &&
                      ((client.clientBuyBox as Record<string, unknown>).boroughs as string[]).slice(0, 2).map((b: string) => (
                        <Badge key={b} variant="outline" className="text-[9px]">
                          {BOROUGHS.find((br) => br.value === b)?.label || b}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (client.collections[0]) {
                        router.push(`/collections/${client.collections[0].id}`);
                      }
                    }}
                  >
                    <FolderOpen className="size-3.5" />
                    View Collections
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteEmail(client.clientEmail)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>
              Add a buyer client to create collections and auto-searches for them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client Name <span className="text-destructive">*</span></Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(212) 555-0100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName.trim() || !formEmail.trim() || isCreating}
            >
              {isCreating && <Loader2 className="size-4 animate-spin" />}
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEmail} onOpenChange={() => setDeleteEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove client info from all their collections. The collections themselves will remain.
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
