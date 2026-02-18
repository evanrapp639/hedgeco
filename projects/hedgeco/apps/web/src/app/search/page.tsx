"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
// ScrollArea removed - not used
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Sparkles,
  TrendingUp,
  Building2,
  MapPin,
  Star,
  Filter,
  X,
  Lightbulb,
  Clock,
  ArrowUpRight,
  BarChart3,
  Percent,
  DollarSign,
  Wand2,
} from "lucide-react";

// Mock search results
const mockResults = [
  {
    id: "1",
    type: "fund",
    name: "Citadel Wellington Fund",
    category: "Hedge Fund",
    strategy: "Long/Short Equity",
    location: "New York, USA",
    aum: 1200000000,
    returns: { ytd: 15.8, oneYear: 23.1, threeYear: 18.4 },
    sharpeRatio: 1.84,
    relevanceScore: 98,
    matchReason: "High YTD returns • Long/Short Equity strategy",
  },
  {
    id: "2",
    type: "fund",
    name: "Renaissance Medallion Fund",
    category: "Hedge Fund",
    strategy: "Quantitative",
    location: "East Setauket, NY, USA",
    aum: 2100000000,
    returns: { ytd: 22.1, oneYear: 31.2, threeYear: 28.7 },
    sharpeRatio: 2.12,
    relevanceScore: 95,
    matchReason: "Exceptional returns • Quantitative approach",
  },
  {
    id: "3",
    type: "fund",
    name: "Tiger Global Management",
    category: "Hedge Fund",
    strategy: "Long/Short Equity",
    location: "New York, USA",
    aum: 890000000,
    returns: { ytd: 12.4, oneYear: 19.2, threeYear: 16.1 },
    sharpeRatio: 1.56,
    relevanceScore: 91,
    matchReason: "Strong track record • Tech-focused",
  },
  {
    id: "4",
    type: "fund",
    name: "Bridgewater Pure Alpha",
    category: "Hedge Fund",
    strategy: "Global Macro",
    location: "Westport, CT, USA",
    aum: 3500000000,
    returns: { ytd: 8.9, oneYear: 14.3, threeYear: 12.8 },
    sharpeRatio: 1.42,
    relevanceScore: 87,
    matchReason: "Global diversification • Risk parity focus",
  },
  {
    id: "5",
    type: "fund",
    name: "Point72 Asset Management",
    category: "Hedge Fund",
    strategy: "Multi-Strategy",
    location: "Stamford, CT, USA",
    aum: 1800000000,
    returns: { ytd: 11.2, oneYear: 17.8, threeYear: 15.3 },
    sharpeRatio: 1.68,
    relevanceScore: 84,
    matchReason: "Multi-strategy approach • Consistent performance",
  },
];

const similarFunds = [
  { id: "s1", name: "Millennium Management", strategy: "Multi-Strategy", returns: 14.2 },
  { id: "s2", name: "DE Shaw Composite", strategy: "Quantitative", returns: 18.7 },
  { id: "s3", name: "Baupost Group", strategy: "Value", returns: 11.4 },
];

const suggestedQueries = [
  "Long/short equity funds with 15%+ annual returns",
  "Quantitative hedge funds with Sharpe > 1.5",
  "Global macro funds with AUM over $1B",
  "ESG-focused hedge funds",
  "Emerging market specialists",
];

const recentSearches = [
  "Long/short equity funds",
  "Tech-focused hedge funds",
  "Low volatility strategies",
];

function formatAUM(aum: number): string {
  if (aum >= 1e9) return `$${(aum / 1e9).toFixed(1)}B`;
  if (aum >= 1e6) return `$${(aum / 1e6).toFixed(0)}M`;
  return `$${aum.toLocaleString()}`;
}

