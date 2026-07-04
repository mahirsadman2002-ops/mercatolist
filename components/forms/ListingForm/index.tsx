"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AddressAutofill } from "@mapbox/search-js-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  ImagePlus,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CategoryCombobox } from "@/components/ui/category-combobox";

import {
  BOROUGHS,
  NEIGHBORHOODS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import {
  prepareImageForUpload,
  looksLikeImage,
  ImagePrepError,
} from "@/lib/image-client";
import { boroughFromZip, isNycZip } from "@/lib/nyc-geo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: any;
  listingId?: string;
  /** Admins can save listings without a full address (hidden/unknown). */
  isAdmin?: boolean;
}

interface FormData {
  // Step 1 — Basic Info
  title: string;
  category: string;
  description: string;

  // Step 2 — Financials
  askingPrice: string;
  annualRevenue: string;
  cashFlowSDE: string;
  netIncome: string;
  monthlyRent: string;
  rentEscalation: string;
  annualPayroll: string;
  totalExpenses: string;
  inventoryValue: string;
  inventoryIncluded: boolean;
  ffeValue: string;
  ffeIncluded: boolean;
  sellerFinancing: boolean;
  sbaFinancingAvailable: boolean;
  assetSale: boolean;

  // Step 3 — Business Details
  yearEstablished: string;
  numberOfEmployees: string;
  employeesWillingToStay: boolean;
  ownerInvolvement: string;
  ownerHoursPerWeek: string;
  squareFootage: string;
  leaseTerms: string;
  leaseRenewalOption: boolean;
  reasonForSelling: string;
  licensesPermits: string;
  trainingSupport: string;

  // Step 4 — Location
  address: string;
  neighborhood: string;
  borough: string;
  city: string;
  state: string;
  zipCode: string;
  hideAddress: boolean;
  latitude: string;
  longitude: string;

  // Step 5 — Photos
  photos: { url: string; key?: string; order: number }[];

  // Internal: lets the publish button render the right label in edit mode.
  // Not part of the API payload — preparePayload strips it.
  status?: string;
}

