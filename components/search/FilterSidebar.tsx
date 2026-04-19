"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CategoryMultiCombobox } from "@/components/ui/category-combobox";
import {
  BOROUGHS,
  NEIGHBORHOODS,
} from "@/lib/constants";

interface FilterSidebarProps {
  onFiltersChange: (filters: Record<string, string>) => void;
  initialFilters?: Record<string, string>;
}

const PRICE_PRESETS = [
  { label: "$0-$100K", min: "0", max: "100000" },
  { label: "$100K-$250K", min: "100000", max: "250000" },
  { label: "$250K-$500K", min: "250000", max: "500000" },
  { label: "$500K-$1M", min: "500000", max: "1000000" },
  { label: "$1M-$2.5M", min: "1000000", max: "2500000" },
  { label: "$2.5M-$5M", min: "2500000", max: "5000000" },
  { label: "$5M+", min: "5000000", max: "" },
];

const REVENUE_PRESETS = [
  { label: "$0-$100K", min: "0", max: "100000" },
  { label: "$100K-$250K", min: "100000", max: "250000" },
  { label: "$250K-$500K", min: "250000", max: "500000" },
  { label: "$500K-$1M", min: "500000", max: "1000000" },
  { label: "$1M-$2.5M", min: "1000000", max: "2500000" },
  { label: "$2.5M-$5M", min: "2500000", max: "5000000" },
  { label: "$5M+", min: "5000000", max: "" },
];

const DAYS_ON_MARKET_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Under 7 days", value: "7" },
  { label: "Under 30 days", value: "30" },
  { label: "Under 90 days", value: "90" },
  { label: "Over 90 days", value: "90+" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Under Contract", value: "UNDER_CONTRACT" },
  { label: "Sold", value: "SOLD" },
];

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function toList(items: string[]): string {
  return items.join(",");
}

