"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { BOROUGHS } from "@/lib/constants";
import {
  prepareImageForUpload,
  looksLikeImage,
  ImagePrepError,
} from "@/lib/image-client";
import { ArrowLeft, Loader2, Search, X, ImagePlus, Check } from "lucide-react";
import { toast } from "sonner";

interface SellerHit {
  name: string;
  email: string;
  phone: string;
  role: string;
  brokerageName: string | null;
}

export default function AdminCreateListingPage() {
  const router = useRouter();

  // Seller
  const [sellerQuery, setSellerQuery] = useState("");
  const [sellerHits, setSellerHits] = useState<SellerHit[]>([]);
  const [linkedExisting, setLinkedExisting] = useState(false);
  const [seller, setSeller] = useState({
    name: "",
    email: "",
    phone: "",
    accountType: "SELLER" as "SELLER" | "ADVISOR",
    brokerageName: "",
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listing
  const [listing, setListing] = useState({
    title: "",
    category: "",
    askingPrice: "",
    annualRevenue: "",
    cashFlowSDE: "",
    description: "",
    borough: "",
    neighborhood: "",
    address: "",
    zipCode: "",
    hideAddress: false,
  });

  const [photos, setPhotos] = useState<{ url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const searchSellers = useCallback((q: string) => {
    setSellerQuery(q);
    setLinkedExisting(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) {
      setSellerHits([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/users?search=${encodeURIComponent(q.trim())}&limit=8`,
        );
        const json = await res.json();
        if (json.success) {
          setSellerHits(
            (json.data || [])
              .filter((u: { role: string }) => u.role !== "ADMIN")
              .map((u: SellerHit) => ({
                name: u.name,
                email: u.email,
                phone: u.phone || "",
                role: u.role,
                brokerageName: u.brokerageName,
              })),
          );
        }
      } catch {
        setSellerHits([]);
      }
    }, 250);
  }, []);

  function pickSeller(u: SellerHit) {
    setSeller({
      name: u.name,
      email: u.email,
      phone: u.phone,
      accountType: u.role === "BROKER" ? "ADVISOR" : "SELLER",
      brokerageName: u.brokerageName || "",
    });
    setLinkedExisting(true);
    setSellerHits([]);
    setSellerQuery("");
  }

  async function handlePhotoFiles(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!looksLikeImage(file)) continue;
        const prepared = await prepareImageForUpload(file, 10 * 1024 * 1024);
        const presign = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileType: prepared.type,
            folder: "listings",
            fileSize: prepared.size,
          }),
        });
        const pj = await presign.json();
        if (!pj.success) throw new Error(pj.error || "Upload unavailable");
        const put = await fetch(pj.data.url, {
          method: "PUT",
          headers: { "Content-Type": prepared.type },
          body: prepared,
        });
        if (!put.ok) throw new Error("Upload failed");
        setPhotos((prev) => [...prev, { url: pj.data.url.split("?")[0] }]);
      }
    } catch (err) {
      toast.error(
        err instanceof ImagePrepError || err instanceof Error
          ? err.message
          : "Photo upload failed",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!seller.name.trim() || !seller.email.trim()) {
      toast.error("Seller name and email are required");
      return;
    }
    if (!listing.title.trim() || !listing.category || !listing.askingPrice.trim()) {
      toast.error("Listing needs a title, category, and asking price");
      return;
    }
    if (!listing.borough) {
      toast.error("Select a borough (required to list in NYC)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller,
          listing: {
            ...listing,
            askingPrice: Number(listing.askingPrice) || 0,
            annualRevenue: listing.annualRevenue ? Number(listing.annualRevenue) : null,
            cashFlowSDE: listing.cashFlowSDE ? Number(listing.cashFlowSDE) : null,
            photos: photos.map((p, i) => ({ url: p.url, order: i })),
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          json.data.owner.created
            ? "Listing created — new account made and invited to claim it"
            : "Listing created and assigned to the existing account",
        );
        router.push("/admin/listings");
      } else {
        toast.error(json.error || "Failed to create listing");
      }
    } catch {
      toast.error("Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/listings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create listing</h1>
          <p className="text-sm text-muted-foreground">
            Post a listing on a seller or advisor&apos;s behalf.
          </p>
        </div>
      </div>

      {/* Seller / advisor */}
      <Card>
        <CardHeader><CardTitle className="text-base">Seller / Advisor</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Find an existing user</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sellerQuery}
                onChange={(e) => searchSellers(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
              {sellerHits.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-auto">
                  {sellerHits.map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => pickSeller(u)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-accent"
                    >
                      <span className="text-sm font-medium">
                        {u.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {u.role === "BROKER" ? "Advisor" : "Seller"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Pick one to assign the listing, or fill the fields below to create
              &amp; invite a new account.
            </p>
          </div>

          {linkedExisting && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Check className="h-4 w-4" />
              Assigning to existing account — {seller.email}
              <button
                type="button"
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => { setLinkedExisting(false); setSeller({ name: "", email: "", phone: "", accountType: "SELLER", brokerageName: "" }); }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={seller.name} onChange={(e) => setSeller((s) => ({ ...s, name: e.target.value }))} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={seller.email} onChange={(e) => setSeller((s) => ({ ...s, email: e.target.value }))} placeholder="jane@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input value={seller.phone} onChange={(e) => setSeller((s) => ({ ...s, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Account type</Label>
              <Select value={seller.accountType} onValueChange={(v) => setSeller((s) => ({ ...s, accountType: v as "SELLER" | "ADVISOR" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELLER">Seller / Buyer</SelectItem>
                  <SelectItem value="ADVISOR">Broker / Advisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {seller.accountType === "ADVISOR" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Brokerage (optional)</Label>
                <Input value={seller.brokerageName} onChange={(e) => setSeller((s) => ({ ...s, brokerageName: e.target.value }))} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listing */}
      <Card>
        <CardHeader><CardTitle className="text-base">Listing details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={listing.title} onChange={(e) => setListing((l) => ({ ...l, title: e.target.value }))} placeholder="Busy pizzeria in Astoria" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <CategoryCombobox value={listing.category} onValueChange={(v) => setListing((l) => ({ ...l, category: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Asking price ($)</Label>
              <Input inputMode="numeric" value={listing.askingPrice} onChange={(e) => setListing((l) => ({ ...l, askingPrice: e.target.value }))} placeholder="500000" />
            </div>
            <div className="space-y-1.5">
              <Label>Annual revenue ($) — optional</Label>
              <Input inputMode="numeric" value={listing.annualRevenue} onChange={(e) => setListing((l) => ({ ...l, annualRevenue: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Cash flow / SDE ($) — optional</Label>
              <Input inputMode="numeric" value={listing.cashFlowSDE} onChange={(e) => setListing((l) => ({ ...l, cashFlowSDE: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={4} value={listing.description} onChange={(e) => setListing((l) => ({ ...l, description: e.target.value }))} placeholder="Overview of the business…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Borough</Label>
              <Select value={listing.borough} onValueChange={(v) => setListing((l) => ({ ...l, borough: v }))}>
                <SelectTrigger><SelectValue placeholder="Select borough" /></SelectTrigger>
                <SelectContent>
                  {BOROUGHS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Neighborhood (optional)</Label>
              <Input value={listing.neighborhood} onChange={(e) => setListing((l) => ({ ...l, neighborhood: e.target.value }))} placeholder="Astoria" />
            </div>
            <div className="space-y-1.5">
              <Label>Address (optional)</Label>
              <Input value={listing.address} onChange={(e) => setListing((l) => ({ ...l, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ZIP (optional)</Label>
              <Input value={listing.zipCode} onChange={(e) => setListing((l) => ({ ...l, zipCode: e.target.value }))} placeholder="11106" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={listing.hideAddress} onCheckedChange={(c) => setListing((l) => ({ ...l, hideAddress: !!c }))} />
            Hide the exact address publicly (show only the neighborhood)
          </label>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, x) => x !== i))}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed text-muted-foreground hover:bg-muted"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) handlePhotoFiles(e.target.files); if (photoInputRef.current) photoInputRef.current.value = ""; }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/listings">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || uploading}>
          {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Create &amp; publish listing
        </Button>
      </div>
    </div>
  );
}
