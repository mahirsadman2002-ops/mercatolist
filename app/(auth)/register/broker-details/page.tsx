"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { BOROUGHS, BUSINESS_CATEGORIES } from "@/lib/constants";

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Create Account", "Account Type", "Details"];
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
            i < currentStep ? "bg-accent text-accent-foreground" : i === currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:inline ${i === currentStep ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{step}</span>
          {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

export default function BrokerDetailsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
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
  const [boroughsServed, setBoroughsServed] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleBorough = (value: string) => {
    setBoroughsServed((prev) =>
      prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]
    );
  };

  const toggleSpecialty = (value: string) => {
    setSpecialties((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.brokerageName.trim()) newErrors.brokerageName = "Brokerage name is required";
    if (!form.brokeragePhone.trim()) newErrors.brokeragePhone = "Phone number is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "BROKER",
          ...form,
          boroughsServed,
          specialties,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error();
      }

      toast.success("Broker profile created! Welcome to MercatoList.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to save broker details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <StepIndicator currentStep={2} />
          <CardTitle className="text-2xl font-bold">Set up your broker profile</CardTitle>
          <CardDescription>Help clients find and trust you</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brokerageName">Brokerage Name *</Label>
              <Input id="brokerageName" placeholder="e.g., NYC Business Sales" value={form.brokerageName} onChange={(e) => updateField("brokerageName", e.target.value)} />
              {errors.brokerageName && <p className="text-xs text-destructive">{errors.brokerageName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brokeragePhone">Brokerage Phone *</Label>
              <Input id="brokeragePhone" type="tel" placeholder="(212) 555-0100" value={form.brokeragePhone} onChange={(e) => updateField("brokeragePhone", e.target.value)} />
              {errors.brokeragePhone && <p className="text-xs text-destructive">{errors.brokeragePhone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brokerageWebsite">Brokerage Website</Label>
              <Input id="brokerageWebsite" type="url" placeholder="https://example.com" value={form.brokerageWebsite} onChange={(e) => updateField("brokerageWebsite", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About / Bio</Label>
              <Textarea id="bio" placeholder="Tell potential clients about your experience..." rows={3} value={form.bio} onChange={(e) => updateField("bio", e.target.value)} />
            </div>

            {/* Boroughs Served */}
            <div className="space-y-2">
              <Label>Boroughs You Serve</Label>
              <div className="flex flex-wrap gap-2">
                {BOROUGHS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => toggleBorough(b.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      boroughsServed.includes(b.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {boroughsServed.includes(b.value) && <Check className="h-3 w-3 inline mr-1" />}
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <Label>Specialties (select all that apply)</Label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleSpecialty(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      specialties.includes(cat)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {specialties.length > 0 && (
                <p className="text-xs text-muted-foreground">{specialties.length} selected</p>
              )}
            </div>

            {/* Social links */}
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-muted-foreground">Social Media (optional)</p>
              <div className="grid gap-3">
                <Input placeholder="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => updateField("linkedinUrl", e.target.value)} />
                <Input placeholder="Instagram URL" value={form.instagramUrl} onChange={(e) => updateField("instagramUrl", e.target.value)} />
                <Input placeholder="Twitter / X URL" value={form.twitterUrl} onChange={(e) => updateField("twitterUrl", e.target.value)} />
                <Input placeholder="Facebook URL" value={form.facebookUrl} onChange={(e) => updateField("facebookUrl", e.target.value)} />
                <Input placeholder="TikTok URL" value={form.tiktokUrl} onChange={(e) => updateField("tiktokUrl", e.target.value)} />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Complete Setup
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Complete later</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
