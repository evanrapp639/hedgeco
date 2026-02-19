import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  TrendingUp,
  Users,
  Shield,
  Globe,
  BarChart3,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Lock,
  Target,
  PieChart,
} from "lucide-react";

// SPV Types
const spvTypes = [
  {
    name: "Deal-Specific SPVs",
    description: "Single-asset vehicles created for specific private equity deals, real estate transactions, or venture capital rounds.",
    features: ["Single investment focus", "Limited duration", "Specific deal terms", "Targeted investor group"],
    icon: Target,
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Fund-of-One SPVs",
    description: "Customized vehicles for single institutional investors or family offices to access specific strategies.",
    features: ["Custom mandate", "Direct manager access", "Tailored reporting", "Exclusive terms"],
    icon: Users,
    color: "from-green-500 to-green-600",
  },
  {
    name: "Co-Investment SPVs",
    description: "Structures that allow multiple investors to participate together in specific investment opportunities.",
    features: ["Shared economics", "Reduced minimums", "Diversified access", "Collaborative due diligence"],
    icon: PieChart,
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Secondary SPVs",
    description: "Vehicles created to facilitate secondary transactions in private equity, venture capital, or real estate.",
    features: ["Liquidity solutions", "Portfolio restructuring", "Estate planning", "Strategic exits"],
    icon: TrendingUp,
    color: "from-orange-500 to-orange-600",
  },
];

// Benefits of SPVs
const benefits = [
  {
    title: "Access to Exclusive Deals",
    description: "Gain entry to premium investment opportunities typically reserved for large institutions.",
    icon: Lock,
  },
  {
    title: "Reduced Minimums",
    description: "Participate in high-quality investments with lower capital requirements than traditional funds.",
    icon: DollarSign,
  },
  {
    title: "Enhanced Control",
    description: "Maintain greater influence over investment terms, strategy, and exit timing.",
    icon: Shield,
  },
  {
    title: "Portfolio Diversification",
    description: "Add specific asset classes or strategies to your portfolio without broad fund commitments.",
    icon: PieChart,
  },
  {
    title: "Transparent Structure",
    description: "Clear fee arrangements, direct asset ownership, and simplified reporting.",
    icon: CheckCircle,
  },
  {
    title: "Global Opportunities",
    description: "Access international deals and cross-border investments through properly structured vehicles.",
    icon: Globe,
  },
];

// Featured SPV Opportunities
const featuredOpportunities = [
  {
    title: "AI Infrastructure Fund SPV",
    category: "Technology",
    target: "$25M",
    status: "Open",
    description: "Co-investment opportunity in AI compute infrastructure with leading data center operator.",
    investors: "12/25 slots filled",
  },
  {
    title: "European Real Estate Debt SPV",
    category: "Real Estate",
    target: "$50M",
    status: "Open",
    description: "Senior secured lending to prime commercial properties in major European cities.",
    investors: "8/15 slots filled",
  },
  {
    title: "Biotech Venture Round SPV",
    category: "Healthcare",
    target: "$15M",
    status: "Closing Soon",
    description: "Series B participation in groundbreaking gene therapy platform.",
    investors: "18/20 slots filled",
  },
];

export default function SPVPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative hedgeco-gradient text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="hedgeco-container py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              Special Purpose Vehicles
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Access Exclusive Investment Opportunities Through{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                SPV Structures
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Special Purpose Vehicles (SPVs) provide flexible, targeted access to premium alternative 
              investments with reduced minimums and enhanced control over specific deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-hedgeco-primary-dark hover:bg-white/90 text-lg px-8" asChild>
                <Link href="/register">
                  Explore SPV Opportunities
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" asChild>
                <Link href="#learn-more">Learn About SPVs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-hedgeco-light border-b border-hedgeco-border">
        <div className="hedgeco-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">275+</div>
              <div className="text-sm text-hedgeco-text">Active SPVs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">$4.2B+</div>
              <div className="text-sm text-hedgeco-text">Capital Deployed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">89%</div>
              <div className="text-sm text-hedgeco-text">IRR Average</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">2,500+</div>
              <div className="text-sm text-hedgeco-text">Investor Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* What are SPVs Section */}
      <section id="learn-more" className="hedgeco-section-padding bg-white">
        <div className="hedgeco-container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-4">
              What Are Special Purpose Vehicles (SPVs)?
            </h2>
            <p className="text-lg text-hedgeco-text">
              SPVs are legal entities created for a specific, limited purpose, typically to isolate 
              financial risk. In alternative investments, SPVs allow investors to participate in 
              individual deals or specific strategies without committing to entire funds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {spvTypes.map((type) => (
              <Card key={type.name} className="hedgeco-card">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hedgeco-text mb-4">
                    {type.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-hedgeco-text">
                        <CheckCircle className="h-4 w-4 text-hedgeco-primary mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-4">
              Benefits of SPV Investing
            </h2>
            <p className="text-lg text-hedgeco-text max-w-3xl mx-auto">
              SPVs offer unique advantages for both accredited investors and fund managers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-hedgeco-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-8 w-8 text-hedgeco-primary" />
                </div>
                <h3 className="text-xl font-semibold text-hedgeco-text-dark mb-2">
                  {benefit.title}
                </h3>
                <p className="text-hedgeco-text">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="hedgeco-section-padding bg-hedgeco-light">
        <div className="hedgeco-container">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-2">
                Featured SPV Opportunities
              </h2>
              <p className="text-hedgeco-text">
                Current SPV offerings available to accredited investors
              </p>
            </div>
            <Button variant="outline" className="border-hedgeco-border" asChild>
              <Link href="/spv/opportunities">
                View All Opportunities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredOpportunities.map((opportunity) => (
              <Card key={opportunity.title} className="hedgeco-card">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={
                      opportunity.status === "Open" 
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }>
                      {opportunity.status}
                    </Badge>
                    <Badge variant="outline">{opportunity.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                  <div className="text-2xl font-bold text-hedgeco-text-dark mt-2">
                    {opportunity.target}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hedgeco-text mb-4">
                    {opportunity.description}
                  </CardDescription>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-hedgeco-text-light">
                      {opportunity.investors}
                    </div>
                    <Button size="sm" className="hedgeco-button-primary" asChild>
                      <Link href={`/spv/opportunities/${opportunity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="hedgeco-section-padding bg-white">
        <div className="hedgeco-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-4">
              How SPV Investing Works
            </h2>
            <p className="text-lg text-hedgeco-text max-w-3xl mx-auto">
              A streamlined process from discovery to investment
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-hedgeco-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Discover</h3>
              <p className="text-hedgeco-text">
                Browse curated SPV opportunities across asset classes
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-hedgeco-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Review</h3>
              <p className="text-hedgeco-text">
                Access detailed deal memos, financials, and legal documents
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-hedgeco-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Commit</h3>
              <p className="text-hedgeco-text">
                Submit your investment commitment through secure platform
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-hedgeco-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-lg mb-2">Monitor</h3>
              <p className="text-hedgeco-text">
                Track performance and receive regular updates on your investment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hedgeco-gradient text-white">
        <div className="hedgeco-container py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Access Premium SPV Opportunities?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of accredited investors who use HedgeCo.Net to discover and invest in exclusive SPV deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-hedgeco-primary-dark hover:bg-white/90 text-lg px-8" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" asChild>
              <Link href="/contact">Schedule a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}