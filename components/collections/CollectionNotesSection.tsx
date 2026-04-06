"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, StickyNote, Trash2, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NoteUser {
  id: string;
  name: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface CollectionNote {
  id: string;
  content: string;
  listingId?: string | null;
  user: NoteUser;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CollectionNotesSection({
  collectionId,
  listingId,
}: {
  collectionId: string;
  listingId: string;
}) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const currentUserId = session?.user?.id;

  const [notes, setNotes] = useState<CollectionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch notes for this listing in this collection
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/notes?listingId=${listingId}`
      );
      if (!res.ok) {
        setNotes([]);
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotes(json.data);
      } else {
        setNotes([]);
      }
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, listingId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote.trim(),
          listingId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add note");
      }
      const json = await res.json();
      if (json.success) {
        setNotes((prev) => [json.data, ...prev]);
        setNewNote("");
        toast.success("Note added");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add note"
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/notes/${noteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <StickyNote className="size-4" />
          Collection Notes
        </h3>

        {/* Add note form (logged in only) */}
        {isLoggedIn ? (
          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this listing..."
              rows={2}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || isAdding}
            >
              {isAdding && <Loader2 className="size-3.5 animate-spin mr-1" />}
              Add Note
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            <LogIn className="size-4 shrink-0" />
            <span>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/")}`}
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>{" "}
              to add notes
            </span>
          </div>
        )}

        {/* Notes list */}
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No notes for this listing yet.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="group/note flex gap-3 text-sm">
                <Avatar className="size-7 shrink-0">
                  {note.user.avatarUrl && (
                    <AvatarImage src={note.user.avatarUrl} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {initials(note.user.displayName || note.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium">
                      {note.user.displayName || note.user.name}
                    </span>
                    <span className="text-muted-foreground">
                      {timeAgo(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
                {isLoggedIn && currentUserId === note.user.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover/note:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
