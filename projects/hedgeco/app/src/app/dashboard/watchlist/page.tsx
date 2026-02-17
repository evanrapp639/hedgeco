"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  Plus,
  Search,
  ArrowLeft,
  Download,
  Trash2,
  Scale,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  Building2,
  ExternalLink,
} from "lucide-react";

interface WatchlistFund {
  id: string;
  name: string;
  strategy: string;
  aum: number;
  ytdReturn: number;
  mtdReturn: number;
  oneYearReturn: number;
  threeYearReturn: number;
  sharpeRatio: number;
  volatility: number;
  addedDate: string;
}

const mockWatchlist: WatchlistFund[] = [
  {
    id: "1",
    name: "Alpha Global Equity Fund",
    strategy: "Long/Short Equity",
    aum: 285,
    ytdReturn: 12.4,
    mtdReturn: 1.8,
    oneYearReturn: 18.2,
    threeYearReturn: 14.5,
    sharpeRatio: 1.42,
    volatility: 8.2,
    addedDate: "2025-11-15",
  },
  {
    id: "2",
    name: "Quantum Macro Fund",
    strategy: "Global Macro",
    aum: 520,
    ytdReturn: 18.2,
    mtdReturn: 2.1,
    oneYearReturn: 22.5,
    threeYearReturn: 16.8,
    sharpeRatio: 1.65,
    volatility: 10.5,
    addedDate: "2025-10-22",
  },
  {
    id: "3",
    name: "Sigma Statistical Arbitrage",
    strategy: "Statistical Arbitrage",
    aum: 180,
    ytdReturn: 9.8,
    mtdReturn: 0.9,
    oneYearReturn: 11.2,
    threeYearReturn: 10.3,
    sharpeRatio: 2.1,
    volatility: 4.8,
    addedDate: "2025-12-03",
  },
  {
    id: "4",
    name: "Phoenix Event Driven",
    strategy: "Event Driven",
    aum: 340,
    ytdReturn: 14.1,
    mtdReturn: -0.5,
    oneYearReturn: 15.8,
    threeYearReturn: 12.1,
    sharpeRatio: 1.28,
    volatility: 11.2,
    addedDate: "2026-01-08",
  },
  {
    id: "5",
    name: "Meridian Multi-Strategy",
    strategy: "Multi-Strategy",
    aum: 890,
    ytdReturn: 11.5,
    mtdReturn: 1.2,
    oneYearReturn: 13.9,
    threeYearReturn: 11.8,
    sharpeRatio: 1.55,
    volatility: 7.1,
    addedDate: "2025-09-17",
  },
];

interface SearchResult {
  id: string;
  name: string;
  strategy: string;
  ytdReturn: number;
}

const mockSearchResults: SearchResult[] = [
  { id: "10", name: "Renaissance Technologies", strategy: "Quantitative", ytdReturn: 25.3 },
  { id: "11", name: "Citadel Global Equities", strategy: "Multi-Strategy", ytdReturn: 19.8 },
  { id: "12", name: "Two Sigma Compass", strategy: "Systematic", ytdReturn: 16.4 },
];

