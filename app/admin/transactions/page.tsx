"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Handshake,
  Check,
  X,
  ExternalLink,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface PendingTransaction {
  id: string;
  rating: number;
  text: string | null;
  experienceType: "BOUGHT" | "SOLD" | "COLLABORATED" | null;
  businessCategory: string | null;
  businessName: string | null;
  businessAddress: string | null;
  transactionYear: number | null;
  transactionPrice: number | null;
  transactionStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  transactionReviewedAt: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
    displayName: string | null;
  };
  broker: {
    id: string;
    name: string;
    email: string;
    displayName: string | null;
    brokerageName: string | null;
  };
  transactionReviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">(
    "PENDING",
  );
  const [items, setItems] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisionDialog, setDecisionDialog] = useState<{
    review: PendingTransaction;
    decision: "APPROVED" | "REJECTED";
  } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions?status=${status}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      } else {
        toast.error(json.error || "Failed to load");
      }
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleDecision() {
    if (!decisionDialog) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/transactions/${decisionDialog.review.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: decisionDialog.decision,
            notes: decisionNotes || undefined,
          }),
        },
      );
      const json = await res.json();
      if (res.ok) {
        toast.success(
          decisionDialog.decision === "APPROVED"
            ? "Approved and added to broker's verified deals"
            : "Rejected",
        );
        setDecisionDialog(null);
        setDecisionNotes("");
        fetchItems();
      } else {
        toast.error(json.error || "Failed to process");
      }
    } catch {
      toast.error("Failed to process");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Handshake className="h-7 w-7" />
        <div>
          <h1 className="text-2xl font-bold">Transaction Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Buyer- and seller-submitted transaction details awaiting
            verification.
          </p>
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="mt-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No {status.toLowerCase()} transaction reviews.
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {item.businessName ||
                          `Unnamed ${item.businessCategory}`}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          Submitted{" "}
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>·</span>
                        <Badge variant="outline">{item.experienceType}</Badge>
                        {item.businessCategory && (
                          <Badge variant="secondary">
                            {item.businessCategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= item.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        Reviewer (buyer/seller)
                      </p>
                      <p className="font-medium">
                        {item.reviewer.displayName || item.reviewer.name}
                      </p>
                      <a
                        href={`mailto:${item.reviewer.email}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {item.reviewer.email}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        Broker
                      </p>
                      <Link
                        href={`/advisors/${item.broker.id}`}
                        className="font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {item.broker.displayName || item.broker.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      {item.broker.brokerageName && (
                        <p className="text-xs text-muted-foreground">
                          {item.broker.brokerageName}
                        </p>
                      )}
                    </div>
                    {item.businessAddress && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Address
                        </p>
                        <p>{item.businessAddress}</p>
                      </div>
                    )}
                    {item.transactionYear && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Year
                        </p>
                        <p>{item.transactionYear}</p>
                      </div>
                    )}
                    {item.transactionPrice && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Sale price
                        </p>
                        <p>{formatCurrency(item.transactionPrice)}</p>
                      </div>
                    )}
                  </div>

                  {item.text && (
                    <div className="rounded-md bg-muted/40 p-3 text-sm">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Review text
                      </p>
                      <p className="leading-relaxed">{item.text}</p>
                    </div>
                  )}

                  {status === "PENDING" ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        onClick={() =>
                          setDecisionDialog({
                            review: item,
                            decision: "APPROVED",
                          })
                        }
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve & add to Past Deals
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setDecisionDialog({
                            review: item,
                            decision: "REJECTED",
                          })
                        }
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <a href={`mailto:${item.reviewer.email}`}>
                          Email reviewer
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <a href={`mailto:${item.broker.email}`}>
                          Email broker
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground pt-2">
                      {item.transactionStatus} on{" "}
                      {item.transactionReviewedAt
                        ? new Date(
                            item.transactionReviewedAt,
                          ).toLocaleDateString("en-US")
                        : "—"}
                      {item.transactionReviewer &&
                        ` by ${item.transactionReviewer.name}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!decisionDialog}
        onOpenChange={(open) => !open && setDecisionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionDialog?.decision === "APPROVED"
                ? "Approve transaction"
                : "Reject transaction"}
            </DialogTitle>
            <DialogDescription>
              {decisionDialog?.decision === "APPROVED"
                ? "This will add the transaction to the broker's verified Past Deals on their public profile."
                : "The review remains visible but the transaction details won't be marked as verified."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Anything we want to remember about this decision..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDecisionDialog(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecision}
              disabled={submitting}
              variant={
                decisionDialog?.decision === "REJECTED"
                  ? "destructive"
                  : "default"
              }
            >
              {submitting ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
