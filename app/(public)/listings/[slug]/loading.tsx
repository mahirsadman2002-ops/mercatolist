import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Photo gallery skeleton */}
      <Skeleton className="bg-muted aspect-video w-full rounded-lg mb-8" />

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Skeleton className="bg-muted h-8 w-2/3" />

          {/* Badge row */}
          <div className="flex gap-2">
            <Skeleton className="bg-muted h-6 w-20 rounded-full" />
            <Skeleton className="bg-muted h-6 w-24 rounded-full" />
            <Skeleton className="bg-muted h-6 w-16 rounded-full" />
          </div>

          {/* Financial grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <Skeleton className="bg-muted h-4 w-1/2" />
                <Skeleton className="bg-muted h-6 w-3/4" />
              </div>
            ))}
          </div>

          {/* Description lines */}
          <div className="space-y-3">
            <Skeleton className="bg-muted h-4 w-full" />
            <Skeleton className="bg-muted h-4 w-full" />
            <Skeleton className="bg-muted h-4 w-5/6" />
            <Skeleton className="bg-muted h-4 w-4/6" />
            <Skeleton className="bg-muted h-4 w-3/4" />
          </div>
        </div>

        {/* Right sidebar - contact card */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 space-y-4">
            {/* Avatar and name */}
            <div className="flex items-center gap-3">
              <Skeleton className="bg-muted h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="bg-muted h-5 w-2/3" />
                <Skeleton className="bg-muted h-4 w-1/2" />
              </div>
            </div>
            {/* Contact button */}
            <Skeleton className="bg-muted h-10 w-full rounded-md" />
            {/* Phone */}
            <Skeleton className="bg-muted h-10 w-full rounded-md" />
            {/* Additional info */}
            <Skeleton className="bg-muted h-4 w-3/4" />
            <Skeleton className="bg-muted h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}
