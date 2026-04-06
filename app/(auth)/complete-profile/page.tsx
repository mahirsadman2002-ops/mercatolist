"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Building2, BadgeCheck, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [selectedType, setSelectedType] = useState<"USER" | "BROKER" | null>(null);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Broker fields
  const [brokerForm, setBrokerForm] = useState({
    brokerageName: "",
    brokerageWebsite: "",
    brokeragePhone: "",
    bio: "",
    linkedinUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateBrokerField = (field: string, value: string) => {
    setBrokerForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Redirect if not logged in
  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedType) return;

    if (selectedType === "BROKER") {
      const newErrors: Record<string, string> = {};
      if (!brokerForm.brokerageName.trim()) newErrors.brokerageName = "Required";
      if (!brokerForm.brokeragePhone.trim()) newErrors.brokeragePhone = "Required";
      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    }

    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        role: selectedType,
        phone: phone || undefined,
      };

      if (selectedType === "BROKER") {
        Object.assign(body, brokerForm);
      }

      const res = await fetch("/api/auth/complete-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      toast.success("Profile complete! Welcome to MercatoList.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <Link href="/" className="inline-block mx-auto">
            <span className="font-heading text-2xl font-bold tracking-tight">MercatoList</span>
          </Link>
          <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
          <CardDescription>
            Welcome, {session?.user?.name}! Just a few more details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input id="phone" type="tel" placeholder="(212) 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {/* Account type */}
          <div className="space-y-3">
            <Label>What best describes you?</Label>
            <div className="grid gap-3">
              <button onClick={() => setSelectedType("USER")} className={`relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all ${selectedType === "USER" ? "border-accent bg-accent/5" : "border-border hover:border-border/80"}`}>
                <Building2 className={`h-5 w-5 mt-0.5 ${selectedType === "USER" ? "text-accent" : "text-muted-foreground"}`} />
                <div><h3 className="font-semibold">Buyer / Seller</h3><p className="text-sm text-muted-foreground">I want to buy or sell a business</p></div>
                {selectedType === "USER" && <Check className="absolute top-3 right-3 h-5 w-5 text-accent" />}
              </button>
              <button onClick={() => setSelectedType("BROKER")} className={`relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all ${selectedType === "BROKER" ? "border-accent bg-accent/5" : "border-border hover:border-border/80"}`}>
                <BadgeCheck className={`h-5 w-5 mt-0.5 ${selectedType === "BROKER" ? "text-accent" : "text-muted-foreground"}`} />
                <div><h3 className="font-semibold">Business Advisor</h3><p className="text-sm text-muted-foreground">I represent buyers and sellers</p></div>
                {selectedType === "BROKER" && <Check className="absolute top-3 right-3 h-5 w-5 text-accent" />}
              </button>
            </div>
          </div>

          {/* Broker details (expanded inline) */}
          {selectedType === "BROKER" && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-semibold">Advisor Details</p>
              <div className="space-y-2">
                <Label htmlFor="cp-brokerage">Brokerage Name *</Label>
                <Input id="cp-brokerage" placeholder="e.g., NYC Business Sales" value={brokerForm.brokerageName} onChange={(e) => updateBrokerField("brokerageName", e.target.value)} />
                {errors.brokerageName && <p className="text-xs text-destructive">{errors.brokerageName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-phone">Brokerage Phone *</Label>
                <Input id="cp-phone" type="tel" placeholder="(212) 555-0100" value={brokerForm.brokeragePhone} onChange={(e) => updateBrokerField("brokeragePhone", e.target.value)} />
                {errors.brokeragePhone && <p className="text-xs text-destructive">{errors.brokeragePhone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-website">Website</Label>
                <Input id="cp-website" type="url" placeholder="https://example.com" value={brokerForm.brokerageWebsite} onChange={(e) => updateBrokerField("brokerageWebsite", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-bio">About / Bio</Label>
                <Textarea id="cp-bio" placeholder="Tell clients about your experience..." rows={3} value={brokerForm.bio} onChange={(e) => updateBrokerField("bio", e.target.value)} />
              </div>
              <div className="space-y-2 pt-1">
                <p className="text-sm text-muted-foreground">Social Media (optional)</p>
                <Input placeholder="LinkedIn URL" value={brokerForm.linkedinUrl} onChange={(e) => updateBrokerField("linkedinUrl", e.target.value)} />
                <Input placeholder="Instagram URL" value={brokerForm.instagramUrl} onChange={(e) => updateBrokerField("instagramUrl", e.target.value)} />
              </div>
            </div>
          )}

          <Button className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={handleSubmit} disabled={!selectedType || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Complete Setup
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:underline">Skip for now</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
