"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Lock,
  Trash2,
  Instagram,
  Linkedin,
  Globe,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    revenueMin?: number | null;
    revenueMax?: number | null;
  } | null;
  brokerageName: string | null;
  brokerageWebsite: string | null;
  brokeragePhone: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  hasPassword: boolean;
}

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [ownedBusiness, setOwnedBusiness] = useState("");
  const [buyBoxCategories, setBuyBoxCategories] = useState<string[]>([]);
  const [buyBoxBoroughs, setBuyBoxBoroughs] = useState<string[]>([]);
  const [buyBoxPriceMin, setBuyBoxPriceMin] = useState("");
  const [buyBoxPriceMax, setBuyBoxPriceMax] = useState("");
  const [buyBoxRevenueMin, setBuyBoxRevenueMin] = useState("");
  const [buyBoxRevenueMax, setBuyBoxRevenueMax] = useState("");

  // Broker fields
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageWebsite, setBrokerageWebsite] = useState("");
  const [brokeragePhone, setBrokeragePhone] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

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
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || "");
        setOwnedBusiness(data.ownedBusiness || "");
        setBuyBoxCategories(data.buyBox?.categories || []);
        setBuyBoxBoroughs(data.buyBox?.boroughs || []);
        setBuyBoxPriceMin(data.buyBox?.priceMin?.toString() || "");
        setBuyBoxPriceMax(data.buyBox?.priceMax?.toString() || "");
        setBuyBoxRevenueMin(data.buyBox?.revenueMin?.toString() || "");
        setBuyBoxRevenueMax(data.buyBox?.revenueMax?.toString() || "");
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
        buyBoxCategories.length > 0 ||
        buyBoxBoroughs.length > 0 ||
        buyBoxPriceMin ||
        buyBoxPriceMax
          ? {
              categories: buyBoxCategories,
              boroughs: buyBoxBoroughs,
              priceMin: buyBoxPriceMin ? parseFloat(buyBoxPriceMin) : null,
              priceMax: buyBoxPriceMax ? parseFloat(buyBoxPriceMax) : null,
              revenueMin: buyBoxRevenueMin
                ? parseFloat(buyBoxRevenueMin)
                : null,
              revenueMax: buyBoxRevenueMax
                ? parseFloat(buyBoxRevenueMax)
                : null,
            }
          : null;

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || null,
          phone: phone || null,
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
        toast.success("Profile updated");
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Password updated");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(json.error || "Failed to change password");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted");
        signOut({ callbackUrl: "/" });
      } else {
        toast.error("Failed to delete account");
      }
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  // Password strength indicator
  const passwordStrength = (() => {
    if (!newPassword) return { level: 0, label: "" };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 2)
      return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 3)
      return { level: 2, label: "Fair", color: "bg-amber-500" };
    if (score <= 4)
      return { level: 3, label: "Good", color: "bg-emerald-500" };
    return { level: 4, label: "Strong", color: "bg-emerald-600" };
  })();

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
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

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={profile?.name || "Your display name"}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label>Bio ({bio.length}/1000)</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 1000))}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {/* Avatar */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {(profile?.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                {avatarUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl("")}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy Box */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Box Preferences</CardTitle>
          <CardDescription>
            Set your preferred business criteria for recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Categories</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border p-3">
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
            <Label>Preferred Boroughs</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Price</Label>
              <Input
                type="number"
                value={buyBoxPriceMin}
                onChange={(e) => setBuyBoxPriceMin(e.target.value)}
                placeholder="e.g. 100000"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Price</Label>
              <Input
                type="number"
                value={buyBoxPriceMax}
                onChange={(e) => setBuyBoxPriceMax(e.target.value)}
                placeholder="e.g. 500000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Revenue</Label>
              <Input
                type="number"
                value={buyBoxRevenueMin}
                onChange={(e) => setBuyBoxRevenueMin(e.target.value)}
                placeholder="e.g. 200000"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Revenue</Label>
              <Input
                type="number"
                value={buyBoxRevenueMax}
                onChange={(e) => setBuyBoxRevenueMax(e.target.value)}
                placeholder="e.g. 1000000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Ownership */}
      <Card>
        <CardHeader>
          <CardTitle>Business Ownership</CardTitle>
          <CardDescription>
            Do you currently own a business?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input
              value={ownedBusiness}
              onChange={(e) => setOwnedBusiness(e.target.value)}
              placeholder="Name of your business (leave blank if N/A)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Broker Fields */}
      {isBroker && (
        <Card>
          <CardHeader>
            <CardTitle>Broker Information</CardTitle>
            <CardDescription>
              Your brokerage details and social links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Brokerage Name
              </Label>
              <Input
                value={brokerageName}
                onChange={(e) => setBrokerageName(e.target.value)}
                placeholder="Your Brokerage LLC"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Brokerage Website
              </Label>
              <Input
                value={brokerageWebsite}
                onChange={(e) => setBrokerageWebsite(e.target.value)}
                placeholder="https://yourbrokerage.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Brokerage Phone
              </Label>
              <Input
                value={brokeragePhone}
                onChange={(e) => setBrokeragePhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourbrokerage"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <Input
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/you"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/you"
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@you"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Changes"}
      </Button>

      <Separator />

      {/* Password Change */}
      {profile?.hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= passwordStrength.level
                            ? passwordStrength.color
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-destructive">
                  Passwords don&apos;t match
                </p>
              )}
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmPassword
              }
              variant="outline"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all listings,
              inquiries, and data. This action cannot be undone. Type{" "}
              <strong>DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder='Type "DELETE" to confirm'
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "DELETE" || deleting}
            >
              {deleting ? "Deleting..." : "Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
