import type { Metadata } from "next";
import Link from "next/link";
import { Star, LayoutList, Phone, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BOROUGHS } from "@/lib/constants";

interface CompanyAdvisorsPageProps {
  params: Promise<{ companyName: string }>;
}

interface AdvisorData {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  brokerageName: string | null;
  brokeragePhone: string | null;
  activeListings: number;
  reviewCount: number;
  avgRating: number;
  boroughsServed: string[];
  specialties: string[];
}

export async function generateMetadata({
  params,
}: CompanyAdvisorsPageProps): Promise<Metadata> {
  const { companyName } = await params;
  const decoded = decodeURIComponent(companyName);

  return {
    title: `${decoded} — Business Advisors | MercatoList`,
    description: `View business advisors from ${decoded} on MercatoList. Find experienced NYC business advisors to help you buy or sell a business.`,
    openGraph: {
      title: `${decoded} — Business Advisors | MercatoList`,
      description: `View business advisors from ${decoded} on MercatoList.`,
    },
  };
}

async function getCompanyAdvisors(companyName: string): Promise<AdvisorData[]> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/advisors/company/${encodeURIComponent(companyName)}`,
    { cache: "no-store" }
  );
  const json = await res.json();
  return json.success ? json.data : [];
}

export default async function CompanyAdvisorsPage({
  params,
}: CompanyAdvisorsPageProps) {
  const { companyName } = await params;
  const decoded = decodeURIComponent(companyName);
  const advisors = await getCompanyAdvisors(decoded);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{decoded}</h1>
        <p className="text-muted-foreground">
          {advisors.length} business advisor{advisors.length !== 1 ? "s" : ""}{" "}
          at {decoded}
        </p>
      </div>

      {advisors.length === 0 ? (
        <div className="text-center py-16">
          <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No advisors found for this company
          </h3>
          <p className="text-muted-foreground">
            The company name may have changed or advisors may have moved.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/advisors">Browse All Advisors</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advisors.map((advisor) => {
            const initials = advisor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card
                key={advisor.id}
                className="overflow-hidden transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={advisor.avatarUrl || undefined}
                        alt={advisor.name}
                      />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/advisors/${advisor.id}`}
                        className="font-semibold truncate block hover:underline text-teal-600 dark:text-teal-400"
                      >
                        {advisor.name}
                      </Link>
                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1">
                        {advisor.reviewCount > 0 ? (
                          <>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <= Math.round(advisor.avgRating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium">
                              {advisor.avgRating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({advisor.reviewCount})
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No reviews yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Specialties badges */}
                  {advisor.specialties && advisor.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {advisor.specialties.slice(0, 3).map((spec) => (
                        <Badge
                          key={spec}
                          variant="secondary"
                          className="text-xs"
                        >
                          {spec}
                        </Badge>
                      ))}
                      {advisor.specialties.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{advisor.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Boroughs served badges */}
                  {advisor.boroughsServed &&
                    advisor.boroughsServed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {advisor.boroughsServed.map((b) => {
                          const label =
                            BOROUGHS.find((br) => br.value === b)?.label || b;
                          return (
                            <Badge
                              key={b}
                              variant="outline"
                              className="text-xs"
                            >
                              {label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <LayoutList className="h-3.5 w-3.5" />
                      {advisor.activeListings} active
                    </div>
                    {(advisor.brokeragePhone || advisor.phone) && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {advisor.brokeragePhone || advisor.phone}
                      </div>
                    )}
                  </div>

                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/advisors/${advisor.id}`}>View Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
