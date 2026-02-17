"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Search,
  TrendingUp,
  Building2,
  Calendar,
  MessageSquare,
  Star,
  Clock,
  Settings,
  Sparkles,
  ArrowRight,
  BarChart3,
} from "lucide-react";

// Mock data for quick results
const recentSearches = [
  "Long/short equity funds",
  "Tech-focused hedge funds", 
  "Low volatility strategies",
];

const popularFunds = [
  { id: "1", name: "Citadel Wellington Fund", type: "Hedge Fund", returns: "+15.8%" },
  { id: "2", name: "Renaissance Medallion", type: "Quant", returns: "+22.1%" },
  { id: "3", name: "Bridgewater Pure Alpha", type: "Macro", returns: "+8.9%" },
];

const quickActions = [
  { label: "Browse All Funds", href: "/funds", icon: TrendingUp },
  { label: "Service Providers", href: "/providers", icon: Building2 },
  { label: "Conferences", href: "/conferences", icon: Calendar },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Saved Funds", href: "/watchlist", icon: Star },
  { label: "Settings", href: "/settings", icon: Settings },
];

const searchFilters = [
  { label: "Hedge Funds", query: "type:hedge" },
  { label: "Private Equity", query: "type:pe" },
  { label: "15%+ Returns", query: "returns:>15" },
  { label: "AUM > $1B", query: "aum:>1b" },
];

interface SearchCommandProps {
  trigger?: React.ReactNode;
}

export function SearchCommand({ trigger }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  // Global keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (value: string) => {
    setOpen(false);
    
    // Handle different action types
    if (value.startsWith("search:")) {
      const searchQuery = value.replace("search:", "");
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else if (value.startsWith("fund:")) {
      const fundId = value.replace("fund:", "");
      router.push(`/funds/${fundId}`);
    } else if (value.startsWith("action:")) {
      const href = value.replace("action:", "");
      router.push(href);
    } else if (value.startsWith("filter:")) {
      const filterQuery = value.replace("filter:", "");
      router.push(`/search?q=${encodeURIComponent(filterQuery)}`);
    }
    
    setQuery("");
  };

  const handleAISearch = () => {
    if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Search funds...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search funds, providers, or type a question..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No results found. Try an AI-powered search?
              </p>
              <Button onClick={handleAISearch} disabled={!query.trim()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Search with AI
              </Button>
            </div>
          </CommandEmpty>

          {/* AI Search Prompt - when there's a query */}
          {query && (
            <CommandGroup heading="AI Search">
              <CommandItem
                value={`search:${query}`}
                onSelect={() => handleAISearch()}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Search: &quot;{query}&quot;</div>
                  <div className="text-xs text-muted-foreground">
                    Use AI to find matching funds
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            </CommandGroup>
          )}

          {/* Quick Filters */}
          {!query && (
            <CommandGroup heading="Quick Filters">
              {searchFilters.map((filter) => (
                <CommandItem
                  key={filter.label}
                  value={`filter:${filter.query}`}
                  onSelect={handleSelect}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {filter.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search) => (
                <CommandItem
                  key={search}
                  value={`search:${search}`}
                  onSelect={handleSelect}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Popular Funds */}
          {!query && (
            <CommandGroup heading="Popular Funds">
              {popularFunds.map((fund) => (
                <CommandItem
                  key={fund.id}
                  value={`fund:${fund.id}`}
                  onSelect={handleSelect}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>{fund.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {fund.type}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-green-600">
                    {fund.returns}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.href}
                  value={`action:${action.href}`}
                  onSelect={handleSelect}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            <span>Navigate</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            <span>Select</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
            <span>Close</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>AI-powered</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

// Also export a hook for programmatic control
export function useSearchCommand() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
