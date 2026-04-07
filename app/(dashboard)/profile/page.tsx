"use client";

import { useState, useEffect, useRef } from "react";
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
  Camera,
  X,
  Plus,
  BadgeCheck,
  Shield,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BUSINESS_CATEGORIES, BOROUGHS } from "@/lib/constants";

interface LicenseData {
  id: string;
  name: string;
  issuingAuthority: string | null;
  licenseNumber: string | null;
  expirationDate: string | null;
  documentUrl: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

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
  hasLicenses?: boolean;
  licenses?: LicenseData[];
}

interface OwnedBusinessData {
  name: string;
  address: string;
  employees: string;
  revenue: string;
  yearsInOperation: string;
}

const LICENSE_OPTIONS = [
  "NY Real Estate Broker License",
  "NY Real Estate Salesperson License",
  "Certified Business Intermediary",
  "Certified Business Appraiser",
  "Merger & Acquisition Master Intermediary",
  "Other",
];

function parseOwnedBusiness(raw: string | null): { owns: boolean; data: OwnedBusinessData } {
  if (!raw) return { owns: false, data: { name: "", address: "", employees: "", revenue: "", yearsInOperation: "" } };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed.name) {
      return {
        owns: true,
        data: {
          name: parsed.name || "",
          address: parsed.address || "",
          employees: parsed.employees?.toString() || "",
          revenue: parsed.revenue?.toString() || "",
          yearsInOperation: parsed.yearsInOperation?.toString() || "",
        },
      };
    }
  } catch {
    // Legacy: plain string means just a business name
    if (raw.trim()) {
      return {
        owns: true,
        data: { name: raw, address: "", employees: "", revenue: "", yearsInOperation: "" },
      };
    }
  }
  return { owns: false, data: { name: "", address: "", employees: "", revenue: "", yearsInOperation: "" } };
}

