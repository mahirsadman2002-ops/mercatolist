import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ListingForm } from "@/components/forms/ListingForm";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Listing",
  description: "Edit your business listing on MercatoList.",
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/my-listings/${id}/edit`);
  }

  const listing = await prisma.businessListing.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!listing) notFound();

  // Owner or admin only
  if (
    listing.listedById !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    notFound();
  }

  // Serialize Decimals + Dates into the plain shape the form expects.
  const initialData = {
    title: listing.title,
    category: listing.category,
    description: listing.description,
    askingPrice: listing.askingPrice ? Number(listing.askingPrice) : null,
    annualRevenue: listing.annualRevenue ? Number(listing.annualRevenue) : null,
    cashFlowSDE: listing.cashFlowSDE ? Number(listing.cashFlowSDE) : null,
    netIncome: listing.netIncome ? Number(listing.netIncome) : null,
    monthlyRent: listing.monthlyRent ? Number(listing.monthlyRent) : null,
    rentEscalation: listing.rentEscalation,
    annualPayroll: listing.annualPayroll ? Number(listing.annualPayroll) : null,
    totalExpenses: listing.totalExpenses ? Number(listing.totalExpenses) : null,
    inventoryValue: listing.inventoryValue
      ? Number(listing.inventoryValue)
      : null,
    inventoryIncluded: listing.inventoryIncluded,
    ffeValue: listing.ffeValue ? Number(listing.ffeValue) : null,
    ffeIncluded: listing.ffeIncluded,
    sellerFinancing: listing.sellerFinancing,
    sbaFinancingAvailable: listing.sbaFinancingAvailable,
    yearEstablished: listing.yearEstablished,
    numberOfEmployees: listing.numberOfEmployees,
    employeesWillingToStay: listing.employeesWillingToStay,
    ownerInvolvement: listing.ownerInvolvement,
    ownerHoursPerWeek: listing.ownerHoursPerWeek,
    squareFootage: listing.squareFootage,
    leaseTerms: listing.leaseTerms,
    leaseRenewalOption: listing.leaseRenewalOption,
    reasonForSelling: listing.reasonForSelling,
    licensesPermits: listing.licensesPermits,
    trainingSupport: listing.trainingSupport,
    address: listing.address,
    neighborhood: listing.neighborhood,
    borough: listing.borough,
    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
    hideAddress: listing.hideAddress,
    latitude: listing.latitude ? Number(listing.latitude) : null,
    longitude: listing.longitude ? Number(listing.longitude) : null,
    status: listing.status,
    photos: listing.photos.map((p) => ({
      url: p.url,
      order: p.order,
    })),
  };

  const isDraft = listing.status === "DRAFT";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">
          {isDraft ? "Continue Draft" : "Edit Listing"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isDraft
            ? "Pick up where you left off. Save changes anytime or publish when ready."
            : "Update your business listing details below."}
        </p>
      </div>
      <ListingForm
        mode="edit"
        initialData={initialData}
        listingId={id}
        isAdmin={session?.user?.role === "ADMIN"}
        isOwner={listing.listedById === session.user.id}
      />
    </div>
  );
}
