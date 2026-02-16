"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  MessageSquare,
  Star,
  Share2,
  Download,
  Lock,
  ExternalLink,
} from "lucide-react";

// Sample fund data (would come from API in real app)
const fundData = {
  "alpha-equity-partners": {
    id: "1",
    name: "Alpha Equity Partners",
    slug: "alpha-equity-partners",
    type: "HEDGE_FUND",
    strategy: "Long/Short Equity",
    subStrategy: "US Large Cap",
    description: `Alpha Equity Partners employs a fundamental, bottom-up approach to long/short equity investing, focusing on US large-cap stocks. Our investment team leverages deep sector expertise and rigorous due diligence to identify mispriced securities across the market cap spectrum.

The fund targets absolute returns with lower volatility than the broader equity market through careful position sizing and active risk management.

Our investment philosophy is rooted in three core principles:
1. Deep fundamental research drives alpha generation
2. Risk management is paramount - preserving capital enables compounding
3. Patience and discipline outperform speculation`,
    manager: {
      name: "John Smith",
      title: "Managing Partner",
      company: "Alpha Capital Management",
    },
    aum: 850000000,
    aumDate: "2026-01-31",
    inceptionDate: "2018-03-15",
    managementFee: 0.02,
    performanceFee: 0.2,
    hurdleRate: null,
    highWaterMark: true,
    minInvestment: 1000000,
    lockupPeriod: "12 months",
    redemptionTerms: "Quarterly with 90 days notice",
    legalStructure: "Delaware LP",
    domicile: "United States",
    regulator: "SEC",
    city: "New York",
    state: "NY",
    country: "US",
    featured: true,
    primaryBenchmark: "S&P 500",
    statistics: {
      totalReturn: 0.4523,
      cagr: 0.1245,
      ytdReturn: 0.0167,
      oneYearReturn: 0.2156,
      threeYearReturn: 0.1189,
      fiveYearReturn: null,
      volatility: 0.0845,
      sharpeRatio: 1.47,
      sortinoRatio: 2.12,
      calmarRatio: 1.89,
      maxDrawdown: -0.0658,
      maxDrawdownDate: "2024-08-15",
      currentDrawdown: 0,
      bestMonth: 0.0345,
      worstMonth: -0.0145,
      avgMonthlyReturn: 0.0165,
      positiveMonths: 22,
      negativeMonths: 3,
      winRate: 0.88,
      correlationSP500: 0.65,
      beta: 0.72,
      alpha: 0.0823,
      monthsOfData: 25,
    },
    returns: [
      { year: 2024, month: 1, netReturn: 0.0215 },
      { year: 2024, month: 2, netReturn: 0.0189 },
      { year: 2024, month: 3, netReturn: -0.0087 },
      { year: 2024, month: 4, netReturn: 0.0312 },
      { year: 2024, month: 5, netReturn: 0.0156 },
      { year: 2024, month: 6, netReturn: 0.0078 },
      { year: 2024, month: 7, netReturn: 0.0234 },
      { year: 2024, month: 8, netReturn: -0.0145 },
      { year: 2024, month: 9, netReturn: 0.0198 },
      { year: 2024, month: 10, netReturn: 0.0267 },
      { year: 2024, month: 11, netReturn: 0.0345 },
      { year: 2024, month: 12, netReturn: 0.0123 },
      { year: 2025, month: 1, netReturn: 0.0187 },
      { year: 2025, month: 2, netReturn: 0.0156 },
      { year: 2025, month: 3, netReturn: -0.0067 },
      { year: 2025, month: 4, netReturn: 0.0289 },
      { year: 2025, month: 5, netReturn: 0.0134 },
      { year: 2025, month: 6, netReturn: 0.0212 },
      { year: 2025, month: 7, netReturn: 0.0178 },
      { year: 2025, month: 8, netReturn: -0.0098 },
      { year: 2025, month: 9, netReturn: 0.0234 },
      { year: 2025, month: 10, netReturn: 0.0312 },
      { year: 2025, month: 11, netReturn: 0.0189 },
      { year: 2025, month: 12, netReturn: 0.0145 },
      { year: 2026, month: 1, netReturn: 0.0167 },
    ],
  },
};

