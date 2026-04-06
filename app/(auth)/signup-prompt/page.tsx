"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Heart,
  MessageCircle,
  MessageSquare,
  FolderOpen,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Card components no longer used in two-column layout
import { toast } from "sonner";

// ── OAuth icon components ───────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// ── Password helpers ────────────────────────────────────────────────

function getPasswordStrength(password: string): {
  label: string;
  color: string;
  width: string;
} {
  if (password.length === 0) return { label: "", color: "", width: "0%" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 4) return { label: "Medium", color: "bg-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

// ── Action config ───────────────────────────────────────────────────

type ActionKey = "contact" | "save" | "collection" | "collection-interact";

interface ActionConfig {
  icon: React.ElementType;
  heading: string;
  subtext: string;
  bullets: string[];
}

const ACTION_MAP: Record<ActionKey, ActionConfig> = {
  contact: {
    icon: MessageCircle,
    heading: "Connect with the Seller",
    subtext:
      "Create a free account to start a conversation about this business.",
    bullets: [
      "Send and receive messages directly with sellers and advisors",
      "Keep all your conversations organized in one inbox",
      "Get notified instantly when you receive a reply",
    ],
  },
  save: {
    icon: Heart,
    heading: "Save Listings You're Interested In",
    subtext:
      "Create a free account to save listings and never lose track of opportunities.",
    bullets: [
      "Save listings to revisit them anytime",
      "Get alerts when a saved listing changes status or price",
      "Track your favorites across all NYC boroughs",
    ],
  },
  collection: {
    icon: FolderOpen,
    heading: "Organize Your Business Search",
    subtext:
      "Create a free account to build collections and stay organized.",
    bullets: [
      "Group listings into custom collections",
      "Share collections with your team or advisor",
      "Compare businesses side by side",
    ],
  },
  "collection-interact": {
    icon: MessageCircle,
    heading: "Join the Conversation",
    subtext:
      "Create a free account to like or dislike listings, leave notes, and collaborate with your advisor on finding the right business.",
    bullets: [
      "React to listings your advisor shares with you",
      "Leave notes and comments for your advisor to see",
      "Track your preferences across all shared collections",
    ],
  },
};

const DEFAULT_ACTION: ActionConfig = {
  icon: Sparkles,
  heading: "Join MercatoList",
  subtext:
    "Create a free account to access all features of NYC's premier business marketplace.",
  bullets: [
    "Browse and save businesses for sale across all five boroughs",
    "Message sellers and advisors directly",
    "Organize your search with collections and saved searches",
  ],
};

// ── Inner component (uses useSearchParams) ──────────────────────────

function SignupPromptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const action = searchParams.get("action") as ActionKey | null;
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const config = (action && ACTION_MAP[action]) || DEFAULT_ACTION;
  const Icon = config.icon;

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordStrength = getPasswordStrength(password);

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (name.trim().length < 2)
      newErrors.name = "Name must be at least 2 characters";
    if (!email.includes("@"))
      newErrors.email = "Please enter a valid email";
    if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password))
      newErrors.password = "Password must contain an uppercase letter";
    else if (!/[0-9]/.test(password))
      newErrors.password = "Password must contain a number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: "An account with this email already exists" });
        } else if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.details)) {
            fieldErrors[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
          }
          setErrors(fieldErrors);
        } else {
          toast.error(data.error || "Failed to create account");
        }
        return;
      }

      toast.success("Account created successfully!");

      // Auto-sign in then redirect to the original callbackUrl
      const signInResult = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error("Account created but auto-login failed. Please sign in.");
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.push(callbackUrl);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: string) => {
    setIsOAuthLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-4xl flex-col md:flex-row md:gap-0 rounded-lg border bg-background shadow-lg overflow-hidden">
        {/* ── Left column: Benefits (40%) ────────────────────────── */}
        <div className="w-full md:w-[40%] bg-muted/40 p-8 flex flex-col justify-center gap-6">
          <Link href="/" className="inline-block">
            <span className="font-heading text-2xl font-bold tracking-tight">
              MercatoList
            </span>
          </Link>

          <div className="flex flex-col gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <Icon className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {config.heading}
            </h1>
            <p className="text-sm text-muted-foreground">
              {config.subtext}
            </p>
          </div>

          <ul className="space-y-3 text-sm text-muted-foreground">
            {config.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right column: Form (60%) ───────────────────────────── */}
        <div className="w-full md:w-[60%] p-8 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-sm space-y-6">
            {/* OAuth buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                onClick={() => handleOAuthSignup("google")}
                disabled={!!isOAuthLoading}
              >
                {isOAuthLoading === "google" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                Sign up with Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium bg-black text-white hover:bg-black/90 hover:text-white border-black"
                onClick={() => handleOAuthSignup("apple")}
                disabled={!!isOAuthLoading}
              >
                {isOAuthLoading === "apple" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <AppleIcon className="h-5 w-5" />
                )}
                Sign up with Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((p) => ({ ...p, name: "" }));
                  }}
                  required
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  required
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                    }}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {password.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      {requirements.map((req) => (
                        <div
                          key={req.label}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          {req.met ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span
                            className={
                              req.met
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading fallback ────────────────────────────────────────────────

function SignupPromptFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-4xl flex-col md:flex-row md:gap-0 rounded-lg border bg-background shadow-lg overflow-hidden">
        {/* Left column skeleton */}
        <div className="w-full md:w-[40%] bg-muted/40 p-8 flex flex-col justify-center gap-6">
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="flex flex-col gap-3">
            <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
            <div className="h-7 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
          </div>
        </div>
        {/* Right column skeleton */}
        <div className="w-full md:w-[60%] p-8 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-sm space-y-4">
            <div className="h-11 rounded bg-muted animate-pulse" />
            <div className="h-11 rounded bg-muted animate-pulse" />
            <div className="h-px bg-border" />
            <div className="space-y-3">
              <div className="h-10 rounded bg-muted animate-pulse" />
              <div className="h-10 rounded bg-muted animate-pulse" />
              <div className="h-10 rounded bg-muted animate-pulse" />
              <div className="h-10 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-11 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page export (Suspense boundary) ─────────────────────────────────

export default function SignupPromptPage() {
  return (
    <Suspense fallback={<SignupPromptFallback />}>
      <SignupPromptContent />
    </Suspense>
  );
}
