"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

interface MessageThreadProps {
  inquiryId: string;
  initialMessages?: MessageData[];
  pollInterval?: number;
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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function groupMessagesByDate(messages: MessageData[]): Map<string, MessageData[]> {
  const groups = new Map<string, MessageData[]>();
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toDateString();
    const group = groups.get(key) || [];
    group.push(msg);
    groups.set(key, group);
  }
  return groups;
}

export function MessageThread({
  inquiryId,
  initialMessages = [],
  pollInterval = 10000,
}: MessageThreadProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(initialMessages.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/messages`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch {
      // Silently fail for polling
    }
  }, [inquiryId]);

  // Initial load
  useEffect(() => {
    if (initialMessages.length === 0) {
      fetchMessages().finally(() => setIsLoading(false));
    }
  }, [fetchMessages, initialMessages.length]);

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchMessages, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMessages, pollInterval]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom(messages.length <= (initialMessages.length || 1) ? "instant" : "smooth");
  }, [messages.length, initialMessages.length, scrollToBottom]);

  // Send message
  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setNewMessage("");

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      const json = await res.json();
      if (json.success && json.data) {
        setMessages((prev) => [...prev, json.data]);
      }
    } catch (err) {
      setNewMessage(content); // Restore the message
      toast.error(
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending, inquiryId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dateGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          Array.from(dateGroups.entries()).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 border-t" />
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDateHeader(msgs[0].createdAt)}
                </span>
                <div className="flex-1 border-t" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {msgs.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  const displayName =
                    msg.sender.displayName || msg.sender.name;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2.5",
                        isOwn ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="size-8 shrink-0">
                          {msg.sender.avatarUrl && (
                            <AvatarImage
                              src={msg.sender.avatarUrl}
                              alt={displayName}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[75%] space-y-1",
                          isOwn ? "items-end" : "items-start"
                        )}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium text-muted-foreground">
                            {displayName}
                          </p>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>
                        <p
                          className={cn(
                            "text-[10px] text-muted-foreground",
                            isOwn ? "text-right" : "text-left"
                          )}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-background px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
