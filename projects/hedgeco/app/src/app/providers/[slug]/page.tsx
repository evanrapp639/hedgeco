"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Star,
  Clock,
  Users,
  Award,
  ExternalLink,
  MessageSquare,
  Share2,
  Check,
} from "lucide-react";

// Mock data - in production would fetch from API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providersData: Record<string, any> = {
  "citco-fund-services": {
    id: "1",
    slug: "citco-fund-services",
    name: "Citco Fund Services",
    category: "Fund Administration",
    categoryId: "admin",
    tier: "featured",
    description: "Citco Fund Services is the world's leading fund administrator, serving hedge funds, private equity firms, and real estate funds across the globe. With over 70 years of experience, we provide comprehensive middle and back office solutions that enable fund managers to focus on their core investment activities.",
    longDescription: `
      <p>Founded in 1948, Citco has grown to become the largest independent fund administrator in the world. Our global presence spans over 45 countries with more than 8,000 professionals dedicated to servicing alternative investment funds.</p>
      
      <h4>Our Expertise</h4>
      <p>We specialize in providing tailored solutions for complex fund structures, including:</p>
      <ul>
        <li>Multi-strategy hedge funds</li>
        <li>Private equity and venture capital</li>
        <li>Real estate and infrastructure funds</li>
        <li>Fund of funds structures</li>
      </ul>
      
      <h4>Technology-Driven Solutions</h4>
      <p>Our proprietary technology platform, combined with strategic partnerships, delivers real-time reporting, advanced analytics, and seamless integration with your existing systems.</p>
    `,
    location: "New York, USA",
    headquarters: "Curacao, Netherlands Antilles",
    founded: 1948,
    employees: "8,000+",
    website: "https://www.citco.com",
    email: "info@citco.com",
    phone: "+1 (212) 555-0100",
    rating: 4.9,
    reviewCount: 127,
    services: [
      {
        name: "Fund Accounting",
        description: "Comprehensive NAV calculation, portfolio accounting, and financial reporting",
      },
      {
        name: "Investor Services",
        description: "Capital activity processing, investor reporting, and AML/KYC compliance",
      },
      {
        name: "Middle Office",
        description: "Trade capture, reconciliation, and collateral management",
      },
      {
        name: "Regulatory Reporting",
        description: "Form PF, AIFMD, CPO-PQR, and other regulatory filings",
      },
      {
        name: "Tax Services",
        description: "K-1 preparation, FATCA/CRS reporting, and tax advisory",
      },
      {
        name: "Risk Analytics",
        description: "Portfolio analytics, risk reporting, and compliance monitoring",
      },
    ],
    awards: [
      "Best Fund Administrator 2025 - Hedge Fund Journal",
      "Technology Innovation Award 2024 - Global Custodian",
      "Best Client Service 2024 - Fund Intelligence",
    ],
    clients: "1,500+ funds globally",
    aum: "$2 trillion in assets under administration",
    relatedProviders: ["goldman-sachs-prime", "pwc-asset-management", "dechert-llp"],
  },
  "dechert-llp": {
    id: "2",
    slug: "dechert-llp",
    name: "Dechert LLP",
    category: "Legal",
    categoryId: "legal",
    tier: "featured",
    description: "Dechert LLP is a premier global law firm with deep expertise in investment management and alternative investments.",
    longDescription: `<p>Dechert's financial services practice is consistently ranked among the top globally, advising hedge funds, private equity firms, and institutional investors on their most complex matters.</p>`,
    location: "Philadelphia, USA",
    headquarters: "Philadelphia, PA, USA",
    founded: 1875,
    employees: "1,000+",
    website: "https://www.dechert.com",
    email: "info@dechert.com",
    phone: "+1 (215) 555-0200",
    rating: 4.8,
    reviewCount: 89,
    services: [
      { name: "Fund Formation", description: "Structuring and launching hedge funds and PE funds" },
      { name: "Regulatory Compliance", description: "SEC, CFTC, NFA compliance advisory" },
      { name: "M&A Advisory", description: "Buy-side and sell-side transactions" },
    ],
    awards: ["Top Tier - Chambers Global 2025"],
    clients: "500+ fund managers",
    aum: "N/A",
    relatedProviders: ["citco-fund-services", "akin-gump"],
  },
};

