"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function BrokerStepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Create Account", "Advisor Details"];
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
          {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

export default function BrokerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 form
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

  const updateBrokerField = (field: string, value: string) => {
    setBrokerForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";
    if (!email.includes("@")) newErrors.email = "Please enter a valid email";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password)) newErrors.password = "Must contain an uppercase letter";
    else if (!/[0-9]/.test(password)) newErrors.password = "Must contain a number";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role: "BROKER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) setErrors({ email: "An account with this email already exists" });
        else toast.error(data.error || "Registration failed");
        return;
      }
      toast.success("Account created! Check your email to verify.");
      setStep(1);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!brokerForm.brokerageName.trim()) newErrors.brokerageName = "Required";
    if (!brokerForm.brokeragePhone.trim()) newErrors.brokeragePhone = "Required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "BROKER", ...brokerForm }),
      });
      if (res.status === 401) {
        // Not authenticated — that's expected since email isn't verified yet
        toast.success("Advisor profile saved! Please verify your email to sign in.");
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Advisor profile created! Welcome to MercatoList.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to save advisor details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    setIsOAuthLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/complete-profile" });
    } catch {
      toast.error("Something went wrong.");
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Link href="/" className="inline-block mx-auto">
            <span className="font-heading text-2xl font-bold tracking-tight">MercatoList</span>
          </Link>
          <BrokerStepIndicator currentStep={step} />
          <CardTitle className="text-2xl font-bold">
            {step === 0 ? "Register as an Advisor" : "Set up your advisor profile"}
          </CardTitle>
          <CardDescription>
            {step === 0 ? "List businesses, manage clients, and grow your practice" : "Help clients find and trust you"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 ? (
            <>
              {/* OAuth */}
              <div className="space-y-3">
                <Button variant="outline" className="w-full h-11 gap-3 font-medium" onClick={() => handleOAuth("google")} disabled={!!isOAuthLoading}>
                  {isOAuthLoading === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
                  Sign up with Google
                </Button>
                <Button variant="outline" className="w-full h-11 gap-3 font-medium bg-black text-white hover:bg-black/90 hover:text-white border-black" onClick={() => handleOAuth("apple")} disabled={!!isOAuthLoading}>
                  {isOAuthLoading === "apple" ? <Loader2 className="h-5 w-5 animate-spin" /> : <AppleIcon className="h-5 w-5" />}
                  Sign up with Apple
                </Button>
              </div>
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
              {/* Credentials form */}
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="b-name">Full Name</Label>
                  <Input id="b-name" placeholder="John Doe" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({...p, name: ""})); }} required />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b-email">Email</Label>
                  <Input id="b-email" type="email" placeholder="you@company.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({...p, email: ""})); }} required />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b-password">Password</Label>
                  <div className="relative">
                    <Input id="b-password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({...p, password: ""})); }} required className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b-confirm">Confirm Password</Label>
                  <Input id="b-confirm" type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({...p, confirmPassword: ""})); }} required />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Advisor Account
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bd-name">Company Name *</Label>
                <Input id="bd-name" placeholder="e.g., NYC Business Sales" value={brokerForm.brokerageName} onChange={(e) => updateBrokerField("brokerageName", e.target.value)} />
                {errors.brokerageName && <p className="text-xs text-destructive">{errors.brokerageName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bd-phone">Company Phone *</Label>
                <Input id="bd-phone" type="tel" placeholder="(212) 555-0100" value={brokerForm.brokeragePhone} onChange={(e) => updateBrokerField("brokeragePhone", e.target.value)} />
                {errors.brokeragePhone && <p className="text-xs text-destructive">{errors.brokeragePhone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bd-website">Company Website</Label>
                <Input id="bd-website" type="url" placeholder="https://example.com" value={brokerForm.brokerageWebsite} onChange={(e) => updateBrokerField("brokerageWebsite", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bd-bio">About / Bio</Label>
                <Textarea id="bd-bio" placeholder="Tell clients about your experience..." rows={3} value={brokerForm.bio} onChange={(e) => updateBrokerField("bio", e.target.value)} />
              </div>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-muted-foreground">Social Media (optional)</p>
                <Input placeholder="LinkedIn URL" value={brokerForm.linkedinUrl} onChange={(e) => updateBrokerField("linkedinUrl", e.target.value)} />
                <Input placeholder="Instagram URL" value={brokerForm.instagramUrl} onChange={(e) => updateBrokerField("instagramUrl", e.target.value)} />
                <Input placeholder="Twitter / X URL" value={brokerForm.twitterUrl} onChange={(e) => updateBrokerField("twitterUrl", e.target.value)} />
                <Input placeholder="Facebook URL" value={brokerForm.facebookUrl} onChange={(e) => updateBrokerField("facebookUrl", e.target.value)} />
                <Input placeholder="TikTok URL" value={brokerForm.tiktokUrl} onChange={(e) => updateBrokerField("tiktokUrl", e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Complete Setup
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/" className="hover:underline">Complete later</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
