import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { sendClaimEmail } from "@/lib/claim";
import { findOrCreateManagedUser } from "@/lib/create-managed-user";
import { validateNycLocation } from "@/lib/nyc-geo";

export type SellerInput = {
  email?: string;
  name?: string;
  phone?: string;
  accountType?: "SELLER" | "ADVISOR";
  brokerageName?: string;
};

export type ListingInput = {
  title?: string;
  description?: string;
  category?: string;
  askingPrice?: number | string;
  annualRevenue?: number | string | null;
  cashFlowSDE?: number | string | null;
  netIncome?: number | string | null;
  assetSale?: boolean;
  sellerFinancing?: boolean;
  sbaFinancingAvailable?: boolean;
  yearEstablished?: number | string | null;
  address?: string;
  hideAddress?: boolean;
  neighborhood?: string;
  borough?: string;
  zipCode?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  // Photos must already be hosted (our S3 CDN URLs).
  photos?: Array<{ url: string; order?: number }>;
};

export type CreateResult =
  | { ok: true; listing: { id: string; slug: string; title: string }; owner: { id: string; email: string; role: string; created: boolean } }
  | { ok: false; status: number; error: string };

const num = (v: unknown) => (v == null || v === "" ? null : Number(v));

/**
 * Find-or-create the owner account (auto-verified, unclaimed) and create an
 * ACTIVE listing assigned to them. Shared by the admin UI and the import
 * (bookmarklet) endpoint. Assumes the caller is already authorized as admin.
 */
export async function createListingForSeller(
  seller: SellerInput,
  listing: ListingInput
): Promise<CreateResult> {
  const email = String(seller.email || "").trim().toLowerCase();
  const name = String(seller.name || "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "A valid seller email is required." };
  }
  if (!name) {
    return { ok: false, status: 400, error: "Seller name is required." };
  }
  if (!listing.title || !listing.category || listing.askingPrice == null || listing.askingPrice === "") {
    return { ok: false, status: 400, error: "Listing needs at least a title, category, and asking price." };
  }

  // Geo-lock: imports create live listings, so they must be inside NYC too.
  // Borough is the priority — a Brooklyn listing with the address hidden and no
  // ZIP is still valid.
  const geo = validateNycLocation({
    borough: listing.borough,
    zipCode: listing.zipCode,
    latitude: listing.latitude,
    longitude: listing.longitude,
  });
  if (!geo.ok) {
    return { ok: false, status: 400, error: geo.error };
  }

  // Owner: find or create a managed (auto-verified, unclaimed) account —
  // shared with the standalone admin "Create user" flow.
  const ownerResult = await findOrCreateManagedUser({
    email,
    name,
    phone: seller.phone,
    accountType: seller.accountType,
    brokerageName: seller.brokerageName,
  });
  if (!ownerResult.ok) {
    return { ok: false, status: ownerResult.status, error: ownerResult.error };
  }
  const owner = ownerResult.user;
  const ownerCreated = ownerResult.created;

  const baseTitle = String(listing.title).trim();
  let slug = slugify(baseTitle);
  const existing = await prisma.businessListing.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const askingPrice = Number(listing.askingPrice);
  const annualRevenue = num(listing.annualRevenue);
  const netIncome = num(listing.netIncome);
  const cashFlowSDE = num(listing.cashFlowSDE);

  const profitMargin =
    annualRevenue && netIncome ? Number(((netIncome / annualRevenue) * 100).toFixed(2)) : null;
  const askingMultiple =
    askingPrice && cashFlowSDE && cashFlowSDE > 0 ? Number((askingPrice / cashFlowSDE).toFixed(2)) : null;

  const photos = Array.isArray(listing.photos) ? listing.photos : [];

  const data: Prisma.BusinessListingUncheckedCreateInput = {
    slug,
    status: "ACTIVE",
    title: baseTitle,
    description: String(listing.description || "").trim(),
    category: String(listing.category),
    askingPrice,
    annualRevenue,
    cashFlowSDE,
    netIncome,
    assetSale: !!listing.assetSale,
    sellerFinancing: !!listing.sellerFinancing,
    sbaFinancingAvailable: !!listing.sbaFinancingAvailable,
    yearEstablished: listing.yearEstablished ? Number(listing.yearEstablished) : null,
    address: String(listing.address || "").trim(),
    hideAddress: !!listing.hideAddress,
    neighborhood: String(listing.neighborhood || "").trim(),
    borough: (String(listing.borough || "MANHATTAN") as Prisma.BusinessListingUncheckedCreateInput["borough"]),
    // Empty string when unknown — never a fake "00000" (which the geo/ZIP
    // checks would then reject on edit).
    zipCode: String(listing.zipCode || "").trim(),
    latitude: num(listing.latitude) ?? 0,
    longitude: num(listing.longitude) ?? 0,
    profitMargin,
    askingMultiple,
    listedById: owner.id,
    photos:
      photos.length > 0
        ? { create: photos.map((p, idx) => ({ url: p.url, order: typeof p.order === "number" ? p.order : idx })) }
        : undefined,
  };

  const created = await prisma.businessListing.create({
    data,
    select: { id: true, slug: true, title: true },
  });

  // Nudge the owner to claim their account (best-effort — never blocks creation).
  // New account → "created"; existing unclaimed managed account → "listing".
  await sendClaimEmail(owner, ownerCreated ? "created" : "listing", { listingTitle: created.title });

  return {
    ok: true,
    listing: created,
    owner: { id: owner.id, email: owner.email, role: owner.role, created: ownerCreated },
  };
}
