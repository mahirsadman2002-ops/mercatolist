import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function calculateDaysOnMarket(createdAt: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateShareToken(): string {
  return uuidv4().replace(/-/g, "").substring(0, 16);
}

/**
 * Sanitize a post-auth redirect target (e.g. ?callbackUrl=) to a same-origin
 * relative path. Rejects absolute URLs and protocol-relative "//evil.com"
 * values, which would otherwise be an open redirect for phishing.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw || typeof raw !== "string") return fallback;
  // Must start with a single "/" — not "//" (protocol-relative), "/\" (some
  // browsers treat backslash as slash), and not an encoded variant.
  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.startsWith("/\\") ||
    raw.startsWith("/%2F") ||
    raw.startsWith("/%5C")
  ) {
    return fallback;
  }
  return raw;
}
