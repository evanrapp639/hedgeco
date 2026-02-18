"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Star,
  Share2,
  ExternalLink,
  CheckCircle,
  Building2,
  Mail,
  Phone,
  Coffee,
  Utensils,
  Mic,
  MessageSquare,
} from "lucide-react";

// Mock conference data - types will come from API
/* eslint-disable @typescript-eslint/no-explicit-any */
const conferencesData: Record<string, any> = {
  "global-hedge-fund-summit-2026": {
    id: "1",
    slug: "global-hedge-fund-summit-2026",
    name: "Global Hedge Fund Summit 2026",
    date: new Date("2026-05-15"),
    endDate: new Date("2026-05-17"),
    location: "New York, USA",
    venue: "The Pierre Hotel",
    address: "2 East 61st Street, New York, NY 10065",
    description: "The premier gathering of hedge fund professionals featuring keynote speakers, panel discussions, and networking opportunities.",
    longDescription: `
      <p>Join over 850 hedge fund professionals, allocators, and service providers at the most anticipated alternative investment event of 2026.</p>
      
      <h4>What to Expect</h4>
      <p>The Global Hedge Fund Summit brings together the industry's brightest minds for three days of insights, networking, and deal-making. This year's theme, "Navigating Uncertainty," will explore strategies for success in an evolving market landscape.</p>
      
      <h4>Who Should Attend</h4>
      <ul>
        <li>Hedge fund managers and analysts</li>
        <li>Institutional investors and allocators</li>
        <li>Family office professionals</li>
        <li>Service providers (legal, admin, prime brokerage)</li>
      </ul>
    `,
    registrationUrl: "https://example.com/register",
    ticketCost: 2500,
    earlyBirdCost: 2000,
    earlyBirdDeadline: new Date("2026-03-15"),
    featured: true,
    category: "Summit",
    attendees: 850,
    rsvpStatus: null,
    format: "In-Person",
    topics: ["Hedge Funds", "Market Outlook", "AI in Investing", "Risk Management"],
    organizer: {
      name: "HedgeCo.Net Events",
      email: "events@hedgeco.net",
      phone: "+1 (212) 555-0100",
    },
    speakers: [
      {
        id: "s1",
        name: "Dr. James Mitchell",
        title: "Chief Investment Officer",
        company: "Citadel LLC",
        avatar: null,
        keynote: true,
      },
      {
        id: "s2",
        name: "Sarah Williams",
        title: "Managing Partner",
        company: "Renaissance Technologies",
        avatar: null,
        keynote: true,
      },
      {
        id: "s3",
        name: "Michael Chen",
        title: "Head of AI Research",
        company: "Two Sigma",
        avatar: null,
        keynote: false,
      },
      {
        id: "s4",
        name: "Elizabeth Taylor",
        title: "CIO",
        company: "Yale Endowment",
        avatar: null,
        keynote: false,
      },
    ],
    agenda: [
      {
        day: "Day 1 - May 15",
        sessions: [
          { time: "8:00 AM", title: "Registration & Breakfast", icon: Coffee },
          { time: "9:00 AM", title: "Opening Keynote: The Future of Hedge Funds", icon: Mic },
          { time: "10:30 AM", title: "Panel: AI & Machine Learning in Investment", icon: MessageSquare },
          { time: "12:00 PM", title: "Networking Lunch", icon: Utensils },
          { time: "2:00 PM", title: "Breakout Sessions", icon: Users },
          { time: "5:00 PM", title: "Cocktail Reception", icon: Coffee },
        ],
      },
      {
        day: "Day 2 - May 16",
        sessions: [
          { time: "8:30 AM", title: "Breakfast Roundtables", icon: Coffee },
          { time: "10:00 AM", title: "Panel: Global Macro Outlook 2026", icon: MessageSquare },
          { time: "11:30 AM", title: "Investor-Manager Speed Dating", icon: Users },
          { time: "12:30 PM", title: "Lunch & Learn Sessions", icon: Utensils },
          { time: "2:30 PM", title: "Panel: ESG Integration in Hedge Funds", icon: MessageSquare },
          { time: "4:00 PM", title: "One-on-One Meetings", icon: Users },
          { time: "7:00 PM", title: "Gala Dinner", icon: Utensils },
        ],
      },
      {
        day: "Day 3 - May 17",
        sessions: [
          { time: "9:00 AM", title: "Final Keynote: 10 Predictions for 2026", icon: Mic },
          { time: "10:30 AM", title: "Closing Panel: Regulatory Landscape", icon: MessageSquare },
          { time: "12:00 PM", title: "Farewell Lunch", icon: Utensils },
        ],
      },
    ],
    sponsors: [
      { name: "Goldman Sachs", tier: "Platinum" },
      { name: "JP Morgan", tier: "Platinum" },
      { name: "Citco", tier: "Gold" },
      { name: "PwC", tier: "Gold" },
      { name: "Dechert LLP", tier: "Silver" },
    ],
    attendeeList: [
      { name: "John Smith", company: "ABC Capital", role: "Portfolio Manager" },
      { name: "Jane Doe", company: "XYZ Investments", role: "CIO" },
      { name: "Michael Brown", company: "123 Family Office", role: "Principal" },
    ],
  },
};