function ReturnBadge({ value }: { value: number }) {
  return (
    <span className={`font-mono text-sm font-medium ${
      value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-slate-600"
    }`}>
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function SearchResultCard({ result }: { result: typeof mockResults[0] }) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{result.category}</Badge>
              <Badge variant="outline">{result.strategy}</Badge>
            </div>
            <Link href={`/funds/${result.id}`}>
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {result.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {result.location}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-slate-500 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {result.relevanceScore}% match
            </div>
          </div>
        </div>

        {/* Returns Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">YTD</div>
            <ReturnBadge value={result.returns.ytd} />
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">1Y</div>
            <ReturnBadge value={result.returns.oneYear} />
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">3Y CAGR</div>
            <ReturnBadge value={result.returns.threeYear} />
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Sharpe</div>
            <span className="font-mono text-sm font-medium text-slate-900">
              {result.sharpeRatio.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-slate-500">AUM:</span>{" "}
            <span className="font-medium text-slate-900">{formatAUM(result.aum)}</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-blue-50 px-2 py-1 rounded">
            <Lightbulb className="h-3 w-3 text-blue-500" />
            {result.matchReason}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/funds/${result.id}`}>
              View Details
            </Link>
          </Button>
          <Button size="sm">
            <Star className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof mockResults>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filters
  const [fundTypes, setFundTypes] = useState<string[]>(["hedge"]);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [minAum, setMinAum] = useState<string>("");
  const [minReturn, setMinReturn] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("relevance");

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate AI search delay
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 1500);
  }, [query]);

  const handleSuggestedQuery = (suggested: string) => {
    setQuery(suggested);
    // Trigger search after setting query
    setTimeout(() => {
      setIsSearching(true);
      setHasSearched(true);
      setTimeout(() => {
        setResults(mockResults);
        setIsSearching(false);
      }, 1500);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            AI-Powered Fund Search
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Search our database of 500,000+ funds using natural language. 
            Our AI understands complex queries and finds the best matches.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Wand2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-500" />
                  <Input
                    placeholder="Try: 'Long/short equity funds with 15%+ returns and low volatility'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 pr-4 py-6 text-lg"
                  />
                </div>
                <Button 
                  size="lg" 
                  onClick={handleSearch}
                  disabled={!query.trim() || isSearching}
                  className="px-8"
                >
                  {isSearching ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              
              {/* AI Hint */}
              <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Powered by AI — understands natural language queries</span>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Queries */}
          {!hasSearched && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Try these searches:</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggested, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuery(suggested)}
                    className="px-3 py-1.5 text-sm bg-white border rounded-full hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    {suggested}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        {hasSearched && (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fund Type */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Fund Type</Label>
                  <div className="space-y-2">
                    {[
                      { id: "hedge", label: "Hedge Funds" },
                      { id: "pe", label: "Private Equity" },
                      { id: "vc", label: "Venture Capital" },
                      { id: "realestate", label: "Real Estate" },
                    ].map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={type.id}
                          checked={fundTypes.includes(type.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFundTypes([...fundTypes, type.id]);
                            } else {
                              setFundTypes(fundTypes.filter(t => t !== type.id));
                            }
                          }}
                        />
                        <label htmlFor={type.id} className="text-sm">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Strategy */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Strategy</Label>
                  <div className="space-y-2">
                    {[
                      { id: "longshort", label: "Long/Short Equity" },
                      { id: "macro", label: "Global Macro" },
                      { id: "quant", label: "Quantitative" },
                      { id: "event", label: "Event Driven" },
                      { id: "multi", label: "Multi-Strategy" },
                    ].map((strat) => (
                      <div key={strat.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={strat.id}
                          checked={strategies.includes(strat.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStrategies([...strategies, strat.id]);
                            } else {
                              setStrategies(strategies.filter(s => s !== strat.id));
                            }
                          }}
                        />
                        <label htmlFor={strat.id} className="text-sm">
                          {strat.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* AUM Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Minimum AUM</Label>
                  <Select value={minAum} onValueChange={setMinAum}>
                    <SelectTrigger>
                      <DollarSign className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="100m">$100M+</SelectItem>
                      <SelectItem value="500m">$500M+</SelectItem>
                      <SelectItem value="1b">$1B+</SelectItem>
                      <SelectItem value="5b">$5B+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Return */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Min Annual Return</Label>
                  <Select value={minReturn} onValueChange={setMinReturn}>
                    <SelectTrigger>
                      <Percent className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="5">5%+</SelectItem>
                      <SelectItem value="10">10%+</SelectItem>
                      <SelectItem value="15">15%+</SelectItem>
                      <SelectItem value="20">20%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button variant="outline" className="w-full" onClick={() => {
                  setFundTypes(["hedge"]);
                  setStrategies([]);
                  setMinAum("");
                  setMinReturn("");
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {isSearching ? "Searching..." : `${results.length} Results`}
                  </h2>
                  {!isSearching && (
                    <p className="text-sm text-slate-500">
                      for &quot;{query}&quot;
                    </p>
                  )}
                </div>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="returns">Highest Returns</SelectItem>
                    <SelectItem value="aum">Largest AUM</SelectItem>
                    <SelectItem value="sharpe">Best Sharpe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loading State */}
              {isSearching ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-32" />
                          </div>
                          <Skeleton className="h-8 w-3/4" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {/* Results Grid */}
                  <div className="space-y-4 mb-8">
                    {results.map((result) => (
                      <SearchResultCard key={result.id} result={result} />
                    ))}
                  </div>

                  {/* Similar Funds Section */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Similar Funds You Might Like
                      </CardTitle>
                      <CardDescription>
                        Based on your search criteria
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        {similarFunds.map((fund) => (
                          <div 
                            key={fund.id}
                            className="p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-slate-900">{fund.name}</div>
                              <ArrowUpRight className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="text-sm text-slate-500 mb-2">{fund.strategy}</div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="font-mono text-sm text-green-600">
                                +{fund.returns}% YTD
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Searches */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-400" />
                        Recent Searches
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestedQuery(search)}
                            className="px-3 py-1.5 text-sm bg-slate-100 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-2"
                          >
                            <Clock className="h-3 w-3" />
                            {search}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pre-search state */}
        {!hasSearched && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {[
              { label: "Hedge Funds", count: "1,989", icon: BarChart3 },
              { label: "Private Equity", count: "112", icon: Building2 },
              { label: "Venture Capital", count: "234", icon: TrendingUp },
              { label: "Real Estate", count: "51", icon: Building2 },
            ].map((category, i) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={i} 
                  className="cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
                  onClick={() => handleSuggestedQuery(`${category.label} with strong returns`)}
                >
                  <CardContent className="pt-6">
                    <Icon className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-slate-900">{category.label}</h3>
                    <p className="text-sm text-slate-500">{category.count} funds</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
