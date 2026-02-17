"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const defaultSettings: NotificationSetting[] = [
  {
    id: "fund_updates",
    label: "Fund Updates",
    description: "Get notified when funds you follow post updates or returns",
    icon: <TrendingUp className="h-5 w-5" />,
    enabled: true,
  },
  {
    id: "messages",
    label: "Messages",
    description: "New messages and inquiries from other users",
    icon: <MessageSquare className="h-5 w-5" />,
    enabled: true,
  },
  {
    id: "calendar",
    label: "Calendar Reminders",
    description: "Upcoming meetings and scheduled calls",
    icon: <Calendar className="h-5 w-5" />,
    enabled: true,
  },
  {
    id: "investor_activity",
    label: "Investor Activity",
    description: "New inquiries and investor interest notifications",
    icon: <Users className="h-5 w-5" />,
    enabled: true,
  },
  {
    id: "documents",
    label: "Documents",
    description: "New documents shared or available for download",
    icon: <FileText className="h-5 w-5" />,
    enabled: false,
  },
];

interface EmailPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultEmailPreferences: EmailPreference[] = [
  {
    id: "weekly_digest",
    label: "Weekly Digest",
    description: "Summary of activity and updates from your watchlist",
    enabled: true,
  },
  {
    id: "marketing",
    label: "Marketing & Promotions",
    description: "New features, tips, and promotional offers",
    enabled: false,
  },
  {
    id: "security",
    label: "Security Alerts",
    description: "Important security notifications (recommended)",
    enabled: true,
  },
];

export default function NotificationSettingsPage() {
  const [settings, setSettings] = React.useState(defaultSettings);
  const [emailPrefs, setEmailPrefs] = React.useState(defaultEmailPreferences);
  const [pushEnabled, setPushEnabled] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleEmailPref = (id: string) => {
    setEmailPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("Push notifications are not supported in this browser");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPushEnabled(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
              <p className="text-slate-500">Manage how and when you receive notifications</p>
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg">Push Notifications</CardTitle>
            </div>
            <CardDescription>
              Receive instant notifications on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-toggle" className="font-medium">
                  Enable Push Notifications
                </Label>
                <p className="text-sm text-slate-500 mt-1">
                  {pushEnabled
                    ? "Push notifications are enabled"
                    : "Click to enable push notifications"}
                </p>
              </div>
              <Switch
                id="push-toggle"
                checked={pushEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestPushPermission();
                  } else {
                    setPushEnabled(false);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg">Notification Types</CardTitle>
            </div>
            <CardDescription>
              Choose which notifications you'd like to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {settings.map((setting, index) => (
              <React.Fragment key={setting.id}>
                <div className="flex items-start justify-between py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                      {setting.icon}
                    </div>
                    <div>
                      <Label
                        htmlFor={setting.id}
                        className="font-medium cursor-pointer"
                      >
                        {setting.label}
                      </Label>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={setting.id}
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(setting.id)}
                  />
                </div>
                {index < settings.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg">Email Preferences</CardTitle>
            </div>
            <CardDescription>
              Control which emails you receive from HedgeCo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {emailPrefs.map((pref, index) => (
              <React.Fragment key={pref.id}>
                <div className="flex items-start justify-between py-4">
                  <div>
                    <Label
                      htmlFor={pref.id}
                      className="font-medium cursor-pointer"
                    >
                      {pref.label}
                    </Label>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {pref.description}
                    </p>
                  </div>
                  <Switch
                    id={pref.id}
                    checked={pref.enabled}
                    onCheckedChange={() => toggleEmailPref(pref.id)}
                    disabled={pref.id === "security"}
                  />
                </div>
                {index < emailPrefs.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Settings saved!</span>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
