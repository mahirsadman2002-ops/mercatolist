import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured post skeleton */}
      <div className="mb-10 border rounded-lg overflow-hidden">
        <Skeleton className="bg-muted aspect-video w-full rounded-none" />
        <div className="p-6 space-y-3">
          <Skeleton className="bg-muted h-4 w-24" />
          <Skeleton className="bg-muted h-7 w-2/3" />
          <Skeleton className="bg-muted h-4 w-full" />
          <Skeleton className="bg-muted h-4 w-3/4" />
        </div>
      </div>

      {/* Grid of 4 post card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <Skeleton className="bg-muted aspect-video w-full rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="bg-muted h-4 w-20" />
              <Skeleton className="bg-muted h-5 w-3/4" />
              <Skeleton className="bg-muted h-4 w-full" />
              <Skeleton className="bg-muted h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
