"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Shield,
  Search,
  Users,
  Building2,
  LineChart,
  ArrowRight,
  Sparkles,
  Globe,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";

const stats = [
  { label: "Hedge Funds", value: "2,500+", icon: TrendingUp },
  { label: "Accredited Investors", value: "15,000+", icon: Users },
  { label: "Service Providers", value: "1,300+", icon: Building2 },
  { label: "Assets Tracked", value: "$850B+", icon: BarChart3 },
];

const features = [
  {
    icon: Search,
    title: "AI-Powered Search",
    description:
      "Find funds using natural language. Ask questions like 'long/short equity funds with 15%+ returns' and get instant results.",
  },
  {
    icon: Shield,
    title: "Verified Data",
    description:
      "All fund data is verified and regularly updated. Access detailed performance metrics, AUM history, and fee structures.",
  },
  {
    icon: Sparkles,
    title: "Smart Recommendations",
    description:
      "Our AI learns your preferences and recommends funds that match your investment criteria and risk profile.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description:
      "Access hedge funds, private equity, venture capital, real estate, crypto funds, and SPVs from around the world.",
  },
  {
    icon: LineChart,
    title: "Performance Analytics",
    description:
      "Comprehensive statistics including Sharpe ratio, max drawdown, correlation analysis, and benchmark comparisons.",
  },
  {
    icon: Zap,
    title: "Direct Connections",
    description:
      "Connect directly with fund managers through our secure messaging platform. No intermediaries.",
  },
];

const fundTypes = [
  { name: "Hedge Funds", count: "1,200+", href: "/funds?type=HEDGE_FUND" },
  { name: "Private Equity", count: "450+", href: "/funds?type=PRIVATE_EQUITY" },
  { name: "Venture Capital", count: "380+", href: "/funds?type=VENTURE_CAPITAL" },
  { name: "Real Estate", count: "220+", href: "/funds?type=REAL_ESTATE" },
  { name: "Crypto Funds", count: "180+", href: "/funds?type=CRYPTO" },
  { name: "SPVs", count: "150+", href: "/funds?type=SPV" },
];

const featuredFunds = [
  {
    name: "Alpha Equity Partners",
    strategy: "Long/Short Equity",
    aum: "$850M",
    ytdReturn: "+18.7%",
    slug: "alpha-equity-partners",
  },
  {
    name: "Quantum Alpha Fund",
    strategy: "Quantitative",
    aum: "$2.3B",
    ytdReturn: "+14.2%",
    slug: "quantum-alpha-fund",
  },
  {
    name: "Crescent Growth Fund III",
    strategy: "Growth Equity",
    aum: "$750M",
    ytdReturn: "N/A",
    slug: "crescent-growth-fund-iii",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30">
              The #1 Alternative Investment Network
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Discover & Connect with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Elite Investment Funds
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Access comprehensive data on hedge funds, private equity, venture capital, and more.
              Powered by AI to help you find the perfect investment opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-lg px-8 bg-transparent hover:bg-slate-800" asChild>
                <Link href="/funds">Browse Funds</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fund Types */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Explore Investment Opportunities
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Browse our comprehensive database of alternative investment funds across all major categories.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {fundTypes.map((type) => (
              <Link key={type.name} href={type.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{type.count}</div>
                    <div className="text-sm text-slate-600">{type.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Why HedgeCo.Net</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              The Intelligent Way to Find Funds
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our AI-powered platform makes it easy to discover, analyze, and connect with
              investment funds that match your criteria.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-slate-200">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Funds */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Funds</h2>
              <p className="text-slate-600">Top performing funds in our network</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/funds">
                View All Funds
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredFunds.map((fund) => (
              <Link key={fund.slug} href={`/funds/${fund.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg mb-1">{fund.name}</CardTitle>
                        <CardDescription>{fund.strategy}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        {fund.ytdReturn}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">AUM</span>
                      <span className="font-semibold text-slate-900">{fund.aum}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Different Users */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built for Every Stakeholder
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Whether you&apos;re an investor, fund manager, or service provider, HedgeCo.Net has the tools you need.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Investors */}
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Investors</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-slate-600 space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Search 2,500+ funds with AI
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Access detailed performance data
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Connect directly with managers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Build and track watchlists
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register?type=investor">Register as Investor</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Fund Managers */}
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <LineChart className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Fund Managers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-slate-600 space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    List your fund for free
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Reach 15,000+ investors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Track performance & analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Generate PDF reports
                  </li>
                </ul>
                <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/register?type=manager">List Your Fund</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Service Providers */}
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Service Providers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-slate-600 space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Showcase your services
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Connect with fund managers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Premium listing options
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Lead generation tools
                  </li>
                </ul>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                  <Link href="/register?type=provider">Join Directory</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Next Investment?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of investors and fund managers already using HedgeCo.Net
            to make smarter investment decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10 bg-transparent" asChild>
              <Link href="/funds">Explore Funds</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
