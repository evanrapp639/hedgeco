"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  DollarSign,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "DRAFT", label: "Draft" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CLOSED", label: "Closed" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle };
    case "PENDING_REVIEW":
      return { label: "Pending", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock };
    case "REJECTED":
      return { label: "Rejected", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle };
    case "SUSPENDED":
      return { label: "Suspended", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle };
    case "DRAFT":
      return { label: "Draft", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: Clock };
    case "CLOSED":
      return { label: "Closed", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: XCircle };
    default:
      return { label: status, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: Clock };
  }
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAUM(aum: unknown) {
  if (!aum) return "—";
  const num = typeof aum === "string" ? parseFloat(aum) : Number(aum);
  if (isNaN(num)) return "—";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

export default function FundsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get("status") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);

  const { data, isLoading, refetch } = trpc.admin.getFunds.useQuery({
    search: search || undefined,
    status: status !== "all" ? (status as "PENDING_REVIEW" | "APPROVED" | "DRAFT" | "REJECTED" | "SUSPENDED" | "CLOSED") : undefined,
    page,
    limit: 20,
  });

  const approveFund = trpc.admin.approveFund.useMutation({
    onSuccess: () => refetch(),
  });

  const rejectFund = trpc.admin.rejectFund.useMutation({
    onSuccess: () => refetch(),
  });

  const updateFilters = (newStatus?: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (newPage && newPage > 1) params.set("page", String(newPage));
    router.push(`/admin/funds${params.toString() ? `?${params}` : ""}`);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    updateFilters(value, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateFilters(status, newPage);
  };

  const handleQuickApprove = async (fundId: string) => {
    await approveFund.mutateAsync({ fundId });
  };

  const handleQuickReject = async (fundId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      await rejectFund.mutateAsync({ fundId, reason });
    }
  };

  // Count pending funds
  const pendingCount = data?.funds.filter((f) => f.status === "PENDING_REVIEW").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fund Management</h1>
          <p className="text-slate-600 mt-1">
            {data?.pagination.total ?? 0} total funds
            {pendingCount > 0 && status === "all" && (
              <span className="text-amber-600 ml-2">• {pendingCount} pending review</span>
            )}
          </p>
        </div>
      </div>

      {/* Pending Funds Queue */}
      {status === "PENDING_REVIEW" && data && data.funds.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approval Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.funds.slice(0, 5).map((fund) => (
                <div
                  key={fund.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200"
                >
                  <div className="flex-1">
                    <Link
                      href={`/admin/funds/${fund.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {fund.name}
                    </Link>
                    <div className="text-sm text-slate-500">
                      {fund.manager.profile?.firstName} {fund.manager.profile?.lastName} • {fund.type?.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleQuickApprove(fund.id)}
                      disabled={approveFund.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleQuickReject(fund.id)}
                      disabled={rejectFund.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/funds/${fund.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by fund name or manager..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fund List */}
      <Card>
        <CardHeader>
          <CardTitle>Funds</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading funds...</div>
          ) : data?.funds.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No funds found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">Fund</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Manager</th>
                    <th className="pb-3 font-medium">AUM</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.funds.map((fund) => {
                    const statusInfo = getStatusBadge(fund.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={fund.id} className="hover:bg-slate-50">
                        <td className="py-4">
                          <Link
                            href={`/admin/funds/${fund.id}`}
                            className="flex items-center gap-3"
                          >
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 hover:text-blue-600">
                                {fund.name}
                              </div>
                              {fund.strategy && (
                                <div className="text-sm text-slate-500">{fund.strategy}</div>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className="capitalize">
                            {fund.type?.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="text-sm">
                            <div className="font-medium text-slate-900">
                              {fund.manager.profile?.firstName} {fund.manager.profile?.lastName}
                            </div>
                            <div className="text-slate-500">{fund.manager.email}</div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3 text-slate-400" />
                            {formatAUM(fund.aum)}
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className={`${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(fund.createdAt)}
                          </div>
                        </td>
                        <td className="py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/funds/${fund.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/funds/${fund.slug}`} target="_blank">
                                  View Public Page
                                </Link>
                              </DropdownMenuItem>
                              {fund.status === "PENDING_REVIEW" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleQuickApprove(fund.id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleQuickReject(fund.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-slate-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.pagination.total)} of{" "}
                {data.pagination.total} funds
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
