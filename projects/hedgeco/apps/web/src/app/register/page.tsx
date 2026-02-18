"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  Target,
  LineChart,
  Building2,
  Newspaper,
  ArrowRight,
  Loader2,
} from "lucide-react";

const userTypes = [
  {
    id: "investor",
    label: "Investor",
    icon: Target,
    color: "blue",
    description: "Access fund data and connect with managers",
  },
  {
    id: "manager",
    label: "Fund Manager",
    icon: LineChart,
    color: "green",
    description: "List your fund and reach investors",
  },
  {
    id: "provider",
    label: "Service Provider",
    icon: Building2,
    color: "purple",
    description: "Showcase services to the industry",
  },
  {
    id: "news",
    label: "News Member",
    icon: Newspaper,
    color: "orange",
    description: "Access news and basic fund info",
  },
];

const investorTypes = [
  { value: "INDIVIDUAL", label: "Individual Investor" },
  { value: "FAMILY_OFFICE", label: "Family Office" },
  { value: "INSTITUTIONAL", label: "Institutional Investor" },
  { value: "FUND_OF_FUNDS", label: "Fund of Funds" },
  { value: "ENDOWMENT", label: "Endowment" },
  { value: "PENSION", label: "Pension Fund" },
  { value: "RIA", label: "Registered Investment Advisor" },
  { value: "BANK", label: "Bank / Financial Institution" },
  { value: "INSURANCE", label: "Insurance Company" },
];

const fundTypes = [
  { value: "HEDGE_FUND", label: "Hedge Fund" },
  { value: "PRIVATE_EQUITY", label: "Private Equity" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "REAL_ESTATE", label: "Real Estate Fund" },
  { value: "CRYPTO", label: "Crypto / Digital Assets" },
  { value: "SPV", label: "SPV / Co-Investment" },
  { value: "FUND_OF_FUNDS", label: "Fund of Funds" },
  { value: "CREDIT", label: "Credit / Fixed Income" },
];

