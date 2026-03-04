import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ListingStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "For Sale",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  UNDER_CONTRACT: {
    label: "Under Contract",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  SOLD: {
    label: "Sold",
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  OFF_MARKET: {
    label: "Off Market",
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
  },
};

export function ListingStatusBadge({ status }: ListingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
  };

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-semibold", config.className)}
    >
      {config.label}
    </Badge>
  );
}
