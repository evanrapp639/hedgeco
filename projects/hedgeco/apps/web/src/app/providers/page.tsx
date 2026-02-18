"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Building2,
  Scale,
  Calculator,
  Briefcase,
  Shield,
  Globe,
  Star,
  MapPin,
  ExternalLink,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";

// Mock provider data
const categories = [
  { id: "legal", label: "Legal", icon: Scale, count: 45 },
  { id: "audit", label: "Audit & Tax", icon: Calculator, count: 32 },
  { id: "prime", label: "Prime Broker", icon: Briefcase, count: 18 },
  { id: "admin", label: "Fund Administration", icon: Building2, count: 56 },
  { id: "compliance", label: "Compliance", icon: Shield, count: 24 },
  { id: "technology", label: "Technology", icon: Globe, count: 38 },
];

const featuredProviders = [
  {
    id: "1",
    slug: "citco-fund-services",
    name: "Citco Fund Services",
    category: "Fund Administration",
    categoryId: "admin",
    description: "Global leader in fund administration services with over 70 years of experience serving hedge funds and private equity.",
    location: "New York, USA",
    tier: "featured" as const,
    rating: 4.9,
    reviewCount: 127,
    services: ["Fund Accounting", "NAV Calculation", "Investor Services"],
    logo: null,
  },
  {
    id: "2",
    slug: "dechert-llp",
    name: "Dechert LLP",
    category: "Legal",
    categoryId: "legal",
    description: "Premier law firm specializing in investment management, with deep expertise in hedge fund formation and regulatory compliance.",
    location: "Philadelphia, USA",
    tier: "featured" as const,
    rating: 4.8,
    reviewCount: 89,
    services: ["Fund Formation", "Regulatory Compliance", "M&A Advisory"],
    logo: null,
  },
  {
    id: "3",
    slug: "pwc-asset-management",
    name: "PwC Asset Management",
    category: "Audit & Tax",
    categoryId: "audit",
    description: "World-class audit and tax services tailored for the alternative investment industry.",
    location: "London, UK",
    tier: "featured" as const,
    rating: 4.7,
    reviewCount: 156,
    services: ["Audit Services", "Tax Advisory", "Risk Management"],
    logo: null,
  },
];

const allProviders = [
  ...featuredProviders,
  {
    id: "4",
    slug: "goldman-sachs-prime",
    name: "Goldman Sachs Prime Services",
    category: "Prime Broker",
    categoryId: "prime",
    description: "Comprehensive prime brokerage services including financing, securities lending, and capital introduction.",
    location: "New York, USA",
    tier: "premium" as const,
    rating: 4.9,
    reviewCount: 203,
    services: ["Prime Brokerage", "Securities Lending", "Capital Introduction"],
    logo: null,
  },
  {
    id: "5",
    slug: "akin-gump",
    name: "Akin Gump Strauss Hauer & Feld",
    category: "Legal",
    categoryId: "legal",
    description: "Leading law firm with extensive experience in hedge fund formation, regulatory matters, and complex transactions.",
    location: "Washington, DC, USA",
    tier: "premium" as const,
    rating: 4.6,
    reviewCount: 67,
    services: ["Fund Formation", "Regulatory", "Litigation"],
    logo: null,
  },
  {
    id: "6",
    slug: "ss-and-c-technologies",
    name: "SS&C Technologies",
    category: "Technology",
    categoryId: "technology",
    description: "Industry-leading financial technology solutions for investment managers worldwide.",
    location: "Windsor, CT, USA",
    tier: "premium" as const,
    rating: 4.5,
    reviewCount: 178,
    services: ["Portfolio Management", "Risk Analytics", "Order Management"],
    logo: null,
  },
  {
    id: "7",
    slug: "kpmg-alternatives",
    name: "KPMG Alternative Investments",
    category: "Audit & Tax",
    categoryId: "audit",
    description: "Specialized audit, tax, and advisory services for alternative investment managers.",
    location: "Chicago, USA",
    tier: "basic" as const,
    rating: 4.4,
    reviewCount: 92,
    services: ["Audit", "Tax Planning", "Valuation"],
    logo: null,
  },
  {
    id: "8",
    slug: "eze-castle-integration",
    name: "Eze Castle Integration",
    category: "Technology",
    categoryId: "technology",
    description: "IT managed services and cybersecurity solutions designed for investment firms.",
    location: "Boston, USA",
    tier: "basic" as const,
    rating: 4.3,
    reviewCount: 54,
    services: ["Managed IT", "Cybersecurity", "Cloud Services"],
    logo: null,
  },
  {
    id: "9",
    slug: "compliance-solutions",
    name: "Compliance Solutions Strategies",
    category: "Compliance",
    categoryId: "compliance",
    description: "Comprehensive compliance consulting and outsourced CCO services for investment managers.",
    location: "New York, USA",
    tier: "basic" as const,
    rating: 4.5,
    reviewCount: 38,
    services: ["Compliance Consulting", "Outsourced CCO", "SEC Exam Prep"],
    logo: null,
  },
];

