import type { Metadata } from "next";

// Components needed: LoginForm with email/password fields, Google OAuth button
// import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | MercatoList",
  description: "Sign in to your MercatoList account to manage listings, save businesses, and connect with brokers.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your MercatoList account</p>
        </div>
        <p className="text-muted-foreground text-center">Login form — coming soon</p>
      </div>
    </div>
  );
}
