"use client";

import { LayoutGrid, Map, Columns2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  activeView: "grid" | "map" | "split";
  onViewChange: (view: "grid" | "map" | "split") => void;
}

const views = [
  { value: "grid" as const, icon: LayoutGrid, label: "Grid view" },
  { value: "map" as const, icon: Map, label: "Map view" },
  { value: "split" as const, icon: Columns2, label: "Split view" },
];

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-background p-0.5">
      {views.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={activeView === value ? "default" : "ghost"}
          size="icon-sm"
          onClick={() => onViewChange(value)}
          aria-label={label}
          className={cn(
            "rounded-md",
            activeView !== value && "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </div>
  );
}