const tierColors = {
  featured: "bg-amber-100 text-amber-800 border-amber-200",
  premium: "bg-blue-100 text-blue-800 border-blue-200",
  basic: "bg-slate-100 text-slate-700 border-slate-200",
};

function ProviderCard({ provider, variant = "default" }: { provider: typeof allProviders[0]; variant?: "default" | "compact" }) {
  const isCompact = variant === "compact";
  
  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${provider.tier === "featured" ? "ring-2 ring-amber-200" : ""}`}>
      <CardHeader className={isCompact ? "pb-2" : ""}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                <Link href={`/providers/${provider.slug}`}>
                  {provider.name}
                </Link>
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {provider.category}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <Badge className={`${tierColors[provider.tier]} text-xs`}>
            {provider.tier === "featured" && <Star className="h-3 w-3 mr-1 fill-amber-500" />}
            {provider.tier.charAt(0).toUpperCase() + provider.tier.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className={isCompact ? "pt-0" : ""}>
        {!isCompact && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {provider.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {provider.location}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {provider.rating} ({provider.reviewCount})
          </span>
        </div>
        
        {!isCompact && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {provider.services.slice(0, 3).map((service) => (
              <Badge key={service} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/providers/${provider.slug}`}>
              View Profile
            </Link>
          </Button>
          <Button size="sm" variant="default">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProviders = allProviders.filter((provider) => {
    const matchesSearch = 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === "all" || provider.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featured = filteredProviders.filter((p) => p.tier === "featured");
  const others = filteredProviders.filter((p) => p.tier !== "featured");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Service Providers
          </h1>
          <p className="text-slate-600">
            Find trusted service providers for your investment management needs
          </p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.id ? "all" : category.id
                )}
                className={`p-4 rounded-xl border transition-all text-left hover:shadow-md ${
                  selectedCategory === category.id
                    ? "bg-blue-50 border-blue-200 shadow-md"
                    : "bg-white border-slate-200 hover:border-blue-200"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${
                  selectedCategory === category.id ? "text-blue-600" : "text-slate-500"
                }`} />
                <div className="font-medium text-sm text-slate-900">{category.label}</div>
                <div className="text-xs text-slate-500">{category.count} providers</div>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Providers */}
        {featured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <h2 className="text-xl font-semibold text-slate-900">Featured Providers</h2>
            </div>
            <div className={`grid gap-4 ${
              viewMode === "grid" 
                ? "md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {featured.map((provider) => (
                <ProviderCard 
                  key={provider.id} 
                  provider={provider}
                  variant={viewMode === "list" ? "compact" : "default"}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Providers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {selectedCategory === "all" ? "All Providers" : categories.find(c => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-sm text-slate-500">
              {others.length} provider{others.length !== 1 ? "s" : ""}
            </span>
          </div>
          
          {others.length > 0 ? (
            <div className={`grid gap-4 ${
              viewMode === "grid" 
                ? "md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {others.map((provider) => (
                <ProviderCard 
                  key={provider.id} 
                  provider={provider}
                  variant={viewMode === "list" ? "compact" : "default"}
                />
              ))}
            </div>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No providers found</h3>
                <p className="text-slate-500 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA for Service Providers */}
        <Card className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Are you a service provider?</h3>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Join HedgeCo.Net and connect with thousands of fund managers and investors looking for your services.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/register?role=provider">
                List Your Services <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
