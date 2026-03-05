"use client";

import { useState, useCallback } from "react";
import { Bell, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface SaveSearchPromptProps {
  criteria: Record<string, unknown>;
  hasSearched: boolean;
}

export function SaveSearchPrompt({ criteria, hasSearched }: SaveSearchPromptProps) {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria,
          checkFrequency: "DAILY",
          emailFrequency: "DAILY_DIGEST",
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      toast.success("Search saved! You'll get notified about new matches.");
    } catch {
      toast.error("Failed to save search");
    } finally {
      setSaving(false);
    }
  }, [criteria]);

  // Don't show if: not logged in, no search performed, dismissed, or already saved
  if (!session?.user || !hasSearched || dismissed || saved) return null;

  // Check if there are any meaningful criteria
  const hasCriteria = Object.values(criteria).some(
    (v) => v !== undefined && v !== null && v !== ""
  );
  if (!hasCriteria) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <Bell className="size-4 text-primary shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-medium">Save this search?</span>{" "}
        <span className="text-muted-foreground">
          Get notified when new listings match.
        </span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Save Search"
          )}
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
