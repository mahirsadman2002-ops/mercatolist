"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  ImagePlus,
  Loader2,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: any;
  listingId?: string;
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
    category: data.category,
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
    neighborhood: data.neighborhood,
    borough: data.borough,
    city: data.city.trim(),
    state: data.state.trim(),
    zipCode: data.zipCode.trim(),
    hideAddress: data.hideAddress,
    latitude: toNumber(data.latitude),
    longitude: toNumber(data.longitude),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

type ValidationErrors = Record<string, string>;

function validateStep(step: number, data: FormData): ValidationErrors {
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
      if (!data.address.trim()) errors.address = "Address is required";
      if (!data.borough) errors.borough = "Borough is required";
      if (!data.neighborhood) errors.neighborhood = "Neighborhood is required";
      if (!data.zipCode.trim()) errors.zipCode = "Zip code is required";
      else if (!/^\d{5}(-\d{4})?$/.test(data.zipCode.trim()))
        errors.zipCode = "Enter a valid zip code";
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
              <Input
                id="address"
                placeholder="e.g. 123 Main Street"
                value={data.address}
                onChange={(e) => onChange("address", e.target.value)}
                aria-invalid={!!errors.address}
              />
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

            <div className="flex items-center gap-3">
              <Checkbox
                id="hideAddress"
                checked={data.hideAddress}
                onCheckedChange={(checked) =>
                  onChange("hideAddress", checked === true)
                }
              />
              <Label htmlFor="hideAddress" className="cursor-pointer">
                Hide exact address on public listing (show approximate location only)
              </Label>
            </div>
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

function StepPhotos() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload high-quality photos of the business. Listings with photos receive significantly more inquiries.
        </p>

        {/* Drop zone */}
        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ImagePlus className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">
                Drag and drop photos here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse from your computer
              </p>
            </div>
            <Button type="button" variant="outline" size="sm">
              <Upload className="size-4" />
              Choose Files
            </Button>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WEBP. Max 10MB per file. Up to 20 photos.
            </p>
          </div>
        </div>

        {/* Placeholder thumbnails area */}
        <div className="bg-muted/40 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Photo upload functionality will be available once cloud storage is connected. Uploaded photos will appear here with drag-to-reorder support.
          </p>
        </div>
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

export function ListingForm({ mode, initialData, listingId }: ListingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(() =>
    mergeInitialData(initialData)
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const stepErrors = validateStep(i, formData);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          setCurrentStep(i);
          toast.error("Please fix the errors before proceeding.");
          return;
        }
      }
      setCurrentStep(step);
    },
    [currentStep, formData]
  );

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(currentStep, formData);
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

  const handleSubmit = useCallback(async () => {
    // Re-validate all steps before submitting
    for (let i = 0; i < STEPS.length - 1; i++) {
      const stepErrors = validateStep(i, formData);
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
      const payload = preparePayload(formData);
      const url =
        mode === "create"
          ? "/api/listings"
          : `/api/listings/${listingId}`;
      const method = mode === "create" ? "POST" : "PUT";

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
        mode === "create"
          ? "Listing created successfully!"
          : "Listing updated successfully!"
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
  }, [formData, mode, listingId, router]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
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
        {currentStep === 4 && <StepPhotos />}
        {currentStep === 5 && <StepReview data={formData} mode={mode} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
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

        <div className="flex items-center gap-3">
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
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Listing"
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
