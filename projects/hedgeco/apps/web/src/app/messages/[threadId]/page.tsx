"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Badge - imported for future use
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Reply,
  Forward,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  Paperclip,
  Send,
  Download,
  FileText,
  Clock,
  User,
} from "lucide-react";

// Mock thread data - types will come from API
/* eslint-disable @typescript-eslint/no-explicit-any */
const mockThreadData: Record<string, any> = {
  "1": {
    id: "1",
    subject: "Interest in Alpha Growth Fund",
    participants: [
      { id: "u1", name: "Sarah Chen", email: "sarah.chen@example.com", avatar: null, role: "Investor" },
      { id: "me", name: "You", email: "you@example.com", avatar: null, role: "Fund Manager" },
    ],
    starred: false,
    messages: [
      {
        id: "m1",
        sender: { id: "u1", name: "Sarah Chen", avatar: null },
        timestamp: new Date("2026-02-16T10:30:00"),
        content: `Dear Fund Team,

I recently came across the Alpha Growth Fund on HedgeCo.Net and was impressed by your consistent performance track record over the past 5 years.

As a representative of Johnson Family Office, we are looking to diversify our alternative investment portfolio and would like to learn more about:

1. Your investment strategy and risk management approach
2. Minimum investment requirements
3. Current fund capacity
4. The subscription process

Could we schedule a call this week to discuss further?

Best regards,
Sarah Chen
Johnson Family Office`,
        attachments: [],
      },
      {
        id: "m2",
        sender: { id: "me", name: "You", avatar: null },
        timestamp: new Date("2026-02-16T14:15:00"),
        content: `Dear Sarah,

Thank you for your interest in the Alpha Growth Fund. We're delighted to hear from Johnson Family Office.

I'd be happy to schedule a call to discuss our strategy and answer your questions in detail. Here are a few key points:

• Our minimum investment is $1M
• We currently have capacity for additional investments
• Our investment approach focuses on long/short equity with a technology sector emphasis

I've attached our latest investor presentation and fact sheet for your review.

Would Thursday at 2 PM EST work for a 30-minute introductory call?

Best regards,
Michael`,
        attachments: [
          { name: "Alpha_Growth_Fund_Presentation.pdf", size: "2.4 MB" },
          { name: "Fact_Sheet_Q4_2025.pdf", size: "856 KB" },
        ],
      },
      {
        id: "m3",
        sender: { id: "u1", name: "Sarah Chen", avatar: null },
        timestamp: new Date("2026-02-16T16:45:00"),
        content: `Michael,

Thank you for the quick response and the materials. I'll review them before our call.

Thursday at 2 PM EST works perfectly for me. Please send over the calendar invite.

Looking forward to speaking with you.

Best,
Sarah`,
        attachments: [],
      },
    ],
  },
  "2": {
    id: "2",
    subject: "Q4 2025 Performance Update",
    participants: [
      { id: "u2", name: "Michael Roberts", email: "m.roberts@alphafund.com", avatar: null, role: "Fund Manager" },
    ],
    starred: true,
    messages: [
      {
        id: "m1",
        sender: { id: "u2", name: "Michael Roberts", avatar: null },
        timestamp: new Date("2026-02-15T09:15:00"),
        content: `Dear Investors,

I'm pleased to share our Q4 2025 performance report and year-end investor letter.

Q4 2025 Highlights:
• Net return: +4.2%
• Full year 2025 return: +18.7%
• Sharpe ratio: 1.92

Key contributors to performance included our positions in AI infrastructure and healthcare technology. Our risk-adjusted returns continue to outperform our benchmark by a significant margin.

Please find the detailed report attached. As always, feel free to reach out with any questions.

Best regards,
Michael Roberts
Portfolio Manager`,
        attachments: [
          { name: "Q4_2025_Performance_Report.pdf", size: "3.1 MB" },
          { name: "Investor_Letter_Q4_2025.pdf", size: "1.2 MB" },
        ],
      },
    ],
  },
};

function formatFullTimestamp(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function MessageBubble({ message, isMe }: { message: any; isMe: boolean }) {
  return (
    <div className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={message.sender.avatar || undefined} />
        <AvatarFallback className={`text-sm ${isMe ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
          {getInitials(message.sender.name)}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 max-w-2xl ${isMe ? "text-right" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium text-sm ${isMe ? "order-2" : ""}`}>
            {message.sender.name}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatFullTimestamp(message.timestamp)}
          </span>
        </div>
        
        <div className={`rounded-lg p-4 ${isMe ? "bg-blue-50 text-left" : "bg-white border"}`}>
          <div className="whitespace-pre-wrap text-sm text-slate-700">
            {message.content}
          </div>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {message.attachments.length} attachment{message.attachments.length !== 1 ? "s" : ""}
              </div>
              {message.attachments.map((file: any, i: number) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{file.name}</span>
                    <span className="text-xs text-slate-400">{file.size}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ThreadPage() {
  const params = useParams();
  // Navigation reserved for future use
  const threadId = params.threadId as string;
  
  const [reply, setReply] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  
  // Get thread data (mock - would be API call)
  const thread = mockThreadData[threadId] || mockThreadData["1"];
  
  const handleSend = () => {
    if (!reply.trim()) return;
    // In production, this would send the message via API
    console.log("Sending reply:", reply);
    setReply("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/messages" 
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Messages
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsStarred(!isStarred)}
            >
              <Star className={`h-4 w-4 ${isStarred || thread.starred ? "fill-amber-400 text-amber-400" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply All
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Mark as Unread</DropdownMenuItem>
                <DropdownMenuItem>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Thread */}
          <Card className="lg:col-span-3">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">{thread.subject}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{thread.messages.length} message{thread.messages.length !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>{thread.participants.length} participant{thread.participants.length !== 1 ? "s" : ""}</span>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-6 space-y-6">
                  {thread.messages.map((message: any) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      isMe={message.sender.id === "me"}
                    />
                  ))}
                </div>
              </ScrollArea>
              
              {/* Reply Composer */}
              <div className="border-t p-4">
                <div className="bg-white rounded-lg border">
                  <Textarea
                    placeholder="Write your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="border-0 focus-visible:ring-0 resize-none min-h-[120px]"
                  />
                  <div className="flex items-center justify-between p-3 border-t bg-slate-50 rounded-b-lg">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4 mr-1" />
                        Attach
                      </Button>
                    </div>
                    <Button onClick={handleSend} disabled={!reply.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar - Participants */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {thread.participants.map((participant: any) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar || undefined} />
                      <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                        {getInitials(participant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {participant.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {participant.email || participant.role}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Reply className="h-4 w-4 mr-2" />
                  Reply All
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </Button>
                <Separator className="my-2" />
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Thread
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
