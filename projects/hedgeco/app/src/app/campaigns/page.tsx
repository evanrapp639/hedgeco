"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Mail,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Users,
  Send,
  Clock,
  Check,
  X,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  audience: string;
  audienceCount: number;
  scheduledFor?: string;
  sentAt?: string;
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}

const sampleCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Q1 Newsletter",
    subject: "HedgeCo Q1 2026 Insights & Updates",
    status: "sent",
    audience: "All subscribers",
    audienceCount: 15420,
    sentAt: "Feb 15, 2026",
    stats: { sent: 15420, delivered: 15100, opened: 8540, clicked: 2130 },
  },
  {
    id: "2",
    name: "New Fund Alert",
    subject: "Exclusive: New Top-Tier Hedge Fund Now Listed",
    status: "scheduled",
    audience: "Premium members",
    audienceCount: 3250,
    scheduledFor: "Feb 20, 2026 at 9:00 AM ET",
  },
  {
    id: "3",
    name: "Conference Reminder",
    subject: "Don't Miss: HedgeCo Summit 2026",
    status: "sending",
    audience: "Conference registrants",
    audienceCount: 890,
    stats: { sent: 450, delivered: 445, opened: 0, clicked: 0 },
  },
  {
    id: "4",
    name: "Welcome Series - Day 1",
    subject: "Welcome to HedgeCo! Here's what you need to know",
    status: "draft",
    audience: "New users",
    audienceCount: 0,
  },
];

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600", icon: Edit },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: Clock },
  sending: { label: "Sending", color: "bg-amber-100 text-amber-700", icon: Send },
  sent: { label: "Sent", color: "bg-emerald-100 text-emerald-700", icon: Check },
  paused: { label: "Paused", color: "bg-red-100 text-red-700", icon: Pause },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState(sampleCampaigns);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  const handleDuplicate = (id: string) => {
    const original = campaigns.find((c) => c.id === id);
    if (original) {
      setCampaigns([
        ...campaigns,
        { 
          ...original, 
          id: Date.now().toString(), 
          name: `${original.name} (Copy)`, 
          status: "draft",
          stats: undefined,
          sentAt: undefined,
          scheduledFor: undefined,
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Email Campaigns</h1>
              <p className="text-slate-600 mt-1">
                Create and manage email campaigns
              </p>
            </div>
            <Link href="/campaigns/builder">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="container mx-auto px-4 py-8">
        {filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={Mail}
            title={search || statusFilter !== "all" ? "No campaigns found" : "No campaigns yet"}
            description={search || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first email campaign to engage your audience"}
            action={
              !search && statusFilter === "all" ? (
                <Link href="/campaigns/builder">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}>
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredCampaigns.map((campaign) => {
              const status = statusConfig[campaign.status];
              const StatusIcon = status.icon;
              
              return (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {campaign.name}
                            </h3>
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 truncate mb-2">
                            {campaign.subject}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {campaign.audience}
                              {campaign.audienceCount > 0 && ` (${campaign.audienceCount.toLocaleString()})`}
                            </span>
                            {campaign.scheduledFor && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {campaign.scheduledFor}
                              </span>
                            )}
                            {campaign.sentAt && (
                              <span className="flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" />
                                Sent {campaign.sentAt}
                              </span>
                            )}
                          </div>
                          
                          {/* Stats for sent campaigns */}
                          {campaign.stats && campaign.status === "sent" && (
                            <div className="flex gap-4 mt-3 pt-3 border-t">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-slate-900">
                                  {((campaign.stats.delivered / campaign.stats.sent) * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500">Delivered</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-slate-900">
                                  {((campaign.stats.opened / campaign.stats.delivered) * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500">Opened</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-slate-900">
                                  {((campaign.stats.clicked / campaign.stats.delivered) * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500">Clicked</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === "sent" && (
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Stats
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/campaigns/builder?id=${campaign.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(campaign.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
