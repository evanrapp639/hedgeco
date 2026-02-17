"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Check, 
  X, 
  Sparkles, 
  Building2, 
  Rocket, 
  Crown,
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTier {
  name: string;
  description: string;
  price: string;
  period: string;
  highlight?: boolean;
  badge?: string;
  icon: React.ElementType;
  features: Array<{
    name: string;
    included: boolean;
    note?: string;
  }>;
  cta: string;
  ctaVariant: "default" | "outline" | "secondary";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    description: "Perfect for emerging fund managers getting started",
    price: "$299",
    period: "/month",
    icon: Rocket,
    features: [
      { name: "Basic fund profile listing", included: true },
      { name: "Up to 100 investor views/month", included: true },
      { name: "Standard search visibility", included: true },
      { name: "Email support", included: true },
      { name: "Basic analytics dashboard", included: true },
      { name: "1 team member", included: true },
      { name: "Enhanced profile features", included: false },
      { name: "Investor inquiry management", included: false },
      { name: "Premium placement", included: false },
      { name: "Conference discounts", included: false },
    ],
    cta: "Start Free Trial",
    ctaVariant: "outline",
  },
  {
    name: "Professional",
    description: "For established funds looking to grow their investor base",
    price: "$799",
    period: "/month",
    highlight: true,
    badge: "Most Popular",
    icon: Sparkles,
    features: [
      { name: "Enhanced fund profile", included: true },
      { name: "Unlimited investor views", included: true },
      { name: "Priority search placement", included: true },
      { name: "Priority email & chat support", included: true },
      { name: "Advanced analytics dashboard", included: true },
      { name: "Up to 5 team members", included: true },
      { name: "Enhanced profile features", included: true },
      { name: "Investor inquiry management", included: true },
      { name: "Premium placement", included: false },
      { name: "20% conference discount", included: true },
    ],
    cta: "Start Free Trial",
    ctaVariant: "default",
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large funds and institutions",
    price: "Custom",
    period: "",
    icon: Crown,
    features: [
      { name: "Multiple fund profiles", included: true },
      { name: "Unlimited everything", included: true },
      { name: "Premium search placement", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom analytics & reporting", included: true },
      { name: "Unlimited team members", included: true },
      { name: "White-label options", included: true },
      { name: "API access", included: true },
      { name: "Featured fund status", included: true },
      { name: "Complimentary conference passes", included: true },
    ],
    cta: "Contact Sales",
    ctaVariant: "secondary",
  },
];

const featureMatrix = [
  { category: "Profile & Visibility", features: [
    { name: "Fund Profile Listing", starter: "Basic", professional: "Enhanced", enterprise: "Premium" },
    { name: "Monthly Investor Views", starter: "100", professional: "Unlimited", enterprise: "Unlimited" },
    { name: "Search Placement", starter: "Standard", professional: "Priority", enterprise: "Premium + Featured" },
    { name: "Profile Verification Badge", starter: false, professional: true, enterprise: true },
    { name: "Media & Document Uploads", starter: "5 files", professional: "50 files", enterprise: "Unlimited" },
  ]},
  { category: "Investor Relations", features: [
    { name: "Inquiry Management", starter: false, professional: true, enterprise: true },
    { name: "Investor CRM", starter: false, professional: "Basic", enterprise: "Advanced" },
    { name: "Automated Responses", starter: false, professional: true, enterprise: true },
    { name: "Meeting Scheduling", starter: false, professional: true, enterprise: true },
  ]},
  { category: "Analytics & Reporting", features: [
    { name: "Analytics Dashboard", starter: "Basic", professional: "Advanced", enterprise: "Custom" },
    { name: "Investor Demographics", starter: false, professional: true, enterprise: true },
    { name: "Competitor Benchmarking", starter: false, professional: false, enterprise: true },
    { name: "Custom Reports", starter: false, professional: false, enterprise: true },
  ]},
  { category: "Support & Services", features: [
    { name: "Support Channels", starter: "Email", professional: "Email + Chat", enterprise: "Dedicated Manager" },
    { name: "Response Time", starter: "48 hours", professional: "24 hours", enterprise: "4 hours" },
    { name: "Onboarding", starter: "Self-service", professional: "Guided", enterprise: "White-glove" },
    { name: "Conference Benefits", starter: false, professional: "20% discount", enterprise: "Complimentary passes" },
  ]},
];

