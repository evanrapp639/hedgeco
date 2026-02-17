"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Star,
  Share2,
  Download,
  Lock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/fund/StatsCard";
import { PerformanceChart } from "@/components/fund/PerformanceChart";
import { ReturnTable } from "@/components/fund/ReturnTable";

function formatCurrency(amount: unknown): string {
  if (amount === null || amount === undefined) return "N/A";
  const num = Number(amount);
  if (isNaN(num)) return "N/A";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  return `$${num.toLocaleString()}`;
}

function formatPercent(value: unknown, includeSign = true): string {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  if (isNaN(num)) return "N/A";
  const sign = includeSign && num >= 0 ? "+" : "";
  return `${sign}${(num * 100).toFixed(2)}%`;
}

function getFundTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HEDGE_FUND: "Hedge Fund",
    PRIVATE_EQUITY: "Private Equity",
    VENTURE_CAPITAL: "Venture Capital",
    REAL_ESTATE: "Real Estate",
    CRYPTO: "Crypto",
    SPV: "SPV",
  };
  return labels[type] || type;
}

// Reserved for future use: monthly returns table
// const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FundDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const { data: fund, isLoading, error } = trpc.fund.getBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Fund Not Found</h2>
            <p className="text-slate-600 mb-4">
              {error?.message || "The fund you&apos;re looking for doesn&apos;t exist."}
            </p>
            <Button asChild>
              <Link href="/funds">Browse All Funds</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Note: Monthly returns data comes from the full details endpoint when authenticated
  // For now we show basic info only via the public getBySlug endpoint

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link
              href="/funds"
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Funds
            </Link>
          </div>

          {/* Fund Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{fund.name}</h1>
                {fund.featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {getFundTypeLabel(fund.type)}
                </span>
                {fund.strategy && <span>{fund.strategy} {fund.subStrategy && `• ${fund.subStrategy}`}</span>}
                {fund.city && fund.state && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {fund.city}, {fund.state}
                  </span>
                )}
                {fund.inceptionDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Inception: {new Date(fund.inceptionDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
            {/* Action buttons - full width on mobile */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Button variant="outline" size="sm" className="flex-1 lg:flex-none min-h-[44px]">
                <Star className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Add to </span>Watchlist
              </Button>
              <Button variant="outline" size="sm" className="flex-1 lg:flex-none min-h-[44px]">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button size="sm" className="w-full sm:w-auto sm:flex-1 lg:flex-none min-h-[44px]">
                <MessageSquare className="h-4 w-4 mr-1" />
                Contact Manager
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Stats - Enhanced StatsCard Component */}
            <StatsCard
              aum={fund.aum}
              aumDate={fund.aumDate}
              statistics={fund.statistics}
            />

            {/* Performance Chart */}
            <PerformanceChart
              fundName={fund.name}
              benchmarkName={fund.primaryBenchmark || "S&P 500"}
            />

            {/* Tabs - scrollable on mobile */}
            <Tabs defaultValue="overview">
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="w-max md:w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-4 space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fund Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 whitespace-pre-line">
                      {fund.description || "No description available."}
                    </p>
                  </CardContent>
                </Card>

                {/* Investment Terms */}
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Minimum Investment</span>
                          <span className="font-medium">{formatCurrency(fund.minInvestment)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Management Fee</span>
                          <span className="font-medium">
                            {fund.managementFee ? `${(Number(fund.managementFee) * 100).toFixed(1)}%` : "N/A"}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Performance Fee</span>
                          <span className="font-medium">
                            {fund.performanceFee ? `${(Number(fund.performanceFee) * 100).toFixed(0)}%` : "N/A"}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">High Water Mark</span>
                          <span className="font-medium">{fund.highWaterMark ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Lockup Period</span>
                          <span className="font-medium">{fund.lockupPeriod || "N/A"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Redemption</span>
                          <span className="font-medium">{fund.redemptionTerms || "N/A"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Legal Structure</span>
                          <span className="font-medium">{fund.legalStructure || "N/A"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Domicile</span>
                          <span className="font-medium">{fund.domicile || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statistics" className="mt-4 space-y-6">
                {/* Monthly Returns Table */}
                <ReturnTable />

                {/* Risk Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk & Return Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fund.statistics ? (
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-slate-900">Return Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Total Return</span>
                              <span className="font-medium">{formatPercent(fund.statistics.totalReturn)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">CAGR</span>
                              <span className="font-medium">{formatPercent(fund.statistics.cagr)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">1-Year Return</span>
                              <span className="font-medium">{formatPercent(fund.statistics.oneYearReturn)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">3-Year Return (Ann.)</span>
                              <span className="font-medium">{formatPercent(fund.statistics.threeYearReturn)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-medium text-slate-900">Risk Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Volatility (Ann.)</span>
                              <span className="font-medium">{formatPercent(fund.statistics.volatility, false)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Max Drawdown</span>
                              <span className="font-medium text-red-600">{formatPercent(fund.statistics.maxDrawdown)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Sharpe Ratio</span>
                              <span className="font-medium">{fund.statistics.sharpeRatio ? Number(fund.statistics.sharpeRatio).toFixed(2) : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Sortino Ratio</span>
                              <span className="font-medium">{fund.statistics.sortinoRatio ? Number(fund.statistics.sortinoRatio).toFixed(2) : "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-medium text-slate-900">Benchmark Comparison</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Benchmark</span>
                              <span className="font-medium">{fund.primaryBenchmark || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Correlation</span>
                              <span className="font-medium">{fund.statistics.correlationSP500 ? Number(fund.statistics.correlationSP500).toFixed(2) : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Beta</span>
                              <span className="font-medium">{fund.statistics.beta ? Number(fund.statistics.beta).toFixed(2) : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Alpha (Ann.)</span>
                              <span className="font-medium text-green-600">{formatPercent(fund.statistics.alpha)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-8">No statistics available for this fund.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Fund Documents</CardTitle>
                    <CardDescription>
                      <Lock className="h-4 w-4 inline mr-1" />
                      Accreditation required to access documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: "Fund Fact Sheet", type: "PDF", date: "Jan 2026", access: "Accredited" },
                        { name: "Private Placement Memorandum", type: "PDF", date: "Mar 2025", access: "NDA Required" },
                        { name: "Due Diligence Questionnaire", type: "PDF", date: "Dec 2025", access: "Accredited" },
                        { name: "Audited Financials (2024)", type: "PDF", date: "Mar 2025", access: "Accredited" },
                      ].map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg border bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-900">{doc.name}</div>
                              <div className="text-xs text-slate-500">
                                {doc.type} • Updated {doc.date}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {doc.access}
                            </Badge>
                            <Button variant="ghost" size="sm" disabled>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-blue-700 mb-2">
                        Complete your accreditation to access fund documents
                      </p>
                      <Button size="sm">Verify Accreditation</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Manager Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fund Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <Users className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {fund.manager.profile?.firstName} {fund.manager.profile?.lastName}
                    </div>
                    <div className="text-sm text-slate-500">{fund.manager.profile?.title}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 mb-4">{fund.manager.profile?.company}</div>
                <Button className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Manager
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">AUM</span>
                  <span className="font-medium">{formatCurrency(fund.aum)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Min Investment</span>
                  <span className="font-medium">{formatCurrency(fund.minInvestment)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fees</span>
                  <span className="font-medium">
                    {fund.managementFee && fund.performanceFee 
                      ? `${(Number(fund.managementFee) * 100).toFixed(0)}/${(Number(fund.performanceFee) * 100).toFixed(0)}`
                      : "N/A"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Lockup</span>
                  <span className="font-medium">{fund.lockupPeriod || "N/A"}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Regulator</span>
                  <span className="font-medium">{fund.regulator || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Fact Sheet
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Request DDQ
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Manager Website
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