export function FilterSidebar({
  onFiltersChange,
  initialFilters = {},
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitFilters = useCallback(
    (updated: Record<string, string>) => {
      // Clean out empty values before emitting
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(updated)) {
        if (v) cleaned[k] = v;
      }
      onFiltersChange(cleaned);
    },
    [onFiltersChange]
  );

  const updateFilter = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (!value) delete next[key];
        emitFilters(next);
        return next;
      });
    },
    [emitFilters]
  );

  const updateFilterDebounced = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (!value) delete next[key];
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => emitFilters(next), 400);
        return next;
      });
    },
    [emitFilters]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggleInList = useCallback(
    (key: string, item: string) => {
      setFilters((prev) => {
        const current = parseList(prev[key]);
        const next = current.includes(item)
          ? current.filter((i) => i !== item)
          : [...current, item];
        const updated = { ...prev, [key]: toList(next) };
        if (!updated[key]) delete updated[key];
        emitFilters(updated);
        return updated;
      });
    },
    [emitFilters]
  );

  const resetAllFilters = useCallback(() => {
    setFilters({});
    setNeighborhoodSearch("");
    onFiltersChange({});
  }, [onFiltersChange]);

  // Derive selected boroughs for neighborhood filtering
  const selectedBoroughs = parseList(filters.borough);
  const selectedCategories = parseList(filters.category);
  const selectedStatuses = parseList(filters.status);

  // Build filtered neighborhoods
  const availableNeighborhoods: { borough: string; neighborhoods: string[] }[] =
    [];
  const boroughKeys =
    selectedBoroughs.length > 0
      ? selectedBoroughs
      : BOROUGHS.map((b) => b.value);

  for (const boroughValue of boroughKeys) {
    const hoods = NEIGHBORHOODS[boroughValue] || [];
    const filtered = neighborhoodSearch
      ? hoods.filter((n) =>
          n.toLowerCase().includes(neighborhoodSearch.toLowerCase())
        )
      : hoods;
    if (filtered.length > 0) {
      const label =
        BOROUGHS.find((b) => b.value === boroughValue)?.label || boroughValue;
      availableNeighborhoods.push({ borough: label, neighborhoods: filtered });
    }
  }

  const selectedNeighborhoods = parseList(filters.neighborhood);

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <aside className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Keyword Search */}
        <div className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={filters.keyword || ""}
              onChange={(e) =>
                updateFilterDebounced("keyword", e.target.value)
              }
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        <Accordion
          type="multiple"
          defaultValue={[
            "category",
            "borough",
            "price",
            "status",
          ]}
          className="w-full"
        >
          {/* Category Filter */}
          <AccordionItem value="category">
            <AccordionTrigger>Category</AccordionTrigger>
            <AccordionContent>
              <CategoryMultiCombobox
                values={selectedCategories}
                onValuesChange={(next) => {
                  setFilters((prev) => {
                    const list = toList(next);
                    const updated = { ...prev };
                    if (list) {
                      updated.category = list;
                    } else {
                      delete (updated as Record<string, string>).category;
                    }
                    emitFilters(updated);
                    return updated;
                  });
                }}
                placeholder="Search categories..."
              />
            </AccordionContent>
          </AccordionItem>

          {/* Borough Filter */}
          <AccordionItem value="borough">
            <AccordionTrigger>Borough</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {BOROUGHS.map((b) => (
                  <div key={b.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`borough-${b.value}`}
                      checked={selectedBoroughs.includes(b.value)}
                      onCheckedChange={() => toggleInList("borough", b.value)}
                    />
                    <Label
                      htmlFor={`borough-${b.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {b.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Neighborhood Filter */}
          <AccordionItem value="neighborhood">
            <AccordionTrigger>Neighborhood</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <Input
                  placeholder="Search neighborhoods..."
                  value={neighborhoodSearch}
                  onChange={(e) => setNeighborhoodSearch(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                  {availableNeighborhoods.map(({ borough, neighborhoods }) => (
                    <div key={borough}>
                      <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {borough}
                      </p>
                      <div className="space-y-1.5">
                        {neighborhoods.map((hood) => (
                          <div
                            key={hood}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`hood-${hood}`}
                              checked={selectedNeighborhoods.includes(hood)}
                              onCheckedChange={() =>
                                toggleInList("neighborhood", hood)
                              }
                            />
                            <Label
                              htmlFor={`hood-${hood}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {hood}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {availableNeighborhoods.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No neighborhoods found.
                    </p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price Range Filter */}
          <AccordionItem value="price">
            <AccordionTrigger>Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ""}
                    onChange={(e) =>
                      updateFilterDebounced("priceMin", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ""}
                    onChange={(e) =>
                      updateFilterDebounced("priceMax", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const isActive =
                      filters.priceMin === preset.min &&
                      (filters.priceMax || "") === preset.max;
                    return (
                      <Button
                        key={preset.label}
                        variant={isActive ? "default" : "outline"}
                        size="xs"
                        onClick={() => {
                          if (isActive) {
                            updateFilter("priceMin", "");
                            updateFilter("priceMax", "");
                          } else {
                            setFilters((prev) => {
                              const next = {
                                ...prev,
                                priceMin: preset.min,
                                priceMax: preset.max,
                              };
                              if (!next.priceMax) (next as Record<string, unknown>).priceMax = undefined;
                              emitFilters(next);
                              return next;
                            });
                          }
                        }}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Revenue Range Filter */}
          <AccordionItem value="revenue">
            <AccordionTrigger>Revenue Range</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.revenueMin || ""}
                    onChange={(e) =>
                      updateFilterDebounced("revenueMin", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.revenueMax || ""}
                    onChange={(e) =>
                      updateFilterDebounced("revenueMax", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {REVENUE_PRESETS.map((preset) => {
                    const isActive =
                      filters.revenueMin === preset.min &&
                      (filters.revenueMax || "") === preset.max;
                    return (
                      <Button
                        key={preset.label}
                        variant={isActive ? "default" : "outline"}
                        size="xs"
                        onClick={() => {
                          if (isActive) {
                            updateFilter("revenueMin", "");
                            updateFilter("revenueMax", "");
                          } else {
                            setFilters((prev) => {
                              const next = {
                                ...prev,
                                revenueMin: preset.min,
                                revenueMax: preset.max,
                              };
                              if (!next.revenueMax) (next as Record<string, unknown>).revenueMax = undefined;
                              emitFilters(next);
                              return next;
                            });
                          }
                        }}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Days on Market Filter */}
          <AccordionItem value="daysOnMarket">
            <AccordionTrigger>Days on Market</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {DAYS_ON_MARKET_OPTIONS.map((opt) => (
                  <div key={opt.label} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`dom-${opt.value}`}
                      name="daysOnMarket"
                      checked={(filters.daysOnMarket || "") === opt.value}
                      onChange={() =>
                        updateFilter("daysOnMarket", opt.value)
                      }
                      className="size-4 accent-primary"
                    />
                    <Label
                      htmlFor={`dom-${opt.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Listing Status Filter */}
          <AccordionItem value="status">
            <AccordionTrigger>Listing Status</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${opt.value}`}
                      checked={selectedStatuses.includes(opt.value)}
                      onCheckedChange={() =>
                        toggleInList("status", opt.value)
                      }
                    />
                    <Label
                      htmlFor={`status-${opt.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Financing Options */}
          <AccordionItem value="financing">
            <AccordionTrigger>Financing</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sbaFinancing"
                    checked={filters.sbaFinancing === "true"}
                    onCheckedChange={(checked) =>
                      updateFilter(
                        "sbaFinancing",
                        checked ? "true" : ""
                      )
                    }
                  />
                  <Label
                    htmlFor="sbaFinancing"
                    className="cursor-pointer text-sm font-normal"
                  >
                    SBA Financing Available
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sellerFinancing"
                    checked={filters.sellerFinancing === "true"}
                    onCheckedChange={(checked) =>
                      updateFilter(
                        "sellerFinancing",
                        checked ? "true" : ""
                      )
                    }
                  />
                  <Label
                    htmlFor="sellerFinancing"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Seller Financing Available
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Reset All Filters */}
      {hasActiveFilters && (
        <div className="border-t pt-4 mt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={resetAllFilters}
          >
            <RotateCcw className="size-4" />
            Reset All Filters
          </Button>
        </div>
      )}
    </aside>
  );
}
