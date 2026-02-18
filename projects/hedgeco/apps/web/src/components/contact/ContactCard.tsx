"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Globe,
  Building2,
  Calendar,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactCardProps {
  manager: {
    name: string;
    title: string;
    avatar?: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  fund: {
    name: string;
    company: string;
    website?: string;
  };
  onScheduleMeeting?: () => void;
  onSendMessage?: () => void;
  className?: string;
}

export function ContactCard({ 
  manager, 
  fund, 
  onScheduleMeeting,
  onSendMessage,
  className 
}: ContactCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header with gradient */}
      <div className="h-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      
      <CardContent className="pt-0 pb-6 -mt-10">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
            <AvatarImage src={manager.avatar} />
            <AvatarFallback className="text-xl bg-slate-100">
              {manager.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Manager Info */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-slate-900">{manager.name}</h3>
          <p className="text-sm text-slate-500">{manager.title}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">{fund.company}</span>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-3 mb-6">
          <a 
            href={`mailto:${manager.email}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white shadow-sm">
              <Mail className="h-4 w-4 text-slate-600" />
            </div>
            <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
              {manager.email}
            </span>
          </a>

          {manager.phone && (
            <a 
              href={`tel:${manager.phone}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
            >
              <div className="p-2 rounded-full bg-white shadow-sm">
                <Phone className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
                {manager.phone}
              </span>
            </a>
          )}

          {manager.location && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <div className="p-2 rounded-full bg-white shadow-sm">
                <MapPin className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm text-slate-700">{manager.location}</span>
            </div>
          )}

          {fund.website && (
            <a 
              href={fund.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
            >
              <div className="p-2 rounded-full bg-white shadow-sm">
                <Globe className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                Visit Website
                <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          )}
        </div>

        {/* Social Links */}
        {manager.linkedin && (
          <div className="flex justify-center mb-6">
            <a 
              href={manager.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full" 
            onClick={onScheduleMeeting}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onSendMessage}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>

        {/* Response Time Badge */}
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-xs">
            Usually responds within 24 hours
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContactCard;