function serializeOwnedBusiness(owns: boolean, data: OwnedBusinessData): string | null {
  if (!owns || !data.name.trim()) return null;
  return JSON.stringify({
    name: data.name.trim(),
    address: data.address.trim() || undefined,
    employees: data.employees ? parseInt(data.employees) : undefined,
    revenue: data.revenue ? parseFloat(data.revenue) : undefined,
    yearsInOperation: data.yearsInOperation ? parseInt(data.yearsInOperation) : undefined,
  });
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
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Business ownership
  const [ownsBusiness, setOwnsBusiness] = useState(false);
  const [businessData, setBusinessData] = useState<OwnedBusinessData>({
    name: "",
    address: "",
    employees: "",
    revenue: "",
    yearsInOperation: "",
  });

  // Buy box
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

  // Licenses (broker only)
  const [hasLicenses, setHasLicenses] = useState(false);
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [newLicenseName, setNewLicenseName] = useState("");
  const [newLicenseCustomName, setNewLicenseCustomName] = useState("");
  const [newLicenseNumber, setNewLicenseNumber] = useState("");
  const [addingLicense, setAddingLicense] = useState(false);

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
        setAvatarPreview(data.avatarUrl || "");

        // Parse owned business
        const { owns, data: bData } = parseOwnedBusiness(data.ownedBusiness);
        setOwnsBusiness(owns);
        setBusinessData(bData);

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

        // Licenses
        setHasLicenses(data.hasLicenses || false);
        setLicenses(data.licenses || []);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      // Get presigned URL
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: file.type, folder: "avatars" }),
      });
      const presignJson = await presignRes.json();

      if (!presignJson.success) {
        // Fallback: use FileReader to create a data URL preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setAvatarPreview(dataUrl);
          setAvatarUrl(dataUrl);
        };
        reader.readAsDataURL(file);
        toast.info("Avatar preview set. Upload service unavailable, using local preview.");
        return;
      }

      const { url, key } = presignJson.data;

      // Upload to S3
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Construct CDN URL
      const cdnUrl = `https://${key.includes("://") ? key : ""}`;
      // The presigned URL domain gives us the bucket URL - extract base
      const bucketUrl = url.split("?")[0];
      const finalUrl = bucketUrl.includes(key) ? bucketUrl : `${new URL(url).origin}/${key}`;

      setAvatarUrl(finalUrl);
      setAvatarPreview(finalUrl);
      toast.success("Photo uploaded");
    } catch {
      // Fallback to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAvatarPreview(dataUrl);
        setAvatarUrl(dataUrl);
      };
      reader.readAsDataURL(file);
      toast.info("Using local preview. Save to apply changes.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    handleAvatarUpload(file);
  }

  function handleRemoveAvatar() {
    setAvatarUrl("");
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

      const ownedBusiness = serializeOwnedBusiness(ownsBusiness, businessData);

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || null,
          phone: phone || null,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          ownedBusiness,
          buyBox,
          brokerageName: brokerageName || null,
          brokerageWebsite: brokerageWebsite || null,
          brokeragePhone: brokeragePhone || null,
          instagramUrl: instagramUrl || null,
          linkedinUrl: linkedinUrl || null,
          twitterUrl: twitterUrl || null,
          facebookUrl: facebookUrl || null,
          tiktokUrl: tiktokUrl || null,
          hasLicenses,
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

  async function handleAddLicense() {
    const name = newLicenseName === "Other" ? newLicenseCustomName : newLicenseName;
    if (!name.trim()) {
      toast.error("License name is required");
      return;
    }

    setAddingLicense(true);
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          licenseNumber: newLicenseNumber.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLicenses((prev) => [json.data, ...prev]);
        setNewLicenseName("");
        setNewLicenseCustomName("");
        setNewLicenseNumber("");
        setShowAddLicense(false);
        setHasLicenses(true);
        toast.success("License added");
      } else {
        toast.error(json.error || "Failed to add license");
      }
    } catch {
      toast.error("Failed to add license");
    } finally {
      setAddingLicense(false);
    }
  }

  async function handleDeleteLicense(id: string) {
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setLicenses((prev) => prev.filter((l) => l.id !== id));
        if (licenses.length <= 1) {
          setHasLicenses(false);
        }
        toast.success("License removed");
      } else {
        toast.error(json.error || "Failed to remove license");
      }
    } catch {
      toast.error("Failed to remove license");
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
          {/* Avatar Upload - Centered at top */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-2xl">
                  {(profile?.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Camera className="mr-2 h-4 w-4" />
                {uploadingAvatar ? "Uploading..." : "Upload Photo"}
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                >
                  <X className="mr-1 h-4 w-4" />
                  Remove Photo
                </Button>
              )}
            </div>
          </div>

          <Separator />

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
        </CardContent>
      </Card>

      {/* Buy Box - Only for non-BROKER users */}
      {profile?.role !== "BROKER" && (
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

            <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/50">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your preferences help us recommend relevant listings. We&apos;ll notify you when new listings match your criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Ownership */}
      <Card>
        <CardHeader>
          <CardTitle>Business Ownership</CardTitle>
          <CardDescription>
            Do you currently own a business?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant={ownsBusiness ? "default" : "outline"}
              size="sm"
              onClick={() => setOwnsBusiness(true)}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={!ownsBusiness ? "default" : "outline"}
              size="sm"
              onClick={() => setOwnsBusiness(false)}
            >
              No
            </Button>
          </div>

          {ownsBusiness ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Business Name <span className="text-destructive">*</span></Label>
                <Input
                  value={businessData.name}
                  onChange={(e) =>
                    setBusinessData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Joe's Pizza"
                />
              </div>
              <div className="space-y-2">
                <Label>Business Address</Label>
                <Input
                  value={businessData.address}
                  onChange={(e) =>
                    setBusinessData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="e.g. 123 Main St, Brooklyn, NY"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Number of Employees</Label>
                  <Input
                    type="number"
                    min="0"
                    value={businessData.employees}
                    onChange={(e) =>
                      setBusinessData((prev) => ({ ...prev, employees: e.target.value }))
                    }
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Revenue ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={businessData.revenue}
                    onChange={(e) =>
                      setBusinessData((prev) => ({ ...prev, revenue: e.target.value }))
                    }
                    placeholder="e.g. 500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years in Operation</Label>
                  <Input
                    type="number"
                    min="0"
                    value={businessData.yearsInOperation}
                    onChange={(e) =>
                      setBusinessData((prev) => ({ ...prev, yearsInOperation: e.target.value }))
                    }
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You can always update this later.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Advisor Fields */}
      {isBroker && (
        <Card>
          <CardHeader>
            <CardTitle>Advisor Information</CardTitle>
            <CardDescription>
              Your company details and social links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Company Name
              </Label>
              <Input
                value={brokerageName}
                onChange={(e) => setBrokerageName(e.target.value)}
                placeholder="Your Company LLC"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Company Website
              </Label>
              <Input
                value={brokerageWebsite}
                onChange={(e) => setBrokerageWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Company Phone
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
                placeholder="https://instagram.com/yourcompany"
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

      {/* Licenses & Certifications - Broker only */}
      {isBroker && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Licenses &amp; Certifications
            </CardTitle>
            <CardDescription>
              Professional licenses and certifications build trust with clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Do you have professional licenses?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={hasLicenses ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHasLicenses(true)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!hasLicenses && licenses.length === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (licenses.length === 0) {
                      setHasLicenses(false);
                    } else {
                      toast.error("Remove existing licenses first before selecting No");
                    }
                  }}
                >
                  No
                </Button>
              </div>
            </div>

            {(hasLicenses || licenses.length > 0) ? (
              <div className="space-y-3">
                {/* Existing licenses */}
                {licenses.map((license) => (
                  <div
                    key={license.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{license.name}</p>
                          {license.isVerified && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        {license.licenseNumber && (
                          <p className="text-xs text-muted-foreground">
                            #{license.licenseNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLicense(license.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add license form */}
                {showAddLicense ? (
                  <div className="rounded-md border p-4 space-y-3">
                    <div className="space-y-2">
                      <Label>License Name</Label>
                      <Select
                        value={newLicenseName}
                        onValueChange={setNewLicenseName}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a license type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LICENSE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newLicenseName === "Other" && (
                      <div className="space-y-2">
                        <Label>License Name (specify)</Label>
                        <Input
                          value={newLicenseCustomName}
                          onChange={(e) => setNewLicenseCustomName(e.target.value)}
                          placeholder="Enter license name"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>License Number (optional)</Label>
                      <Input
                        value={newLicenseNumber}
                        onChange={(e) => setNewLicenseNumber(e.target.value)}
                        placeholder="e.g. 10401234567"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddLicense}
                        disabled={addingLicense || (!newLicenseName || (newLicenseName === "Other" && !newLicenseCustomName.trim()))}
                      >
                        {addingLicense ? "Adding..." : "Add"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddLicense(false);
                          setNewLicenseName("");
                          setNewLicenseCustomName("");
                          setNewLicenseNumber("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddLicense(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add License
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No licenses added. You can change this anytime.
              </p>
            )}
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
