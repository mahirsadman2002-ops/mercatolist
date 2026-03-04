import type { Metadata } from "next";

// Components needed: SearchBar, FilterSidebar, ListingGrid, MapView, ViewToggle, SaveSearchPrompt
// import { SearchBar } from "@/components/search/SearchBar";
// import { FilterSidebar } from "@/components/search/FilterSidebar";
// import { ListingGrid } from "@/components/listings/ListingGrid";
// import { MapView } from "@/components/search/MapView";
// import { ViewToggle } from "@/components/search/ViewToggle";

export const metadata: Metadata = {
  title: "Browse Businesses for Sale in NYC | MercatoList",
  description:
    "Search and browse businesses for sale across all five NYC boroughs. Filter by category, price, location, and more.",
  openGraph: {
    title: "Browse Businesses for Sale in NYC | MercatoList",
    description:
      "Search and browse businesses for sale across all five NYC boroughs. Filter by category, price, location, and more.",
  },
};

export default function ListingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Businesses for Sale in NYC</h1>
      <p className="text-muted-foreground">Browse listings page — coming soon</p>
    </div>
  );
}
