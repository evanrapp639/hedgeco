"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Tabs removed - not used in this version
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Inbox,
  Send,
  Archive,
  Trash2,
  Star,
  Plus,
  Circle,
  Mail,
} from "lucide-react";
import { ComposeModal } from "@/components/messages/ComposeModal";

// Mock data for messages
const mockThreads = [
  {
    id: "1",
    participants: [
      { id: "u1", name: "Sarah Chen", avatar: null, role: "Investor" },
    ],
    subject: "Interest in Alpha Growth Fund",
    preview: "Thank you for your interest in our fund. I'd be happy to schedule a call to discuss...",
    timestamp: new Date("2026-02-16T14:30:00"),
    unread: true,
    starred: false,
    category: "inquiry",
  },
  {
    id: "2",
    participants: [
      { id: "u2", name: "Michael Roberts", avatar: null, role: "Fund Manager" },
    ],
    subject: "Q4 2025 Performance Update",
    preview: "Please find attached our Q4 2025 performance report and investor letter...",
    timestamp: new Date("2026-02-15T09:15:00"),
    unread: true,
    starred: true,
    category: "update",
  },
  {
    id: "3",
    participants: [
      { id: "u3", name: "Jennifer Walsh", avatar: null, role: "Compliance Officer" },
    ],
    subject: "Re: Due Diligence Questionnaire",
    preview: "We've completed the DDQ and attached it here. Please let us know if you need any...",
    timestamp: new Date("2026-02-14T16:45:00"),
    unread: false,
    starred: false,
    category: "documents",
  },
  {
    id: "4",
    participants: [
      { id: "u4", name: "David Kim", avatar: null, role: "Service Provider" },
    ],
    subject: "Citco Fund Services - Introduction",
    preview: "I wanted to follow up on your inquiry about fund administration services...",
    timestamp: new Date("2026-02-13T11:20:00"),
    unread: false,
    starred: true,
    category: "inquiry",
  },
  {
    id: "5",
    participants: [
      { id: "u5", name: "Emily Thompson", avatar: null, role: "Investor Relations" },
    ],
    subject: "Conference Registration Confirmed",
    preview: "Your registration for the Global Hedge Fund Summit has been confirmed. Here are...",
    timestamp: new Date("2026-02-12T08:00:00"),
    unread: false,
    starred: false,
    category: "event",
  },
  {
    id: "6",
    participants: [
      { id: "u6", name: "James Wilson", avatar: null, role: "Portfolio Manager" },
    ],
    subject: "Monthly Investment Committee Notes",
    preview: "Attached are the notes from last week's investment committee meeting...",
    timestamp: new Date("2026-02-10T15:30:00"),
    unread: false,
    starred: false,
    category: "update",
  },
];

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function ThreadItem({ thread, selected }: { thread: typeof mockThreads[0]; selected?: boolean }) {
  return (
    <Link href={`/messages/${thread.id}`}>
      <div className={`p-4 border-b hover:bg-slate-50 transition-colors cursor-pointer ${
        selected ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
      } ${thread.unread ? "bg-white" : "bg-slate-50/50"}`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={thread.participants[0].avatar || undefined} />
            <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
              {getInitials(thread.participants[0].name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {thread.unread && (
                  <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
                )}
                <span className={`font-medium text-sm truncate ${thread.unread ? "text-slate-900" : "text-slate-700"}`}>
                  {thread.participants[0].name}
                </span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {thread.participants[0].role}
                </Badge>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {thread.starred && (
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                )}
                <span className="text-xs text-slate-500">{formatTimestamp(thread.timestamp)}</span>
              </div>
            </div>
            
            <h4 className={`text-sm truncate mb-1 ${thread.unread ? "font-semibold text-slate-900" : "text-slate-700"}`}>
              {thread.subject}
            </h4>
            
            <p className="text-xs text-slate-500 truncate">
              {thread.preview}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");

  const unreadCount = mockThreads.filter(t => t.unread).length;
  const starredThreads = mockThreads.filter(t => t.starred);
  
  const filteredThreads = mockThreads.filter(thread =>
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    thread.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
            <p className="text-slate-600">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Folders */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="py-4 px-2">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "inbox" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Inbox
                  </div>
                  {unreadCount > 0 && (
                    <Badge className="bg-blue-600">{unreadCount}</Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("starred")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "starred" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Starred
                  </div>
                  {starredThreads.length > 0 && (
                    <span className="text-xs text-slate-500">{starredThreads.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("sent")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "sent" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Sent
                </button>
                <button
                  onClick={() => setActiveTab("archive")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "archive" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
                <button
                  onClick={() => setActiveTab("trash")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "trash" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  Trash
                </button>
              </nav>

              {/* Categories */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 mb-2">
                  Categories
                </h4>
                <div className="space-y-1">
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100">
                    <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                    Inquiries
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    Updates
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100">
                    <Circle className="h-2 w-2 fill-purple-500 text-purple-500" />
                    Documents
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100">
                    <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                    Events
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message List */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {activeTab === "inbox" && "Inbox"}
                  {activeTab === "starred" && "Starred"}
                  {activeTab === "sent" && "Sent"}
                  {activeTab === "archive" && "Archive"}
                  {activeTab === "trash" && "Trash"}
                </CardTitle>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {activeTab === "inbox" && (
                  filteredThreads.length > 0 ? (
                    filteredThreads.map((thread) => (
                      <ThreadItem key={thread.id} thread={thread} />
                    ))
                  ) : (
                    <div className="py-16 text-center">
                      <Mail className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No messages found</h3>
                      <p className="text-slate-500">
                        {searchQuery ? "Try a different search term" : "Your inbox is empty"}
                      </p>
                    </div>
                  )
                )}
                {activeTab === "starred" && (
                  starredThreads.length > 0 ? (
                    starredThreads.map((thread) => (
                      <ThreadItem key={thread.id} thread={thread} />
                    ))
                  ) : (
                    <div className="py-16 text-center">
                      <Star className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No starred messages</h3>
                      <p className="text-slate-500">Star important messages to find them here</p>
                    </div>
                  )
                )}
                {(activeTab === "sent" || activeTab === "archive" || activeTab === "trash") && (
                  <div className="py-16 text-center">
                    <Mail className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      No messages in {activeTab}
                    </h3>
                    <p className="text-slate-500">
                      {activeTab === "sent" && "Messages you send will appear here"}
                      {activeTab === "archive" && "Archived messages will appear here"}
                      {activeTab === "trash" && "Deleted messages will appear here"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
