"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactTable, Contact } from "@/components/crm/ContactTable";
import { ContactCard } from "@/components/crm/ContactCard";
import { ContactModal } from "@/components/crm/ContactModal";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { DealModal } from "@/components/crm/DealModal";
import type { Deal } from "@/components/crm/DealCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Plus,
  UserPlus,
} from "lucide-react";
import { subDays } from "date-fns";

// Mock data
const mockContacts: Contact[] = [
  { id: "1", name: "Michael Chen", email: "mchen@citadel.com", phone: "+1 212 555 0101", company: "Citadel", role: "Portfolio Manager", stage: "qualified", value: 250000, lastContact: subDays(new Date(), 2), tags: ["VIP", "Q1 Target"] },
  { id: "2", name: "Sarah Johnson", email: "sjohnson@blackrock.com", company: "BlackRock", role: "Director of Investments", stage: "negotiation", value: 500000, lastContact: subDays(new Date(), 5) },
  { id: "3", name: "James Wilson", email: "jwilson@kkr.com", company: "KKR", role: "Managing Director", stage: "prospect", value: 175000, lastContact: subDays(new Date(), 1) },
  { id: "4", name: "Emily Davis", email: "edavis@apollo.com", phone: "+1 212 555 0104", company: "Apollo Global", role: "Investment Analyst", stage: "lead", value: 75000 },
  { id: "5", name: "David Brown", email: "dbrown@carlyle.com", company: "The Carlyle Group", role: "Partner", stage: "closed", value: 350000, lastContact: subDays(new Date(), 10), tags: ["Enterprise"] },
  { id: "6", name: "Jennifer Lee", email: "jlee@bridgewater.com", company: "Bridgewater Associates", role: "Research Director", stage: "lost", value: 200000, lastContact: subDays(new Date(), 30) },
];

type PipelineStage = {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
};

const pipelineStages: PipelineStage[] = [
  {
    id: "lead",
    name: "Lead",
    color: "bg-slate-400",
    deals: [
      { id: "d1", title: "Platform License", contactName: "Emily Davis", company: "Apollo Global", value: 75000, stage: "lead", probability: 20, expectedCloseDate: subDays(new Date(), -45) },
      { id: "d2", title: "Data Feed Access", contactName: "Tom Harris", company: "Millennium", value: 45000, stage: "lead", probability: 15, expectedCloseDate: subDays(new Date(), -60) },
    ],
  },
  {
    id: "prospect",
    name: "Prospect",
    color: "bg-blue-400",
    deals: [
      { id: "d3", title: "Enterprise Suite", contactName: "James Wilson", company: "KKR", value: 175000, stage: "prospect", probability: 35, expectedCloseDate: subDays(new Date(), -30), tags: ["Enterprise"] },
    ],
  },
  {
    id: "qualified",
    name: "Qualified",
    color: "bg-amber-400",
    deals: [
      { id: "d4", title: "Full Platform Access", contactName: "Michael Chen", company: "Citadel", value: 250000, stage: "qualified", probability: 60, expectedCloseDate: subDays(new Date(), -20), tags: ["VIP", "Q1"] },
    ],
  },
  {
    id: "negotiation",
    name: "Negotiation",
    color: "bg-purple-400",
    deals: [
      { id: "d5", title: "Multi-Year License", contactName: "Sarah Johnson", company: "BlackRock", value: 500000, stage: "negotiation", probability: 80, expectedCloseDate: subDays(new Date(), -10), tags: ["Enterprise", "Strategic"] },
    ],
  },
  {
    id: "closed",
    name: "Closed Won",
    color: "bg-emerald-400",
    deals: [
      { id: "d6", title: "Standard Package", contactName: "David Brown", company: "Carlyle", value: 350000, stage: "closed", probability: 100, tags: ["Enterprise"] },
    ],
  },
];