function formatDateRange(start: Date, end?: Date): string {
  const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  const startStr = start.toLocaleDateString("en-US", options);
  
  if (!end || start.getTime() === end.getTime()) {
    return startStr;
  }
  
  const endStr = end.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return `${start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} - ${endStr}, ${start.getFullYear()}`;
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

export default function ConferenceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  
  // Get conference data (mock - would be API call)
  const conference = conferencesData[slug] || conferencesData["global-hedge-fund-summit-2026"];
  
  const isEarlyBird = new Date() < conference.earlyBirdDeadline;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          href="/conferences" 
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Conferences
        </Link>

        {/* Hero Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {conference.featured && (
                <Badge className="bg-white/20 text-white border-0">
                  <Star className="h-3 w-3 mr-1 fill-white" />
                  Featured Event
                </Badge>
              )}
              <Badge className="bg-white/20 text-white border-0">{conference.category}</Badge>
              <Badge className="bg-white/20 text-white border-0">{conference.format}</Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{conference.name}</h1>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-indigo-100">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span>{formatDateRange(conference.date, conference.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{conference.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>{conference.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{conference.attendees}+ Attendees</span>
              </div>
            </div>
          </div>
          
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  {isEarlyBird ? (
                    <>
                      <span className="text-3xl font-bold text-slate-900">
                        ${conference.earlyBirdCost?.toLocaleString()}
                      </span>
                      <span className="text-lg text-slate-400 line-through">
                        ${conference.ticketCost.toLocaleString()}
                      </span>
                      <Badge className="bg-green-100 text-green-800">Early Bird</Badge>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-slate-900">
                      ${conference.ticketCost.toLocaleString()}
                    </span>
                  )}
                </div>
                {isEarlyBird && (
                  <p className="text-sm text-slate-500 mt-1">
                    Early bird pricing ends {conference.earlyBirdDeadline.toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {rsvpStatus === "registered" ? (
                  <Button variant="secondary" className="min-w-[180px]">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Registered
                  </Button>
                ) : (
                  <Button 
                    className="min-w-[180px]"
                    onClick={() => setRsvpStatus("registered")}
                  >
                    Register Now
                  </Button>
                )}
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
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
                <TabsTrigger value="attendees">Attendees</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: conference.longDescription }}
                    />
                    
                    {/* Topics */}
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-slate-900 mb-3">Topics Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {conference.topics.map((topic: string) => (
                          <Badge key={topic} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Sponsors */}
                    {conference.sponsors && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold text-slate-900 mb-4">Sponsors</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {conference.sponsors.map((sponsor: any, i: number) => (
                            <div 
                              key={i} 
                              className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"
                            >
                              <Building2 className="h-5 w-5 text-slate-400" />
                              <div>
                                <div className="font-medium text-sm">{sponsor.name}</div>
                                <div className="text-xs text-slate-500">{sponsor.tier}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agenda">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Schedule</CardTitle>
                    <CardDescription>
                      Full agenda for {conference.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {conference.agenda.map((day: any, dayIndex: number) => (
                        <div key={dayIndex}>
                          <h4 className="font-semibold text-lg text-slate-900 mb-4">
                            {day.day}
                          </h4>
                          <div className="space-y-3">
                            {day.sessions.map((session: any, sessionIndex: number) => {
                              const Icon = session.icon;
                              return (
                                <div 
                                  key={sessionIndex}
                                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  <div className="w-20 shrink-0">
                                    <span className="text-sm font-medium text-slate-900">
                                      {session.time}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                      <Icon className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <span className="font-medium text-slate-900">
                                      {session.title}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="speakers">
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Speakers</CardTitle>
                    <CardDescription>
                      Industry leaders sharing their insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {conference.speakers.map((speaker: any) => (
                        <div 
                          key={speaker.id}
                          className="flex items-start gap-4 p-4 border rounded-lg"
                        >
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={speaker.avatar || undefined} />
                            <AvatarFallback className="bg-slate-200 text-slate-600">
                              {getInitials(speaker.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {speaker.name}
                              </span>
                              {speaker.keynote && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                  Keynote
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-600">{speaker.title}</div>
                            <div className="text-sm text-slate-500">{speaker.company}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendees">
                <Card>
                  <CardHeader>
                    <CardTitle>Who&apos;s Attending</CardTitle>
                    <CardDescription>
                      Connect with {conference.attendees}+ professionals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {conference.attendeeList.map((attendee: any, i: number) => (
                        <div 
                          key={i}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                              {getInitials(attendee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{attendee.name}</div>
                            <div className="text-sm text-slate-500">
                              {attendee.role} at {attendee.company}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Connect
                          </Button>
                        </div>
                      ))}
                      
                      <div className="text-center pt-4">
                        <Button variant="outline">
                          View All Attendees ({conference.attendees}+)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-3xl font-bold text-slate-900">
                    ${isEarlyBird ? conference.earlyBirdCost?.toLocaleString() : conference.ticketCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">per attendee</div>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Full conference access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>All meals included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Networking events</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Session recordings</span>
                  </li>
                </ul>
                
                <Button className="w-full">
                  {rsvpStatus === "registered" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Registered
                    </>
                  ) : (
                    "Register Now"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Venue Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Venue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">{conference.venue}</div>
                    <div className="text-sm text-slate-500">{conference.address}</div>
                  </div>
                </div>
                
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                  Map placeholder
                </div>
                
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Organizer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm font-medium text-slate-900">
                  {conference.organizer.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${conference.organizer.email}`} className="hover:text-blue-600">
                    {conference.organizer.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4" />
                  <span>{conference.organizer.phone}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
