import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar skeleton */}
      <div className="mb-8">
        <Skeleton className="bg-muted h-12 w-full max-w-2xl rounded-lg" />
      </div>

      {/* Grid of 6 listing card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            {/* Image placeholder */}
            <Skeleton className="bg-muted h-48 w-full rounded-none" />
            <div className="p-4 space-y-3">
              {/* Title line */}
              <Skeleton className="bg-muted h-5 w-3/4" />
              {/* Price line */}
              <Skeleton className="bg-muted h-5 w-1/3" />
              {/* Location line */}
              <Skeleton className="bg-muted h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