const relatedProvidersData = [
  {
    id: "4",
    slug: "goldman-sachs-prime",
    name: "Goldman Sachs Prime Services",
    category: "Prime Broker",
    tier: "premium",
    rating: 4.9,
  },
  {
    id: "3",
    slug: "pwc-asset-management",
    name: "PwC Asset Management",
    category: "Audit & Tax",
    tier: "featured",
    rating: 4.7,
  },
  {
    id: "2",
    slug: "dechert-llp",
    name: "Dechert LLP",
    category: "Legal",
    tier: "featured",
    rating: 4.8,
  },
];

const tierColors = {
  featured: "bg-amber-100 text-amber-800 border-amber-200",
  premium: "bg-blue-100 text-blue-800 border-blue-200",
  basic: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ProviderDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Get provider data (mock - would be API call)
  const provider = providersData[slug] || providersData["citco-fund-services"];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          href="/providers" 
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Providers
        </Link>

        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-10 w-10 text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{provider.name}</h1>
                    <Badge className={tierColors[provider.tier as keyof typeof tierColors]}>
                      {provider.tier === "featured" && <Star className="h-3 w-3 mr-1 fill-amber-500" />}
                      {provider.tier.charAt(0).toUpperCase() + provider.tier.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 mb-3">
                    <Badge variant="secondary">{provider.category}</Badge>
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      {provider.location}
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {provider.rating} ({provider.reviewCount} reviews)
                    </span>
                  </div>
                  <p className="text-slate-600 max-w-2xl">{provider.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About {provider.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: provider.longDescription }}
                    />
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <Clock className="h-5 w-5 mx-auto text-slate-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">{provider.founded}</div>
                        <div className="text-xs text-slate-500">Founded</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <Users className="h-5 w-5 mx-auto text-slate-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">{provider.employees}</div>
                        <div className="text-xs text-slate-500">Employees</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <Building2 className="h-5 w-5 mx-auto text-slate-500 mb-2" />
                        <div className="text-xl font-bold text-slate-900">{provider.clients}</div>
                        <div className="text-xs text-slate-500">Clients</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <Award className="h-5 w-5 mx-auto text-slate-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">{provider.awards?.length || 0}</div>
                        <div className="text-xs text-slate-500">Awards</div>
                      </div>
                    </div>

                    {/* Awards */}
                    {provider.awards && provider.awards.length > 0 && (
                      <div className="mt-8">
                        <h4 className="font-semibold text-slate-900 mb-4">Awards & Recognition</h4>
                        <div className="space-y-2">
                          {provider.awards.map((award: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <Award className="h-4 w-4 text-amber-500" />
                              {award}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <CardTitle>Services Offered</CardTitle>
                    <CardDescription>
                      Comprehensive solutions for alternative investment managers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {provider.services.map((service: any, i: number) => (
                        <div key={i} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <div>
                              <h4 className="font-medium text-slate-900">{service.name}</h4>
                              <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Reviews</CardTitle>
                    <CardDescription>
                      {provider.reviewCount} verified reviews from clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Reviews Coming Soon</h3>
                      <p className="text-slate-500 mb-4">
                        Client reviews will be available in an upcoming release.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-slate-600">Headquarters</div>
                    <div className="font-medium text-slate-900">{provider.headquarters}</div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-slate-600">Website</div>
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {provider.website.replace("https://", "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-slate-600">Email</div>
                    <a href={`mailto:${provider.email}`} className="font-medium text-blue-600 hover:underline">
                      {provider.email}
                    </a>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-slate-600">Phone</div>
                    <div className="font-medium text-slate-900">{provider.phone}</div>
                  </div>
                </div>
                
                <Button className="w-full mt-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Related Providers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Providers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedProvidersData.slice(0, 3).map((related) => (
                  <Link 
                    key={related.id} 
                    href={`/providers/${related.slug}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">
                        {related.name}
                      </div>
                      <div className="text-xs text-slate-500">{related.category}</div>
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                      {related.rating}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
