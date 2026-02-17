"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Calendar,
  Download,
  Edit3,
  Save,
  X,
  Info,
  FileSpreadsheet,
} from "lucide-react";

interface Fund {
  id: string;
  name: string;
  lastReturnDate: string;
  status: "current" | "pending" | "overdue";
}

const mockFunds: Fund[] = [
  { id: "1", name: "Alpha Global Equity Fund", lastReturnDate: "2026-01-31", status: "current" },
  { id: "2", name: "Beta Multi-Strategy Fund", lastReturnDate: "2025-12-31", status: "pending" },
];

interface HistoricalReturn {
  id: string;
  fundId: string;
  fundName: string;
  year: number;
  month: number;
  returnValue: number;
  submittedAt: string;
  status: "submitted" | "pending" | "draft";
}

const mockHistoricalReturns: HistoricalReturn[] = [
  { id: "1", fundId: "1", fundName: "Alpha Global Equity Fund", year: 2026, month: 1, returnValue: 1.8, submittedAt: "2026-02-03", status: "submitted" },
  { id: "2", fundId: "1", fundName: "Alpha Global Equity Fund", year: 2025, month: 12, returnValue: 2.1, submittedAt: "2026-01-05", status: "submitted" },
  { id: "3", fundId: "1", fundName: "Alpha Global Equity Fund", year: 2025, month: 11, returnValue: 1.5, submittedAt: "2025-12-04", status: "submitted" },
  { id: "4", fundId: "1", fundName: "Alpha Global Equity Fund", year: 2025, month: 10, returnValue: -0.8, submittedAt: "2025-11-05", status: "submitted" },
  { id: "5", fundId: "2", fundName: "Beta Multi-Strategy Fund", year: 2025, month: 12, returnValue: -0.3, submittedAt: "2026-01-10", status: "submitted" },
  { id: "6", fundId: "2", fundName: "Beta Multi-Strategy Fund", year: 2025, month: 11, returnValue: 1.2, submittedAt: "2025-12-06", status: "submitted" },
  { id: "7", fundId: "2", fundName: "Beta Multi-Strategy Fund", year: 2025, month: 10, returnValue: 0.9, submittedAt: "2025-11-04", status: "submitted" },
  { id: "8", fundId: "2", fundName: "Beta Multi-Strategy Fund", year: 2026, month: 1, returnValue: null as unknown as number, submittedAt: "", status: "pending" },
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getMonthName(month: number): string {
  return months[month - 1] || "";
}

export default function ReturnsPage() {
  const [selectedFund, setSelectedFund] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("1");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [returnValue, setReturnValue] = useState<string>("");
  const [editingReturn, setEditingReturn] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingFunds = mockFunds.filter(f => f.status !== "current");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund || !returnValue) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
    setReturnValue("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowUploadDialog(false);
    setCsvFile(null);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  const handleEditSave = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setEditingReturn(null);
    setEditValue("");
  };

  const filteredReturns = mockHistoricalReturns.filter(r => 
    !selectedFund || r.fundId === selectedFund
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Monthly Returns</h1>
              <p className="text-slate-600 mt-1">Submit and manage fund performance data</p>
            </div>
            
            {/* Success Toast */}
            {submitSuccess && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-lg text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Return submitted successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Overview */}
        {pendingFunds.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">Returns Needed</p>
                    <p className="text-sm text-amber-700">
                      {pendingFunds.length} fund(s) need January 2026 returns submitted by Feb 15
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-auto sm:h-10">
            <TabsTrigger value="submit" className="min-h-[44px] sm:min-h-0 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Submit Return</span>
              <span className="sm:hidden">Submit</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="min-h-[44px] sm:min-h-0 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Upload</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="min-h-[44px] sm:min-h-0 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Submit Return Tab */}
          <TabsContent value="submit">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Entry Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Monthly Return Entry
                  </CardTitle>
                  <CardDescription>
                    Enter the net monthly return for your fund
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Fund Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="fund">Select Fund</Label>
                        <Select value={selectedFund} onValueChange={setSelectedFund}>
                          <SelectTrigger className="min-h-[48px]">
                            <SelectValue placeholder="Choose a fund..." />
                          </SelectTrigger>
                          <SelectContent>
                            {mockFunds.map(fund => (
                              <SelectItem key={fund.id} value={fund.id}>
                                <div className="flex items-center gap-2">
                                  <span>{fund.name}</span>
                                  {fund.status === "pending" && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Period Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="month">Month</Label>
                          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="min-h-[48px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month, idx) => (
                                <SelectItem key={idx} value={String(idx + 1)}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="year">Year</Label>
                          <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="min-h-[48px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2026">2026</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2024">2024</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Return Value */}
                      <div className="space-y-2">
                        <Label htmlFor="return">Net Monthly Return (%)</Label>
                        <div className="relative">
                          <Input
                            id="return"
                            type="number"
                            step="0.01"
                            placeholder="e.g., 1.25 or -0.50"
                            value={returnValue}
                            onChange={(e) => setReturnValue(e.target.value)}
                            className="min-h-[48px] text-lg pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Enter the net return after all fees. Use negative values for losses.
                        </p>
                      </div>
                    </div>

                    {/* Preview */}
                    {selectedFund && returnValue && (
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600 mb-2">Preview:</p>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {mockFunds.find(f => f.id === selectedFund)?.name}
                          </span>
                          <span className={`text-lg font-bold ${
                            parseFloat(returnValue) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(returnValue) >= 0 ? '+' : ''}{returnValue}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {getMonthName(parseInt(selectedMonth))} {selectedYear}
                        </p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full min-h-[48px]"
                      disabled={!selectedFund || !returnValue || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Submit Return
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Submission Status Per Fund */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submission Status</CardTitle>
                  <CardDescription>Current month: January 2026</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockFunds.map(fund => (
                    <div 
                      key={fund.id}
                      className={`p-4 rounded-lg border ${
                        fund.status === 'current' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm text-slate-900">{fund.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Last: {new Date(fund.lastReturnDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        {fund.status === 'current' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        )}
                      </div>
                      {fund.status !== 'current' && (
                        <Button 
                          size="sm" 
                          className="w-full mt-3 min-h-[40px]"
                          onClick={() => setSelectedFund(fund.id)}
                        >
                          Submit Now
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bulk Upload Tab */}
          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Bulk CSV Upload
                </CardTitle>
                <CardDescription>
                  Upload multiple returns at once using our CSV template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Download */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-900">Download Template First</p>
                        <p className="text-sm text-blue-700">
                          Use our CSV template to ensure correct formatting
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="min-h-[44px]">
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>

                {/* Upload Area */}
                <div 
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                    ${csvFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
                  `}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {csvFile ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <FileSpreadsheet className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">{csvFile.name}</p>
                        <p className="text-sm text-green-700">
                          {(csvFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCsvFile(null);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                        <Upload className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Drop your CSV here</p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Format Requirements */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-sm text-slate-900 mb-2">CSV Format Requirements:</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Columns: fund_id, year, month, return</li>
                    <li>• Return values as decimals (e.g., 1.25 for 1.25%)</li>
                    <li>• One row per month per fund</li>
                    <li>• UTF-8 encoding</li>
                  </ul>
                </div>

                {/* Upload Button */}
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full min-h-[48px]" 
                      disabled={!csvFile}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Process
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Upload</DialogTitle>
                      <DialogDescription>
                        This will process {csvFile?.name} and update your fund returns. 
                        Existing returns for the same periods will be overwritten.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">This action cannot be undone</span>
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowUploadDialog(false)}
                        className="min-h-[44px]"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCsvUpload}
                        disabled={isSubmitting}
                        className="min-h-[44px]"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Upload"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-400" />
                      Historical Returns
                    </CardTitle>
                    <CardDescription>View and edit past submissions</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={selectedFund} onValueChange={setSelectedFund}>
                      <SelectTrigger className="w-[200px] min-h-[44px]">
                        <SelectValue placeholder="All funds" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All funds</SelectItem>
                        {mockFunds.map(fund => (
                          <SelectItem key={fund.id} value={fund.id}>{fund.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="min-h-[44px]">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Fund</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Period</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600 text-sm">Return</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Submitted</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReturns.map((ret) => (
                        <tr key={ret.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-sm text-slate-900">{ret.fundName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-600">
                              {getMonthName(ret.month)} {ret.year}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editingReturn === ret.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-24 h-8 text-right"
                                />
                                <span className="text-slate-400">%</span>
                              </div>
                            ) : ret.status === 'pending' ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <span className={`font-semibold text-sm ${
                                ret.returnValue >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {ret.returnValue >= 0 ? '+' : ''}{ret.returnValue.toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={ret.status === 'submitted' ? 'default' : 'secondary'}
                              className={
                                ret.status === 'submitted' 
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }
                            >
                              {ret.status === 'submitted' ? 'Submitted' : 'Pending'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-500">
                              {ret.submittedAt ? new Date(ret.submittedAt).toLocaleDateString() : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editingReturn === ret.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="min-h-[36px]"
                                  onClick={() => handleEditSave()}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="min-h-[36px]"
                                  onClick={() => {
                                    setEditingReturn(null);
                                    setEditValue("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : ret.status === 'pending' ? (
                              <Button
                                size="sm"
                                className="min-h-[36px]"
                                onClick={() => setSelectedFund(ret.fundId)}
                              >
                                Submit
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-[36px]"
                                onClick={() => {
                                  setEditingReturn(ret.id);
                                  setEditValue(String(ret.returnValue));
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