const funnelData = [
  { name: "Leads", value: 124, fill: "#94a3b8" },
  { name: "Prospects", value: 78, fill: "#60a5fa" },
  { name: "Qualified", value: 45, fill: "#fbbf24" },
  { name: "Negotiation", value: 23, fill: "#a78bfa" },
  { name: "Closed", value: 12, fill: "#34d399" },
];

const conversionData = [
  { name: "Lead → Prospect", rate: 63 },
  { name: "Prospect → Qualified", rate: 58 },
  { name: "Qualified → Negotiation", rate: 51 },
  { name: "Negotiation → Closed", rate: 52 },
];

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState("contacts");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealStageId, setDealStageId] = useState<string>("");

  const totalPipelineValue = pipelineStages
    .flatMap((s) => s.deals)
    .reduce((sum, d) => sum + d.value, 0);

  const weightedPipelineValue = pipelineStages
    .flatMap((s) => s.deals)
    .reduce((sum, d) => sum + (d.value * d.probability) / 100, 0);

  const handleSaveContact = async (contact: Partial<Contact>) => {
    console.log("Saving contact:", contact);
    // TODO: API call
    await new Promise((r) => setTimeout(r, 500));
  };

  const handleSaveDeal = async (deal: Partial<Deal>) => {
    console.log("Saving deal:", deal);
    // TODO: API call
    await new Promise((r) => setTimeout(r, 500));
  };

  const handleAddDeal = (stageId: string) => {
    setDealStageId(stageId);
    setEditingDeal(null);
    setDealModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
          <p className="text-slate-600">Manage contacts, deals, and pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setEditingContact(null);
              setContactModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setEditingDeal(null);
              setDealStageId("lead");
              setDealModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Contacts</p>
                <p className="text-2xl font-bold">{mockContacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pipeline Value</p>
                <p className="text-2xl font-bold">${(totalPipelineValue / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Weighted Value</p>
                <p className="text-2xl font-bold">${(weightedPipelineValue / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Win Rate</p>
                <p className="text-2xl font-bold">24%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>All Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactTable
                    contacts={mockContacts}
                    onContactClick={setSelectedContact}
                    onContactEdit={(contact) => {
                      setEditingContact(contact);
                      setContactModalOpen(true);
                    }}
                    onContactDelete={(id) => console.log("Delete:", id)}
                  />
                </CardContent>
              </Card>
            </div>
            <div>
              {selectedContact ? (
                <ContactCard
                  contact={selectedContact}
                  onClose={() => setSelectedContact(null)}
                  onEdit={() => {
                    setEditingContact(selectedContact);
                    setContactModalOpen(true);
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-slate-500">
                    Select a contact to view details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineBoard
                stages={pipelineStages}
                onDealClick={(deal) => {
                  setEditingDeal(deal);
                  setDealModalOpen(true);
                }}
                onAddDeal={handleAddDeal}
                onDealMove={(dealId, from, to) =>
                  console.log(`Move ${dealId} from ${from} to ${to}`)
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel dataKey="value" data={funnelData} isAnimationActive>
                        <LabelList
                          position="right"
                          fill="#374151"
                          stroke="none"
                          dataKey="name"
                        />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [typeof value === 'number' ? `${value}%` : String(value), "Conversion Rate"]} />
                      <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-slate-900">124</p>
                    <p className="text-sm text-slate-500">New Leads</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-slate-900">12</p>
                    <p className="text-sm text-slate-500">Deals Closed</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-emerald-600">$847K</p>
                    <p className="text-sm text-slate-500">Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-slate-900">18 days</p>
                    <p className="text-sm text-slate-500">Avg Sales Cycle</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        contact={editingContact}
        onSave={handleSaveContact}
      />

      <DealModal
        open={dealModalOpen}
        onOpenChange={setDealModalOpen}
        deal={editingDeal}
        stages={pipelineStages.map((s) => ({ id: s.id, name: s.name }))}
        onSave={handleSaveDeal}
      />
    </div>
  );
}
