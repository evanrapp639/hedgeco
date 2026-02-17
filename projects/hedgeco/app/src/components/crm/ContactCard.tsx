"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2, Calendar, DollarSign, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Contact } from "./ContactTable";

interface ContactCardProps {
  contact: Contact;
  onClose?: () => void;
  onEdit?: () => void;
  className?: string;
}

const stageConfig = {
  lead: { label: "Lead", color: "bg-slate-100 text-slate-700" },
  prospect: { label: "Prospect", color: "bg-blue-100 text-blue-700" },
  qualified: { label: "Qualified", color: "bg-amber-100 text-amber-700" },
  negotiation: { label: "Negotiation", color: "bg-purple-100 text-purple-700" },
  closed: { label: "Closed Won", color: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Lost", color: "bg-red-100 text-red-700" },
};

export function ContactCard({
  contact,
  onClose,
  onEdit,
  className,
}: ContactCardProps) {
  const stage = stageConfig[contact.stage];

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-slate-100 text-slate-600 text-lg">
                {contact.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg text-slate-900">{contact.name}</h3>
              <p className="text-sm text-slate-500">{contact.role}</p>
              <Badge className={cn("mt-1 font-medium", stage.color)}>
                {stage.label}
              </Badge>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-slate-400" />
            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
              {contact.email}
            </a>
          </div>
          {contact.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-slate-400" />
              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                {contact.phone}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">{contact.company}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Deal Value</p>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-900">
                {contact.value ? `$${contact.value.toLocaleString()}` : "—"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Last Contact</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                {contact.lastContact ? format(contact.lastContact, "MMM d, yyyy") : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <>
            <div className="border-t border-slate-100" />
            <div>
              <p className="text-xs text-slate-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1 gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Button>
          {contact.phone && (
            <Button variant="outline" className="flex-1 gap-2">
              <Phone className="h-4 w-4" />
              Call
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ContactCard;
