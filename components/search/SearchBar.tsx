"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { BUSINESS_CATEGORIES, BOROUGHS, NEIGHBORHOODS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Suggestion engine ─────────────────────────────────────────────

interface Suggestion {
  label: string;
  type: "category" | "neighborhood" | "borough" | "combined";
  url: string;
}

function generateSuggestions(query: string): Suggestion[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: Suggestion[] = [];

  // Match categories
  for (const cat of BUSINESS_CATEGORIES) {
    if (cat.toLowerCase().includes(q)) {
      // Category alone
      results.push({ label: cat, type: "category", url: `/listings?category=${encodeURIComponent(cat)}` });
      // Category + borough combos
      for (const b of BOROUGHS) {
        results.push({
          label: `${cat} in ${b.label}`,
          type: "combined",
          url: `/listings?category=${encodeURIComponent(cat)}&borough=${b.value}`,
        });
      }
    }
  }

  // Match boroughs
  for (const b of BOROUGHS) {
    if (b.label.toLowerCase().includes(q)) {
      results.push({
        label: `Businesses in ${b.label}`,
        type: "borough",
        url: `/listings?borough=${b.value}`,
      });
    }
  }

  // Match neighborhoods
  for (const [borough, neighborhoods] of Object.entries(NEIGHBORHOODS)) {
    for (const n of neighborhoods) {
      if (n.toLowerCase().includes(q)) {
        const boroughLabel = BOROUGHS.find((b) => b.value === borough)?.label || borough;
        results.push({
          label: `Businesses in ${n}, ${boroughLabel}`,
          type: "neighborhood",
          url: `/listings?neighborhood=${encodeURIComponent(n)}`,
        });
      }
    }
  }

  // Deduplicate and limit
  const seen = new Set<string>();
  const unique: Suggestion[] = [];
  for (const s of results) {
    if (!seen.has(s.label)) {
      seen.add(s.label);
      unique.push(s);
    }
    if (unique.length >= 8) break;
  }

  return unique;
}

// ── Component ─────────────────────────────────────────────────────

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Generate suggestions on keyword change
  useEffect(() => {
    const results = generateSuggestions(keyword);
    setSuggestions(results);
    setSelectedIndex(-1);
    setShowSuggestions(results.length > 0 && keyword.length >= 2);
  }, [keyword]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);

    if (onSearch) {
      onSearch(keyword, category);
      return;
    }

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (category && category !== "all") params.set("category", category);
    const qs = params.toString();
    router.push(`/listings${qs ? `?${qs}` : ""}`);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setShowSuggestions(false);

    if (onSearch) {
      // Extract keyword/category from suggestion URL and use the onSearch callback
      // so the browse page updates in-place instead of navigating
      const url = new URL(suggestion.url, "http://localhost");
      const sugKeyword = url.searchParams.get("keyword") || url.searchParams.get("neighborhood") || "";
      const sugCategory = url.searchParams.get("category") || "";
      setKeyword(sugKeyword);
      setCategory(sugCategory);
      onSearch(sugKeyword, sugCategory);
    } else {
      setKeyword("");
      router.push(suggestion.url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const suggestionIcon = (type: Suggestion["type"]) => {
    if (type === "category") return <Tag className="size-3.5 text-teal-500 shrink-0" />;
    if (type === "borough" || type === "neighborhood") return <MapPin className="size-3.5 text-amber-500 shrink-0" />;
    return <Search className="size-3.5 text-muted-foreground shrink-0" />;
  };

  const suggestionsDropdown = showSuggestions && suggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-white shadow-lg dark:bg-zinc-900 overflow-hidden">
      {suggestions.map((s, i) => (
        <button
          key={s.label}
          type="button"
          onClick={() => handleSuggestionClick(s)}
          className={cn(
            "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-colors",
            i === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
          )}
        >
          {suggestionIcon(s.type)}
          <span className="truncate text-foreground">{s.label}</span>
        </button>
      ))}
    </div>
  );

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1" ref={wrapperRef}>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search businesses..."
            className="h-9 pl-9"
          />
          {suggestionsDropdown}
        </div>
        <div className="w-[200px]">
          <CategoryCombobox
            value={category === "all" ? "" : category}
            onValueChange={(val) => setCategory(val || "all")}
            allowAll
            allLabel="All Categories"
            className="h-9"
          />
        </div>
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
      <div className="relative flex-1" ref={variant === "hero" ? wrapperRef : undefined}>
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by keyword, business name, or neighborhood..."
          className="h-12 border-0 pl-10 text-base shadow-none focus-visible:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        {suggestionsDropdown}
      </div>
      <div className="sm:w-[220px]">
        <CategoryCombobox
          value={category === "all" ? "" : category}
          onValueChange={(val) => setCategory(val || "all")}
          allowAll
          allLabel="All Categories"
          className="h-12 border-0 shadow-none focus-visible:ring-0 sm:border-l sm:rounded-l-none sm:border-input"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 px-8 text-base">
        <Search className="size-5" />
        Search
      </Button>
    </form>
  );
}
