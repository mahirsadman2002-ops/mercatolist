import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Heading skeleton */}
      <Skeleton className="bg-muted h-8 w-1/4" />

      {/* Grid of 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-3">
            <Skeleton className="bg-muted h-4 w-1/2" />
            <Skeleton className="bg-muted h-8 w-2/3" />
            <Skeleton className="bg-muted h-3 w-3/4" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="flex gap-4">
            <Skeleton className="bg-muted h-4 w-1/4" />
            <Skeleton className="bg-muted h-4 w-1/6" />
            <Skeleton className="bg-muted h-4 w-1/6" />
            <Skeleton className="bg-muted h-4 w-1/6" />
            <Skeleton className="bg-muted h-4 w-1/8" />
          </div>
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b last:border-b-0 p-4">
            <div className="flex gap-4">
              <Skeleton className="bg-muted h-4 w-1/4" />
              <Skeleton className="bg-muted h-4 w-1/6" />
              <Skeleton className="bg-muted h-4 w-1/6" />
              <Skeleton className="bg-muted h-4 w-1/6" />
              <Skeleton className="bg-muted h-4 w-1/8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
