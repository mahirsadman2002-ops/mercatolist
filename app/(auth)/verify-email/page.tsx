"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    }

    verifyToken();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (res.ok) {
        toast.success("Verification email sent! Check your inbox.");
      } else {
        toast.error(data.error || "Failed to resend");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mx-auto mb-4">
            <span className="font-heading text-2xl font-bold tracking-tight">MercatoList</span>
          </Link>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
              <CardTitle className="text-xl">Verifying your email...</CardTitle>
              <p className="text-muted-foreground">Please wait while we verify your email address.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">Email verified!</CardTitle>
              <p className="text-muted-foreground">Your email has been verified. You can now sign in to your account.</p>
              <Link href="/login">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Go to Sign In
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Verification failed</CardTitle>
              <p className="text-muted-foreground">{errorMessage}</p>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">Resend verification email</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                  <Button onClick={handleResend} disabled={isResending} className="shrink-0">
                    {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {status === "no-token" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <p className="text-muted-foreground">
                We&apos;ve sent a verification link to your email address. Click the link to verify your account.
              </p>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">Didn&apos;t receive it? Resend below.</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                  <Button onClick={handleResend} disabled={isResending} className="shrink-0">
                    {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
