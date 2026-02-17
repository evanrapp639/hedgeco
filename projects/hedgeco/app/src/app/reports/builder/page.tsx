"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportWizard } from "@/components/reports/ReportWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Eye,
  Download,
  Loader2,
} from "lucide-react";

function ReportBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [showPreview, setShowPreview] = React.useState(false);

  // In real app, fetch existing report if editId is provided
  const initialConfig = editId ? {
    name: "Weekly Performance Summary",
    type: "performance",
    // ... other fields
  } : undefined;

  const handleSave = async (config: Parameters<typeof ReportWizard>[0]["onSave"] extends (c: infer T) => unknown ? T : never) => {
    console.log("Saving report:", config);
    // In real app: await createReport(config) or updateReport(editId, config)
    router.push("/reports");
  };

  const handleTestSend = async (config: Parameters<typeof ReportWizard>[0]["onSave"] extends (c: infer T) => unknown ? T : never) => {
    console.log("Sending test report:", config);
    alert("Test report sent to your email!");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/reports")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {editId ? "Edit Report" : "Create Report"}
                </h1>
                <p className="text-sm text-slate-500">
                  Configure your automated report
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
                className="hidden md:flex"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className={`grid gap-8 ${showPreview ? "md:grid-cols-2" : "max-w-2xl mx-auto"}`}>
          {/* Wizard */}
          <div>
            <ReportWizard
              initialConfig={initialConfig}
              onSave={handleSave}
              onCancel={() => router.push("/reports")}
              onTestSend={handleTestSend}
            />
          </div>

          {/* Preview Pane */}
          {showPreview && (
            <div className="hidden md:block">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5" />
                    Report Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[8.5/11] bg-white border rounded-lg shadow-inner p-6 overflow-hidden">
                    {/* Mock report preview */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-4">
                        <div>
                          <div className="text-xs text-slate-400">HEDGECO REPORT</div>
                          <div className="font-semibold text-slate-900">Performance Summary</div>
                        </div>
                        <div className="text-xs text-slate-400">Feb 17, 2026</div>
                      </div>
                      
                      {/* Summary metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Funds", value: "24" },
                          { label: "Total AUM", value: "$1.2B" },
                          { label: "Avg Return", value: "+8.4%" },
                        ].map((metric) => (
                          <div key={metric.label} className="p-2 bg-slate-50 rounded text-center">
                            <div className="text-[10px] text-slate-500">{metric.label}</div>
                            <div className="text-sm font-semibold text-slate-900">{metric.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Chart placeholder */}
                      <div className="h-24 bg-gradient-to-r from-blue-50 to-blue-100 rounded flex items-center justify-center">
                        <div className="text-xs text-blue-400">Performance Chart</div>
                      </div>

                      {/* Table placeholder */}
                      <div className="space-y-1">
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-50 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-50 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}

export default function ReportBuilderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReportBuilderContent />
    </Suspense>
  );
}
