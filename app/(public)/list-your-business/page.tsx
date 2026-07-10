import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Camera,
  MessageSquare,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Building2,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "List Your NYC Business for Sale — Free",
  description:
    "List your business for sale on NYC's premier marketplace. Free listings, qualified buyers across all five boroughs, no commission, no fees.",
  openGraph: {
    title: "List Your NYC Business for Sale — Free",
    description:
      "List your business for sale on NYC's premier marketplace. Free listings, qualified buyers across all five boroughs.",
  },
};

export default async function ListYourBusinessPage() {
  const session = await auth();

  // Logged-in users skip the marketing pitch and go straight to the creation form.
  if (session?.user?.id) {
    redirect("/my-listings/new");
  }

  const registerHref = `/register?callbackUrl=${encodeURIComponent("/my-listings/new")}`;

  return (
    <div className="flex flex-col">
      {/* =================================================================
          Hero
      ================================================================= */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.85)_50%,hsl(var(--primary)/0.95)_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.5) 59px, rgba(255,255,255,0.5) 60px),
              repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.5) 59px, rgba(255,255,255,0.5) 60px)
            `,
          }}
        />

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="size-3" />
              Free to list — no commission, no fees
            </span>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] mt-6">
              Sell your NYC business
              <br />
              <span className="text-amber-300">on your terms.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80 sm:text-xl">
              Reach thousands of qualified buyers across all five boroughs.
              List your business in minutes — keep 100% of what it sells for.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={registerHref}>
                <Button
                  size="lg"
                  className="bg-amber-400 text-amber-950 hover:bg-amber-500 font-semibold shadow-lg h-12 px-8 text-base"
                >
                  List for Free
                </Button>
              </Link>
              <Link href="/listings">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 h-12 px-8 text-base"
                >
                  Browse Listings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          Why MercatoList
      ================================================================= */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Built for NYC business owners
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We&apos;re not a national marketplace where your deli competes with
            a SaaS company in Wyoming. Everything on MercatoList is here, in
            New York.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Benefit
            icon={CheckCircle2}
            title="Free listings, forever"
            body="No upfront cost. No commission when your business sells. List as many businesses as you want."
          />
          <Benefit
            icon={Users}
            title="Qualified, local buyers"
            body="Every buyer on MercatoList is here for NYC businesses. No tire-kickers from across the country."
          />
          <Benefit
            icon={Building2}
            title="Five boroughs, one platform"
            body="Manhattan, Brooklyn, Queens, the Bronx, Staten Island. Browse and list by neighborhood."
          />
          <Benefit
            icon={Camera}
            title="Beautiful listings"
            body="Upload up to 20 photos. Add financials, lease terms, and what makes your business special — buyers see everything they need."
          />
          <Benefit
            icon={MessageSquare}
            title="Direct buyer messaging"
            body="Inquiries land in your MercatoList inbox. Reply on the platform — no email tag, no missed leads."
          />
          <Benefit
            icon={EyeOff}
            title="Ghost listings for privacy"
            body="Don't want competitors or employees seeing your business is for sale? Use a ghost listing — only people you share the link with can see it."
          />
          <Benefit
            icon={TrendingUp}
            title="Real metrics"
            body="See views, saves, and inquiries on every listing. Know what's working and what's not."
          />
          <Benefit
            icon={Shield}
            title="Verified brokers"
            body="If you'd rather not handle the sale yourself, browse our directory of licensed NYC business advisors."
          />
          <Benefit
            icon={Clock}
            title="List in minutes"
            body="A guided multi-step form walks you through everything. Most sellers are live the same day they start."
          />
        </div>
      </section>

      {/* =================================================================
          How it works
      ================================================================= */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps from "thinking about it" to "live and getting inquiries."
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <Step
              number="1"
              title="Create a free account"
              body="30 seconds with Google, Apple, or email. We'll never charge you to list."
            />
            <Step
              number="2"
              title="Build your listing"
              body="Photos, asking price, financials, location, lease terms. Take 10 minutes or skip around and finish later."
            />
            <Step
              number="3"
              title="Get inquiries"
              body="Serious buyers message you directly through MercatoList. Reply, negotiate, close — at your own pace."
            />
          </div>
        </div>
      </section>

      {/* =================================================================
          Closing CTA
      ================================================================= */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-10 text-center shadow-sm">
          <Eye className="mx-auto size-10 text-amber-500" />
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to find the right buyer?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Create your free account and have your listing live tonight.
          </p>
          <div className="mt-8">
            <Link href={registerHref}>
              <Button
                size="lg"
                className="bg-amber-400 text-amber-950 hover:bg-amber-500 font-semibold shadow-lg h-12 px-10 text-base"
              >
                List for Free
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login?callbackUrl=/my-listings/new"
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>{" "}
            to continue.
          </p>
        </div>
      </section>
    </div>
  );
}

function Benefit({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-amber-950 font-heading text-2xl font-bold shadow-md">
        {number}
      </div>
      <h3 className="mt-4 font-semibold tracking-tight text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
