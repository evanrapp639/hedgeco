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
  User,
  Mail,
  Calendar,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "INVESTOR", label: "Investor" },
  { value: "MANAGER", label: "Manager" },
  { value: "SERVICE_PROVIDER", label: "Service Provider" },
  { value: "NEWS_MEMBER", label: "News Member" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "locked", label: "Locked" },
];

function getUserStatus(user: {
  emailVerified: Date | null;
  active: boolean;
  locked: boolean;
}) {
  if (user.locked) return { label: "Locked", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: Lock };
  if (!user.emailVerified) return { label: "Pending", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock };
  if (!user.active) return { label: "Inactive", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: XCircle };
  return { label: "Active", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle };
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRole = searchParams.get("role") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);

  const { data, isLoading, refetch } = trpc.admin.getUsers.useQuery({
    search: search || undefined,
    role: role !== "all" ? (role as "INVESTOR" | "MANAGER" | "SERVICE_PROVIDER" | "NEWS_MEMBER" | "ADMIN" | "SUPER_ADMIN") : undefined,
    status: status !== "all" ? (status as "active" | "pending" | "locked") : undefined,
    page,
    limit: 20,
  });

  const updateUserStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => refetch(),
  });

  // Update URL when filters change
  const updateFilters = (newRole?: string, newStatus?: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (newRole && newRole !== "all") params.set("role", newRole);
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (newPage && newPage > 1) params.set("page", String(newPage));
    router.push(`/admin/users${params.toString() ? `?${params}` : ""}`);
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    setPage(1);
    updateFilters(value, status, 1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    updateFilters(role, value, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateFilters(role, status, newPage);
  };

  const handleUserAction = async (userId: string, action: "activate" | "suspend" | "lock") => {
    await updateUserStatus.mutateAsync({ userId, action });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">
            {data?.pagination.total ?? 0} total users
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading users...</div>
          ) : data?.users.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Last Login</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.users.map((user) => {
                    const statusInfo = getUserStatus(user);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="py-4">
                          <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                              {user.profile?.avatarUrl ? (
                                <img
                                  src={user.profile.avatarUrl}
                                  alt=""
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <User className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {user.profile?.firstName && user.profile?.lastName
                                  ? `${user.profile.firstName} ${user.profile.lastName}`
                                  : user.email.split("@")[0]}
                              </div>
                              <div className="text-sm text-slate-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className="capitalize">
                            {user.role.toLowerCase().replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className={`${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-4 text-sm text-slate-500">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="py-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.createdAt)}
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
                                <Link href={`/admin/users/${user.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.locked || !user.active ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, "activate")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Activate
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleUserAction(user.id, "suspend")}
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-amber-600" />
                                    Suspend
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUserAction(user.id, "lock")}
                                    className="text-red-600"
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Lock Account
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
                {data.pagination.total} users
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
