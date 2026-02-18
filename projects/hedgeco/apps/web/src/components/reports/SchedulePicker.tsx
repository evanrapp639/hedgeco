"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type ScheduleFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "custom";

interface ScheduleConfig {
  frequency: ScheduleFrequency;
  time: string;
  timezone: string;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  dayOfMonth?: number;
  customCron?: string;
}

interface SchedulePickerProps {
  value: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  className?: string;
}

const weekDays = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
];

export function SchedulePicker({
  value,
  onChange,
  className,
}: SchedulePickerProps) {
  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    onChange({ ...value, ...updates });
  };

  const toggleDayOfWeek = (day: number) => {
    const current = value.daysOfWeek || [];
    const newDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    updateConfig({ daysOfWeek: newDays });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Frequency */}
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select
          value={value.frequency}
          onValueChange={(freq) => updateConfig({ frequency: freq as ScheduleFrequency })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="custom">Custom (Cron)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Weekly - Day selection */}
      {value.frequency === "weekly" && (
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="flex gap-1 flex-wrap">
            {weekDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDayOfWeek(day.value)}
                className={cn(
                  "w-10 h-10 rounded-lg text-sm font-medium transition-colors",
                  value.daysOfWeek?.includes(day.value)
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly - Day of month */}
      {(value.frequency === "monthly" || value.frequency === "quarterly") && (
        <div className="space-y-2">
          <Label>Day of Month</Label>
          <Select
            value={String(value.dayOfMonth || 1)}
            onValueChange={(day) => updateConfig({ dayOfMonth: parseInt(day) })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                </SelectItem>
              ))}
              <SelectItem value="last">Last day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom cron */}
      {value.frequency === "custom" && (
        <div className="space-y-2">
          <Label>Cron Expression</Label>
          <Input
            value={value.customCron || ""}
            onChange={(e) => updateConfig({ customCron: e.target.value })}
            placeholder="0 9 * * 1-5"
            className="font-mono"
          />
          <p className="text-xs text-slate-500">
            Format: minute hour day-of-month month day-of-week
          </p>
        </div>
      )}

      {/* Time */}
      {value.frequency !== "custom" && (
        <div className="space-y-2">
          <Label>Time</Label>
          <Input
            type="time"
            value={value.time}
            onChange={(e) => updateConfig({ time: e.target.value })}
            className="w-32"
          />
        </div>
      )}

      {/* Timezone */}
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select
          value={value.timezone}
          onValueChange={(tz) => updateConfig({ timezone: tz })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          <span className="font-medium">Schedule: </span>
          {getScheduleSummary(value)}
        </p>
      </div>
    </div>
  );
}

function getScheduleSummary(config: ScheduleConfig): string {
  const timeStr = config.time || "9:00 AM";
  const tzName = timezones.find((tz) => tz.value === config.timezone)?.label || config.timezone;

  switch (config.frequency) {
    case "daily":
      return `Every day at ${timeStr} ${tzName}`;
    case "weekly": {
      const days = config.daysOfWeek?.map((d) => weekDays[d].label).join(", ") || "Monday";
      return `Every ${days} at ${timeStr} ${tzName}`;
    }
    case "monthly":
      return `Monthly on day ${config.dayOfMonth || 1} at ${timeStr} ${tzName}`;
    case "quarterly":
      return `Quarterly on day ${config.dayOfMonth || 1} at ${timeStr} ${tzName}`;
    case "custom":
      return config.customCron || "Custom schedule";
    default:
      return "Not configured";
  }
}

export default SchedulePicker;
