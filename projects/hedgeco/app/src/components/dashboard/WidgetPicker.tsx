"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  TrendingUp, 
  List, 
  Link2, 
  Eye, 
  LineChart,
  Newspaper,
  Plus,
  X,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface WidgetDefinition {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: "sm" | "md" | "lg" | "xl";
  category: "metrics" | "charts" | "lists" | "tools";
}

export const availableWidgets: WidgetDefinition[] = [
  {
    type: "stats",
    title: "Stats Widget",
    description: "Display a single KPI metric with trend",
    icon: <BarChart3 className="h-5 w-5" />,
    defaultSize: "sm",
    category: "metrics",
  },
  {
    type: "chart",
    title: "Chart Widget",
    description: "Configurable chart (line, bar, or pie)",
    icon: <LineChart className="h-5 w-5" />,
    defaultSize: "md",
    category: "charts",
  },
  {
    type: "list",
    title: "List Widget",
    description: "Recent items list with quick actions",
    icon: <List className="h-5 w-5" />,
    defaultSize: "sm",
    category: "lists",
  },
  {
    type: "quicklinks",
    title: "Quick Links",
    description: "Shortcut buttons to common actions",
    icon: <Link2 className="h-5 w-5" />,
    defaultSize: "sm",
    category: "tools",
  },
  {
    type: "watchlist",
    title: "Watchlist Preview",
    description: "Quick view of your watched funds",
    icon: <Eye className="h-5 w-5" />,
    defaultSize: "md",
    category: "lists",
  },
  {
    type: "performance",
    title: "Portfolio Performance",
    description: "Track your portfolio performance",
    icon: <TrendingUp className="h-5 w-5" />,
    defaultSize: "lg",
    category: "charts",
  },
  {
    type: "news",
    title: "News Feed",
    description: "Recent news and activity",
    icon: <Newspaper className="h-5 w-5" />,
    defaultSize: "md",
    category: "lists",
  },
];

interface WidgetPickerProps {
  onAdd: (widget: WidgetDefinition) => void;
  existingWidgetTypes?: string[];
  onClose?: () => void;
  className?: string;
}

export function WidgetPicker({ 
  onAdd, 
  existingWidgetTypes = [],
  onClose,
  className 
}: WidgetPickerProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const categories = [
    { id: "metrics", label: "Metrics" },
    { id: "charts", label: "Charts" },
    { id: "lists", label: "Lists" },
    { id: "tools", label: "Tools" },
  ];

  const filteredWidgets = availableWidgets.filter((widget) => {
    const matchesSearch = 
      widget.title.toLowerCase().includes(search.toLowerCase()) ||
      widget.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={cn("bg-white rounded-lg border shadow-lg w-80", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Add Widget</h3>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="p-2 border-b">
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-7 text-xs"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="h-7 text-xs"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-1">
          {filteredWidgets.map((widget) => {
            const isAdded = existingWidgetTypes.includes(widget.type);
            return (
              <button
                key={widget.type}
                onClick={() => !isAdded && onAdd(widget)}
                disabled={isAdded}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors flex items-start gap-3",
                  isAdded 
                    ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                    : "hover:bg-slate-50 cursor-pointer"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  isAdded ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600"
                )}>
                  {widget.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-medium text-sm",
                      isAdded ? "text-slate-400" : "text-slate-900"
                    )}>
                      {widget.title}
                    </span>
                    {!isAdded && (
                      <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {widget.description}
                  </p>
                </div>
              </button>
            );
          })}
          {filteredWidgets.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No widgets found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default WidgetPicker;