interface StepMeta {
  label: string;
  shortLabel: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS: StepMeta[] = [
  { label: "Basic Info", shortLabel: "Basics" },
  { label: "Financials", shortLabel: "Financials" },
  { label: "Business Details", shortLabel: "Details" },
  { label: "Location", shortLabel: "Location" },
  { label: "Photos", shortLabel: "Photos" },
  { label: "Review & Submit", shortLabel: "Review" },
];

const INITIAL_FORM_DATA: FormData = {
  title: "",
  category: "",
  description: "",
  askingPrice: "",
  annualRevenue: "",
  cashFlowSDE: "",
  netIncome: "",
  monthlyRent: "",
  rentEscalation: "",
  annualPayroll: "",
  totalExpenses: "",
  inventoryValue: "",
  inventoryIncluded: false,
  ffeValue: "",
  ffeIncluded: false,
  sellerFinancing: false,
  sbaFinancingAvailable: false,
  assetSale: false,
  yearEstablished: "",
  numberOfEmployees: "",
  employeesWillingToStay: false,
  ownerInvolvement: "",
  ownerHoursPerWeek: "",
  squareFootage: "",
  leaseTerms: "",
  leaseRenewalOption: false,
  reasonForSelling: "",
  licensesPermits: "",
  trainingSupport: "",
  address: "",
  neighborhood: "",
  borough: "",
  city: "New York",
  state: "NY",
  zipCode: "",
  hideAddress: false,
  latitude: "",
  longitude: "",
  photos: [],
  status: undefined,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeInitialData(initial: any): FormData {
  if (!initial) return { ...INITIAL_FORM_DATA };
  return {
    title: initial.title ?? "",
    category: initial.category ?? "",
    description: initial.description ?? "",
    askingPrice: initial.askingPrice?.toString() ?? "",
    annualRevenue: initial.annualRevenue?.toString() ?? "",
    cashFlowSDE: initial.cashFlowSDE?.toString() ?? "",
    netIncome: initial.netIncome?.toString() ?? "",
    monthlyRent: initial.monthlyRent?.toString() ?? "",
    rentEscalation: initial.rentEscalation ?? "",
    annualPayroll: initial.annualPayroll?.toString() ?? "",
    totalExpenses: initial.totalExpenses?.toString() ?? "",
    inventoryValue: initial.inventoryValue?.toString() ?? "",
    inventoryIncluded: initial.inventoryIncluded ?? false,
    ffeValue: initial.ffeValue?.toString() ?? "",
    ffeIncluded: initial.ffeIncluded ?? false,
    sellerFinancing: initial.sellerFinancing ?? false,
    sbaFinancingAvailable: initial.sbaFinancingAvailable ?? false,
    assetSale: initial.assetSale ?? false,
    yearEstablished: initial.yearEstablished?.toString() ?? "",
    numberOfEmployees: initial.numberOfEmployees?.toString() ?? "",
    employeesWillingToStay: initial.employeesWillingToStay ?? false,
    ownerInvolvement: initial.ownerInvolvement ?? "",
    ownerHoursPerWeek: initial.ownerHoursPerWeek?.toString() ?? "",
    squareFootage: initial.squareFootage?.toString() ?? "",
    leaseTerms: initial.leaseTerms ?? "",
    leaseRenewalOption: initial.leaseRenewalOption ?? false,
    reasonForSelling: initial.reasonForSelling ?? "",
    licensesPermits: initial.licensesPermits ?? "",
    trainingSupport: initial.trainingSupport ?? "",
    address: initial.address ?? "",
    neighborhood: initial.neighborhood ?? "",
    borough: initial.borough ?? "",
    city: initial.city ?? "New York",
    state: initial.state ?? "NY",
    zipCode: initial.zipCode ?? "",
    hideAddress: initial.hideAddress ?? false,
    latitude: initial.latitude?.toString() ?? "",
    longitude: initial.longitude?.toString() ?? "",
    photos: Array.isArray(initial.photos)
      ? initial.photos.map(
          (
            p: { url: string; order?: number; key?: string | null },
            i: number,
          ) => ({
            url: p.url,
            key: p.key ?? undefined,
            order: typeof p.order === "number" ? p.order : i,
          }),
        )
      : [],
    status: initial.status ?? undefined,
  };
}

/** Convert empty strings to null, numeric strings to numbers, etc. */
function preparePayload(data: FormData) {
  const toNumber = (val: string): number | null => {
    if (!val || val.trim() === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const toInt = (val: string): number | null => {
    if (!val || val.trim() === "") return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  };

  const toStringOrNull = (val: string): string | null =>
    val.trim() === "" ? null : val.trim();

  return {
    title: data.title.trim(),
    description: data.description.trim(),
    askingPrice: toNumber(data.askingPrice),
    annualRevenue: toNumber(data.annualRevenue),
    cashFlowSDE: toNumber(data.cashFlowSDE),
    netIncome: toNumber(data.netIncome),
    monthlyRent: toNumber(data.monthlyRent),
    rentEscalation: toStringOrNull(data.rentEscalation),
    annualPayroll: toNumber(data.annualPayroll),
    totalExpenses: toNumber(data.totalExpenses),
    inventoryValue: toNumber(data.inventoryValue),
    inventoryIncluded: data.inventoryIncluded,
    ffeValue: toNumber(data.ffeValue),
    ffeIncluded: data.ffeIncluded,
    sellerFinancing: data.sellerFinancing,
    sbaFinancingAvailable: data.sbaFinancingAvailable,
    assetSale: data.assetSale,
    yearEstablished: toInt(data.yearEstablished),
    numberOfEmployees: toInt(data.numberOfEmployees),
    employeesWillingToStay: data.employeesWillingToStay,
    ownerInvolvement: toStringOrNull(data.ownerInvolvement),
    ownerHoursPerWeek: toInt(data.ownerHoursPerWeek),
    squareFootage: toInt(data.squareFootage),
    leaseTerms: toStringOrNull(data.leaseTerms),
    leaseRenewalOption: data.leaseRenewalOption,
    reasonForSelling: toStringOrNull(data.reasonForSelling),
    licensesPermits: toStringOrNull(data.licensesPermits),
    trainingSupport: toStringOrNull(data.trainingSupport),
    address: data.address.trim(),
    neighborhood: toStringOrNull(data.neighborhood),
    // borough is an enum on the server; empty string must become null for drafts
    borough: toStringOrNull(data.borough),
    category: toStringOrNull(data.category),
    city: data.city.trim(),
    state: data.state.trim(),
    zipCode: data.zipCode.trim(),
    hideAddress: data.hideAddress,
    latitude: toNumber(data.latitude),
    longitude: toNumber(data.longitude),
    photos: data.photos.map((p, i) => ({
      url: p.url,
      key: p.key,
      order: typeof p.order === "number" ? p.order : i,
    })),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

type ValidationErrors = Record<string, string>;

function validateStep(
  step: number,
  data: FormData,
  isAdmin = false
): ValidationErrors {
  const errors: ValidationErrors = {};

  switch (step) {
    case 0: {
      if (!data.title.trim()) errors.title = "Title is required";
      if (!data.category) errors.category = "Category is required";
      if (!data.description.trim()) errors.description = "Description is required";
      if (data.description.trim().length < 50)
        errors.description = "Description must be at least 50 characters";
      break;
    }
    case 1: {
      if (!data.askingPrice.trim()) errors.askingPrice = "Asking price is required";
      else if (isNaN(Number(data.askingPrice)) || Number(data.askingPrice) <= 0)
        errors.askingPrice = "Enter a valid price";
      break;
    }
    case 2: {
      // No strictly required fields for business details, but validate formats
      if (data.yearEstablished) {
        const year = parseInt(data.yearEstablished, 10);
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear())
          errors.yearEstablished = "Enter a valid year";
      }
      if (data.numberOfEmployees) {
        const num = parseInt(data.numberOfEmployees, 10);
        if (isNaN(num) || num < 0) errors.numberOfEmployees = "Enter a valid number";
      }
      break;
    }
    case 3: {
      // Borough is always required (it's the NYC geo-anchor). For admins,
      // address / neighborhood / ZIP are optional — admin-created/imported
      // listings often have the address hidden or unknown. Regular sellers
      // still fill them in.
      if (!isAdmin && !data.address.trim()) errors.address = "Address is required";
      if (!data.borough) errors.borough = "Borough is required";
      if (!isAdmin && !data.neighborhood)
        errors.neighborhood = "Neighborhood is required";
      if (!isAdmin && !data.zipCode.trim()) {
        errors.zipCode = "Zip code is required";
      } else if (data.zipCode.trim()) {
        // Whenever a ZIP is provided (admin or not), it must be a valid NYC ZIP.
        if (!/^\d{5}(-\d{4})?$/.test(data.zipCode.trim()))
          errors.zipCode = "Enter a valid zip code";
        else if (!isNycZip(data.zipCode.trim()))
          errors.zipCode =
            "MercatoList only lists businesses in the five NYC boroughs.";
      }
      break;
    }
    // Steps 4 (Photos) and 5 (Review) have no required validation gates
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: StepMeta[];
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="w-full">
      {/* Desktop indicator */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                    }
                  `}
                >
                  {isCompleted ? <Check className="size-4" /> : index + 1}
                </div>
                <span
                  className={`
                    text-sm font-medium transition-colors
                    ${
                      isCurrent
                        ? "text-foreground"
                        : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  `}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-px mx-4 transition-colors
                    ${index < currentStep ? "bg-primary" : "bg-border"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep].label}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onStepClick(index)}
              className={`
                h-1.5 flex-1 rounded-full transition-colors cursor-pointer
                ${
                  index < currentStep
                    ? "bg-primary"
                    : index === currentStep
                    ? "bg-primary"
                    : "bg-muted"
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

function CurrencyField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = "0",
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            onChange(raw);
          }}
          className="pl-7"
          aria-invalid={!!error}
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Components
// ---------------------------------------------------------------------------

function StepBasicInfo({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: ValidationErrors;
  onChange: (field: keyof FormData, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Listing Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder='e.g. "Established Italian Restaurant in Astoria"'
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            aria-invalid={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <CategoryCombobox
            id="category"
            value={data.category}
            onValueChange={(val) => onChange("category", val)}
            placeholder="Search or select a category"
          />
          <FieldError message={errors.category} />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe the business, its history, unique selling points, customer base, and growth potential. Minimum 50 characters."
            rows={6}
            value={data.description}
            onChange={(e) => onChange("description", e.target.value)}
            aria-invalid={!!errors.description}
          />
          <div className="flex items-center justify-between">
            <FieldError message={errors.description} />
            <span className="text-xs text-muted-foreground ml-auto">
              {data.description.length} characters
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepFinancials({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: ValidationErrors;
  onChange: (field: keyof FormData, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Financial Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Revenue & Pricing */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Revenue &amp; Pricing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyField
              id="askingPrice"
              label="Asking Price"
              value={data.askingPrice}
              onChange={(val) => onChange("askingPrice", val)}
              error={errors.askingPrice}
              required
            />
            <CurrencyField
              id="annualRevenue"
              label="Annual Revenue"
              value={data.annualRevenue}
              onChange={(val) => onChange("annualRevenue", val)}
              error={errors.annualRevenue}
            />
            <CurrencyField
              id="cashFlowSDE"
              label="Cash Flow (SDE)"
              value={data.cashFlowSDE}
              onChange={(val) => onChange("cashFlowSDE", val)}
              error={errors.cashFlowSDE}
            />
            <CurrencyField
              id="netIncome"
              label="Net Income"
              value={data.netIncome}
              onChange={(val) => onChange("netIncome", val)}
              error={errors.netIncome}
            />
          </div>

          {/* Asset sale toggle */}
          <div className="mt-5 rounded-lg border border-input bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="assetSale"
                checked={data.assetSale}
                onCheckedChange={(checked) => onChange("assetSale", checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="assetSale" className="cursor-pointer font-medium">
                  This is an asset sale
                </Label>
                <p className="text-sm text-muted-foreground">
                  You&apos;re selling the equipment, fixtures, lease and other assets rather than an
                  operating business. Revenue and profit figures are{" "}
                  <span className="font-medium text-foreground">optional</span> for asset sales, and
                  your listing will be labeled as an{" "}
                  <span className="font-medium text-foreground">Asset Sale</span> on the marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Operating Costs */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Operating Costs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyField
              id="monthlyRent"
              label="Monthly Rent"
              value={data.monthlyRent}
              onChange={(val) => onChange("monthlyRent", val)}
              error={errors.monthlyRent}
            />
            <div className="space-y-2">
              <Label htmlFor="rentEscalation">Rent Escalation</Label>
              <Input
                id="rentEscalation"
                placeholder='e.g. "3% annually"'
                value={data.rentEscalation}
                onChange={(e) => onChange("rentEscalation", e.target.value)}
              />
            </div>
            <CurrencyField
              id="annualPayroll"
              label="Annual Payroll"
              value={data.annualPayroll}
              onChange={(val) => onChange("annualPayroll", val)}
              error={errors.annualPayroll}
            />
            <CurrencyField
              id="totalExpenses"
              label="Total Expenses"
              value={data.totalExpenses}
              onChange={(val) => onChange("totalExpenses", val)}
              error={errors.totalExpenses}
            />
          </div>
        </div>

        <Separator />

        {/* Assets */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Assets &amp; Inventory
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyField
              id="inventoryValue"
              label="Inventory Value"
              value={data.inventoryValue}
              onChange={(val) => onChange("inventoryValue", val)}
              error={errors.inventoryValue}
            />
            <CurrencyField
              id="ffeValue"
              label="FF&E Value"
              value={data.ffeValue}
              onChange={(val) => onChange("ffeValue", val)}
              error={errors.ffeValue}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="inventoryIncluded"
                checked={data.inventoryIncluded}
                onCheckedChange={(checked) =>
                  onChange("inventoryIncluded", checked === true)
                }
              />
              <Label htmlFor="inventoryIncluded" className="cursor-pointer">
                Inventory included in asking price
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="ffeIncluded"
                checked={data.ffeIncluded}
                onCheckedChange={(checked) =>
                  onChange("ffeIncluded", checked === true)
                }
              />
              <Label htmlFor="ffeIncluded" className="cursor-pointer">
                FF&amp;E included in asking price
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Financing */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Financing Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Checkbox
                id="sellerFinancing"
                checked={data.sellerFinancing}
                onCheckedChange={(checked) =>
                  onChange("sellerFinancing", checked === true)
                }
              />
              <Label htmlFor="sellerFinancing" className="cursor-pointer">
                Seller financing available
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="sbaFinancingAvailable"
                checked={data.sbaFinancingAvailable}
                onCheckedChange={(checked) =>
                  onChange("sbaFinancingAvailable", checked === true)
                }
              />
              <Label htmlFor="sbaFinancingAvailable" className="cursor-pointer">
                SBA financing available
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepBusinessDetails({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: ValidationErrors;
  onChange: (field: keyof FormData, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Business Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* General */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            General
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="yearEstablished">Year Established</Label>
              <Input
                id="yearEstablished"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2005"
                value={data.yearEstablished}
                onChange={(e) =>
                  onChange(
                    "yearEstablished",
                    e.target.value.replace(/[^0-9]/g, "")
                  )
                }
                aria-invalid={!!errors.yearEstablished}
              />
              <FieldError message={errors.yearEstablished} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="squareFootage">Square Footage</Label>
              <Input
                id="squareFootage"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2500"
                value={data.squareFootage}
                onChange={(e) =>
                  onChange(
                    "squareFootage",
                    e.target.value.replace(/[^0-9]/g, "")
                  )
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Employees */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Employees
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Number of Employees</Label>
              <Input
                id="numberOfEmployees"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 12"
                value={data.numberOfEmployees}
                onChange={(e) =>
                  onChange(
                    "numberOfEmployees",
                    e.target.value.replace(/[^0-9]/g, "")
                  )
                }
                aria-invalid={!!errors.numberOfEmployees}
              />
              <FieldError message={errors.numberOfEmployees} />
            </div>
            <div className="flex items-center gap-3 md:mt-8">
              <Checkbox
                id="employeesWillingToStay"
                checked={data.employeesWillingToStay}
                onCheckedChange={(checked) =>
                  onChange("employeesWillingToStay", checked === true)
                }
              />
              <Label htmlFor="employeesWillingToStay" className="cursor-pointer">
                Employees willing to stay after sale
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Owner Involvement */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Owner Involvement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ownerInvolvement">Owner Involvement</Label>
              <Select
                value={data.ownerInvolvement}
                onValueChange={(val) => onChange("ownerInvolvement", val)}
              >
                <SelectTrigger id="ownerInvolvement" className="w-full">
                  <SelectValue placeholder="Select involvement level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER_OPERATED">Owner Operated</SelectItem>
                  <SelectItem value="ABSENTEE">Absentee Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerHoursPerWeek">Owner Hours Per Week</Label>
              <Input
                id="ownerHoursPerWeek"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 40"
                value={data.ownerHoursPerWeek}
                onChange={(e) =>
                  onChange(
                    "ownerHoursPerWeek",
                    e.target.value.replace(/[^0-9]/g, "")
                  )
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Lease */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Lease Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="leaseTerms">Lease Terms</Label>
              <Input
                id="leaseTerms"
                placeholder='e.g. "5 years remaining"'
                value={data.leaseTerms}
                onChange={(e) => onChange("leaseTerms", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 md:mt-8">
              <Checkbox
                id="leaseRenewalOption"
                checked={data.leaseRenewalOption}
                onCheckedChange={(checked) =>
                  onChange("leaseRenewalOption", checked === true)
                }
              />
              <Label htmlFor="leaseRenewalOption" className="cursor-pointer">
                Lease renewal option available
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Additional Info */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Additional Information
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reasonForSelling">Reason for Selling</Label>
              <Input
                id="reasonForSelling"
                placeholder="e.g. Retirement, relocation, new venture"
                value={data.reasonForSelling}
                onChange={(e) => onChange("reasonForSelling", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensesPermits">Licenses &amp; Permits</Label>
              <Textarea
                id="licensesPermits"
                placeholder="List all relevant licenses and permits that transfer with the business..."
                rows={3}
                value={data.licensesPermits}
                onChange={(e) => onChange("licensesPermits", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainingSupport">Training &amp; Support</Label>
              <Textarea
                id="trainingSupport"
                placeholder="Describe what training and transition support you will provide to the buyer..."
                rows={3}
                value={data.trainingSupport}
                onChange={(e) => onChange("trainingSupport", e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function StepLocation({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: ValidationErrors;
  onChange: (field: keyof FormData, value: any) => void;
}) {
  const neighborhoodsForBorough = data.borough
    ? NEIGHBORHOODS[data.borough] ?? []
    : [];
  const mapboxToken =
    (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim() || null;

  function handleAutofillRetrieve(res: unknown) {
    // Be tolerant of the response shape across @mapbox/search-js versions.
    const asColl = res as { features?: unknown[] };
    const feature = (asColl?.features?.[0] || res || null) as {
      geometry?: { coordinates?: number[] };
      properties?: Record<string, string | undefined>;
    } | null;
    if (!feature) return;
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates;

    if (props.address_line1) onChange("address", props.address_line1);
    const zip = (props.postcode || "").trim();
    if (zip) onChange("zipCode", zip);

    // Borough: Mapbox reports every NYC borough's city as "New York", so its
    // city field can't distinguish them. ZIP code IS deterministic for NYC —
    // use it first, and only fall back to the city name if there's no ZIP.
    let boroughVal: string = boroughFromZip(zip);
    if (!boroughVal) {
      const city = (props.address_level2 || props.place || "").toUpperCase();
      boroughVal =
        ({
          BROOKLYN: "BROOKLYN",
          QUEENS: "QUEENS",
          BRONX: "BRONX",
          "STATEN ISLAND": "STATEN_ISLAND",
          MANHATTAN: "MANHATTAN",
        } as Record<string, string>)[city] || "";
    }
    if (boroughVal) {
      onChange("borough", boroughVal);
      // If Mapbox's neighborhood matches one of ours for this borough, set it.
      const cand = (props.neighborhood || props.address_level3 || "").trim().toLowerCase();
      if (cand) {
        const match = (NEIGHBORHOODS[boroughVal] || []).find(
          (n) => n.toLowerCase() === cand
        );
        if (match) onChange("neighborhood", match);
      }
    }

    if (coords && coords.length >= 2) {
      onChange("longitude", String(coords[0]));
      onChange("latitude", String(coords[1]));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Address */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Address
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">
                Street Address <span className="text-destructive">*</span>
              </Label>
              {mapboxToken ? (
                <AddressAutofill
                  accessToken={mapboxToken}
                  onRetrieve={handleAutofillRetrieve}
                  options={{
                    country: "us",
                    proximity: "ip" as const,
                  }}
                >
                  <Input
                    id="address"
                    placeholder="Start typing an address..."
                    autoComplete="street-address"
                    value={data.address}
                    onChange={(e) => onChange("address", e.target.value)}
                    aria-invalid={!!errors.address}
                  />
                </AddressAutofill>
              ) : (
                <Input
                  id="address"
                  placeholder="e.g. 123 Main Street"
                  value={data.address}
                  onChange={(e) => onChange("address", e.target.value)}
                  aria-invalid={!!errors.address}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {mapboxToken
                  ? "Start typing and pick from the suggestions — zip, borough, and coordinates fill in automatically."
                  : "Address autocomplete unavailable. You can type manually."}
              </p>
              <FieldError message={errors.address} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="borough">
                  Borough <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.borough}
                  onValueChange={(val) => {
                    onChange("borough", val);
                    // Reset neighborhood when borough changes
                    onChange("neighborhood", "");
                  }}
                >
                  <SelectTrigger id="borough" className="w-full" aria-invalid={!!errors.borough}>
                    <SelectValue placeholder="Select borough" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOROUGHS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.borough} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">
                  Neighborhood <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.neighborhood}
                  onValueChange={(val) => onChange("neighborhood", val)}
                  disabled={!data.borough}
                >
                  <SelectTrigger
                    id="neighborhood"
                    className="w-full"
                    aria-invalid={!!errors.neighborhood}
                  >
                    <SelectValue
                      placeholder={
                        data.borough
                          ? "Select neighborhood"
                          : "Select a borough first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoodsForBorough.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.neighborhood} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => onChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={data.state}
                  onChange={(e) => onChange("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">
                  Zip Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zipCode"
                  placeholder="e.g. 11101"
                  value={data.zipCode}
                  onChange={(e) =>
                    onChange("zipCode", e.target.value.replace(/[^0-9-]/g, ""))
                  }
                  aria-invalid={!!errors.zipCode}
                />
                <FieldError message={errors.zipCode} />
              </div>
            </div>

            {/* Address privacy — deliberately prominent so skeptical sellers see it */}
            <label
              htmlFor="hideAddress"
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                data.hideAddress
                  ? "border-teal bg-teal/5"
                  : "border-dashed border-input hover:border-teal/50 hover:bg-muted/40"
              }`}
            >
              <Checkbox
                id="hideAddress"
                checked={data.hideAddress}
                onCheckedChange={(checked) =>
                  onChange("hideAddress", checked === true)
                }
                className="mt-0.5"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-4 w-4 ${data.hideAddress ? "text-teal" : "text-muted-foreground"}`} />
                  <span className="font-semibold">Keep my exact address private</span>
                  {data.hideAddress && (
                    <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      On
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended for confidential sales. Buyers see only an approximate area (a privacy
                  circle on the map) — never your street address — until you choose to share it with a
                  serious inquirer.
                </p>
              </div>
            </label>
          </div>
        </div>

        <Separator />

        {/* Coordinates (placeholder) */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Coordinates
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Latitude and longitude will be automatically filled via geocoding in a future update. You can manually enter them for now.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                placeholder="e.g. 40.7128"
                value={data.latitude}
                onChange={(e) => onChange("latitude", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                placeholder="e.g. -74.0060"
                value={data.longitude}
                onChange={(e) => onChange("longitude", e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MAX_PHOTOS = 20;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function StepPhotos({
  photos,
  onPhotosChange,
}: {
  photos: FormData["photos"];
  onPhotosChange: (next: FormData["photos"]) => void;
}) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<{ url: string; key: string } | null> {
    // Two-step upload: (1) presign through our API (same-origin), then
    // (2) PUT directly to S3 (cross-origin — needs CORS on the bucket).
    let presignJson: { success: boolean; data?: { url: string; key: string }; error?: string };
    try {
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: file.type,
          folder: "listings",
          fileSize: file.size,
        }),
      });
      presignJson = await presignRes.json();
      if (!presignRes.ok || !presignJson.success) {
        throw new Error(presignJson.error || "Couldn't get upload URL");
      }
    } catch (err) {
      console.error("[photo] presign step failed:", err);
      const msg =
        err instanceof Error ? err.message : "Couldn't reach the upload service";
      toast.error(`Presign failed: ${msg}`);
      return null;
    }

    const { url, key } = presignJson.data!;
    try {
      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        const body = await putRes.text().catch(() => "");
        throw new Error(`S3 returned ${putRes.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
      }
      const viewUrl = url.split("?")[0];
      return { url: viewUrl, key };
    } catch (err) {
      console.error("[photo] S3 PUT failed:", err);
      // "Failed to fetch" / TypeError almost always means CORS rejected the
      // request. Give the user (or admin) an actionable hint.
      const isLikelyCors =
        err instanceof TypeError ||
        (err instanceof Error && err.message.toLowerCase().includes("failed to fetch"));
      const hint = isLikelyCors
        ? "Browser blocked the upload — your S3 bucket needs CORS configured to allow PUT from this domain. Check the AWS S3 console → bucket → Permissions → CORS."
        : err instanceof Error
          ? err.message
          : "Upload to storage failed";
      toast.error(hint);
      return null;
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const filesArray = Array.from(files);
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`You've hit the ${MAX_PHOTOS}-photo limit`);
      return;
    }
    // Quick pre-filter on "is this an image at all" (mime OR extension —
    // browsers report an empty type for HEIC and some other formats).
    const candidates = filesArray.slice(0, remaining).filter((f) => {
      if (!looksLikeImage(f)) {
        toast.error(`${f.name} isn't an image`);
        return false;
      }
      return true;
    });
    if (candidates.length === 0) return;

    setUploadingCount((c) => c + candidates.length);
    // Convert HEIC/odd formats to JPEG and compress oversized files, then
    // upload. Per-file: one bad photo never blocks the rest of the batch.
    const results = await Promise.all(
      candidates.map(async (f) => {
        try {
          const prepared = await prepareImageForUpload(f, MAX_PHOTO_BYTES);
          return await uploadFile(prepared);
        } catch (err) {
          toast.error(
            err instanceof ImagePrepError
              ? err.message
              : `Couldn't process ${f.name}`,
          );
          return null;
        }
      }),
    );
    const successful = results.filter(
      (r): r is { url: string; key: string } => r !== null,
    );
    if (successful.length > 0) {
      const startOrder = photos.length;
      onPhotosChange([
        ...photos,
        ...successful.map((s, i) => ({
          url: s.url,
          key: s.key,
          order: startOrder + i,
        })),
      ]);
      toast.success(
        `Uploaded ${successful.length} photo${successful.length === 1 ? "" : "s"}`,
      );
    }
    setUploadingCount((c) => Math.max(0, c - candidates.length));
  }

  function removePhoto(index: number) {
    const next = photos.filter((_, i) => i !== index).map((p, i) => ({
      ...p,
      order: i,
    }));
    onPhotosChange(next);
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    onPhotosChange(next.map((p, i) => ({ ...p, order: i })));
  }

  function reorderPhoto(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= photos.length) return;
    if (toIndex < 0 || toIndex >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onPhotosChange(next.map((p, i) => ({ ...p, order: i })));
  }

  // HTML5 drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload high-quality photos of the business. Listings with photos
          receive significantly more inquiries.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ImagePlus className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-medium">
                Drag and drop photos here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse from your computer
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={photos.length >= MAX_PHOTOS}
            >
              {uploadingCount > 0 ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading {uploadingCount}...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Choose Files
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, HEIC, or any photo format — large images are
              compressed automatically. {photos.length}/{MAX_PHOTOS} photos
              used.
            </p>
          </div>
        </div>

        {photos.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              Drag to reorder. The first photo is the cover image shown on
              listing cards and search results.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, index) => {
                const isDragging = draggedIndex === index;
                const isDropTarget =
                  dropIndex === index && draggedIndex !== null && draggedIndex !== index;
                return (
                  <div
                    key={`${photo.url}-${index}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                      // Required for Firefox to actually fire dragover
                      try {
                        e.dataTransfer.setData("text/plain", String(index));
                      } catch {
                        /* noop */
                      }
                    }}
                    onDragOver={(e) => {
                      if (draggedIndex === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dropIndex !== index) setDropIndex(index);
                    }}
                    onDragLeave={() => {
                      if (dropIndex === index) setDropIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null) {
                        reorderPhoto(draggedIndex, index);
                      }
                      setDraggedIndex(null);
                      setDropIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDropIndex(null);
                    }}
                    className={`group relative aspect-square overflow-hidden rounded-md border bg-muted cursor-move transition-all ${
                      isDragging ? "opacity-40 scale-95" : ""
                    } ${
                      isDropTarget
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Listing photo ${index + 1}`}
                      className="h-full w-full object-cover pointer-events-none"
                    />
                    {index === 0 && (
                      <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePhoto(index, -1);
                          }}
                          disabled={index === 0}
                          className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground disabled:opacity-40"
                          aria-label="Move left"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePhoto(index, 1);
                          }}
                          disabled={index === photos.length - 1}
                          className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground disabled:opacity-40"
                          aria-label="Move right"
                        >
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                        className="rounded bg-red-500/90 px-1.5 py-0.5 text-[11px] font-medium text-white hover:bg-red-600"
                        aria-label="Remove photo"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StepReview({
  data,
  mode,
}: {
  data: FormData;
  mode: "create" | "edit";
}) {
  const boroughLabel =
    BOROUGHS.find((b) => b.value === data.borough)?.label ?? data.borough;

  const ownerLabel =
    data.ownerInvolvement === "OWNER_OPERATED"
      ? "Owner Operated"
      : data.ownerInvolvement === "ABSENTEE"
      ? "Absentee Owner"
      : "Not specified";

  const formatPrice = (val: string) => {
    if (!val) return "Not specified";
    const num = Number(val);
    return isNaN(num) ? val : formatCurrency(num);
  };

  const boolLabel = (val: boolean) => (val ? "Yes" : "No");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Review Your {mode === "create" ? "Listing" : "Changes"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Basic Information
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <ReviewField label="Title" value={data.title} />
            <ReviewField label="Category" value={data.category} />
            <div className="md:col-span-2">
              <ReviewField label="Description" value={data.description} />
            </div>
          </dl>
        </div>

        <Separator />

        {/* Financials */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Financials
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <ReviewField label="Asking Price" value={formatPrice(data.askingPrice)} />
            <ReviewField label="Annual Revenue" value={formatPrice(data.annualRevenue)} />
            <ReviewField label="Cash Flow (SDE)" value={formatPrice(data.cashFlowSDE)} />
            <ReviewField label="Net Income" value={formatPrice(data.netIncome)} />
            <ReviewField label="Monthly Rent" value={formatPrice(data.monthlyRent)} />
            <ReviewField label="Rent Escalation" value={data.rentEscalation || "Not specified"} />
            <ReviewField label="Annual Payroll" value={formatPrice(data.annualPayroll)} />
            <ReviewField label="Total Expenses" value={formatPrice(data.totalExpenses)} />
            <ReviewField label="Inventory Value" value={formatPrice(data.inventoryValue)} />
            <ReviewField label="Inventory Included" value={boolLabel(data.inventoryIncluded)} />
            <ReviewField label="FF&E Value" value={formatPrice(data.ffeValue)} />
            <ReviewField label="FF&E Included" value={boolLabel(data.ffeIncluded)} />
            <ReviewField label="Seller Financing" value={boolLabel(data.sellerFinancing)} />
            <ReviewField label="SBA Financing" value={boolLabel(data.sbaFinancingAvailable)} />
            <ReviewField label="Asset Sale" value={boolLabel(data.assetSale)} />
          </dl>
        </div>

        <Separator />

        {/* Business Details */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Business Details
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <ReviewField label="Year Established" value={data.yearEstablished || "Not specified"} />
            <ReviewField label="Employees" value={data.numberOfEmployees || "Not specified"} />
            <ReviewField label="Employees Stay" value={boolLabel(data.employeesWillingToStay)} />
            <ReviewField label="Owner Involvement" value={ownerLabel} />
            <ReviewField
              label="Owner Hours/Week"
              value={data.ownerHoursPerWeek ? `${data.ownerHoursPerWeek} hrs` : "Not specified"}
            />
            <ReviewField
              label="Square Footage"
              value={data.squareFootage ? `${Number(data.squareFootage).toLocaleString()} sq ft` : "Not specified"}
            />
            <ReviewField label="Lease Terms" value={data.leaseTerms || "Not specified"} />
            <ReviewField label="Lease Renewal" value={boolLabel(data.leaseRenewalOption)} />
            <ReviewField label="Reason for Selling" value={data.reasonForSelling || "Not specified"} />
          </dl>
          {data.licensesPermits && (
            <div className="mt-3">
              <ReviewField label="Licenses & Permits" value={data.licensesPermits} />
            </div>
          )}
          {data.trainingSupport && (
            <div className="mt-3">
              <ReviewField label="Training & Support" value={data.trainingSupport} />
            </div>
          )}
        </div>

        <Separator />

        {/* Location */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Location
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <ReviewField label="Address" value={data.address} />
            <ReviewField label="Borough" value={boroughLabel} />
            <ReviewField label="Neighborhood" value={data.neighborhood || "Not specified"} />
            <ReviewField
              label="City / State / Zip"
              value={`${data.city}, ${data.state} ${data.zipCode}`}
            />
            <ReviewField label="Hide Address" value={boolLabel(data.hideAddress)} />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground mt-0.5 whitespace-pre-wrap break-words">
        {value || "—"}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ListingForm({ mode, initialData, listingId, isAdmin = false }: ListingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(() =>
    mergeInitialData(initialData),
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Server-side draft id. Initialised from the edit-mode listingId prop;
  // in create mode, set after the first successful POST creates a draft row.
  const [serverDraftId, setServerDraftId] = useState<string | null>(
    listingId ?? null,
  );

  // Autosave state for the inline status pill
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Track what we last persisted so we don't re-save unchanged state on every tick.
  const lastSavedSnapshotRef = useRef<string>(JSON.stringify(formData));
  // Re-entrancy guard so concurrent autosaves don't race the POST that creates the draft id.
  const isSavingRef = useRef(false);

  /** Persist the current formData as a draft. Creates on first call, updates after. */
  const saveDraftToServer = useCallback(
    async (opts: { silent: boolean }) => {
      if (isSavingRef.current) return null;
      isSavingRef.current = true;
      if (!opts.silent) setIsSavingDraft(true);
      else setAutoSaveStatus("saving");
      try {
        const payload = { ...preparePayload(formData), status: "DRAFT" };
        const targetId = serverDraftId;
        const url = targetId
          ? `/api/listings/${targetId}`
          : "/api/listings";
        const method = targetId ? "PUT" : "POST";
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Couldn't save");
        }
        if (!targetId && result.data?.id) {
          setServerDraftId(result.data.id);
        }
        lastSavedSnapshotRef.current = JSON.stringify(formData);
        setLastSavedAt(new Date());
        setAutoSaveStatus("saved");
        return result.data;
      } catch (err) {
        setAutoSaveStatus("error");
        if (!opts.silent) {
          toast.error(err instanceof Error ? err.message : "Couldn't save");
        }
        return null;
      } finally {
        isSavingRef.current = false;
        if (!opts.silent) setIsSavingDraft(false);
      }
    },
    [formData, serverDraftId],
  );

  // Debounced server-side autosave — fires 2.5s after the user stops editing.
  useEffect(() => {
    // Don't autosave on first render or if nothing meaningful is there yet.
    const snapshot = JSON.stringify(formData);
    if (snapshot === lastSavedSnapshotRef.current) return;
    const hasAnyContent =
      formData.title.trim() ||
      formData.description.trim() ||
      formData.address.trim() ||
      formData.category ||
      formData.borough ||
      formData.askingPrice ||
      formData.photos.length > 0;
    if (!hasAnyContent) return;

    const handle = setTimeout(() => {
      saveDraftToServer({ silent: true });
    }, 2500);
    return () => clearTimeout(handle);
  }, [formData, saveDraftToServer]);

  const onChange = useCallback(
    (field: keyof FormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for field when user modifies it
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const handleStepClick = useCallback(
    (step: number) => {
      // Allow navigating to any previously visited step or next step
      if (step <= currentStep) {
        setCurrentStep(step);
        return;
      }
      // Validate all intermediate steps before jumping forward
      for (let i = currentStep; i < step; i++) {
        const stepErrors = validateStep(i, formData, isAdmin);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          setCurrentStep(i);
          toast.error("Please fix the errors before proceeding.");
          return;
        }
      }
      setCurrentStep(step);
    },
    [currentStep, formData, isAdmin]
  );

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(currentStep, formData, isAdmin);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error("Please fix the errors before proceeding.");
      return;
    }
    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [currentStep, formData]);

  const handleBack = useCallback(() => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Explicit "Save Draft" button — saves and redirects to /my-listings.
  const handleSaveDraft = useCallback(async () => {
    const saved = await saveDraftToServer({ silent: false });
    if (saved) {
      toast.success("Saved to drafts");
      router.push("/my-listings");
      router.refresh();
    }
  }, [saveDraftToServer, router]);

  const handleSubmit = useCallback(async () => {
    // Re-validate all steps before submitting
    for (let i = 0; i < STEPS.length - 1; i++) {
      const stepErrors = validateStep(i, formData, isAdmin);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setCurrentStep(i);
        toast.error(
          `There are errors in the "${STEPS[i].label}" step. Please fix them before submitting.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Publishing always sends status=ACTIVE. If a draft has already been
      // created (autosave or manual), update that row instead of inserting
      // a new one — that avoids accidentally leaving a DRAFT and an ACTIVE
      // copy of the same listing.
      const targetId = serverDraftId;
      const payload = { ...preparePayload(formData), status: "ACTIVE" };
      const url = targetId
        ? `/api/listings/${targetId}`
        : "/api/listings";
      const method = targetId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      toast.success(
        mode === "create" && !targetId
          ? "Listing created successfully!"
          : "Listing published!"
      );

      // Redirect to the listing or listings page
      if (result.data?.slug) {
        router.push(`/listings/${result.data.slug}`);
      } else {
        router.push("/my-listings");
      }
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, serverDraftId, router]);

  // Render the autosave pill — small status line that lives next to the Save Draft button.
  function renderAutosavePill() {
    const baseClass =
      "flex items-center gap-1.5 text-xs text-muted-foreground";
    if (autoSaveStatus === "saving") {
      return (
        <span className={baseClass}>
          <Loader2 className="size-3 animate-spin" />
          Autosaving...
        </span>
      );
    }
    if (autoSaveStatus === "saved" && lastSavedAt) {
      return (
        <span className={baseClass}>
          <Check className="size-3 text-emerald-600" />
          Saved {lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      );
    }
    if (autoSaveStatus === "error") {
      return (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          Couldn&apos;t autosave
        </span>
      );
    }
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Sticky top action bar — Save Draft + autosave status on the right */}
      <div className="sticky top-0 z-30 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 bg-background/95 backdrop-blur border-b flex items-center justify-end gap-3 flex-wrap">
        {renderAutosavePill()}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSubmitting}
          className="gap-1.5"
        >
          {isSavingDraft ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          Save Draft
        </Button>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* Step Content */}
      <div>
        {currentStep === 0 && (
          <StepBasicInfo data={formData} errors={errors} onChange={onChange} />
        )}
        {currentStep === 1 && (
          <StepFinancials data={formData} errors={errors} onChange={onChange} />
        )}
        {currentStep === 2 && (
          <StepBusinessDetails
            data={formData}
            errors={errors}
            onChange={onChange}
          />
        )}
        {currentStep === 3 && (
          <StepLocation data={formData} errors={errors} onChange={onChange} />
        )}
        {currentStep === 4 && (
          <StepPhotos
            photos={formData.photos}
            onPhotosChange={(next) =>
              setFormData((prev) => ({ ...prev, photos: next }))
            }
          />
        )}
        {currentStep === 5 && <StepReview data={formData} mode={mode} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-2 pt-4 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="gap-2">
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 min-w-[160px]"
            >
              {(() => {
                // If we're editing a draft (the underlying listing has
                // status=DRAFT), this button publishes it, not "saves." If
                // we're editing a live listing, "Save Changes" is right.
                const isPublishing =
                  mode === "create" || formData.status === "DRAFT";
                if (isSubmitting) {
                  return (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {isPublishing ? "Publishing..." : "Saving..."}
                    </>
                  );
                }
                return isPublishing ? "Publish Listing" : "Save Changes";
              })()}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