function formatCurrency(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(0)}M`;
  return `$${amount.toLocaleString()}`;
}

function formatPercent(value: number | null, includeSign = true): string {
  if (value === null) return "N/A";
  const sign = includeSign && value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FundDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const fund = fundData[slug as keyof typeof fundData];

  if (!fund) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Fund Not Found</h2>
            <p className="text-slate-600 mb-4">The fund you&apos;re looking for doesn&apos;t exist.</p>
            <Button asChild>
              <Link href="/funds">Browse All Funds</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group returns by year
  const returnsByYear = fund.returns.reduce((acc, ret) => {
    if (!acc[ret.year]) acc[ret.year] = {};
    acc[ret.year][ret.month] = ret.netReturn;
    return acc;
  }, {} as Record<number, Record<number, number>>);

  const years = Object.keys(returnsByYear)
    .map(Number)
    .sort((a, b) => b - a);

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
                <span>{fund.strategy} • {fund.subStrategy}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {fund.city}, {fund.state}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Inception: {new Date(fund.inceptionDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-1" />
                Add to Watchlist
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button size="sm">
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
            {/* Key Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">AUM</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(fund.aum)}
                    </div>
                    <div className="text-xs text-slate-400">
                      as of {new Date(fund.aumDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">YTD Return</div>
                    <div
                      className={`text-2xl font-bold flex items-center gap-1 ${
                        fund.statistics.ytdReturn >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {fund.statistics.ytdReturn >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      {formatPercent(fund.statistics.ytdReturn)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">CAGR</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatPercent(fund.statistics.cagr)}
                    </div>
                    <div className="text-xs text-slate-400">Since inception</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {fund.statistics.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fund Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 whitespace-pre-line">{fund.description}</p>
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
                          <span className="font-medium">{(fund.managementFee * 100).toFixed(1)}%</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Performance Fee</span>
                          <span className="font-medium">{(fund.performanceFee * 100).toFixed(0)}%</span>
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
                          <span className="font-medium">{fund.lockupPeriod}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Redemption</span>
                          <span className="font-medium">{fund.redemptionTerms}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Legal Structure</span>
                          <span className="font-medium">{fund.legalStructure}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Domicile</span>
                          <span className="font-medium">{fund.domicile}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="mt-4 space-y-6">
                {/* Monthly Returns Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Returns</CardTitle>
                    <CardDescription>Net returns after all fees</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-slate-500">Year</th>
                            {months.map((m) => (
                              <th key={m} className="text-center py-2 font-medium text-slate-500 px-2">
                                {m}
                              </th>
                            ))}
                            <th className="text-center py-2 font-medium text-slate-500 px-2">YTD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {years.map((year) => {
                            const yearReturns = returnsByYear[year];
                            let ytd = 1;
                            for (let m = 1; m <= 12; m++) {
                              if (yearReturns[m] !== undefined) {
                                ytd *= 1 + yearReturns[m];
                              }
                            }
                            ytd = ytd - 1;

                            return (
                              <tr key={year} className="border-b last:border-0">
                                <td className="py-2 font-medium">{year}</td>
                                {months.map((_, i) => {
                                  const ret = yearReturns[i + 1];
                                  return (
                                    <td
                                      key={i}
                                      className={`text-center py-2 px-2 ${
                                        ret === undefined
                                          ? "text-slate-300"
                                          : ret >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {ret !== undefined ? formatPercent(ret, false) : "-"}
                                    </td>
                                  );
                                })}
                                <td
                                  className={`text-center py-2 px-2 font-medium ${
                                    ytd >= 0 ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {formatPercent(ytd, false)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statistics" className="mt-4 space-y-6">
                {/* Risk Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk & Return Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                          <div className="flex justify-between">
                            <span className="text-slate-500">Best Month</span>
                            <span className="font-medium text-green-600">{formatPercent(fund.statistics.bestMonth)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Worst Month</span>
                            <span className="font-medium text-red-600">{formatPercent(fund.statistics.worstMonth)}</span>
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
                            <span className="font-medium">{fund.statistics.sharpeRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Sortino Ratio</span>
                            <span className="font-medium">{fund.statistics.sortinoRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Calmar Ratio</span>
                            <span className="font-medium">{fund.statistics.calmarRatio.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">Benchmark Comparison</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Benchmark</span>
                            <span className="font-medium">{fund.primaryBenchmark}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Correlation</span>
                            <span className="font-medium">{fund.statistics.correlationSP500.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Beta</span>
                            <span className="font-medium">{fund.statistics.beta.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Alpha (Ann.)</span>
                            <span className="font-medium text-green-600">{formatPercent(fund.statistics.alpha)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Win Rate</span>
                            <span className="font-medium">{(fund.statistics.winRate * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Data Points</span>
                            <span className="font-medium">{fund.statistics.monthsOfData} months</span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <div className="font-medium text-slate-900">{fund.manager.name}</div>
                    <div className="text-sm text-slate-500">{fund.manager.title}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 mb-4">{fund.manager.company}</div>
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
                    {(fund.managementFee * 100).toFixed(0)}/{(fund.performanceFee * 100).toFixed(0)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Lockup</span>
                  <span className="font-medium">{fund.lockupPeriod}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Regulator</span>
                  <span className="font-medium">{fund.regulator}</span>
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
