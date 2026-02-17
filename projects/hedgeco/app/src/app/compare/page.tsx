"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  Search,
  ArrowLeft,
  Scale,
  BarChart3,
  Target,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
} from "recharts";

interface FundData {
  id: string;
  name: string;
  strategy: string;
  aum: number;
  ytdReturn: number;
  mtdReturn: number;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  managementFee: number;
  performanceFee: number;
  minInvestment: number;
  lockup: string;
  inception: string;
  monthlyReturns: { date: string; value: number }[];
}

const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const mockFunds: Record<string, FundData> = {
  "1": {
    id: "1",
    name: "Alpha Global Equity Fund",
    strategy: "Long/Short Equity",
    aum: 285,
    ytdReturn: 12.4,
    mtdReturn: 1.8,
    oneYearReturn: 18.2,
    threeYearReturn: 14.5,
    fiveYearReturn: 12.1,
    sharpeRatio: 1.42,
    volatility: 8.2,
    maxDrawdown: -12.5,
    managementFee: 1.5,
    performanceFee: 20,
    minInvestment: 1000000,
    lockup: "1 year",
    inception: "2018-03-15",
    monthlyReturns: generateMonthlyReturns(0.01, 0.025),
  },
  "2": {
    id: "2",
    name: "Quantum Macro Fund",
    strategy: "Global Macro",
    aum: 520,
    ytdReturn: 18.2,
    mtdReturn: 2.1,
    oneYearReturn: 22.5,
    threeYearReturn: 16.8,
    fiveYearReturn: 14.2,
    sharpeRatio: 1.65,
    volatility: 10.5,
    maxDrawdown: -15.3,
    managementFee: 2.0,
    performanceFee: 20,
    minInvestment: 5000000,
    lockup: "2 years",
    inception: "2015-06-01",
    monthlyReturns: generateMonthlyReturns(0.012, 0.03),
  },
  "3": {
    id: "3",
    name: "Sigma Statistical Arbitrage",
    strategy: "Statistical Arbitrage",
    aum: 180,
    ytdReturn: 9.8,
    mtdReturn: 0.9,
    oneYearReturn: 11.2,
    threeYearReturn: 10.3,
    fiveYearReturn: 9.8,
    sharpeRatio: 2.1,
    volatility: 4.8,
    maxDrawdown: -6.2,
    managementFee: 2.0,
    performanceFee: 25,
    minInvestment: 2500000,
    lockup: "6 months",
    inception: "2019-09-01",
    monthlyReturns: generateMonthlyReturns(0.008, 0.015),
  },
  "4": {
    id: "4",
    name: "Phoenix Event Driven",
    strategy: "Event Driven",
    aum: 340,
    ytdReturn: 14.1,
    mtdReturn: -0.5,
    oneYearReturn: 15.8,
    threeYearReturn: 12.1,
    fiveYearReturn: 11.5,
    sharpeRatio: 1.28,
    volatility: 11.2,
    maxDrawdown: -18.7,
    managementFee: 1.75,
    performanceFee: 20,
    minInvestment: 3000000,
    lockup: "1 year",
    inception: "2016-01-15",
    monthlyReturns: generateMonthlyReturns(0.011, 0.028),
  },
};

function generateMonthlyReturns(base: number, volatility: number) {
  const returns: { date: string; value: number }[] = [];
  const now = new Date();
  let cumulative = 100;
  
  for (let i = 36; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthReturn = base + (Math.random() - 0.5) * volatility;
    cumulative *= (1 + monthReturn);
    returns.push({
      date: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      value: cumulative,
    });
  }
  return returns;
}

interface SearchResult {
  id: string;
  name: string;
  strategy: string;
  ytdReturn: number;
}

const allFunds: SearchResult[] = [
  { id: "1", name: "Alpha Global Equity Fund", strategy: "Long/Short Equity", ytdReturn: 12.4 },
  { id: "2", name: "Quantum Macro Fund", strategy: "Global Macro", ytdReturn: 18.2 },
  { id: "3", name: "Sigma Statistical Arbitrage", strategy: "Statistical Arbitrage", ytdReturn: 9.8 },
  { id: "4", name: "Phoenix Event Driven", strategy: "Event Driven", ytdReturn: 14.1 },
  { id: "5", name: "Meridian Multi-Strategy", strategy: "Multi-Strategy", ytdReturn: 11.5 },
  { id: "6", name: "Renaissance Technologies", strategy: "Quantitative", ytdReturn: 25.3 },
];

