"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InquiryForm, MeetingScheduler, ContactCard } from "@/components/contact";
import { 
  ArrowLeft, 
  TrendingUp, 
  Shield, 
  Users, 
  DollarSign,
  Award,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock fund data - in production would be fetched
const getFundData = (slug: string) => ({
  id: "1",
  slug,
  name: "Quantum Alpha Fund",
  strategy: "Quantitative Long/Short Equity",
  aum: "$2.4B",
  minimumInvestment: "$1,000,000",
  managementFee: "2%",
  performanceFee: "20%",
  lockup: "1 year",
  redemption: "Quarterly with 45 days notice",
  ytdReturn: "+18.4%",
  sharpeRatio: "2.1",
  company: "Quantum Capital Management",
  manager: {
    name: "Dr. James Mitchell",
    title: "Founder & Chief Investment Officer",
    avatar: "/avatars/james.jpg",
    email: "contact@quantumcapital.com",
    phone: "+1 (212) 555-0123",
    location: "New York, NY",
    linkedin: "https://linkedin.com/in/jamesmitchell",
  },
  highlights: [
    "15+ years track record",
    "Proprietary AI-driven strategy",
    "Institutional-grade risk management",
    "Monthly investor reporting",
  ],
});

export default function InquiryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const fund = getFundData(slug);
  const [activeTab, setActiveTab] = useState<"inquiry" | "schedule">("inquiry");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Link */}
        <Link href={`/funds/${slug}`}>
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fund
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-2">Investment Inquiry</Badge>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{fund.name}</h1>
          <p className="text-lg text-slate-600">{fund.strategy}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Forms */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inquiry" | "schedule")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="inquiry">Request Information</TabsTrigger>
                <TabsTrigger value="schedule">Schedule Meeting</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inquiry">
                <InquiryForm 
                  fundName={fund.name} 
                  fundSlug={slug}
                />
              </TabsContent>
              
              <TabsContent value="schedule">
                <MeetingScheduler
                  fundName={fund.name}
                  managerName={fund.manager.name}
                />
              </TabsContent>
            </Tabs>

            {/* What to Expect */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">What to Expect</h3>
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Initial Review", desc: "The fund manager reviews your investor profile" },
                    { step: 2, title: "Introduction Call", desc: "Brief call to discuss your investment objectives" },
                    { step: 3, title: "Due Diligence", desc: "Access to detailed fund materials and DDQ" },
                    { step: 4, title: "Onboarding", desc: "Complete subscription documents and funding" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                        {item.step}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="text-sm text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <ContactCard
              manager={fund.manager}
              fund={{ name: fund.name, company: fund.company, website: "https://quantumcapital.com" }}
              onScheduleMeeting={() => setActiveTab("schedule")}
              onSendMessage={() => setActiveTab("inquiry")}
            />

            {/* Fund Quick Facts */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                  Investment Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Minimum Investment</span>
                    <span className="font-medium text-slate-900">{fund.minimumInvestment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Management Fee</span>
                    <span className="font-medium text-slate-900">{fund.managementFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Performance Fee</span>
                    <span className="font-medium text-slate-900">{fund.performanceFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lockup Period</span>
                    <span className="font-medium text-slate-900">{fund.lockup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Redemption</span>
                    <span className="font-medium text-slate-900">{fund.redemption}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Snapshot */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                  Performance Snapshot
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{fund.ytdReturn}</div>
                    <div className="text-xs text-slate-500">YTD Return</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{fund.sharpeRatio}</div>
                    <div className="text-xs text-slate-500">Sharpe Ratio</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-700">{fund.aum}</div>
                    <div className="text-xs text-slate-500">AUM</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fund Highlights */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-slate-400" />
                  Highlights
                </h3>
                <ul className="space-y-2">
                  {fund.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>SEC Registered • Verified Fund</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
