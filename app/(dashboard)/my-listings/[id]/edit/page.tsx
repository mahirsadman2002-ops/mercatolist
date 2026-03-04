import type { Metadata } from "next";
import { ListingForm } from "@/components/forms/ListingForm";
import { notFound } from "next/navigation";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Listing | MercatoList",
  description: "Edit your business listing on MercatoList.",
};

// Mock data for development
const MOCK_LISTING = {
  title: "Joe's Pizza -- Established Neighborhood Pizzeria",
  category: "Restaurants",
  description: "Well-established neighborhood pizzeria...",
  askingPrice: 450000,
  annualRevenue: 850000,
  cashFlowSDE: 180000,
  netIncome: 145000,
  monthlyRent: 8500,
  rentEscalation: "3% annually",
  annualPayroll: 220000,
  totalExpenses: 705000,
  inventoryValue: 15000,
  inventoryIncluded: true,
  ffeValue: 120000,
  ffeIncluded: true,
  sellerFinancing: true,
  sbaFinancingAvailable: true,
  yearEstablished: 2010,
  numberOfEmployees: 12,
  employeesWillingToStay: true,
  ownerInvolvement: "OWNER_OPERATED",
  ownerHoursPerWeek: 45,
  squareFootage: 2200,
  leaseTerms: "7 years remaining",
  leaseRenewalOption: true,
  reasonForSelling: "Owner relocating out of state",
  licensesPermits: "NYC Food Service License, Health Department Certificate",
  trainingSupport: "4 weeks of hands-on training included",
  address: "30-12 Steinway Street",
  neighborhood: "Astoria",
  borough: "QUEENS",
  city: "New York",
  state: "NY",
  zipCode: "11103",
  hideAddress: false,
  latitude: 40.7592,
  longitude: -73.9196,
  status: "ACTIVE",
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;

  // In production, fetch from API. For now, use mock data.
  const listing = MOCK_LISTING;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Edit Listing</h1>
        <p className="mt-2 text-muted-foreground">
          Update your business listing details below.
        </p>
      </div>
      <ListingForm mode="edit" initialData={listing} listingId={id} />
    </div>
  );
}
