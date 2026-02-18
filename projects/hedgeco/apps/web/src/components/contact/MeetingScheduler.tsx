"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Clock, 
  Video, 
  Phone, 
  MapPin,
  CheckCircle2,
  Loader2,
  Globe
} from "lucide-react";
import { format, addDays, isSameDay, isWeekend, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface MeetingSchedulerProps {
  fundName: string;
  managerName: string;
  className?: string;
  onScheduled?: (details: MeetingDetails) => void;
}

interface MeetingDetails {
  date: Date;
  time: string;
  type: "video" | "phone" | "in-person";
  timezone: string;
}

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
];

const meetingTypes = [
  { value: "video" as const, label: "Video Call", icon: Video, description: "Zoom or Google Meet" },
  { value: "phone" as const, label: "Phone Call", icon: Phone, description: "We'll call you" },
  { value: "in-person" as const, label: "In Person", icon: MapPin, description: "At our office" },
];

// Mock some unavailable slots
const getUnavailableSlots = (date: Date): string[] => {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 1) return ["9:00 AM", "9:30 AM", "2:00 PM"]; // Monday
  if (dayOfWeek === 3) return ["1:00 PM", "1:30 PM"]; // Wednesday
  if (dayOfWeek === 5) return ["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"]; // Friday
  return [];
};

export function MeetingScheduler({ 
  fundName, 
  managerName, 
  className,
  onScheduled 
}: MeetingSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<"video" | "phone" | "in-person">("video");
  const [selectedTimezone, setSelectedTimezone] = useState("America/New_York");
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const unavailableSlots = selectedDate ? getUnavailableSlots(selectedDate) : [];
  const availableSlots = timeSlots.filter(slot => !unavailableSlots.includes(slot));

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsScheduling(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const details: MeetingDetails = {
      date: selectedDate,
      time: selectedTime,
      type: selectedType,
      timezone: selectedTimezone,
    };
    
    setIsScheduling(false);
    setIsScheduled(true);
    onScheduled?.(details);
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date())) || isWeekend(date);
  };

  if (isScheduled && selectedDate && selectedTime) {
    const meetingType = meetingTypes.find(t => t.value === selectedType)!;
    const timezone = timezones.find(t => t.value === selectedTimezone)!;
    
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Meeting Scheduled!
          </h3>
          <p className="text-slate-600 mb-6">
            Your meeting with {managerName} has been confirmed.
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-500" />
              <span className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-500" />
              <span>{selectedTime} ({timezone.label})</span>
            </div>
            <div className="flex items-center gap-3">
              <meetingType.icon className="h-5 w-5 text-slate-500" />
              <span>{meetingType.label}</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 mt-4">
            A calendar invite has been sent to your email.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Schedule a Meeting
        </CardTitle>
        <CardDescription>
          Book a call with {managerName} to discuss {fundName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meeting Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Meeting Type</label>
          <div className="grid grid-cols-3 gap-2">
            {meetingTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                  selectedType === type.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <type.icon className={cn(
                  "h-5 w-5",
                  selectedType === type.value ? "text-indigo-600" : "text-slate-500"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  selectedType === type.value ? "text-indigo-900" : "text-slate-700"
                )}>
                  {type.label}
                </span>
                <span className="text-xs text-slate-500">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Timezone
          </label>
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger>
              <SelectValue />
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

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Select Date</label>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime(undefined);
              }}
              disabled={isDateDisabled}
              className="rounded-lg border"
            />
          </div>
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Available Times for {format(selectedDate, "MMMM d")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isUnavailable = unavailableSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => !isUnavailable && setSelectedTime(slot)}
                    disabled={isUnavailable}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      isUnavailable
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : selectedTime === slot
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {unavailableSlots.length > 0 && (
              <p className="text-xs text-slate-500">
                Gray slots are unavailable
              </p>
            )}
          </div>
        )}

        {/* Summary & Schedule Button */}
        {selectedDate && selectedTime && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-slate-600">Selected:</span>
              <Badge variant="secondary" className="font-medium">
                {format(selectedDate, "MMM d")} at {selectedTime}
              </Badge>
            </div>
            
            <Button 
              onClick={handleSchedule}
              className="w-full" 
              size="lg"
              disabled={isScheduling}
            >
              {isScheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Confirm Meeting
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MeetingScheduler;
