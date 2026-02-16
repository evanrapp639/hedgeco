"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";

const fundTypes = [
  { value: "all", label: "All Types" },
  { value: "HEDGE_FUND", label: "Hedge Fund" },
  { value: "PRIVATE_EQUITY", label: "Private Equity" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "SPV", label: "SPV" },
];

const strategies = [
  { value: "all", label: "All Strategies" },
  { value: "Long/Short Equity", label: "Long/Short Equity" },
  { value: "Quantitative", label: "Quantitative" },
  { value: "Global Macro", label: "Global Macro" },
  { value: "Event Driven", label: "Event Driven" },
  { value: "Growth Equity", label: "Growth Equity" },
  { value: "Buyout", label: "Buyout" },
  { value: "Early Stage", label: "Early Stage" },
  { value: "Multi-Strategy", label: "Multi-Strategy" },
];

function formatCurrency(amount: unknown): string {
  if (amount === null || amount === undefined) return "N/A";
  const num = Number(amount);
  if (isNaN(num)) return "N/A";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  return `$${num.toLocaleString()}`;
}

function formatPercent(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  if (isNaN(num)) return "N/A";
  return `${num >= 0 ? "+" : ""}${(num * 100).toFixed(1)}%`;
}

function getFundTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HEDGE_FUND: "Hedge Fund",
    PRIVATE_EQUITY: "Private Equity",
    VENTURE_CAPITAL: "Venture Capital",
    REAL_ESTATE: "Real Estate",
    CRYPTO: "Crypto",
    SPV: "SPV",
    FUND_OF_FUNDS: "Fund of Funds",
    CREDIT: "Credit",
    INFRASTRUCTURE: "Infrastructure",
  };
  return labels[type] || type;
}

export default function FundsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStrategy, setSelectedStrategy] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  // Fetch funds using tRPC
  const { data, isLoading, error } = trpc.fund.list.useQuery({
    type: selectedType !== "all" ? (selectedType as "HEDGE_FUND" | "PRIVATE_EQUITY" | "VENTURE_CAPITAL" | "REAL_ESTATE" | "CRYPTO" | "SPV") : undefined,
    strategy: selectedStrategy !== "all" ? selectedStrategy : undefined,
    search: debouncedSearch || undefined,
    limit: 20,
  });

  const funds = data?.funds || [];

  const activeFilters =
    (selectedType !== "all" ? 1 : 0) + (selectedStrategy !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Fund Database</h1>
              <p className="text-slate-600 mt-1">
                Browse alternative investment funds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Search
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search funds by name, strategy, or manager..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Fund Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  More Filters
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Active filters:</span>
                {selectedType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {getFundTypeLabel(selectedType)}
                    <button onClick={() => setSelectedType("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedStrategy !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedStrategy}
                    <button onClick={() => setSelectedStrategy("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => {
                    setSelectedType("all");
                    setSelectedStrategy("all");
                    setSearchQuery("");
                    setDebouncedSearch("");
                  }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600">
            {isLoading ? "Loading..." : `Showing ${funds.length} fund${funds.length !== 1 ? "s" : ""}`}
          </p>
          <Select defaultValue="relevance">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="aum-desc">AUM (High to Low)</SelectItem>
              <SelectItem value="aum-asc">AUM (Low to High)</SelectItem>
              <SelectItem value="return-desc">YTD Return (High to Low)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-red-600">Error loading funds: {error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Fund Cards */}
        {!isLoading && !error && (
          <div className="grid gap-4">
            {funds.map((fund) => (
              <Link key={fund.id} href={`/funds/${fund.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Fund Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {fund.name}
                              </h3>
                              {fund.featured && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {getFundTypeLabel(fund.type)}
                              </span>
                              {fund.strategy && <span>{fund.strategy}</span>}
                              {fund.city && fund.state && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {fund.city}, {fund.state}
                                </span>
                              )}
                              {fund.inceptionDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Since {new Date(fund.inceptionDate).getFullYear()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stats */}
                      <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-8">
                        <div className="text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                            AUM
                          </div>
                          <div className="text-lg font-semibold text-slate-900">
                            {formatCurrency(fund.aum)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                            YTD
                          </div>
                          <div
                            className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                              !fund.statistics?.ytdReturn
                                ? "text-slate-400"
                                : Number(fund.statistics.ytdReturn) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {fund.statistics?.ytdReturn !== null && fund.statistics?.ytdReturn !== undefined &&
                              (Number(fund.statistics.ytdReturn) >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              ))}
                            {formatPercent(fund.statistics?.ytdReturn)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                            1 Year
                          </div>
                          <div
                            className={`text-lg font-semibold ${
                              !fund.statistics?.oneYearReturn
                                ? "text-slate-400"
                                : Number(fund.statistics.oneYearReturn) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatPercent(fund.statistics?.oneYearReturn)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                            Sharpe
                          </div>
                          <div className="text-lg font-semibold text-slate-900">
                            {fund.statistics?.sharpeRatio 
                              ? Number(fund.statistics.sharpeRatio).toFixed(2) 
                              : "N/A"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                            Min Invest
                          </div>
                          <div className="text-lg font-semibold text-slate-900">
                            {formatCurrency(fund.minInvestment)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && funds.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No funds found</h3>
              <p className="text-slate-600 mb-4">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedType("all");
                  setSelectedStrategy("all");
                  setSearchQuery("");
                  setDebouncedSearch("");
                }}
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More */}
        {!isLoading && data?.nextCursor && (
          <div className="flex justify-center mt-8">
            <Button variant="outline">
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
