import { z } from "zod";
import { BUSINESS_CATEGORIES } from "./constants";

const SOCIAL_DOMAINS = {
  instagram: ["instagram.com", "instagr.am"],
  linkedin: ["linkedin.com", "lnkd.in"],
  twitter: ["twitter.com", "x.com"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  tiktok: ["tiktok.com"],
} as const;

function socialUrl(platform: keyof typeof SOCIAL_DOMAINS) {
  const domains = SOCIAL_DOMAINS[platform];
  const label = platform.charAt(0).toUpperCase() + platform.slice(1);
  return z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const u = new URL(val);
          const host = u.hostname.toLowerCase().replace(/^www\./, "");
          return domains.some((d) => host === d || host.endsWith("." + d));
        } catch {
          return false;
        }
      },
      { message: `Must be a valid ${label} URL (e.g. https://${domains[0]}/yourhandle)` },
    );
}

export const listingCreateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  description: z.string().min(50, "Description must be at least 50 characters"),
  category: z.enum(BUSINESS_CATEGORIES as unknown as [string, ...string[]]),
  askingPrice: z.number().positive("Asking price must be positive"),
  annualRevenue: z.number().positive().optional().nullable(),
  cashFlowSDE: z.number().optional().nullable(),
  netIncome: z.number().optional().nullable(),
  monthlyRent: z.number().positive().optional().nullable(),
  rentEscalation: z.string().optional().nullable(),
  annualPayroll: z.number().positive().optional().nullable(),
  totalExpenses: z.number().positive().optional().nullable(),
  inventoryValue: z.number().positive().optional().nullable(),
  inventoryIncluded: z.boolean().optional().nullable(),
  ffeValue: z.number().positive().optional().nullable(),
  ffeIncluded: z.boolean().optional().nullable(),
  sellerFinancing: z.boolean().default(false),
  sbaFinancingAvailable: z.boolean().default(false),
  assetSale: z.boolean().default(false),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  numberOfEmployees: z.number().int().min(0).optional().nullable(),
  employeesWillingToStay: z.boolean().optional().nullable(),
  ownerInvolvement: z.enum(["OWNER_OPERATED", "ABSENTEE"]).optional().nullable(),
  ownerHoursPerWeek: z.number().int().min(0).max(168).optional().nullable(),
  squareFootage: z.number().int().positive().optional().nullable(),
  leaseTerms: z.string().optional().nullable(),
  leaseRenewalOption: z.boolean().optional().nullable(),
  reasonForSelling: z.string().optional().nullable(),
  licensesPermits: z.string().optional().nullable(),
  trainingSupport: z.string().optional().nullable(),
  address: z.string().min(5, "Address is required"),
  hideAddress: z.boolean().default(false),
  neighborhood: z.string().min(1, "Neighborhood is required"),
  borough: z.enum(["MANHATTAN", "BROOKLYN", "QUEENS", "BRONX", "STATEN_ISLAND"]),
  zipCode: z.string().regex(/^\d{5}$/, "Must be a valid 5-digit zip code"),
  latitude: z.number(),
  longitude: z.number(),
  showPhoneNumber: z.boolean().default(true),
  isGhostListing: z.boolean().default(false),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        key: z.string().optional(),
        order: z.number().int().min(0),
      }),
    )
    .max(20)
    .optional(),
});

/** Relaxed schema for drafts — everything optional so users can save in any state. */
export const listingDraftSchema = z.object({
  title: z.string().max(150).optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  askingPrice: z.number().positive().optional().nullable(),
  annualRevenue: z.number().positive().optional().nullable(),
  cashFlowSDE: z.number().optional().nullable(),
  netIncome: z.number().optional().nullable(),
  monthlyRent: z.number().positive().optional().nullable(),
  rentEscalation: z.string().optional().nullable(),
  annualPayroll: z.number().positive().optional().nullable(),
  totalExpenses: z.number().positive().optional().nullable(),
  inventoryValue: z.number().positive().optional().nullable(),
  inventoryIncluded: z.boolean().optional().nullable(),
  ffeValue: z.number().positive().optional().nullable(),
  ffeIncluded: z.boolean().optional().nullable(),
  sellerFinancing: z.boolean().optional(),
  sbaFinancingAvailable: z.boolean().optional(),
  assetSale: z.boolean().optional(),
  yearEstablished: z.number().int().optional().nullable(),
  numberOfEmployees: z.number().int().optional().nullable(),
  employeesWillingToStay: z.boolean().optional().nullable(),
  ownerInvolvement: z.string().optional().nullable(),
  ownerHoursPerWeek: z.number().int().optional().nullable(),
  squareFootage: z.number().int().optional().nullable(),
  leaseTerms: z.string().optional().nullable(),
  leaseRenewalOption: z.boolean().optional().nullable(),
  reasonForSelling: z.string().optional().nullable(),
  licensesPermits: z.string().optional().nullable(),
  trainingSupport: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  hideAddress: z.boolean().optional(),
  neighborhood: z.string().optional().nullable(),
  borough: z
    .enum(["MANHATTAN", "BROOKLYN", "QUEENS", "BRONX", "STATEN_ISLAND"])
    .optional()
    .nullable(),
  zipCode: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  showPhoneNumber: z.boolean().optional(),
  isGhostListing: z.boolean().optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        key: z.string().optional(),
        order: z.number().int().min(0),
      }),
    )
    .max(20)
    .optional(),
});

