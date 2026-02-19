"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  Building2,
  Rocket,
  Home,
  Bitcoin,
  Briefcase,
  Search,
  BarChart3,
  Globe,
  Bell,
  Users,
  Shield,
  Zap,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

// Exact stats from staging.hedgeco.net
const stats = [
  { label: "Alternative Investment Funds", value: "513K+", icon: TrendingUp },
  { label: "Investment Professionals", value: "172+", icon: Users },
  { label: "Assets Under Management", value: "$695M+", icon: BarChart3 },
  { label: "Countries Worldwide", value: "82+", icon: Globe },
];

// Asset classes from staging site
const assetClasses = [
  { 
    name: "Hedge Funds", 
    count: "1989+ Funds", 
    icon: TrendingUp,
    description: "Long/short equity, market neutral, event-driven, global macro, and quantitative strategies with monthly reporting.",
    color: "from-blue-500 to-blue-600"
  },
  { 
    name: "Private Equity", 
    count: "112+ Funds", 
    icon: Building2,
    description: "Buyout, growth capital, distressed investing, and secondary funds with quarterly performance updates.",
    color: "from-green-500 to-green-600"
  },
  { 
    name: "Venture Capital", 
    count: "0+ Funds", 
    icon: Rocket,
    description: "Seed, early-stage, growth-stage, and late-stage venture capital funds across all sectors and geographies.",
    color: "from-purple-500 to-purple-600"
  },
  { 
    name: "Real Estate", 
    count: "51+ Funds", 
    icon: Home,
    description: "REITs, real estate funds, opportunity zones, and property investment strategies worldwide.",
    color: "from-orange-500 to-orange-600"
  },
  { 
    name: "Crypto & Digital Assets", 
    count: "0+ Funds", 
    icon: Bitcoin,
    description: "Digital asset funds, blockchain investments, DeFi strategies, and cryptocurrency trading funds.",
    color: "from-yellow-500 to-yellow-600"
  },
  { 
    name: "SPV's", 
    count: "275+ Funds", 
    icon: Briefcase,
    description: "Special purpose vehicles-Flexible, deal-specific investment structures used to access individual private deals, venture rounds, or alternative assets.",
    color: "from-cyan-500 to-cyan-600"
  },
];

// Features from staging site
const features = [
  {
    icon: Search,
    title: "Comprehensive Search",
    description: "Advanced filtering by strategy, geography, AUM, performance, and dozens of other criteria to find exactly what you need.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Detailed performance metrics, risk analytics, and benchmarking tools with monthly and quarterly reporting.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Funds from 45+ countries with local market insights and regulatory information for international investing.",
  },
  {
    icon: Zap,
    title: "Mobile Access",
    description: "Full-featured mobile platform for accessing fund data, news, and analytics on the go from any device.",
  },
  {
    icon: Bell,
    title: "Real-time Alerts",
    description: "Custom alerts for fund launches, performance updates, manager changes, and market developments.",
  },
  {
    icon: Users,
    title: "Industry Network",
    description: "Connect with fund managers, investors, and service providers through our professional networking platform.",
  },
];

// News articles from staging site
const newsArticles = [
  {
    title: "Bridgewater's Positioning for an AI Cycle While Warning of 'Bubble' Dynamics",
    excerpt: "Bridgewater's brand has always been macro: cycles, regimes, and the second-order consequences of policy. This week, the trend around the world's most famous macro hedge fund is the collision of two ideas: AI as a structural growth engine and AI as a...",
    date: "Feb 2026",
    href: "/news/02/2026/bridgewaters-positioning-for-an-ai-cycle-while-warning-of-bubble-dynamics.html"
  },
  {
    title: "Alternatives Become Core, Not Optional",
    excerpt: "For decades, alternative investments lived on the margins of portfolio design. They were labeled 'non-core,' allocated sparingly, and often treated as tactical diversifiers rather than foundational building blocks...",
    date: "Feb 2026",
    href: "/news/02/2026/alternatives-become-core-not-optional.html"
  },
  {
    title: "Citadel's Focus: Funding, Compensation Gravity, and the Economics of Scale",
    excerpt: "Citadel remains one of the defining institutions in the hedge-fund universe precisely because it's not just an investment firm—it's a capital ecosystem. This week's 'new and trending' Citadel story is the way scale creates both a moat and a...",
    date: "Feb 2026",
    href: "/news/02/2026/citadels-focus-funding-compensation-gravity-and-the-economics-of-scale.html"
  },
  {
    title: "Crypto at a Crossroads: Why This Week Matters More Than Any Other So Far in 2026",
    excerpt: "The cryptocurrency market has experienced no shortage of defining moments over the past decade—booms, busts, regulatory crackdowns, euphoric rallies, and existential crises. Yet even by those standards, this week stands out as unusually important...",
    date: "Feb 2026",
    href: "/news/02/2026/crypto-at-a-crossroads-why-this-week-matters-more-than-any-other-so-far-in-2026.html"
  },
];

