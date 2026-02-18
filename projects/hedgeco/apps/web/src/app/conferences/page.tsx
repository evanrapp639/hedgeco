/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  ExternalLink,
  CheckCircle,
  Star,
  Grid3X3,
  List,
  Globe,
  DollarSign,
} from "lucide-react";

// Mock conference data
const mockConferences = [
  {
    id: "1",
    slug: "global-hedge-fund-summit-2026",
    name: "Global Hedge Fund Summit 2026",
    date: new Date("2026-05-15"),
    endDate: new Date("2026-05-17"),
    location: "New York, USA",
    venue: "The Pierre Hotel",
    description: "The premier gathering of hedge fund professionals featuring keynote speakers, panel discussions, and networking opportunities.",
    registrationUrl: "https://example.com/register",
    ticketCost: 2500,
    featured: true,
    category: "Summit",
    attendees: 850,
    rsvpStatus: null,
    format: "In-Person",
    topics: ["Hedge Funds", "Market Outlook", "AI in Investing"],
  },
  {
    id: "2",
    slug: "crypto-institutional-forum-2026",
    name: "Crypto Institutional Forum",
    date: new Date("2026-03-20"),
    endDate: new Date("2026-03-21"),
    location: "Miami, FL, USA",
    venue: "Fontainebleau Miami Beach",
    description: "Exploring digital asset opportunities for institutional investors, featuring regulatory updates and investment strategies.",
    registrationUrl: "https://example.com/register",
    ticketCost: 1800,
    featured: true,
    category: "Forum",
    attendees: 500,
    rsvpStatus: "registered",
    format: "In-Person",
    topics: ["Cryptocurrency", "Digital Assets", "Regulation"],
  },
  {
    id: "3",
    slug: "private-equity-conference-2026",
    name: "Private Equity & Venture Conference",
    date: new Date("2026-04-10"),
    endDate: new Date("2026-04-11"),
    location: "San Francisco, CA, USA",
    venue: "Palace Hotel",
    description: "Connecting PE and VC professionals with LPs, featuring deal showcases and fundraising insights.",
    registrationUrl: "https://example.com/register",
    ticketCost: 1500,
    featured: false,
    category: "Conference",
    attendees: 600,
    rsvpStatus: null,
    format: "In-Person",
    topics: ["Private Equity", "Venture Capital", "Fundraising"],
  },
  {
    id: "4",
    slug: "esg-investing-summit-2026",
    name: "ESG & Sustainable Investing Summit",
    date: new Date("2026-06-05"),
    endDate: new Date("2026-06-06"),
    location: "London, UK",
    venue: "The Savoy",
    description: "Leading perspectives on sustainable investing, impact measurement, and ESG integration.",
    registrationUrl: "https://example.com/register",
    ticketCost: 1200,
    featured: false,
    category: "Summit",
    attendees: 400,
    rsvpStatus: "interested",
    format: "Hybrid",
    topics: ["ESG", "Sustainable Investing", "Impact"],
  },
  {
    id: "5",
    slug: "quant-trading-workshop-2026",
    name: "Quantitative Trading Workshop",
    date: new Date("2026-03-28"),
    endDate: new Date("2026-03-28"),
    location: "Virtual",
    venue: "Online",
    description: "Hands-on workshop covering algorithmic trading strategies, machine learning applications, and risk management.",
    registrationUrl: "https://example.com/register",
    ticketCost: 500,
    featured: false,
    category: "Workshop",
    attendees: 200,
    rsvpStatus: null,
    format: "Virtual",
    topics: ["Quantitative Trading", "Machine Learning", "Algorithms"],
  },
  {
    id: "6",
    slug: "real-estate-investment-forum-2026",
    name: "Real Estate Investment Forum",
    date: new Date("2026-07-12"),
    endDate: new Date("2026-07-13"),
    location: "Chicago, IL, USA",
    venue: "The Langham Chicago",
    description: "Insights into commercial and residential real estate investing, market trends, and deal structures.",
    registrationUrl: "https://example.com/register",
    ticketCost: 1400,
    featured: false,
    category: "Forum",
    attendees: 350,
    rsvpStatus: null,
    format: "In-Person",
    topics: ["Real Estate", "REITs", "Property Investment"],
  },
];

const pastConferences = [
  {
    id: "p1",
    slug: "winter-alternatives-conference-2026",
    name: "Winter Alternatives Conference",
    date: new Date("2026-01-25"),
    endDate: new Date("2026-01-26"),
    location: "Zurich, Switzerland",
    venue: "Dolder Grand",
    description: "Annual gathering of European alternative investment professionals.",
    category: "Conference",
    attendees: 420,
    format: "In-Person",
  },
  {
    id: "p2",
    slug: "family-office-symposium-2025",
    name: "Family Office Symposium 2025",
    date: new Date("2025-11-10"),
    endDate: new Date("2025-11-11"),
    location: "Palm Beach, FL, USA",
    venue: "The Breakers",
    description: "Exclusive symposium for single and multi-family offices.",
    category: "Symposium",
    attendees: 180,
    format: "In-Person",
  },
];