export const userRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["USER", "BROKER"]).default("USER"),
});

export const brokerDetailsSchema = z.object({
  brokerageName: z.string().min(2).optional(),
  brokerageWebsite: z.string().url().optional().or(z.literal("")),
  brokeragePhone: z.string().optional(),
  instagramUrl: socialUrl("instagram"),
  linkedinUrl: socialUrl("linkedin"),
  twitterUrl: socialUrl("twitter"),
  facebookUrl: socialUrl("facebook"),
  tiktokUrl: socialUrl("tiktok"),
});

export const inquiryFormSchema = z.object({
  senderName: z.string().min(2, "Name is required"),
  senderEmail: z.string().email("Valid email is required"),
  senderPhone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  listingId: z.string().uuid(),
});

export const reviewFormSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    text: z.string().max(2000).optional().or(z.literal("")),
    brokerId: z.string().uuid(),
    experienceType: z.enum(["BOUGHT", "SOLD", "COLLABORATED"]),
    businessCategory: z.string().optional().or(z.literal("")),
    businessName: z.string().max(200).optional().or(z.literal("")),
    businessAddress: z.string().max(300).optional().or(z.literal("")),
    transactionPrice: z.number().positive().optional().nullable(),
    transactionYear: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      data.experienceType === "COLLABORATED" ||
      (data.businessCategory && data.businessCategory.length > 0),
    {
      message: "Business category is required for purchase or sale reviews",
      path: ["businessCategory"],
    },
  );

export const reviewResponseSchema = z.object({
  response: z.string().min(1, "Response cannot be empty").max(2000),
});

export const transactionReviewDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(1000).optional(),
});

export const reportFormSchema = z.object({
  type: z.enum(["LISTING", "REVIEW", "DEAL", "USER"]),
  reason: z.enum(["INACCURATE", "SUSPICIOUS", "DUPLICATE", "SPAM", "OTHER"]),
  details: z.string().max(1000).optional(),
  listingId: z.string().uuid().optional(),
  reviewId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const collectionCreateSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(100),
  description: z.string().max(500).optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientBuyBox: z.any().optional(),
});

export const savedSearchCreateSchema = z.object({
  name: z.string().max(100).optional(),
  criteria: z.object({
    keyword: z.string().optional(),
    category: z.string().optional(),
    borough: z.string().optional(),
    neighborhood: z.string().optional(),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    revenueMin: z.number().optional(),
    revenueMax: z.number().optional(),
    sellerFinancing: z.boolean().optional(),
    sbaFinancingAvailable: z.boolean().optional(),
    assetSale: z.boolean().optional(),
  }),
  checkFrequency: z.enum(["DAILY", "WEEKLY"]).default("DAILY"),
  emailFrequency: z.enum(["IMMEDIATELY", "DAILY_DIGEST", "WEEKLY_DIGEST"]).default("DAILY_DIGEST"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  ownedBusiness: z.string().max(2000).optional().nullable(),
  buyBox: z
    .object({
      categories: z.array(z.string()).optional(),
      boroughs: z.array(z.string()).optional(),
      priceMin: z.number().optional().nullable(),
      priceMax: z.number().optional().nullable(),
      revenueMin: z.number().optional().nullable(),
      revenueMax: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  // Advisor/Broker-specific fields
  brokerageName: z.string().max(200).optional().nullable(),
  boroughsServed: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().min(0).max(99).optional().nullable(),
  hasLicenses: z.boolean().optional(),
  brokerageWebsite: z.string().url().optional().nullable().or(z.literal("")),
  brokeragePhone: z.string().max(20).optional().nullable(),
  instagramUrl: socialUrl("instagram"),
  linkedinUrl: socialUrl("linkedin"),
  twitterUrl: socialUrl("twitter"),
  facebookUrl: socialUrl("facebook"),
  tiktokUrl: socialUrl("tiktok"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const statusChangeSchema = z.object({
  status: z.enum(["ACTIVE", "UNDER_CONTRACT", "SOLD", "OFF_MARKET"]),
  soldPrice: z.number().positive().optional().nullable(),
  soldDate: z.string().optional().nullable(),
});

// ─── Admin Schemas ──────────────────────────────────────────────────

export const blogPostCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().max(300).optional().nullable(),
  featuredImage: z.string().url().optional().nullable().or(z.literal("")),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const blogPostUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().max(300).optional().nullable(),
  featuredImage: z.string().url().optional().nullable().or(z.literal("")),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const adminListingUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "UNDER_CONTRACT", "SOLD", "OFF_MARKET"]).optional(),
  isFeatured: z.boolean().optional(),
  adminNotes: z.string().optional().nullable(),
  soldPrice: z.number().positive().optional().nullable(),
  soldDate: z.string().optional().nullable(),
});

export const adminUserBanSchema = z.object({
  bannedReason: z.string().min(1, "Reason is required").max(500),
});

export const adminReportUpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED", "ACTION_TAKEN"]),
  adminNotes: z.string().max(2000).optional().nullable(),
});

// ─── Feedback / Bug Reports ──────────────────────────────────────────

export const feedbackSchema = z.object({
  type: z.enum(["BUG", "IDEA"]),
  message: z
    .string()
    .trim()
    .min(5, "Please add a little more detail (at least 5 characters).")
    .max(2000, "Please keep it under 2000 characters."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email.")
    .optional()
    .or(z.literal("")),
  pageUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export const adminFeedbackUpdateSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "DISMISSED"]),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
});
