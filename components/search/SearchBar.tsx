"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialKeyword?: string;
  initialCategory?: string;
  onSearch?: (keyword: string, category: string) => void;
  variant?: "hero" | "compact";
}

export function SearchBar({
  initialKeyword = "",
  initialCategory = "",
  onSearch,
  variant = "hero",
}: SearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState(initialCategory);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (onSearch) {
      onSearch(keyword, category);
      return;
    }

    // Build query params and navigate to /listings
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(`/listings${qs ? `?${qs}` : ""}`);
  };

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search businesses..."
            className="h-9 pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {BUSINESS_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="default" className="h-9">
          <Search className="size-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Search</span>
        </Button>
      </form>
    );
  }

  // Hero variant (homepage)
  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "mx-auto w-full max-w-3xl",
        "rounded-xl bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:bg-zinc-900/95",
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2"
      )}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by keyword, business name, or neighborhood..."
          className="h-12 border-0 pl-10 text-base shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="sm:w-[220px]">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-12 w-full border-0 shadow-none focus-visible:ring-0 sm:border-l sm:rounded-l-none sm:border-input">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {BUSINESS_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="lg" className="h-12 px-8 text-base">
        <Search className="size-5" />
        Search
      </Button>
    </form>
  );
}
