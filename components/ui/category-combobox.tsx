"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const CATEGORIES: readonly string[] = BUSINESS_CATEGORIES;

interface CategoryComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function CategoryCombobox({
  value,
  onValueChange,
  placeholder = "Select a category",
  allowAll = false,
  allLabel = "All Categories",
  className,
  disabled,
  id,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const displayLabel = value ? value : allowAll ? allLabel : placeholder;
  const hasValue = Boolean(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !hasValue && !allowAll && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem
                  value={allLabel}
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {allLabel}
                </CommandItem>
              )}
              {CATEGORIES.map((cat) => (
                <CommandItem
                  key={cat}
                  value={cat}
                  onSelect={(picked) => {
                    onValueChange(picked === value ? "" : picked);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === cat ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {cat}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface CategoryMultiComboboxProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  max?: number;
}

export function CategoryMultiCombobox({
  values,
  onValuesChange,
  placeholder = "Select categories",
  className,
  disabled,
  id,
  max,
}: CategoryMultiComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (cat: string) => {
    if (values.includes(cat)) {
      onValuesChange(values.filter((c) => c !== cat));
    } else {
      if (max && values.length >= max) return;
      onValuesChange([...values, cat]);
    }
  };

  const remove = (cat: string) => {
    onValuesChange(values.filter((c) => c !== cat));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span
              className={cn(
                "truncate text-left",
                values.length === 0 && "text-muted-foreground",
              )}
            >
              {values.length === 0
                ? placeholder
                : `${values.length} selected`}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                {CATEGORIES.map((cat) => {
                  const selected = values.includes(cat);
                  return (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={() => toggle(cat)}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {cat}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="gap-1 pr-1 font-normal"
            >
              {cat}
              <button
                type="button"
                onClick={() => remove(cat)}
                className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                aria-label={`Remove ${cat}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
