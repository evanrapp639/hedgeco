"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SchedulePicker } from "./SchedulePicker";
import {
  FileText,
  Filter,
  Calendar,
  Users,
  Eye,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportConfig {
  name: string;
  description: string;
  type: string;
  filters: {
    fundTypes: string[];
    strategies: string[];
    dateRange: string;
    minAum?: number;
  };
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "custom";
    time: string;
    timezone: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    customCron?: string;
  };
  recipients: string[];
}

interface ReportWizardProps {
  initialConfig?: Partial<ReportConfig>;
  onSave: (config: ReportConfig) => void;
  onCancel: () => void;
  onTestSend?: (config: ReportConfig) => void;
  className?: string;
}

const steps = [
  { id: "type", label: "Report Type", icon: FileText },
  { id: "filters", label: "Filters", icon: Filter },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "recipients", label: "Recipients", icon: Users },
];

const reportTypes = [
  { value: "performance", label: "Performance Report", description: "Fund performance metrics and trends" },
  { value: "allocation", label: "Allocation Report", description: "Portfolio allocation breakdown" },
  { value: "risk", label: "Risk Analysis", description: "Risk metrics and exposure analysis" },
  { value: "compliance", label: "Compliance Report", description: "Regulatory compliance status" },
  { value: "custom", label: "Custom Report", description: "Build your own report" },
];

const fundTypes = ["Hedge Fund", "Private Equity", "Venture Capital", "Real Estate", "Crypto"];
const strategies = ["Long/Short Equity", "Global Macro", "Quantitative", "Event Driven", "Multi-Strategy"];

export function ReportWizard({
  initialConfig,
  onSave,
  onCancel,
  onTestSend,
  className,
}: ReportWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [config, setConfig] = React.useState<ReportConfig>({
    name: "",
    description: "",
    type: "performance",
    filters: {
      fundTypes: [],
      strategies: [],
      dateRange: "ytd",
    },
    schedule: {
      frequency: "weekly",
      time: "09:00",
      timezone: "America/New_York",
      daysOfWeek: [1], // Monday
    },
    recipients: [],
    ...initialConfig,
  });
  const [newRecipient, setNewRecipient] = React.useState("");

  const updateConfig = (updates: Partial<ReportConfig>) => {
    setConfig({ ...config, ...updates });
  };

  const addRecipient = () => {
    if (newRecipient && !config.recipients.includes(newRecipient)) {
      updateConfig({ recipients: [...config.recipients, newRecipient] });
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    updateConfig({ recipients: config.recipients.filter((r) => r !== email) });
  };

  const toggleFilter = (key: "fundTypes" | "strategies", value: string) => {
    const current = config.filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateConfig({ filters: { ...config.filters, [key]: updated } });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return config.name && config.type;
      case 1:
        return true;
      case 2:
        return config.schedule.frequency && config.schedule.time;
      case 3:
        return config.recipients.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSave(config);
    }
  };

  return (
    <div className={cn("", className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-colors",
                    index <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                  disabled={index > currentStep}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isComplete && "bg-emerald-600 text-white",
                    isActive && "bg-blue-600 text-white",
                    !isComplete && !isActive && "bg-slate-100 text-slate-400"
                  )}>
                    {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    isActive ? "text-blue-600" : "text-slate-500"
                  )}>
                    {step.label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2",
                    index < currentStep ? "bg-emerald-600" : "bg-slate-200"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{steps[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  placeholder="Monthly Performance Report"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  placeholder="Brief description of this report..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Report Type</Label>
                <div className="grid gap-2">
                  {reportTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateConfig({ type: type.value })}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors",
                        config.type === type.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="font-medium text-slate-900">{type.label}</div>
                      <div className="text-sm text-slate-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Fund Types</Label>
                <div className="flex flex-wrap gap-2">
                  {fundTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleFilter("fundTypes", type)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        config.filters.fundTypes.includes(type)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {config.filters.fundTypes.length === 0 && (
                  <p className="text-xs text-slate-500">No filter = all fund types</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Strategies</Label>
                <div className="flex flex-wrap gap-2">
                  {strategies.map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => toggleFilter("strategies", strategy)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        config.filters.strategies.includes(strategy)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {strategy}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={config.filters.dateRange}
                  onValueChange={(v) => updateConfig({ filters: { ...config.filters, dateRange: v } })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtd">Month to Date</SelectItem>
                    <SelectItem value="qtd">Quarter to Date</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="1y">Last 12 Months</SelectItem>
                    <SelectItem value="3y">Last 3 Years</SelectItem>
                    <SelectItem value="5y">Last 5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <SchedulePicker
              value={config.schedule}
              onChange={(schedule) => updateConfig({ schedule })}
            />
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="email@example.com"
                    onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                  />
                  <Button onClick={addRecipient} disabled={!newRecipient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {config.recipients.length > 0 && (
                <div className="space-y-2">
                  <Label>Recipients ({config.recipients.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {config.recipients.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1 pr-1">
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {onTestSend && config.recipients.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => onTestSend(config)}
                  className="w-full mt-4"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Report
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onCancel()}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep > 0 ? "Back" : "Cancel"}
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()}>
          {currentStep === steps.length - 1 ? "Create Report" : "Continue"}
          {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}

export default ReportWizard;