const providerCategories = [
  { value: "legal", label: "Legal Services" },
  { value: "accounting", label: "Accounting & Audit" },
  { value: "administration", label: "Fund Administration" },
  { value: "prime_brokerage", label: "Prime Brokerage" },
  { value: "technology", label: "Technology & Software" },
  { value: "compliance", label: "Compliance & Regulatory" },
  { value: "marketing", label: "Marketing & IR" },
  { value: "recruiting", label: "Recruiting & HR" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
];

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const initialType = searchParams.get("type") || "investor";
  const [activeTab, setActiveTab] = useState(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type && userTypes.some((t) => t.id === type)) {
      setActiveTab(type);
    }
  }, [searchParams]);

  const getRoleFromTab = (tab: string): string => {
    const mapping: Record<string, string> = {
      investor: "INVESTOR",
      manager: "MANAGER",
      provider: "SERVICE_PROVIDER",
      news: "NEWS_MEMBER",
    };
    return mapping[tab] || "INVESTOR";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    const registrationData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      role: getRoleFromTab(activeTab),
      company: formData.get("company") as string || undefined,
      title: formData.get("title") as string || undefined,
      investorType: formData.get("investorType") as string || undefined,
      fundType: formData.get("fundType") as string || undefined,
      category: formData.get("category") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      website: formData.get("website") as string || undefined,
      description: formData.get("description") as string || undefined,
    };

    // Validate passwords match
    const confirmPassword = formData.get("confirmPassword") as string;
    if (registrationData.password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    const result = await register(registrationData);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Registration failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
          <p className="text-slate-600">
            Join 15,000+ professionals on HedgeCo.Net
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-auto p-1">
                {userTypes.map((type) => (
                  <TabsTrigger
                    key={type.id}
                    value={type.id}
                    className="flex flex-col items-center py-3 px-2 data-[state=active]:bg-white"
                  >
                    <type.icon className={`h-5 w-5 mb-1 text-${type.color}-600`} />
                    <span className="text-xs font-medium">{type.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Investor Registration */}
              <TabsContent value="investor" className="mt-6">
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                        {error}
                      </div>
                    )}

                    <div className="bg-hedgeco-primary/10 border border-hedgeco-primary/20 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-hedgeco-primary-dark mb-1">Investor Account</h3>
                      <p className="text-sm text-hedgeco-primary">
                        Get access to detailed fund data, performance metrics, and direct manager connections.
                        Accreditation verification required for full access.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inv-firstName">First Name *</Label>
                        <Input id="inv-firstName" name="firstName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv-lastName">Last Name *</Label>
                        <Input id="inv-lastName" name="lastName" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inv-email">Email Address *</Label>
                      <Input id="inv-email" name="email" type="email" required />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inv-password">Password *</Label>
                        <Input id="inv-password" name="password" type="password" required minLength={8} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv-confirmPassword">Confirm Password *</Label>
                        <Input id="inv-confirmPassword" name="confirmPassword" type="password" required />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inv-company">Company / Organization</Label>
                        <Input id="inv-company" name="company" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv-title">Title</Label>
                        <Input id="inv-title" name="title" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inv-investorType">Investor Type *</Label>
                      <Select name="investorType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investor type" />
                        </SelectTrigger>
                        <SelectContent>
                          {investorTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="inv-terms"
                        name="terms"
                        required
                        className="mt-1"
                      />
                      <Label htmlFor="inv-terms" className="text-sm font-normal">
                        I agree to the{" "}
                        <Link href="/terms" className="text-hedgeco-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-hedgeco-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Investor Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>

              {/* Fund Manager Registration */}
              <TabsContent value="manager" className="mt-6">
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-green-900 mb-1">Fund Manager Account</h3>
                      <p className="text-sm text-green-700">
                        List your fund, track performance, and connect with qualified investors.
                        Free basic listing, premium features available.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mgr-firstName">First Name *</Label>
                        <Input id="mgr-firstName" name="firstName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mgr-lastName">Last Name *</Label>
                        <Input id="mgr-lastName" name="lastName" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mgr-email">Email Address *</Label>
                      <Input id="mgr-email" name="email" type="email" required />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mgr-password">Password *</Label>
                        <Input id="mgr-password" name="password" type="password" required minLength={8} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mgr-confirmPassword">Confirm Password *</Label>
                        <Input id="mgr-confirmPassword" name="confirmPassword" type="password" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mgr-company">Fund / Firm Name *</Label>
                      <Input id="mgr-company" name="company" required />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mgr-title">Your Title *</Label>
                        <Input id="mgr-title" name="title" required placeholder="e.g., Managing Partner" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mgr-fundType">Primary Fund Type *</Label>
                        <Select name="fundType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fund type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fundTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mgr-phone">Phone Number</Label>
                      <Input id="mgr-phone" name="phone" type="tel" />
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="mgr-terms"
                        name="terms"
                        required
                        className="mt-1"
                      />
                      <Label htmlFor="mgr-terms" className="text-sm font-normal">
                        I agree to the{" "}
                        <Link href="/terms" className="text-hedgeco-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-hedgeco-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Account..." : "Create Manager Account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>

              {/* Service Provider Registration */}
              <TabsContent value="provider" className="mt-6">
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-purple-900 mb-1">Service Provider Account</h3>
                      <p className="text-sm text-purple-700">
                        Get listed in our directory of 1,300+ service providers.
                        Connect with fund managers and investors looking for your services.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prov-firstName">First Name *</Label>
                        <Input id="prov-firstName" name="firstName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prov-lastName">Last Name *</Label>
                        <Input id="prov-lastName" name="lastName" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prov-email">Email Address *</Label>
                      <Input id="prov-email" name="email" type="email" required />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prov-password">Password *</Label>
                        <Input id="prov-password" name="password" type="password" required minLength={8} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prov-confirmPassword">Confirm Password *</Label>
                        <Input id="prov-confirmPassword" name="confirmPassword" type="password" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prov-company">Company Name *</Label>
                      <Input id="prov-company" name="company" required />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prov-title">Your Title *</Label>
                        <Input id="prov-title" name="title" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prov-category">Primary Category *</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerCategories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prov-website">Website</Label>
                      <Input id="prov-website" name="website" type="url" placeholder="https://" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prov-description">Brief Description</Label>
                      <Textarea
                        id="prov-description"
                        name="description"
                        placeholder="Describe your services..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="prov-terms"
                        name="terms"
                        required
                        className="mt-1"
                      />
                      <Label htmlFor="prov-terms" className="text-sm font-normal">
                        I agree to the{" "}
                        <Link href="/terms" className="text-hedgeco-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-hedgeco-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Account..." : "Create Provider Account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>

              {/* News Member Registration */}
              <TabsContent value="news" className="mt-6">
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-orange-900 mb-1">News Member Account</h3>
                      <p className="text-sm text-orange-700">
                        Free access to industry news, educational content, and basic fund directory.
                        Upgrade to investor account for full access.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="news-firstName">First Name *</Label>
                        <Input id="news-firstName" name="firstName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="news-lastName">Last Name *</Label>
                        <Input id="news-lastName" name="lastName" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="news-email">Email Address *</Label>
                      <Input id="news-email" name="email" type="email" required />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="news-password">Password *</Label>
                        <Input id="news-password" name="password" type="password" required minLength={8} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="news-confirmPassword">Confirm Password *</Label>
                        <Input id="news-confirmPassword" name="confirmPassword" type="password" required />
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="news-newsletter"
                        name="newsletter"
                        defaultChecked
                        className="mt-1"
                      />
                      <Label htmlFor="news-newsletter" className="text-sm font-normal">
                        Subscribe to weekly industry newsletter
                      </Label>
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="news-terms"
                        name="terms"
                        required
                        className="mt-1"
                      />
                      <Label htmlFor="news-terms" className="text-sm font-normal">
                        I agree to the{" "}
                        <Link href="/terms" className="text-hedgeco-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-hedgeco-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Account..." : "Create News Account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Login Link */}
        <p className="text-center mt-6 text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-hedgeco-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
