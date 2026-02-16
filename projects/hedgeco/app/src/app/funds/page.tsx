"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";

// Sample fund data (in real app, this would come from API)
const sampleFunds = [
  {
    id: "1",
    name: "Alpha Equity Partners",
    slug: "alpha-equity-partners",
    type: "HEDGE_FUND",
    strategy: "Long/Short Equity",
    subStrategy: "US Large Cap",
    aum: 850000000,
    ytdReturn: 0.187,
    oneYearReturn: 0.2156,
    sharpeRatio: 1.47,
    inceptionDate: "2018-03-15",
    city: "New York",
    state: "NY",
    country: "US",
    minInvestment: 1000000,
    featured: true,
  },
  {
    id: "2",
    name: "Quantum Alpha Fund",
    slug: "quantum-alpha-fund",
    type: "HEDGE_FUND",
    strategy: "Quantitative",
    subStrategy: "Statistical Arbitrage",
    aum: 2300000000,
    ytdReturn: 0.142,
    oneYearReturn: 0.1823,
    sharpeRatio: 2.12,
    inceptionDate: "2015-09-01",
    city: "San Francisco",
    state: "CA",
    country: "US",
    minInvestment: 5000000,
    featured: true,
  },
  {
    id: "3",
    name: "Crescent Growth Fund III",
    slug: "crescent-growth-fund-iii",
    type: "PRIVATE_EQUITY",
    strategy: "Growth Equity",
    subStrategy: "Technology",
    aum: 750000000,
    ytdReturn: null,
    oneYearReturn: null,
    sharpeRatio: null,
    inceptionDate: "2023-06-01",
    city: "Boston",
    state: "MA",
    country: "US",
    minInvestment: 10000000,
    featured: false,
  },
  {
    id: "4",
    name: "Digital Asset Opportunities",
    slug: "digital-asset-opportunities",
    type: "CRYPTO",
    strategy: "Multi-Strategy",
    subStrategy: "DeFi & Layer 1",
    aum: 180000000,
    ytdReturn: 0.342,
    oneYearReturn: 0.567,
    sharpeRatio: 0.89,
    inceptionDate: "2021-01-15",
    city: "San Francisco",
    state: "CA",
    country: "US",
    minInvestment: 500000,
    featured: false,
  },
  {
    id: "5",
    name: "Horizon Ventures Fund II",
    slug: "horizon-ventures-fund-ii",
    type: "VENTURE_CAPITAL",
    strategy: "Early Stage",
    subStrategy: "AI & Enterprise Software",
    aum: 120000000,
    ytdReturn: null,
    oneYearReturn: null,
    sharpeRatio: null,
    inceptionDate: "2024-03-01",
    city: "Boston",
    state: "MA",
    country: "US",
    minInvestment: 2500000,
    featured: false,
  },
];

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

function formatCurrency(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(0)}M`;
  return `$${amount.toLocaleString()}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
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
  const [showFilters, setShowFilters] = useState(false);

  // Filter funds based on current selections
  const filteredFunds = sampleFunds.filter((fund) => {
    const matchesSearch =
      searchQuery === "" ||
      fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fund.strategy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || fund.type === selectedType;
    const matchesStrategy =
      selectedStrategy === "all" || fund.strategy === selectedStrategy;
    return matchesSearch && matchesType && matchesStrategy;
  });

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
                Browse {sampleFunds.length.toLocaleString()}+ alternative investment funds
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  onClick={() => setShowFilters(!showFilters)}
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
            Showing {filteredFunds.length} fund{filteredFunds.length !== 1 ? "s" : ""}
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

        {/* Fund Cards */}
        <div className="grid gap-4">
          {filteredFunds.map((fund) => (
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
                            <span>{fund.strategy}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {fund.city}, {fund.state}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Since {new Date(fund.inceptionDate).getFullYear()}
                            </span>
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
                            fund.ytdReturn === null
                              ? "text-slate-400"
                              : fund.ytdReturn >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {fund.ytdReturn !== null &&
                            (fund.ytdReturn >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            ))}
                          {formatPercent(fund.ytdReturn)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                          1 Year
                        </div>
                        <div
                          className={`text-lg font-semibold ${
                            fund.oneYearReturn === null
                              ? "text-slate-400"
                              : fund.oneYearReturn >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercent(fund.oneYearReturn)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                          Sharpe
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {fund.sharpeRatio?.toFixed(2) || "N/A"}
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

        {/* Empty State */}
        {filteredFunds.length === 0 && (
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
                }}
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination placeholder */}
        {filteredFunds.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled>
                Previous
              </Button>
              <Button variant="outline" className="bg-blue-50">
                1
              </Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <span className="px-2 text-slate-400">...</span>
              <Button variant="outline">10</Button>
              <Button variant="outline">Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