function formatDateRange(start: Date, end?: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString("en-US", options);
  
  if (!end || start.getTime() === end.getTime()) {
    return `${startStr}, ${start.getFullYear()}`;
  }
  
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }
  
  const endStr = end.toLocaleDateString("en-US", options);
  return `${startStr} - ${endStr}, ${start.getFullYear()}`;
}

function ConferenceCard({ conference, isPast = false }: { conference: typeof mockConferences[0]; isPast?: boolean }) {
  const formatBadge = {
    "In-Person": "bg-blue-100 text-blue-800",
    "Virtual": "bg-green-100 text-green-800",
    "Hybrid": "bg-purple-100 text-purple-800",
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${conference.featured ? "ring-2 ring-amber-200" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {conference.featured && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  <Star className="h-3 w-3 mr-1 fill-amber-500" />
                  Featured
                </Badge>
              )}
              <Badge variant="secondary">{conference.category}</Badge>
              <Badge className={formatBadge[conference.format as keyof typeof formatBadge] || "bg-slate-100 text-slate-700"}>
                {conference.format}
              </Badge>
            </div>
            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
              <Link href={`/conferences/${conference.slug}`}>
                {conference.name}
              </Link>
            </CardTitle>
          </div>
          {conference.rsvpStatus && (
            <Badge className={
              conference.rsvpStatus === "registered" 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-blue-100 text-blue-800 border-blue-200"
            }>
              {conference.rsvpStatus === "registered" ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Registered
                </>
              ) : (
                "Interested"
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span>{formatDateRange(conference.date, conference.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{conference.location}</span>
            {conference.venue !== "Online" && (
              <span className="text-slate-400">• {conference.venue}</span>
            )}
          </div>
          {conference.attendees && (
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-4 w-4 shrink-0" />
              <span>{conference.attendees}+ attendees</span>
            </div>
          )}
          {conference.ticketCost && !isPast && (
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>${conference.ticketCost.toLocaleString()} registration</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-slate-600 mt-4 line-clamp-2">
          {conference.description}
        </p>

        {conference.topics && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {conference.topics.map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      {!isPast && (
        <CardFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/conferences/${conference.slug}`}>
                View Details
              </Link>
            </Button>
            {conference.rsvpStatus !== "registered" ? (
              <Button className="flex-1">
                Register Now
              </Button>
            ) : (
              <Button variant="secondary" className="flex-1">
                Manage Registration
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default function ConferencesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const filteredConferences = mockConferences.filter((conf) => {
    const matchesSearch = 
      conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === "all" || conf.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesFormat = 
      selectedFormat === "all" || conf.format.toLowerCase().includes(selectedFormat.toLowerCase());
    return matchesSearch && matchesCategory && matchesFormat;
  });

  const featuredConferences = filteredConferences.filter(c => c.featured);
  const upcomingConferences = filteredConferences.filter(c => !c.featured);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Conferences & Events
          </h1>
          <p className="text-slate-600">
            Discover industry events, conferences, and networking opportunities
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
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

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="summit">Summit</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="forum">Forum</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="symposium">Symposium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-[180px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="upcoming">
            {/* Featured Events */}
            {featuredConferences.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-xl font-semibold text-slate-900">Featured Events</h2>
                </div>
                <div className={`grid gap-6 ${
                  viewMode === "grid" 
                    ? "md:grid-cols-2" 
                    : "grid-cols-1"
                }`}>
                  {featuredConferences.map((conf) => (
                    <ConferenceCard key={conf.id} conference={conf} />
                  ))}
                </div>
              </div>
            )}

            {/* All Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">All Upcoming Events</h2>
                <span className="text-sm text-slate-500">
                  {upcomingConferences.length} event{upcomingConferences.length !== 1 ? "s" : ""}
                </span>
              </div>
              
              {upcomingConferences.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === "grid" 
                    ? "md:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1"
                }`}>
                  {upcomingConferences.map((conf) => (
                    <ConferenceCard key={conf.id} conference={conf} />
                  ))}
                </div>
              ) : (
                <Card className="py-12 text-center">
                  <CardContent>
                    <CalendarIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No events found</h3>
                    <p className="text-slate-500 mb-4">
                      Try adjusting your search or filter criteria
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedFormat("all");
                    }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {pastConferences.map((conf) => (
                <ConferenceCard key={conf.id} conference={conf as any} isPast />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardContent className="pt-6">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                  
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-sm text-slate-700">Event Types</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span>Featured Events</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-blue-400" />
                        <span>Conferences</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span>Workshops</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {date 
                      ? date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      : "Upcoming Events"
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockConferences.slice(0, 5).map((conf) => (
                      <div 
                        key={conf.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="text-center shrink-0 w-14">
                          <div className="text-2xl font-bold text-slate-900">
                            {conf.date.getDate()}
                          </div>
                          <div className="text-xs text-slate-500 uppercase">
                            {conf.date.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/conferences/${conf.slug}`}
                            className="font-medium text-slate-900 hover:text-blue-600 truncate block"
                          >
                            {conf.name}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {conf.location}
                          </div>
                        </div>
                        <Badge variant="secondary">{conf.category}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA for Event Organizers */}
        <Card className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Hosting an event?</h3>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              List your conference or event on HedgeCo.Net and reach thousands of industry professionals.
            </p>
            <Button variant="secondary" size="lg">
              Submit Your Event <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
