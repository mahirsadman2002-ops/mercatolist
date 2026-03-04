"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BusinessDetailsProps {
  listing: {
    yearEstablished?: number | null;
    numberOfEmployees?: number | null;
    employeesWillingToStay?: boolean | null;
    ownerInvolvement?: string | null;
    ownerHoursPerWeek?: number | null;
    squareFootage?: number | null;
    leaseTerms?: string | null;
    leaseRenewalOption?: boolean | null;
    reasonForSelling?: string | null;
    licensesPermits?: string | null;
    trainingSupport?: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatOwnerInvolvement(value: string): string {
  const map: Record<string, string> = {
    OWNER_OPERATED: "Owner-Operated",
    ABSENTEE: "Absentee",
  };
  return map[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSquareFootage(sqft: number): string {
  return `${sqft.toLocaleString("en-US")} sq ft`;
}

function formatYearsInBusiness(year: number): string {
  const currentYear = new Date().getFullYear();
  const years = currentYear - year;
  if (years <= 0) return `${year} (New)`;
  return `${year} (${years} ${years === 1 ? "year" : "years"} in business)`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NotDisclosed() {
  return (
    <span className="text-muted-foreground/60 font-normal italic">
      Not disclosed
    </span>
  );
}

function BooleanBadge({ value }: { value: boolean }) {
  if (value) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 font-medium">
        Yes
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-muted text-muted-foreground border-border font-medium"
    >
      No
    </Badge>
  );
}

interface RowProps {
  label: string;
  value: React.ReactNode;
  even: boolean;
}

function Row({ label, value, even }: RowProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 px-4 py-3 ${
        even ? "bg-muted/40" : ""
      }`}
    >
      <span className="text-sm font-medium text-foreground/80 whitespace-nowrap shrink-0">
        {label}
      </span>
      <div className="text-sm font-semibold text-foreground text-right">
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BusinessDetails({ listing }: BusinessDetailsProps) {
  const rows: [string, React.ReactNode][] = [
    [
      "Year Established",
      listing.yearEstablished != null ? (
        formatYearsInBusiness(listing.yearEstablished)
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Number of Employees",
      listing.numberOfEmployees != null ? (
        listing.numberOfEmployees.toLocaleString("en-US")
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Employees Willing to Stay",
      listing.employeesWillingToStay != null ? (
        <BooleanBadge value={listing.employeesWillingToStay} />
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Owner Involvement",
      listing.ownerInvolvement ? (
        formatOwnerInvolvement(listing.ownerInvolvement)
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Owner Hours / Week",
      listing.ownerHoursPerWeek != null ? (
        `${listing.ownerHoursPerWeek} hrs/week`
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Square Footage",
      listing.squareFootage != null ? (
        formatSquareFootage(listing.squareFootage)
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Lease Terms",
      listing.leaseTerms ?? <NotDisclosed />,
    ],
    [
      "Lease Renewal Option",
      listing.leaseRenewalOption != null ? (
        <BooleanBadge value={listing.leaseRenewalOption} />
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Reason for Selling",
      listing.reasonForSelling ? (
        <span className="max-w-xs text-right leading-relaxed">
          {listing.reasonForSelling}
        </span>
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Licenses & Permits",
      listing.licensesPermits ? (
        <span className="max-w-xs text-right leading-relaxed">
          {listing.licensesPermits}
        </span>
      ) : (
        <NotDisclosed />
      ),
    ],
    [
      "Training & Support",
      listing.trainingSupport ? (
        <span className="max-w-xs text-right leading-relaxed">
          {listing.trainingSupport}
        </span>
      ) : (
        <NotDisclosed />
      ),
    ],
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Business Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {rows.map(([label, value], index) => (
            <Row
              key={label as string}
              label={label as string}
              value={value}
              even={index % 2 === 0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