type SortField = "name" | "ytdReturn" | "mtdReturn" | "aum" | "sharpeRatio" | "volatility" | "addedDate";
type SortOrder = "asc" | "desc";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState(mockWatchlist);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("addedDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [filterStrategy, setFilterStrategy] = useState<string>("");

  const strategies = Array.from(new Set(watchlist.map(f => f.strategy)));

  const sortedWatchlist = [...watchlist]
    .filter(f => !filterStrategy || f.strategy === filterStrategy)
    .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "ytdReturn":
          comparison = a.ytdReturn - b.ytdReturn;
          break;
        case "mtdReturn":
          comparison = a.mtdReturn - b.mtdReturn;
          break;
        case "aum":
          comparison = a.aum - b.aum;
          break;
        case "sharpeRatio":
          comparison = a.sharpeRatio - b.sharpeRatio;
          break;
        case "volatility":
          comparison = a.volatility - b.volatility;
          break;
        case "addedDate":
          comparison = new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectFund = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFunds([...selectedFunds, id]);
    } else {
      setSelectedFunds(selectedFunds.filter(fid => fid !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFunds(sortedWatchlist.map(f => f.id));
    } else {
      setSelectedFunds([]);
    }
  };

  const handleRemoveSelected = () => {
    setWatchlist(watchlist.filter(f => !selectedFunds.includes(f.id)));
    setSelectedFunds([]);
  };

  const handleRemoveFund = (id: string) => {
    setWatchlist(watchlist.filter(f => f.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Strategy", "AUM ($M)", "YTD %", "MTD %", "1Y %", "3Y %", "Sharpe", "Volatility %"];
    const rows = sortedWatchlist.map(f => [
      f.name,
      f.strategy,
      f.aum,
      f.ytdReturn,
      f.mtdReturn,
      f.oneYearReturn,
      f.threeYearReturn,
      f.sharpeRatio,
      f.volatility,
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watchlist-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                Your Watchlist
              </h1>
              <p className="text-slate-600 mt-1">{watchlist.length} funds tracked</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="min-h-[44px]" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                className="min-h-[44px]" 
                asChild
                disabled={selectedFunds.length < 2}
              >
                <Link href={`/compare?funds=${selectedFunds.join(',')}`}>
                  <Scale className="mr-2 h-4 w-4" />
                  Compare ({selectedFunds.length})
                </Link>
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="min-h-[44px]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Fund
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Fund to Watchlist</DialogTitle>
                    <DialogDescription>Search for funds to add to your watchlist</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search funds..."
                        value={addSearchQuery}
                        onChange={(e) => setAddSearchQuery(e.target.value)}
                        className="pl-10 min-h-[48px]"
                      />
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {mockSearchResults
                        .filter(r => !addSearchQuery || r.name.toLowerCase().includes(addSearchQuery.toLowerCase()))
                        .map(result => (
                          <div 
                            key={result.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-sm text-slate-900">{result.name}</p>
                              <p className="text-xs text-slate-500">{result.strategy}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-green-600">+{result.ytdReturn}%</span>
                              <Button 
                                size="sm" 
                                className="min-h-[36px]"
                                onClick={() => {
                                  // Add to watchlist logic
                                  setShowAddDialog(false);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)} className="min-h-[44px]">
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filter watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
              <Select value={filterStrategy} onValueChange={setFilterStrategy}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Strategies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Strategies</SelectItem>
                  {strategies.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFunds.length > 0 && (
                <Button 
                  variant="destructive" 
                  className="min-h-[44px]"
                  onClick={handleRemoveSelected}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove ({selectedFunds.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>Click column headers to sort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 w-10">
                      <Checkbox
                        checked={selectedFunds.length === sortedWatchlist.length && sortedWatchlist.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="h-5 w-5"
                      />
                    </th>
                    <th 
                      className="text-left py-3 px-3 font-medium text-slate-600 text-sm cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Fund <SortIcon field="name" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-slate-600 text-sm">Strategy</th>
                    <th 
                      className="text-right py-3 px-3 font-medium text-slate-600 text-sm cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("aum")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        AUM <SortIcon field="aum" />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 font-medium text-slate-600 text-sm cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("mtdReturn")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        MTD <SortIcon field="mtdReturn" />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 font-medium text-slate-600 text-sm cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("ytdReturn")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        YTD <SortIcon field="ytdReturn" />
                      </div>
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 text-sm">1Y</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 text-sm">3Y Ann.</th>
                    <th 
                      className="text-right py-3 px-3 font-medium text-slate-600 text-sm cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("sharpeRatio")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Sharpe <SortIcon field="sharpeRatio" />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 font-medium text-slate-600 text-sm cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("volatility")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Vol <SortIcon field="volatility" />
                      </div>
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 text-sm w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWatchlist.map((fund) => (
                    <tr 
                      key={fund.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        selectedFunds.includes(fund.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-3 px-2">
                        <Checkbox
                          checked={selectedFunds.includes(fund.id)}
                          onCheckedChange={(checked) => handleSelectFund(fund.id, checked as boolean)}
                          className="h-5 w-5"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Link 
                          href={`/funds/${fund.id}`}
                          className="flex items-center gap-2 group"
                        >
                          <div className="p-1.5 bg-slate-100 rounded group-hover:bg-blue-100 transition-colors">
                            <Building2 className="h-4 w-4 text-slate-600 group-hover:text-blue-600" />
                          </div>
                          <span className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {fund.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="secondary" className="text-xs">{fund.strategy}</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-medium">${fund.aum}M</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-sm font-semibold ${fund.mtdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.mtdReturn >= 0 ? '+' : ''}{fund.mtdReturn.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-sm font-semibold ${fund.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-sm ${fund.oneYearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.oneYearReturn >= 0 ? '+' : ''}{fund.oneYearReturn.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-sm ${fund.threeYearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.threeYearReturn >= 0 ? '+' : ''}{fund.threeYearReturn.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-sm font-medium ${
                          fund.sharpeRatio >= 1.5 ? 'text-green-600' : 
                          fund.sharpeRatio >= 1 ? 'text-slate-900' : 'text-amber-600'
                        }`}>
                          {fund.sharpeRatio.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm text-slate-600">{fund.volatility.toFixed(1)}%</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            asChild
                          >
                            <Link href={`/funds/${fund.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                            onClick={() => handleRemoveFund(fund.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedWatchlist.length === 0 && (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No funds match your filters</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search or filter criteria</p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterStrategy(""); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile Cards View (visible on small screens) */}
        <div className="md:hidden mt-6 space-y-4">
          {sortedWatchlist.map((fund) => (
            <Card key={fund.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedFunds.includes(fund.id)}
                      onCheckedChange={(checked) => handleSelectFund(fund.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900">{fund.name}</h3>
                      <Badge variant="secondary" className="text-xs mt-1">{fund.strategy}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleRemoveFund(fund.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-500">YTD</p>
                    <p className={`font-semibold ${fund.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">MTD</p>
                    <p className={`font-semibold ${fund.mtdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.mtdReturn >= 0 ? '+' : ''}{fund.mtdReturn}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Sharpe</p>
                    <p className="font-semibold">{fund.sharpeRatio.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" asChild>
                    <Link href={`/funds/${fund.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px] p-0" asChild>
                    <Link href={`/compare?funds=${fund.id}`}>
                      <Scale className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