export default function HomePage() {
  // Fetch featured funds from API
  const { data: featuredData } = trpc.fund.getFeatured.useQuery({ limit: 3 });
  const featuredFunds = featuredData || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section - Exact match to staging */}
      <section className="relative hedgeco-gradient text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="hedgeco-container py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              The Leading Free Alternative Investment Database
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Access thousands of dollars worth of data, all completely{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                Free with Investor Registration
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Connect with thousands of investment professionals and access comprehensive data on 
              hedge funds, private equity, venture capital, crypto funds, and SPVs worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-hedgeco-primary-dark hover:bg-white/90 text-lg px-8" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" asChild>
                <Link href="/funds">Browse Funds</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-hedgeco-light border-b border-hedgeco-border">
        <div className="hedgeco-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">{stat.value}</div>
                <div className="text-sm text-hedgeco-text">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Asset Classes Section */}
      <section className="hedgeco-section-padding bg-white">
        <div className="hedgeco-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-4">
              Alternative Investment Asset Classes
            </h2>
            <p className="text-lg text-hedgeco-text max-w-3xl mx-auto">
              Access comprehensive data across all major alternative investment categories with 
              detailed performance metrics, fund profiles, and manager information.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assetClasses.map((asset) => (
              <Card key={asset.name} className="hedgeco-card">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${asset.color} flex items-center justify-center`}>
                      <asset.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-hedgeco-text-dark">{asset.count}</div>
                      <div className="text-sm text-hedgeco-text-light">Funds</div>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{asset.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hedgeco-text">
                    {asset.description}
                  </CardDescription>
                  <Button variant="ghost" className="mt-4 p-0 h-auto text-hedgeco-primary hover:text-hedgeco-primary-dark" asChild>
                    <Link href={`/funds?type=${asset.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      Explore {asset.name}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="hedgeco-section-padding bg-hedgeco-light">
        <div className="hedgeco-container">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-2">Hedge News</h2>
              <p className="text-hedgeco-text">Latest insights and analysis from the alternative investment world</p>
            </div>
            <Button variant="outline" className="border-hedgeco-border" asChild>
              <Link href="/news">
                View All News
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsArticles.slice(0, 3).map((article) => (
              <Card key={article.title} className="hedgeco-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-hedgeco-primary/10 text-hedgeco-primary border-hedgeco-primary/20">
                      {article.date}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-4 line-clamp-2">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hedgeco-text line-clamp-3">
                    {article.excerpt}
                  </CardDescription>
                  <Button variant="ghost" className="mt-4 p-0 h-auto text-hedgeco-primary hover:text-hedgeco-primary-dark" asChild>
                    <Link href={article.href}>
                      Read More
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="hedgeco-section-padding bg-white">
        <div className="hedgeco-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-hedgeco-text-dark mb-4">
              Why Choose HedgeCo.Net?
            </h2>
            <p className="text-lg text-hedgeco-text max-w-2xl mx-auto">
              Access institutional-grade alternative investment data that would typically cost $50,000+ annually from other providers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="hedgeco-card">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-hedgeco-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-hedgeco-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hedgeco-text">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hedgeco-gradient text-white">
        <div className="hedgeco-container py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Access Premium Alternative Investment Data?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join Thousands of investment professionals who rely on HedgeCo.Net for their alternative investment research.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-hedgeco-primary-dark hover:bg-white/90 text-lg px-8" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" asChild>
              <Link href="/funds">Explore Funds</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}