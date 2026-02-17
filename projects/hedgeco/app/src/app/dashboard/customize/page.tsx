"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetPicker, availableWidgets, WidgetDefinition } from "@/components/dashboard/WidgetPicker";
import { WidgetConfig } from "@/components/dashboard/Widget";
import {
  StatsWidget,
  ChartWidget,
  ListWidget,
  QuickLinksWidget,
  WatchlistWidget,
  PerformanceWidget,
  NewsWidget,
} from "@/components/widgets";
import {
  Plus,
  Save,
  RotateCcw,
  Check,
  X,
  LayoutDashboard,
  Building2,
  Search,
  MessageSquare,
  Settings,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Default widget layout
const defaultWidgets: WidgetConfig[] = [
  { id: "stats-aum", type: "stats", title: "Total AUM", size: "sm" },
  { id: "stats-funds", type: "stats", title: "Funds Tracked", size: "sm" },
  { id: "performance-1", type: "performance", title: "Portfolio Performance", size: "lg" },
  { id: "watchlist-1", type: "watchlist", title: "Watchlist", size: "md" },
  { id: "news-1", type: "news", title: "Recent News", size: "md" },
  { id: "quicklinks-1", type: "quicklinks", title: "Quick Actions", size: "sm" },
];

// Sample data for widgets
const samplePerformanceData = [
  { date: "Jan", value: 100000, benchmark: 100000 },
  { date: "Feb", value: 105000, benchmark: 102000 },
  { date: "Mar", value: 103000, benchmark: 101500 },
  { date: "Apr", value: 112000, benchmark: 104000 },
  { date: "May", value: 118000, benchmark: 106000 },
  { date: "Jun", value: 125000, benchmark: 108000 },
];

const sampleWatchlistFunds = [
  { id: "1", name: "Bridgewater Pure Alpha", slug: "bridgewater-pure-alpha", type: "Hedge Fund", ytdReturn: 0.0823 },
  { id: "2", name: "Renaissance Medallion", slug: "renaissance-medallion", type: "Quantitative", ytdReturn: 0.1547 },
  { id: "3", name: "Two Sigma Compass", slug: "two-sigma-compass", type: "Quantitative", ytdReturn: 0.0621 },
];

const sampleNews = [
  { id: "1", title: "SEC Proposes New Hedge Fund Disclosure Rules", publishedAt: new Date(Date.now() - 3600000).toISOString(), category: "Regulation" },
  { id: "2", title: "Q4 Hedge Fund Performance Roundup", publishedAt: new Date(Date.now() - 86400000).toISOString(), category: "Markets" },
  { id: "3", title: "Alternative Investment Outlook 2025", publishedAt: new Date(Date.now() - 172800000).toISOString(), category: "Analysis" },
];

const quickLinks = [
  { id: "1", label: "Browse Funds", href: "/funds", icon: <Building2 className="h-4 w-4" /> },
  { id: "2", label: "Search", href: "/search", icon: <Search className="h-4 w-4" /> },
  { id: "3", label: "Messages", href: "/messages", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "4", label: "Reports", href: "/reports", icon: <FileText className="h-4 w-4" /> },
];

export default function CustomizeDashboardPage() {
  const [widgets, setWidgets] = React.useState<WidgetConfig[]>(defaultWidgets);
  const [showPicker, setShowPicker] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleWidgetsChange = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    setHasChanges(true);
    setSaved(false);
  };

  const handleAddWidget = (definition: WidgetDefinition) => {
    const newWidget: WidgetConfig = {
      id: `${definition.type}-${Date.now()}`,
      type: definition.type,
      title: definition.title,
      size: definition.defaultSize,
    };
    setWidgets([...widgets, newWidget]);
    setHasChanges(true);
    setSaved(false);
    setShowPicker(false);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
    setHasChanges(true);
    setSaved(false);
  };

  const handleResizeWidget = (id: string, size: WidgetConfig["size"]) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, size } : w)));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In real app: await saveWidgetLayout(widgets);
    localStorage.setItem("dashboard-layout", JSON.stringify(widgets));
    setIsSaving(false);
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setWidgets(defaultWidgets);
    setHasChanges(true);
    setSaved(false);
  };

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case "stats":
        if (widget.id.includes("aum")) {
          return <StatsWidget label="Total AUM" value="$2.4B" change={5.2} />;
        }
        return <StatsWidget label="Funds Tracked" value="847" change={12} />;
      case "chart":
        return (
          <ChartWidget
            type="line"
            data={samplePerformanceData.map((d) => ({ name: d.date, value: d.value }))}
          />
        );
      case "list":
        return (
          <ListWidget
            items={[
              { id: "1", title: "Bridgewater Associates", subtitle: "Hedge Fund" },
              { id: "2", title: "Renaissance Technologies", subtitle: "Quantitative" },
              { id: "3", title: "Two Sigma", subtitle: "Quantitative" },
            ]}
          />
        );
      case "quicklinks":
        return <QuickLinksWidget links={quickLinks} />;
      case "watchlist":
        return <WatchlistWidget funds={sampleWatchlistFunds} />;
      case "performance":
        return (
          <PerformanceWidget
            data={samplePerformanceData}
            currentValue={125000}
            previousValue={100000}
          />
        );
      case "news":
        return <NewsWidget items={sampleNews} />;
      default:
        return <div className="text-slate-400">Unknown widget type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-slate-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Customize Dashboard</h1>
                <p className="text-sm text-slate-500">Drag widgets to reorder, resize, or add new ones</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges && widgets.length === defaultWidgets.length}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowPicker(!showPicker)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
                {showPicker && (
                  <div className="absolute right-0 top-full mt-2 z-50">
                    <WidgetPicker
                      onAdd={handleAddWidget}
                      existingWidgetTypes={[]}
                      onClose={() => setShowPicker(false)}
                    />
                  </div>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(saved && "bg-emerald-600 hover:bg-emerald-700")}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Layout
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="container mx-auto px-4 py-6">
        {widgets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <LayoutDashboard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No widgets yet</h3>
            <p className="text-slate-500 mb-4">Start by adding widgets to your dashboard</p>
            <Button onClick={() => setShowPicker(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Widget
            </Button>
          </div>
        ) : (
          <WidgetGrid
            widgets={widgets}
            onWidgetsChange={handleWidgetsChange}
            renderWidget={renderWidget}
            isEditing={true}
            onRemoveWidget={handleRemoveWidget}
            onResizeWidget={handleResizeWidget}
          />
        )}
      </div>

      {/* Floating save indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 z-50">
          <span className="text-sm">You have unsaved changes</span>
          <Button size="sm" variant="secondary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:text-white hover:bg-slate-800"
            onClick={() => {
              setWidgets(defaultWidgets);
              setHasChanges(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
