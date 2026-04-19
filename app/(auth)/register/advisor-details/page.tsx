"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BOROUGHS } from "@/lib/constants";
import { CategoryMultiCombobox } from "@/components/ui/category-combobox";

const LICENSE_OPTIONS = [
  "NY Real Estate Broker License",
  "NY Real Estate Salesperson License",
  "Certified Business Intermediary",
  "Certified Business Appraiser",
  "Merger & Acquisition Master Intermediary",
  "Other",
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Account", "Type", "Essentials", "Profile", "Done"];
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
            i < currentStep ? "bg-accent text-accent-foreground" : i === currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:inline ${i === currentStep ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{step}</span>
          {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

export default function AdvisorDetailsPage() {
  const router = useRouter();
  const [formStep, setFormStep] = useState<"essentials" | "profile" | "complete">("essentials");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 3: Essentials
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageWebsite, setBrokerageWebsite] = useState("");
  const [brokeragePhone, setBrokeragePhone] = useState("");
  const [boroughsServed, setBoroughsServed] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Step 4: Profile
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [hasLicenses, setHasLicenses] = useState(false);
  const [licenseName, setLicenseName] = useState("");
  const [licenseNameOther, setLicenseNameOther] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const toggleBorough = (value: string) => {
    setBoroughsServed((prev) =>
      prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]
    );
    setErrors((prev) => ({ ...prev, boroughsServed: "" }));
  };

  const handleEssentialsNext = () => {
    const newErrors: Record<string, string> = {};
    if (!brokerageName.trim()) newErrors.brokerageName = "Company/firm name is required";
    if (!brokeragePhone.trim()) newErrors.brokeragePhone = "Phone number is required";
    if (boroughsServed.length === 0) newErrors.boroughsServed = "Select at least one borough";
    if (specialties.length === 0) newErrors.specialties = "Select at least one specialty";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setFormStep("profile");
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    try {
      const cleanBio = stripHtml(bio);
      const finalLicenseName = licenseName === "Other" ? licenseNameOther : licenseName;

      const licenses = hasLicenses && finalLicenseName
        ? [{ name: finalLicenseName, licenseNumber: licenseNumber || undefined }]
        : [];

      const res = await fetch("/api/auth/complete-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "BROKER",
          brokerageName: brokerageName.trim(),
          brokerageWebsite: brokerageWebsite.trim() || undefined,
          brokeragePhone: brokeragePhone.trim(),
          boroughsServed,
          specialties,
          bio: cleanBio || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          instagramUrl: instagramUrl.trim() || undefined,
          twitterUrl: twitterUrl.trim() || undefined,
          facebookUrl: facebookUrl.trim() || undefined,
          tiktokUrl: tiktokUrl.trim() || undefined,
          hasLicenses,
          licenses,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.success("Advisor profile saved! Please verify your email to sign in.");
          router.push("/login");
          return;
        }
        throw new Error();
      }

      toast.success("Advisor profile created!");
      setFormStep("complete");
    } catch {
      toast.error("Failed to save advisor details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepIndex = formStep === "essentials" ? 2 : formStep === "profile" ? 3 : 4;

  // Completion checklist items
  const completionItems = [
    { label: "Account created", done: true },
    { label: "Account type selected", done: true },
    { label: "Company details added", done: !!brokerageName },
    { label: "Boroughs & specialties set", done: boroughsServed.length > 0 && specialties.length > 0 },
    { label: "Bio written", done: bio.length >= 50 },
    { label: "Social links added", done: !!(linkedinUrl || instagramUrl || twitterUrl || facebookUrl || tiktokUrl) },
    { label: "Professional licenses", done: hasLicenses },
    { label: "Profile photo", done: false },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <StepIndicator currentStep={currentStepIndex} />

          {formStep === "essentials" && (
            <>
              <CardTitle className="text-2xl font-bold">Advisor Essentials</CardTitle>
              <CardDescription>Tell us about your advisory practice</CardDescription>
            </>
          )}
          {formStep === "profile" && (
            <>
              <CardTitle className="text-2xl font-bold">Quick Profile Setup</CardTitle>
              <CardDescription>Stand out to potential clients</CardDescription>
            </>
          )}
          {formStep === "complete" && (
            <>
              <div className="flex justify-center mb-2">
                <CheckCircle2 className="h-12 w-12 text-accent" />
              </div>
              <CardTitle className="text-2xl font-bold">Your Advisor Profile is Almost Ready!</CardTitle>
              <CardDescription>
                Advisors with complete profiles get 3x more client inquiries. Take a moment to finish setting up.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {/* Step 3: Essentials */}
          {formStep === "essentials" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company / Firm Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., NYC Business Advisory Group"
                  value={brokerageName}
                  onChange={(e) => { setBrokerageName(e.target.value); setErrors((p) => ({ ...p, brokerageName: "" })); }}
                />
                {errors.brokerageName && <p className="text-xs text-destructive">{errors.brokerageName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  placeholder="https://example.com"
                  value={brokerageWebsite}
                  onChange={(e) => setBrokerageWebsite(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(212) 555-0100"
                  value={brokeragePhone}
                  onChange={(e) => { setBrokeragePhone(e.target.value); setErrors((p) => ({ ...p, brokeragePhone: "" })); }}
                />
                {errors.brokeragePhone && <p className="text-xs text-destructive">{errors.brokeragePhone}</p>}
              </div>

              {/* Boroughs Served */}
              <div className="space-y-2">
                <Label>Boroughs You Serve *</Label>
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
                {errors.boroughsServed && <p className="text-xs text-destructive">{errors.boroughsServed}</p>}
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <Label>Specialties *</Label>
                <CategoryMultiCombobox
                  values={specialties}
                  onValuesChange={(next) => {
                    setSpecialties(next);
                    setErrors((prev) => ({ ...prev, specialties: "" }));
                  }}
                  placeholder="Search categories..."
                />
                {errors.specialties && <p className="text-xs text-destructive">{errors.specialties}</p>}
              </div>

              <Button
                className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2"
                onClick={handleEssentialsNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/" className="hover:underline">Complete later</Link>
              </p>
            </div>
          )}

          {/* Step 4: Profile */}
          {formStep === "profile" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Short Bio</Label>
                  <span className={`text-xs ${bio.length > 1000 ? "text-destructive" : "text-muted-foreground"}`}>
                    {bio.length}/1000
                  </span>
                </div>
                <Textarea
                  id="bio"
                  placeholder="Tell potential clients about your experience, approach, and what makes you a great business advisor..."
                  rows={4}
                  maxLength={1000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Social Media (optional)</p>
                <div className="grid gap-3">
                  <Input placeholder="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  <Input placeholder="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                  <Input placeholder="Twitter / X URL" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} />
                  <Input placeholder="Facebook URL" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                  <Input placeholder="TikTok URL" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} />
                </div>
              </div>

              {/* Licenses */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasLicenses" className="text-sm font-medium">
                    Do you have professional licenses?
                  </Label>
                  <Switch
                    id="hasLicenses"
                    checked={hasLicenses}
                    onCheckedChange={setHasLicenses}
                  />
                </div>

                {hasLicenses && (
                  <div className="space-y-3 pl-1">
                    <div className="space-y-2">
                      <Label htmlFor="licenseName">License Name</Label>
                      <Select value={licenseName} onValueChange={setLicenseName}>
                        <SelectTrigger id="licenseName">
                          <SelectValue placeholder="Select a license type" />
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

                    {licenseName === "Other" && (
                      <div className="space-y-2">
                        <Label htmlFor="licenseNameOther">License Name</Label>
                        <Input
                          id="licenseNameOther"
                          placeholder="Enter your license name"
                          value={licenseNameOther}
                          onChange={(e) => setLicenseNameOther(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number (optional)</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="e.g., 10401234567"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      You can upload proof documents later from your profile settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => setFormStep("essentials")}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  className="flex-1 h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  onClick={handleCompleteSetup}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Complete Setup
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/" className="hover:underline">Complete later</Link>
              </p>
            </div>
          )}

          {/* Step 5: Completion */}
          {formStep === "complete" && (
            <div className="space-y-6">
              <div className="space-y-2">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-1.5">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.done ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.done ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <Button
                  className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  onClick={() => router.push("/profile")}
                >
                  Complete My Profile Now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => { router.push("/"); router.refresh(); }}
                >
                  I&apos;ll Do This Later
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
