"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation"; // Reserved for future navigation
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  TrendingUp,
  User,
  Calendar,
  DollarSign,
  Building2,
  MapPin,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

const FUND_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CLOSED", label: "Closed" },
];

function formatDate(date: Date | null | undefined, includeTime = false) {
  if (!date) return "—";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime && { hour: "numeric", minute: "2-digit" }),
  };
  return new Date(date).toLocaleDateString("en-US", options);
}

function formatAUM(aum: unknown) {
  if (!aum) return "—";
  const num = typeof aum === "string" ? parseFloat(aum) : Number(aum);
  if (isNaN(num)) return "—";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatPercent(value: unknown) {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "—";
  return `${(num * 100).toFixed(2)}%`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle };
    case "PENDING_REVIEW":
      return { label: "Pending", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock };
    case "REJECTED":
      return { label: "Rejected", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle };
    case "SUSPENDED":
      return { label: "Suspended", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle };
    case "DRAFT":
      return { label: "Draft", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: Clock };
    case "CLOSED":
      return { label: "Closed", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: Lock };
    default:
      return { label: status, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: Clock };
  }
}

export default function FundDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // const router = useRouter(); // Reserved for future navigation
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: fund, isLoading, refetch } = trpc.admin.getFund.useQuery({
    fundId: params.id,
  });

  const approveFund = trpc.admin.approveFund.useMutation({
    onSuccess: () => {
      refetch();
      setShowApprovalForm(false);
      setApprovalNotes("");
    },
  });

  const rejectFund = trpc.admin.rejectFund.useMutation({
    onSuccess: () => {
      refetch();
      setShowRejectionForm(false);
      setRejectionReason("");
    },
  });

  const updateStatus = trpc.admin.updateFundStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedStatus(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading fund...</div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-slate-500 mb-4">Fund not found</div>
        <Button variant="outline" asChild>
          <Link href="/admin/funds">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Funds
          </Link>
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusBadge(fund.status);
  const StatusIcon = statusInfo.icon;

  const handleApprove = async () => {
    await approveFund.mutateAsync({
      fundId: fund.id,
      notes: approvalNotes || undefined,
    });
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    await rejectFund.mutateAsync({
      fundId: fund.id,
      reason: rejectionReason,
    });
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    await updateStatus.mutateAsync({
      fundId: fund.id,
      status: selectedStatus as "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED" | "CLOSED",
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/funds"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Funds
      </Link>

      {/* Fund Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{fund.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="capitalize">
                {fund.type?.replace(/_/g, " ").toLowerCase()}
              </Badge>
              {fund.strategy && (
                <Badge variant="outline">{fund.strategy}</Badge>
              )}
              <Badge variant="outline" className={`${statusInfo.bg} ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {fund.visible ? (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  <Eye className="h-3 w-3 mr-1" />
                  Visible
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href={`/funds/${fund.slug}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              View Public
            </Link>
          </Button>
          {fund.status === "PENDING_REVIEW" && (
            <>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowApprovalForm(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectionForm(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Approval Form */}
      {showApprovalForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800">Approve Fund</CardTitle>
            <CardDescription className="text-green-700">
              This will make the fund visible on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-green-800">Notes (optional)</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  className="mt-1 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={approveFund.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approveFund.isPending ? "Approving..." : "Confirm Approval"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Form */}
      {showRejectionForm && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800">Reject Fund</CardTitle>
            <CardDescription className="text-red-700">
              Please provide a reason for rejection. This will be visible to the fund manager.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-red-800">Rejection Reason *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this fund is being rejected..."
                  className="mt-1 bg-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectFund.isPending || !rejectionReason.trim()}
                >
                  {rejectFund.isPending ? "Rejecting..." : "Confirm Rejection"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="status">Status & Visibility</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Fund Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Fund Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">AUM</div>
                    <div className="font-medium">{formatAUM(fund.aum)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Inception Date</div>
                    <div className="font-medium">{formatDate(fund.inceptionDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Legal Structure</div>
                    <div className="font-medium">{fund.legalStructure || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Domicile</div>
                    <div className="font-medium">{fund.domicile || "—"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manager Info */}
            <Card>
              <CardHeader>
                <CardTitle>Fund Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Name</div>
                    <div className="font-medium">
                      {fund.manager.profile?.firstName} {fund.manager.profile?.lastName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="font-medium">{fund.manager.email}</div>
                  </div>
                </div>
                {fund.manager.profile?.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">Company</div>
                      <div className="font-medium">{fund.manager.profile.company}</div>
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <Link href={`/admin/users/${fund.managerId}`}>
                    View Manager Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Fees & Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Fees & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Management Fee</div>
                    <div className="font-medium">{formatPercent(fund.managementFee)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Performance Fee</div>
                    <div className="font-medium">{formatPercent(fund.performanceFee)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Hurdle Rate</div>
                    <div className="font-medium">{formatPercent(fund.hurdleRate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">High Water Mark</div>
                    <div className="font-medium">{fund.highWaterMark ? "Yes" : "No"}</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-slate-500">Minimum Investment</div>
                  <div className="font-medium">{formatAUM(fund.minInvestment)}</div>
                </div>
                {fund.lockupPeriod && (
                  <div>
                    <div className="text-sm text-slate-500">Lockup Period</div>
                    <div className="font-medium">{fund.lockupPeriod}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap">
                  {fund.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fund.statistics ? (
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Returns</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">YTD</span>
                        <span className="font-medium">{formatPercent(fund.statistics.ytdReturn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">1 Year</span>
                        <span className="font-medium">{formatPercent(fund.statistics.oneYearReturn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">3 Year</span>
                        <span className="font-medium">{formatPercent(fund.statistics.threeYearReturn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CAGR</span>
                        <span className="font-medium">{formatPercent(fund.statistics.cagr)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Risk Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Volatility</span>
                        <span className="font-medium">{formatPercent(fund.statistics.volatility)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sharpe Ratio</span>
                        <span className="font-medium">
                          {fund.statistics.sharpeRatio
                            ? parseFloat(String(fund.statistics.sharpeRatio)).toFixed(2)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max Drawdown</span>
                        <span className="font-medium text-red-600">
                          {formatPercent(fund.statistics.maxDrawdown)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Best Month</span>
                        <span className="font-medium text-green-600">
                          {formatPercent(fund.statistics.bestMonth)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Worst Month</span>
                        <span className="font-medium text-red-600">
                          {formatPercent(fund.statistics.worstMonth)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Win Rate</span>
                        <span className="font-medium">{formatPercent(fund.statistics.winRate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fund Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fund.documents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No documents uploaded
                </div>
              ) : (
                <div className="space-y-3">
                  {fund.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-xs text-slate-500">
                            {doc.documentType.replace(/_/g, " ")} • Uploaded {formatDate(doc.uploadedAt)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {doc.accessLevel.toLowerCase().replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
              <CardDescription>
                Manage the fund&apos;s status and visibility on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="space-y-2 flex-1 max-w-xs">
                  <label className="text-sm font-medium">Current Status</label>
                  <Select
                    value={selectedStatus || fund.status}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUND_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || selectedStatus === fund.status || updateStatus.isPending}
                >
                  {updateStatus.isPending ? "Updating..." : "Update Status"}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Audit Trail</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created</span>
                    <span>{formatDate(fund.createdAt, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Updated</span>
                    <span>{formatDate(fund.updatedAt, true)}</span>
                  </div>
                  {fund.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Approved</span>
                      <span>{formatDate(fund.approvedAt, true)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
