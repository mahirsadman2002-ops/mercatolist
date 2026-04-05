"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Inbox,
  Send,
  Mail,
  MailOpen,
  MessageSquare,
  FileText,
  Clock,
  Loader2,
  ArrowLeft,
  User as UserIcon,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageThread } from "@/components/forms/MessageThread";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InquiryListing {
  id: string;
  title: string;
  slug: string;
  photos: { url: string }[];
}

interface InquiryUser {
  id: string;
  name: string;
  displayName?: string | null;
  email: string;
  avatarUrl?: string | null;
}

interface InquiryMessage {
  id: string;
  content: string;
  createdAt: string;
}

interface Inquiry {
  id: string;
  type: "ANONYMOUS_FORM" | "MESSAGE_THREAD";
  senderName?: string | null;
  senderEmail?: string | null;
  senderPhone?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  listing: InquiryListing;
  sender?: InquiryUser | null;
  receiver: InquiryUser;
  messages: InquiryMessage[];
  _count: { messages: number };
  unreadMessageCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// InquiryRow — single item in the list
// ---------------------------------------------------------------------------

function InquiryRow({
  inquiry,
  tab,
  isSelected,
  onClick,
}: {
  inquiry: Inquiry;
  tab: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isThread = inquiry.type === "MESSAGE_THREAD";
  const isUnread = !inquiry.isRead || inquiry.unreadMessageCount > 0;
  const contactName =
    tab === "sent"
      ? inquiry.receiver.displayName || inquiry.receiver.name
      : inquiry.sender?.displayName ||
        inquiry.sender?.name ||
        inquiry.senderName ||
        "Anonymous";
  const photoUrl = inquiry.listing.photos[0]?.url;
  const lastMessage =
    inquiry.messages[0]?.content || inquiry.message;
  const preview =
    lastMessage.length > 80 ? lastMessage.slice(0, 80) + "..." : lastMessage;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-muted/50",
        isSelected && "bg-muted",
        isUnread && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      {/* Avatar or listing photo */}
      <div className="relative shrink-0">
        {photoUrl ? (
          <div className="size-10 rounded-lg overflow-hidden bg-muted">
            <Image
              src={photoUrl}
              alt={inquiry.listing.title}
              width={40}
              height={40}
              className="size-full object-cover"
            />
          </div>
        ) : (
          <Avatar className="size-10">
            <AvatarFallback>{getInitials(contactName)}</AvatarFallback>
          </Avatar>
        )}
        {isUnread && (
          <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              isUnread ? "font-semibold" : "font-medium"
            )}
          >
            {contactName}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {timeAgo(inquiry.messages[0]?.createdAt || inquiry.createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {inquiry.listing.title}
        </p>
        <p
          className={cn(
            "text-xs mt-0.5 truncate",
            isUnread
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          )}
        >
          {preview}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge
          variant={isThread ? "default" : "secondary"}
          className="text-[9px] px-1.5 py-0"
        >
          {isThread ? (
            <MessageSquare className="size-2.5 mr-0.5" />
          ) : (
            <FileText className="size-2.5 mr-0.5" />
          )}
          {isThread ? "Thread" : "Form"}
        </Badge>
        {isThread && inquiry._count.messages > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {inquiry._count.messages} msg{inquiry._count.messages !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// AnonymousInquiryDetail — for viewing ANONYMOUS_FORM inquiries
// ---------------------------------------------------------------------------

function AnonymousInquiryDetail({
  inquiry,
  onBack,
}: {
  inquiry: Inquiry;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">
              Inquiry from {inquiry.senderName || "Anonymous"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              Re: {inquiry.listing.title}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>
                {getInitials(inquiry.senderName || "A")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">
                {inquiry.senderName || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </p>

            <div className="border-t pt-3 space-y-1.5">
              {inquiry.senderEmail && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <a
                    href={`mailto:${inquiry.senderEmail}`}
                    className="text-primary hover:underline"
                  >
                    {inquiry.senderEmail}
                  </a>
                </div>
              )}
              {inquiry.senderPhone && (
                <div className="flex items-center gap-2 text-xs">
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  <a
                    href={`tel:${inquiry.senderPhone}`}
                    className="text-primary hover:underline"
                  >
                    {inquiry.senderPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>
              This is an anonymous inquiry. Reply via the sender&apos;s email above.
            </span>
          </div>

          <Link href={`/listings/${inquiry.listing.slug}`}>
            <Button variant="outline" size="sm" className="mt-2">
              View Listing
              <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InquiriesPage
// ---------------------------------------------------------------------------

export default function InquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <InquiriesPageContent />
    </Suspense>
  );
}

function InquiriesPageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "received");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch inquiries
  const fetchInquiries = useCallback(async () => {
    try {
      const res = await fetch(`/api/inquiries?tab=${tab}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        setInquiries(json.data);
      }
    } catch {
      toast.error("Failed to load inquiries");
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setIsLoading(true);
    setSelectedId(null);
    fetchInquiries();
  }, [fetchInquiries]);

  // Poll for updates every 30s
  useEffect(() => {
    const interval = setInterval(fetchInquiries, 30000);
    return () => clearInterval(interval);
  }, [fetchInquiries]);

  // Mark selected inquiry as read
  const handleSelect = useCallback(
    async (id: string) => {
      setSelectedId(id);
      const inq = inquiries.find((i) => i.id === id);
      if (inq && (!inq.isRead || inq.unreadMessageCount > 0)) {
        try {
          await fetch(`/api/inquiries/${id}/read`, { method: "PUT" });
          setInquiries((prev) =>
            prev.map((i) =>
              i.id === id
                ? { ...i, isRead: true, unreadMessageCount: 0 }
                : i
            )
          );
        } catch {
          // Silent
        }
      }
    },
    [inquiries]
  );

  const selectedInquiry = inquiries.find((i) => i.id === selectedId);
  const unreadCount = inquiries.filter(
    (i) => !i.isRead || i.unreadMessageCount > 0
  ).length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">
          Manage your conversations and inquiries
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="received" className="gap-1.5">
            <Inbox className="size-4" />
            Received
            {tab !== "received" && unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-[20px] justify-center px-1.5 text-[10px]"
              >
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5">
            <Send className="size-4" />
            Sent
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Split Layout */}
      <div className="flex h-[calc(100vh-220px)] min-h-[400px] overflow-hidden rounded-lg border bg-background">
        {/* Left: Inquiry list */}
        <div
          className={cn(
            "w-full lg:w-[380px] lg:border-r flex flex-col shrink-0",
            selectedId ? "hidden lg:flex" : "flex"
          )}
        >
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
              {tab === "received" ? (
                <MailOpen className="size-12 text-muted-foreground/40" />
              ) : (
                <Send className="size-12 text-muted-foreground/40" />
              )}
              <p className="text-sm font-medium">
                {tab === "received"
                  ? "No inquiries received yet"
                  : "No inquiries sent yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {tab === "received"
                  ? "When buyers contact you about your listings, they'll appear here."
                  : "Inquiries and messages you send to listing owners will appear here."}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {inquiries.map((inq) => (
                <InquiryRow
                  key={inq.id}
                  inquiry={inq}
                  tab={tab}
                  isSelected={selectedId === inq.id}
                  onClick={() => handleSelect(inq.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Conversation detail */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            !selectedId ? "hidden lg:flex" : "flex"
          )}
        >
          {selectedInquiry ? (
            selectedInquiry.type === "MESSAGE_THREAD" ? (
              <div className="flex h-full flex-col">
                {/* Thread header */}
                <div className="border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden shrink-0"
                      onClick={() => setSelectedId(null)}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold truncate">
                        {tab === "sent"
                          ? selectedInquiry.receiver.displayName ||
                            selectedInquiry.receiver.name
                          : selectedInquiry.sender?.displayName ||
                            selectedInquiry.sender?.name ||
                            "Unknown"}
                      </h3>
                      <Link
                        href={`/listings/${selectedInquiry.listing.slug}`}
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {selectedInquiry.listing.title}
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Thread messages */}
                <div className="flex-1 overflow-hidden">
                  <MessageThread inquiryId={selectedInquiry.id} />
                </div>
              </div>
            ) : (
              <AnonymousInquiryDetail
                inquiry={selectedInquiry}
                onBack={() => setSelectedId(null)}
              />
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <MessageSquare className="size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to view
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