const faqs = [
  {
    question: "Can I try HedgeCo before committing to a plan?",
    answer: "Yes! All plans come with a 14-day free trial. No credit card required. You can explore all features and decide which plan works best for your fund.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains safe. We provide a 30-day grace period after cancellation during which you can export all your data. After that, data is securely deleted per our privacy policy.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Absolutely! You can change your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the next billing cycle.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes! Annual billing saves you 20% compared to monthly payments. Contact our sales team for multi-year agreements with additional discounts.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, ACH transfers, and wire transfers for annual plans. Enterprise clients can request custom invoicing terms.",
  },
  {
    question: "Is there a minimum commitment period?",
    answer: "Monthly plans have no minimum commitment. Annual plans require a 12-month commitment but offer significant savings. Enterprise agreements are customized.",
  },
  {
    question: "How does the investor view limit work?",
    answer: "Investor views count unique visitors who view your fund profile. The Starter plan includes 100 unique views per month. Once reached, your profile remains visible but won't appear in search until the next billing cycle.",
  },
  {
    question: "Can multiple people from my team access the account?",
    answer: "Yes! Starter includes 1 user, Professional includes 5 users, and Enterprise has unlimited users. Each user gets their own login with role-based permissions.",
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const getAdjustedPrice = (price: string) => {
    if (price === "Custom") return price;
    const numPrice = parseInt(price.replace("$", ""));
    if (billingPeriod === "annual") {
      return `$${Math.round(numPrice * 0.8)}`;
    }
    return price;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your fund's needs. All plans include our core features 
            to help you connect with qualified investors.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                billingPeriod === "monthly" 
                  ? "bg-white text-indigo-600" 
                  : "text-white hover:bg-white/10"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                billingPeriod === "annual" 
                  ? "bg-white text-indigo-600" 
                  : "text-white hover:bg-white/10"
              )}
            >
              Annual
              <Badge className="bg-emerald-500 text-white text-xs">Save 20%</Badge>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 max-w-6xl -mt-12">
        <div className="grid md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.name} 
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                tier.highlight && "border-2 border-indigo-500 shadow-lg scale-105 z-10"
              )}
            >
              {tier.badge && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-indigo-500 text-white">
                    {tier.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    tier.highlight ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                  )}>
                    <tier.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      {getAdjustedPrice(tier.price)}
                    </span>
                    {tier.period && (
                      <span className="text-slate-500">{tier.period}</span>
                    )}
                  </div>
                  {billingPeriod === "annual" && tier.price !== "Custom" && (
                    <p className="text-sm text-emerald-600 mt-1">
                      Billed annually (${parseInt(getAdjustedPrice(tier.price).replace("$", "")) * 12}/year)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={cn(
                        "text-sm",
                        feature.included ? "text-slate-700" : "text-slate-400"
                      )}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={tier.ctaVariant}
                  size="lg"
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto px-4 max-w-6xl py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Compare All Features
          </h2>
          <p className="text-slate-600">
            Detailed breakdown of what's included in each plan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-4 w-1/3">Feature</th>
                <th className="text-center py-4 px-4">Starter</th>
                <th className="text-center py-4 px-4 bg-indigo-50">Professional</th>
                <th className="text-center py-4 px-4">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {featureMatrix.map((category, catIndex) => (
                <>
                  <tr key={`cat-${catIndex}`} className="bg-slate-50">
                    <td colSpan={4} className="py-3 px-4 font-semibold text-slate-900">
                      {category.category}
                    </td>
                  </tr>
                  {category.features.map((feature, featIndex) => (
                    <tr key={`feat-${catIndex}-${featIndex}`} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-slate-700">{feature.name}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.starter === "boolean" ? (
                          feature.starter ? (
                            <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-slate-600">{feature.starter}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center bg-indigo-50/50">
                        {typeof feature.professional === "boolean" ? (
                          feature.professional ? (
                            <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-indigo-600">{feature.professional}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.enterprise === "boolean" ? (
                          feature.enterprise ? (
                            <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-slate-600">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <HelpCircle className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-white rounded-lg border px-4"
              >
                <AccordionTrigger className="text-left py-4 hover:no-underline">
                  <span className="font-medium text-slate-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-slate-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Contact Sales CTA */}
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">
                  Need a Custom Solution?
                </h3>
                <p className="text-slate-300 mb-6">
                  Our Enterprise team can create a tailored package for your organization's 
                  specific needs, including white-label options and API access.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Sales
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule a Call
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-3xl opacity-30" />
                  <Building2 className="h-32 w-32 text-white/20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trust Indicators */}
      <div className="border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>SOC 2 compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
