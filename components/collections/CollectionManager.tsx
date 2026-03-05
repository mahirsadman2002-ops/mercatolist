"use client";

import { useState, useCallback } from "react";
import { Loader2, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CollectionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (collection: { id: string; name: string }) => void;
  initialListingId?: string;
}

export function CollectionManager({
  open,
  onOpenChange,
  onCreated,
  initialListingId,
}: CollectionManagerProps) {
  const { data: session } = useSession();
  const isBroker = session?.user?.role === "BROKER";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignToClient, setAssignToClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        listingId: initialListingId,
      };

      if (isBroker && assignToClient) {
        body.clientName = clientName.trim();
        body.clientEmail = clientEmail.trim();
        body.clientPhone = clientPhone.trim() || undefined;
      }

      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      const json = await res.json();
      toast.success(`Collection "${name.trim()}" created`);
      onCreated?.(json.data);
      onOpenChange(false);

      // Reset form
      setName("");
      setDescription("");
      setAssignToClient(false);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setIsCreating(false);
    }
  }, [
    name, description, initialListingId, isBroker, assignToClient,
    clientName, clientEmail, clientPhone, onCreated, onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Organize listings into a new collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Collection Name <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Manhattan Restaurants"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection for?"
              rows={2}
            />
          </div>

          {isBroker && (
            <>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Switch
                  checked={assignToClient}
                  onCheckedChange={setAssignToClient}
                />
                <div>
                  <p className="text-sm font-medium">Assign to client</p>
                  <p className="text-xs text-muted-foreground">
                    Share this collection with a buyer client
                  </p>
                </div>
              </div>

              {assignToClient && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1.5">
                    <Label>Client Name</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client Email</Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client Phone (optional)</Label>
                    <Input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(212) 555-0100"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
