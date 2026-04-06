"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BUSINESS_CATEGORIES, BOROUGHS } from "@/lib/constants";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
  ownedBusiness: string | null;
  buyBox: {
    categories?: string[];
    boroughs?: string[];
    priceMin?: number | null;
    priceMax?: number | null;
  } | null;
  brokerageName: string | null;
  brokerageWebsite: string | null;
  brokeragePhone: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  createdAt: string;
}

export default function PublicProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviewLinkDialog, setReviewLinkDialog] = useState(false);
  const [reviewEmail, setReviewEmail] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [ownedBusiness, setOwnedBusiness] = useState("");
  const [buyBoxCategories, setBuyBoxCategories] = useState<string[]>([]);
  const [buyBoxBoroughs, setBuyBoxBoroughs] = useState<string[]>([]);
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageWebsite, setBrokerageWebsite] = useState("");
  const [brokeragePhone, setBrokeragePhone] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile");
      const json = await res.json();
      if (json.success) {
        const data = json.data as ProfileData;
        setProfile(data);
        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || "");
        setOwnedBusiness(data.ownedBusiness || "");
        setBuyBoxCategories(data.buyBox?.categories || []);
        setBuyBoxBoroughs(data.buyBox?.boroughs || []);
        setBrokerageName(data.brokerageName || "");
        setBrokerageWebsite(data.brokerageWebsite || "");
        setBrokeragePhone(data.brokeragePhone || "");
        setInstagramUrl(data.instagramUrl || "");
        setLinkedinUrl(data.linkedinUrl || "");
        setTwitterUrl(data.twitterUrl || "");
        setFacebookUrl(data.facebookUrl || "");
        setTiktokUrl(data.tiktokUrl || "");
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const buyBox =
        buyBoxCategories.length > 0 || buyBoxBoroughs.length > 0
          ? { categories: buyBoxCategories, boroughs: buyBoxBoroughs }
          : null;

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || null,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          ownedBusiness: ownedBusiness || null,
          buyBox,
          brokerageName: brokerageName || null,
          brokerageWebsite: brokerageWebsite || null,
          brokeragePhone: brokeragePhone || null,
          instagramUrl: instagramUrl || null,
          linkedinUrl: linkedinUrl || null,
          twitterUrl: twitterUrl || null,
          facebookUrl: facebookUrl || null,
          tiktokUrl: tiktokUrl || null,
        }),
      });

      if (res.ok) {
        toast.success("Public profile updated");
        fetchProfile();
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestReview() {
    setSendingReview(true);
    try {
      const res = await fetch(
        `/api/brokers/${profile?.id}/review-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: reviewEmail || undefined,
          }),
        }
      );
      const json = await res.json();
      if (res.ok) {
        if (reviewEmail) {
          toast.success("Review request sent");
        } else {
          toast.success("Review link copied to clipboard");
          navigator.clipboard.writeText(json.data?.reviewUrl || "");
        }
        setReviewLinkDialog(false);
        setReviewEmail("");
      } else {
        toast.error(json.error || "Failed to create review request");
      }
    } catch {
      toast.error("Failed to create review request");
    } finally {
      setSendingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Public Profile</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  const isBroker = profile?.role === "BROKER";
  const previewName = displayName || profile?.name || "User";
  const previewInitials = previewName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Preview Component
  const ProfilePreview = () => (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Preview
      </div>

      {/* Profile Header */}
      <div className="flex items-start gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="text-xl bg-primary/10 text-primary">
            {previewInitials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{previewName}</h2>
          {isBroker && (
            <Badge variant="secondary" className="mt-1">
              Licensed Broker
            </Badge>
          )}
          {brokerageName && isBroker && (
            <p className="text-sm text-muted-foreground mt-1">
              {brokerageName}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Member since{" "}
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </p>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div>
          <h3 className="text-sm font-semibold mb-1">About</h3>
          <p className="text-sm text-muted-foreground">{bio}</p>
        </div>
      )}

      {/* Business */}
      {ownedBusiness && (
        <div>
          <h3 className="text-sm font-semibold mb-1">Business</h3>
          <p className="text-sm text-muted-foreground">{ownedBusiness}</p>
        </div>
      )}

      {/* Buy Box */}
      {(buyBoxCategories.length > 0 || buyBoxBoroughs.length > 0) && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Interested In</h3>
          <div className="flex flex-wrap gap-1.5">
            {buyBoxCategories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
            {buyBoxBoroughs.map((b) => (
              <Badge key={b} variant="secondary" className="text-xs">
                {b
                  .split("_")
                  .map(
                    (w) =>
                      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                  )
                  .join(" ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Broker Social */}
      {isBroker &&
        (instagramUrl || linkedinUrl || twitterUrl || facebookUrl) && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Connect</h3>
            <div className="flex gap-3 text-sm text-muted-foreground">
              {linkedinUrl && <span>LinkedIn</span>}
              {instagramUrl && <span>Instagram</span>}
              {twitterUrl && <span>Twitter</span>}
              {facebookUrl && <span>Facebook</span>}
            </div>
          </div>
        )}
    </div>
  );

  // Edit Form
  const EditForm = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={profile?.name || "Your name"}
            />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell potential buyers/sellers about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar URL</Label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Business Owned</Label>
            <Input
              value={ownedBusiness}
              onChange={(e) => setOwnedBusiness(e.target.value)}
              placeholder="Your business name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buy Box</CardTitle>
          <CardDescription>
            Show what types of businesses you&apos;re interested in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-md border p-3">
              {BUSINESS_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={buyBoxCategories.includes(cat)}
                    onCheckedChange={(checked) => {
                      setBuyBoxCategories((prev) =>
                        checked
                          ? [...prev, cat]
                          : prev.filter((c) => c !== cat)
                      );
                    }}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Boroughs</Label>
            <div className="flex flex-wrap gap-3">
              {BOROUGHS.map((b) => (
                <label
                  key={b.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={buyBoxBoroughs.includes(b.value)}
                    onCheckedChange={(checked) => {
                      setBuyBoxBoroughs((prev) =>
                        checked
                          ? [...prev, b.value]
                          : prev.filter((v) => v !== b.value)
                      );
                    }}
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isBroker && (
        <Card>
          <CardHeader>
            <CardTitle>Advisor Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Brokerage Name</Label>
              <Input
                value={brokerageName}
                onChange={(e) => setBrokerageName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Brokerage Website</Label>
              <Input
                value={brokerageWebsite}
                onChange={(e) => setBrokerageWebsite(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Brokerage Phone</Label>
              <Input
                value={brokeragePhone}
                onChange={(e) => setBrokeragePhone(e.target.value)}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <Input
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <Button
              variant="outline"
              onClick={() => setReviewLinkDialog(true)}
            >
              Request a Review
            </Button>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Public Profile</h1>

      {/* Desktop: Side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        <EditForm />
        <div className="sticky top-24">
          <ProfilePreview />
        </div>
      </div>

      {/* Mobile: Tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="edit">
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit">
            <EditForm />
          </TabsContent>
          <TabsContent value="preview">
            <ProfilePreview />
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Request Dialog */}
      <Dialog open={reviewLinkDialog} onOpenChange={setReviewLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Review</DialogTitle>
            <DialogDescription>
              Generate a review link. Optionally send it to a client via
              email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client Email (optional)</Label>
              <Input
                type="email"
                value={reviewEmail}
                onChange={(e) => setReviewEmail(e.target.value)}
                placeholder="client@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to just generate a link you can share manually.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewLinkDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestReview}
              disabled={sendingReview}
            >
              {sendingReview
                ? "Generating..."
                : reviewEmail
                  ? "Send Review Request"
                  : "Generate Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
