import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading skeleton */}
      <Skeleton className="bg-muted h-8 w-1/4 mb-8" />

      {/* Grid of 8 broker card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            {/* Avatar circle */}
            <div className="flex justify-center">
              <Skeleton className="bg-muted h-16 w-16 rounded-full" />
            </div>
            {/* Name line */}
            <Skeleton className="bg-muted h-5 w-2/3 mx-auto" />
            {/* Brokerage line */}
            <Skeleton className="bg-muted h-4 w-1/2 mx-auto" />
            {/* Stats row */}
            <div className="flex justify-center gap-4">
              <Skeleton className="bg-muted h-4 w-12" />
              <Skeleton className="bg-muted h-4 w-12" />
              <Skeleton className="bg-muted h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
