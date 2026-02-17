"use client";

import { forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface Deal {
  id: string;
  title: string;
  contactName: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate?: Date;
  lastActivity?: Date;
  tags?: string[];
}

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  className?: string;
}

export const DealCard = forwardRef<HTMLDivElement, DealCardProps>(
  ({ deal, onClick, isDragging, dragHandleProps, className }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isDragging && "opacity-50 shadow-lg ring-2 ring-blue-500",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="flex-shrink-0 p-1 rounded hover:bg-slate-100 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-slate-400" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title & Value */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm text-slate-900 truncate">
                  {deal.title}
                </h4>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-semibold text-sm text-emerald-700">
                    {deal.value >= 1000 ? `${(deal.value / 1000).toFixed(0)}K` : deal.value}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px]">
                    {deal.contactName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-600 truncate">
                  {deal.contactName}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 truncate">
                  {deal.company}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {deal.expectedCloseDate && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {format(deal.expectedCloseDate, "MMM d")}
                    </div>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    deal.probability >= 70
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                      : deal.probability >= 40
                      ? "border-amber-200 text-amber-700 bg-amber-50"
                      : "border-slate-200 text-slate-600"
                  )}
                >
                  {deal.probability}%
                </Badge>
              </div>

              {/* Tags */}
              {deal.tags && deal.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {deal.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {deal.tags.length > 2 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{deal.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

DealCard.displayName = "DealCard";

export default DealCard;
