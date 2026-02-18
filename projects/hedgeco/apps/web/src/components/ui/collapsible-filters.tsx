"use client";

import * as React from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";

interface CollapsibleFiltersProps {
  children: React.ReactNode;
  activeFilterCount?: number;
  onClear?: () => void;
  className?: string;
  defaultOpen?: boolean;
  title?: string;
}

export function CollapsibleFilters({
  children,
  activeFilterCount = 0,
  onClear,
  className,
  defaultOpen = false,
  title = "Filters",
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border border-slate-200 rounded-lg bg-white", className)}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 min-h-[56px] touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-slate-500" />
          <span className="font-medium text-slate-900">{title}</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-slate-500 hover:text-slate-700 min-h-[36px]"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Collapsible content */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t border-slate-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterSection({ title, children, className }: FilterSectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-slate-700">{title}</label>
      {children}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({ label, isActive, onClick, className }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 min-h-[44px] touch-manipulation",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
        className
      )}
    >
      {label}
    </button>
  );
}

interface FilterRangeProps {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  unit?: string;
  className?: string;
}

export function FilterRange({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  unit = "",
  className,
}: FilterRangeProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={minValue}
            onChange={(e) => onMinChange(e.target.value)}
            placeholder="Min"
            className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {unit}
            </span>
          )}
        </div>
        <span className="text-slate-400">to</span>
        <div className="relative flex-1">
          <input
            type="number"
            value={maxValue}
            onChange={(e) => onMaxChange(e.target.value)}
            placeholder="Max"
            className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
