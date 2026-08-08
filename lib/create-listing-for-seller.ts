import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { sendClaimEmail } from "@/lib/claim";
import { findOrCreateManagedUser } from "@/lib/create-managed-user";
import { validateNycLocation, boroughCenter } from "@/lib/nyc-geo";
import { geocodeAddress } from "@/lib/mapbox";

export type SellerInput = {
  email?: string;
  name?: string;
  phone?: string;
  accountType?: "SELLER" | "ADVISOR";
  brokerageName?: string;
  /** Already-hosted avatar URL — set on the account if it has none. */
  avatarUrl?: string;
};

export type ListingInput = {
  title?: string;
  description?: string;
  category?: string;
  askingPrice?: number | string;
  annualRevenue?: number | string | null;
  cashFlowSDE?: number | string | null;
  netIncome?: number | string | null;
  monthlyRent?: number | string | null;
  rentEscalation?: string | null;
  annualPayroll?: number | string | null;
  totalExpenses?: number | string | null;
  inventoryValue?: number | string | null;
  inventoryIncluded?: boolean | null;
  ffeValue?: number | string | null;
  ffeIncluded?: boolean | null;
  assetSale?: boolean;
  sellerFinancing?: boolean;
  sbaFinancingAvailable?: boolean;
  yearEstablished?: number | string | null;
  numberOfEmployees?: number | string | null;
  employeesWillingToStay?: boolean | null;
  ownerInvolvement?: string | null;
  ownerHoursPerWeek?: number | string | null;
  squareFootage?: number | string | null;
  leaseTerms?: string | null;
  leaseRenewalOption?: boolean | null;
  reasonForSelling?: string | null;
  licensesPermits?: string | null;
  trainingSupport?: string | null;
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

// Forgiving numeric parse — bookmarklet values arrive as typed text and may
// include "$" and thousands separators.
const num = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const int = (v: unknown) => {
  const n = num(v);
  return n == null ? null : Math.round(n);
};
const optStr = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};
// Tri-state boolean (schema Boolean?): keep null when unknown.
const optBool = (v: unknown) => (v == null || v === "" ? null : Boolean(v));

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
  if (!listing.title || !listing.category || num(listing.askingPrice) == null) {
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
    avatarUrl: seller.avatarUrl,
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

  const askingPrice = num(listing.askingPrice)!;
  const annualRevenue = num(listing.annualRevenue);
  const netIncome = num(listing.netIncome);
  const cashFlowSDE = num(listing.cashFlowSDE);

  // --- Location: the address is always optional (the source site may not
  // publish one). When one IS provided, geocode it server-side so the public
  // map gets an exact pin. When it isn't — or geocoding fails — we only know
  // the general area, so force hideAddress: the listing page then renders the
  // privacy circle around the area instead of a pin at a made-up spot.
  const address = String(listing.address || "").trim();
  let latitude = num(listing.latitude);
  let longitude = num(listing.longitude);
  if (address && latitude == null && longitude == null) {
    try {
      const boroughLabel = String(listing.borough || "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b[a-z]/g, (c) => c.toUpperCase());
      const zip = String(listing.zipCode || "").trim();
      const geo = await geocodeAddress(
        [address, boroughLabel, `NY ${zip}`.trim()].filter(Boolean).join(", ")
      );
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
    } catch {
      // Geocoding is best-effort — fall through to the general-area circle.
    }
  }
  const hasExactLocation = latitude != null && longitude != null;
  const hideAddress = !!listing.hideAddress || !address || !hasExactLocation;

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
    monthlyRent: num(listing.monthlyRent),
    rentEscalation: optStr(listing.rentEscalation),
    annualPayroll: num(listing.annualPayroll),
    totalExpenses: num(listing.totalExpenses),
    inventoryValue: num(listing.inventoryValue),
    inventoryIncluded: optBool(listing.inventoryIncluded),
    ffeValue: num(listing.ffeValue),
    ffeIncluded: optBool(listing.ffeIncluded),
    assetSale: !!listing.assetSale,
    sellerFinancing: !!listing.sellerFinancing,
    sbaFinancingAvailable: !!listing.sbaFinancingAvailable,
    yearEstablished: int(listing.yearEstablished),
    numberOfEmployees: int(listing.numberOfEmployees),
    employeesWillingToStay: optBool(listing.employeesWillingToStay),
    ownerInvolvement:
      listing.ownerInvolvement === "OWNER_OPERATED" || listing.ownerInvolvement === "ABSENTEE"
        ? listing.ownerInvolvement
        : null,
    ownerHoursPerWeek: int(listing.ownerHoursPerWeek),
    squareFootage: int(listing.squareFootage),
    leaseTerms: optStr(listing.leaseTerms),
    leaseRenewalOption: optBool(listing.leaseRenewalOption),
    reasonForSelling: optStr(listing.reasonForSelling),
    licensesPermits: optStr(listing.licensesPermits),
    trainingSupport: optStr(listing.trainingSupport),
    address,
    hideAddress,
    neighborhood: String(listing.neighborhood || "").trim(),
    borough: (String(listing.borough || "MANHATTAN") as Prisma.BusinessListingUncheckedCreateInput["borough"]),
    // Empty string when unknown — never a fake "00000" (which the geo/ZIP
    // checks would then reject on edit).
    zipCode: String(listing.zipCode || "").trim(),
    // Fall back to the borough center when there's no geocoded address, so the
    // privacy circle sits over the right area (and never stores null/0,0).
    latitude: latitude ?? boroughCenter(listing.borough).lat,
    longitude: longitude ?? boroughCenter(listing.borough).lng,
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
