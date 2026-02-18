"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Eye,
  Send,
  Save,
  Users,
  Calendar,
  Bold,
  Italic,
  Link2,
  Image,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Play,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudienceSegment {
  id: string;
  name: string;
  count: number;
  description: string;
}

const audienceSegments: AudienceSegment[] = [
  { id: "all", name: "All Subscribers", count: 15420, description: "Everyone on your mailing list" },
  { id: "premium", name: "Premium Members", count: 3250, description: "Users with premium subscription" },
  { id: "fund-managers", name: "Fund Managers", count: 1890, description: "Verified fund managers" },
  { id: "investors", name: "Investors", count: 5640, description: "Registered investors" },
  { id: "providers", name: "Service Providers", count: 2340, description: "Service provider accounts" },
  { id: "new-users", name: "New Users (30 days)", count: 420, description: "Users who joined in last 30 days" },
];

function CampaignBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  
  const [activeTab, setActiveTab] = React.useState("content");
  const [campaign, setCampaign] = React.useState({
    name: "",
    subject: "",
    preheader: "",
    content: "",
    selectedAudiences: [] as string[],
    schedule: {
      frequency: "weekly" as const,
      time: "09:00",
      timezone: "America/New_York",
    },
    sendNow: true,
    scheduledDate: "",
  });
  const [showPreview, setShowPreview] = React.useState(false);

  const updateCampaign = (updates: Partial<typeof campaign>) => {
    setCampaign({ ...campaign, ...updates });
  };

  const toggleAudience = (id: string) => {
    const current = campaign.selectedAudiences;
    const updated = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id];
    updateCampaign({ selectedAudiences: updated });
  };

  const selectedCount = campaign.selectedAudiences.reduce((sum, id) => {
    const segment = audienceSegments.find((s) => s.id === id);
    return sum + (segment?.count || 0);
  }, 0);

  const handleSave = () => {
    console.log("Saving campaign:", campaign);
    router.push("/campaigns");
  };

  const handleSendTest = () => {
    alert("Test email sent to your address!");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {editId ? "Edit Campaign" : "Create Campaign"}
                </h1>
                <p className="text-sm text-slate-500">
                  {campaign.name || "Untitled campaign"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
                className="hidden md:flex"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={handleSendTest}>
                <Send className="h-4 w-4 mr-2" />
                Send Test
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className={`grid gap-8 ${showPreview ? "lg:grid-cols-2" : "max-w-3xl mx-auto"}`}>
          {/* Editor */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="content" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="audience" className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  Audience
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-6 space-y-6">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name (internal)</Label>
                  <Input
                    id="name"
                    value={campaign.name}
                    onChange={(e) => updateCampaign({ name: e.target.value })}
                    placeholder="Q1 Newsletter"
                  />
                </div>

                {/* Subject Line */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={campaign.subject}
                    onChange={(e) => updateCampaign({ subject: e.target.value })}
                    placeholder="Your monthly hedge fund insights"
                  />
                  <p className="text-xs text-slate-500">
                    {campaign.subject.length}/100 characters
                  </p>
                </div>

                {/* Preheader */}
                <div className="space-y-2">
                  <Label htmlFor="preheader">Preheader Text (optional)</Label>
                  <Input
                    id="preheader"
                    value={campaign.preheader}
                    onChange={(e) => updateCampaign({ preheader: e.target.value })}
                    placeholder="Preview text shown in inbox"
                  />
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <Label>Email Content</Label>
                  <Card>
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b flex-wrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Undo className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Redo className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-slate-200 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Italic className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-slate-200 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-slate-200 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <List className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Image className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Editor Area */}
                    <Textarea
                      value={campaign.content}
                      onChange={(e) => updateCampaign({ content: e.target.value })}
                      placeholder="Write your email content here..."
                      className="min-h-[300px] border-0 rounded-t-none focus-visible:ring-0 resize-none"
                    />
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="audience" className="mt-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-600">
                    Select one or more audience segments
                  </p>
                  {selectedCount > 0 && (
                    <Badge variant="secondary">
                      {selectedCount.toLocaleString()} recipients
                    </Badge>
                  )}
                </div>
                
                <div className="grid gap-3">
                  {audienceSegments.map((segment) => (
                    <button
                      key={segment.id}
                      onClick={() => toggleAudience(segment.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-colors",
                        campaign.selectedAudiences.includes(segment.id)
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{segment.name}</div>
                          <div className="text-sm text-slate-500">{segment.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900">
                            {segment.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">contacts</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateCampaign({ sendNow: true })}
                      className={cn(
                        "flex-1 p-4 rounded-lg border text-left transition-colors",
                        campaign.sendNow
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Play className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-slate-900">Send Now</div>
                          <div className="text-sm text-slate-500">Send immediately after saving</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => updateCampaign({ sendNow: false })}
                      className={cn(
                        "flex-1 p-4 rounded-lg border text-left transition-colors",
                        !campaign.sendNow
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-slate-900">Schedule</div>
                          <div className="text-sm text-slate-500">Pick a date and time</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {!campaign.sendNow && (
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Send Date & Time</Label>
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={campaign.scheduledDate.split("T")[0] || ""}
                              onChange={(e) => updateCampaign({ 
                                scheduledDate: `${e.target.value}T${campaign.schedule.time}` 
                              })}
                              className="flex-1"
                            />
                            <Input
                              type="time"
                              value={campaign.schedule.time}
                              onChange={(e) => updateCampaign({ 
                                schedule: { ...campaign.schedule, time: e.target.value }
                              })}
                              className="w-32"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <Select
                            value={campaign.schedule.timezone}
                            onValueChange={(v) => updateCampaign({ 
                              schedule: { ...campaign.schedule, timezone: v }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="hidden lg:block">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5" />
                    Email Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 rounded-lg p-4">
                    {/* Email client mockup */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      {/* Email header */}
                      <div className="p-4 border-b bg-slate-50">
                        <div className="text-xs text-slate-500 mb-1">From: HedgeCo &lt;noreply@hedgeco.net&gt;</div>
                        <div className="text-xs text-slate-500 mb-2">To: recipient@example.com</div>
                        <div className="font-semibold text-slate-900">
                          {campaign.subject || "Subject line preview"}
                        </div>
                        {campaign.preheader && (
                          <div className="text-sm text-slate-500 truncate mt-1">
                            {campaign.preheader}
                          </div>
                        )}
                      </div>
                      {/* Email body */}
                      <div className="p-4 min-h-[300px]">
                        {campaign.content ? (
                          <div className="prose prose-sm max-w-none">
                            {campaign.content.split("\n").map((line, i) => (
                              <p key={i}>{line || <br />}</p>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-center py-8">
                            Email content will appear here
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}

export default function CampaignBuilderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CampaignBuilderContent />
    </Suspense>
  );
}
