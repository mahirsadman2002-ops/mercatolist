import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Your Email | MercatoList",
  description: "Verify your email address to complete your MercatoList registration.",
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">We&apos;ve sent a verification link to your email address. Click the link to verify your account.</p>
      </div>
    </div>
  );
}
