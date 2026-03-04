import type { Metadata } from "next";

// Components needed: RegisterForm with name, email, password fields + Google OAuth
// import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | MercatoList",
  description: "Create your free MercatoList account to buy or sell businesses in New York City.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2">Join NYC&apos;s premier business marketplace</p>
        </div>
        <p className="text-muted-foreground text-center">Registration form — coming soon</p>
      </div>
    </div>
  );
}
