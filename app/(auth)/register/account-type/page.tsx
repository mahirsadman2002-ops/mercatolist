"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, BadgeCheck, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

// Step indicator (same as register page)
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

export default function AccountTypePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"USER" | "BROKER" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/account-type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType: selected }),
      });

      if (!res.ok) {
        // If not authenticated, redirect to register
        if (res.status === 401) {
          router.push("/register");
          return;
        }
        throw new Error("Failed to update account type");
      }

      if (selected === "BROKER") {
        router.push("/register/advisor-details");
      } else {
        toast.success("Account set up! Welcome to MercatoList.");
        router.push("/");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <StepIndicator currentStep={1} />
          <CardTitle className="text-2xl font-bold">What best describes you?</CardTitle>
          <CardDescription>This helps us personalize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Buyer/Seller Card */}
            <button
              onClick={() => setSelected("USER")}
              className={`relative flex items-start gap-4 rounded-lg border-2 p-5 text-left transition-all ${
                selected === "USER"
                  ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                selected === "USER" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
              }`}>
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Buyer / Seller</h3>
                <p className="text-sm text-muted-foreground mt-0.5">I want to buy or sell a business in NYC</p>
              </div>
              {selected === "USER" && (
                <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>

            {/* Broker Card */}
            <button
              onClick={() => setSelected("BROKER")}
              className={`relative flex items-start gap-4 rounded-lg border-2 p-5 text-left transition-all ${
                selected === "BROKER"
                  ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                selected === "BROKER" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
              }`}>
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Business Advisor</h3>
                <p className="text-sm text-muted-foreground mt-0.5">I represent buyers and sellers as a business advisor</p>
              </div>
              {selected === "BROKER" && (
                <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>
          </div>

          <Button
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            onClick={handleContinue}
            disabled={!selected || isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Continue
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:underline">Skip for now</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
