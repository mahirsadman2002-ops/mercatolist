// Status badge (Active, Under Contract, Sold, Off Market)
export function ListingStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted">
      {status}
    </span>
  );
}
