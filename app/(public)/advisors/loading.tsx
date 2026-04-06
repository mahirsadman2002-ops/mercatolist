import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading skeleton */}
      <Skeleton className="bg-muted h-8 w-1/4 mb-2" />
      <Skeleton className="bg-muted h-5 w-2/5 mb-8" />

      {/* Filter bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Skeleton className="bg-muted h-10 flex-1" />
        <Skeleton className="bg-muted h-10 w-48" />
        <Skeleton className="bg-muted h-10 w-52" />
        <Skeleton className="bg-muted h-10 w-48" />
      </div>

      {/* Grid of 6 advisor card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="bg-muted h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="bg-muted h-5 w-32" />
                <Skeleton className="bg-muted h-4 w-24" />
                <Skeleton className="bg-muted h-4 w-20" />
              </div>
            </div>
            {/* Badge skeletons */}
            <div className="flex gap-2">
              <Skeleton className="bg-muted h-5 w-16 rounded-full" />
              <Skeleton className="bg-muted h-5 w-20 rounded-full" />
              <Skeleton className="bg-muted h-5 w-14 rounded-full" />
            </div>
            {/* Stats row */}
            <div className="flex gap-4">
              <Skeleton className="bg-muted h-4 w-16" />
              <Skeleton className="bg-muted h-4 w-24" />
            </div>
            {/* Button */}
            <Skeleton className="bg-muted h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