function ComparePageContent() {
  const searchParams = useSearchParams();
  const initialFunds = searchParams.get("funds")?.split(",").filter(Boolean) || [];
  
  const [selectedFundIds, setSelectedFundIds] = useState<string[]>(
    initialFunds.length > 0 ? initialFunds.slice(0, 4) : ["1", "2"]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const selectedFunds = selectedFundIds
    .map(id => mockFunds[id])
    .filter(Boolean);

  const handleAddFund = (id: string) => {
    if (selectedFundIds.length < 4 && !selectedFundIds.includes(id)) {
      setSelectedFundIds([...selectedFundIds, id]);
    }
    setShowAddDialog(false);
  };

  const handleRemoveFund = (id: string) => {
    setSelectedFundIds(selectedFundIds.filter(fid => fid !== id));
  };

  // Combine chart data
  const chartData = useMemo(() => {
    if (selectedFunds.length === 0) return [];
    
    const baseReturns = selectedFunds[0].monthlyReturns;
    return baseReturns.map((point, idx) => {
      const dataPoint: Record<string, string | number> = { date: point.date };
      selectedFunds.forEach((fund) => {
        dataPoint[fund.id] = fund.monthlyReturns[idx]?.value || 0;
      });
      return dataPoint;
    });
  }, [selectedFunds]);

  const metrics = [
    { key: "ytdReturn", label: "YTD Return", format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, highlight: "high" },
    { key: "oneYearReturn", label: "1 Year Return", format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, highlight: "high" },
    { key: "threeYearReturn", label: "3 Year Ann. Return", format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, highlight: "high" },
    { key: "fiveYearReturn", label: "5 Year Ann. Return", format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, highlight: "high" },
    { key: "sharpeRatio", label: "Sharpe Ratio", format: (v: number) => v.toFixed(2), highlight: "high" },
    { key: "volatility", label: "Volatility", format: (v: number) => `${v.toFixed(1)}%`, highlight: "low" },
    { key: "maxDrawdown", label: "Max Drawdown", format: (v: number) => `${v.toFixed(1)}%`, highlight: "low" },
    { key: "aum", label: "AUM", format: (v: number) => `$${v}M`, highlight: "none" },
    { key: "managementFee", label: "Management Fee", format: (v: number) => `${v}%`, highlight: "low" },
    { key: "performanceFee", label: "Performance Fee", format: (v: number) => `${v}%`, highlight: "low" },
    { key: "minInvestment", label: "Min Investment", format: (v: number) => `$${(v/1000000).toFixed(1)}M`, highlight: "none" },
    { key: "lockup", label: "Lock-up Period", format: (v: string) => v, highlight: "none" },
  ];

  const getBestValue = (key: string, highlight: string) => {
    if (highlight === "none") return null;
    const values = selectedFunds.map(f => {
      const fundRecord = f as unknown as Record<string, unknown>;
      return fundRecord[key] as number;
    });
    if (highlight === "high") return Math.max(...values);
    return Math.min(...values);
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
                Back
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Scale className="h-8 w-8 text-blue-600" />
                Fund Comparison
              </h1>
              <p className="text-slate-600 mt-1">Compare up to 4 funds side-by-side</p>
            </div>
          </div>
        </div>

        {/* Fund Selection Pills */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-3">
              {selectedFunds.map((fund, idx) => (
                <div 
                  key={fund.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border-2"
                  style={{ borderColor: colors[idx] }}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[idx] }}
                  />
                  <span className="font-medium text-sm text-slate-900">{fund.name}</span>
                  <button
                    onClick={() => handleRemoveFund(fund.id)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              ))}
              
              {selectedFunds.length < 4 && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-full min-h-[44px]">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Fund
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Fund to Compare</DialogTitle>
                      <DialogDescription>
                        Select a fund to add to your comparison ({4 - selectedFunds.length} slots remaining)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search funds..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 min-h-[48px]"
                        />
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {allFunds
                          .filter(f => !selectedFundIds.includes(f.id))
                          .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(fund => (
                            <button
                              key={fund.id}
                              onClick={() => handleAddFund(fund.id)}
                              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                            >
                              <div>
                                <p className="font-medium text-sm text-slate-900">{fund.name}</p>
                                <p className="text-xs text-slate-500">{fund.strategy}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${fund.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn}%
                                </span>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedFunds.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <Scale className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No Funds Selected</h2>
              <p className="text-slate-500 mb-6">Add at least one fund to start comparing</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Fund
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Performance Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Performance Comparison
                </CardTitle>
                <CardDescription>Cumulative returns (indexed to 100)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        interval="preserveStartEnd"
                        minTickGap={40}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickFormatter={(v) => v.toFixed(0)}
                        domain={["auto", "auto"]}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value, name) => {
                          const fund = selectedFunds.find(f => f.id === name);
                          return [typeof value === 'number' ? value.toFixed(2) : String(value), fund?.name || name];
                        }}
                      />
                      <ReferenceLine y={100} stroke="#cbd5e1" strokeDasharray="5 5" />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value: string) => {
                          const fund = selectedFunds.find(f => f.id === value);
                          return <span className="text-sm">{fund?.name || value}</span>;
                        }}
                      />
                      {selectedFunds.map((fund, idx) => (
                        <Line
                          key={fund.id}
                          type="monotone"
                          dataKey={fund.id}
                          stroke={colors[idx]}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, fill: colors[idx], stroke: "#fff", strokeWidth: 2 }}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Key Metrics
                </CardTitle>
                <CardDescription>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Best in category
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm w-48">Metric</th>
                        {selectedFunds.map((fund, idx) => (
                          <th key={fund.id} className="text-center py-3 px-4 font-medium text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: colors[idx] }}
                              />
                              <span className="truncate max-w-[150px]" title={fund.name}>
                                {fund.name}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Strategy Row */}
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-700">Strategy</td>
                        {selectedFunds.map(fund => (
                          <td key={fund.id} className="py-3 px-4 text-center">
                            <Badge variant="secondary">{fund.strategy}</Badge>
                          </td>
                        ))}
                      </tr>
                      
                      {metrics.map(metric => {
                        const best = getBestValue(metric.key, metric.highlight);
                        return (
                          <tr key={metric.key} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-700">{metric.label}</td>
                            {selectedFunds.map(fund => {
                              const fundRecord = fund as unknown as Record<string, unknown>;
                              const value = fundRecord[metric.key];
                              const isBest = metric.highlight !== "none" && value === best;
                              const isReturn = metric.key.includes("Return");
                              const numValue = typeof value === "number" ? value : 0;
                              
                              return (
                                <td key={fund.id} className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className={`font-semibold ${
                                      isReturn 
                                        ? numValue >= 0 ? 'text-green-600' : 'text-red-600'
                                        : isBest ? 'text-green-600' : 'text-slate-900'
                                    }`}>
                                      {metric.format(value as never)}
                                    </span>
                                    {isBest && (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {/* Inception Row */}
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium text-slate-700">Inception Date</td>
                        {selectedFunds.map(fund => (
                          <td key={fund.id} className="py-3 px-4 text-center text-slate-600">
                            {new Date(fund.inception).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile View: Stacked Cards */}
            <div className="md:hidden mt-6 space-y-4">
              {selectedFunds.map((fund, idx) => (
                <Card key={fund.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: colors[idx] }}
                      />
                      <CardTitle className="text-base">{fund.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">{fund.strategy}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">YTD Return</p>
                        <p className={`font-bold ${fund.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">1Y Return</p>
                        <p className={`font-bold ${fund.oneYearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.oneYearReturn >= 0 ? '+' : ''}{fund.oneYearReturn}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Sharpe Ratio</p>
                        <p className="font-bold">{fund.sharpeRatio.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Volatility</p>
                        <p className="font-bold">{fund.volatility}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">AUM</p>
                        <p className="font-bold">${fund.aum}M</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Fees</p>
                        <p className="font-bold">{fund.managementFee}/{fund.performanceFee}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4 min-h-[44px]" asChild>
                      <Link href={`/funds/${fund.id}`}>View Full Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500">Loading comparison...</span>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}
