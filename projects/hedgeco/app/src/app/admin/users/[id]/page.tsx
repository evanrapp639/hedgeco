"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  User,
  Mail,
  Calendar,
  Building2,
  MapPin,
  Phone,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  Lock,
  Trash2,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";

const ROLES = [
  { value: "INVESTOR", label: "Investor" },
  { value: "MANAGER", label: "Manager" },
  { value: "SERVICE_PROVIDER", label: "Service Provider" },
  { value: "NEWS_MEMBER", label: "News Member" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

function formatDate(date: Date | null | undefined, includeTime = false) {
  if (!date) return "Never";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime && { hour: "numeric", minute: "2-digit" }),
  };
  return new Date(date).toLocaleDateString("en-US", options);
}

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

export default function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: user, isLoading, refetch } = trpc.admin.getUser.useQuery({
    userId: params.id,
  });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedRole(null);
    },
  });

  const updateStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => router.push("/admin/users"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading user...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-slate-500 mb-4">User not found</div>
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>
    );
  }

  const statusInfo = getUserStatus(user);
  const StatusIcon = statusInfo.icon;

  const handleRoleUpdate = async () => {
    if (!selectedRole) return;
    await updateRole.mutateAsync({
      userId: user.id,
      role: selectedRole as "INVESTOR" | "MANAGER" | "SERVICE_PROVIDER" | "NEWS_MEMBER" | "ADMIN" | "SUPER_ADMIN",
    });
  };

  const handleStatusAction = async (action: "activate" | "suspend" | "lock") => {
    await updateStatus.mutateAsync({ userId: user.id, action });
  };

  const handleDelete = async () => {
    await deleteUser.mutateAsync({ userId: user.id });
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
            {user.profile?.avatarUrl ? (
              <img
                src={user.profile.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <User className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {user.profile?.firstName && user.profile?.lastName
                ? `${user.profile.firstName} ${user.profile.lastName}`
                : user.email.split("@")[0]}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">
                {user.role.toLowerCase().replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline" className={`${statusInfo.bg} ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user.locked || !user.active ? (
            <Button
              variant="outline"
              onClick={() => handleStatusAction("activate")}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusAction("suspend")}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Suspend
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusAction("lock")}
                disabled={updateStatus.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-red-900">Delete User Account</h3>
                <p className="text-sm text-red-700 mt-1">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteUser.isPending}
                >
                  {deleteUser.isPending ? "Deleting..." : "Delete User"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="role">Role & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          {user.funds.length > 0 && <TabsTrigger value="funds">Funds</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="font-medium">{user.email}</div>
                  </div>
                </div>
                {user.profile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">Phone</div>
                      <div className="font-medium">{user.profile.phone}</div>
                    </div>
                  </div>
                )}
                {user.profile?.linkedIn && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">LinkedIn</div>
                      <a
                        href={user.profile.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.profile?.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">Company</div>
                      <div className="font-medium">{user.profile.company}</div>
                    </div>
                  </div>
                )}
                {user.profile?.title && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">Title</div>
                      <div className="font-medium">{user.profile.title}</div>
                    </div>
                  </div>
                )}
                {(user.profile?.city || user.profile?.state || user.profile?.country) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">Location</div>
                      <div className="font-medium">
                        {[user.profile.city, user.profile.state, user.profile.country]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Joined</div>
                    <div className="font-medium">{formatDate(user.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Last Login</div>
                    <div className="font-medium">{formatDate(user.lastLoginAt, true)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Email Verified</div>
                    <div className="font-medium">
                      {user.emailVerified ? formatDate(user.emailVerified) : "Not verified"}
                    </div>
                  </div>
                </div>
                {user.locked && user.lockedReason && (
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-red-400" />
                    <div>
                      <div className="text-sm text-slate-500">Lock Reason</div>
                      <div className="font-medium text-red-600">{user.lockedReason}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Provider */}
            {user.serviceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.serviceProvider.companyName}</div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {user.serviceProvider.status.toLowerCase()}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/providers/${user.serviceProvider.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Role & Permissions Tab */}
        <TabsContent value="role">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
              <CardDescription>
                Change the user&apos;s role and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="space-y-2 flex-1 max-w-xs">
                  <label className="text-sm font-medium">Current Role</label>
                  <Select
                    value={selectedRole || user.role}
                    onValueChange={setSelectedRole}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleRoleUpdate}
                  disabled={!selectedRole || selectedRole === user.role || updateRole.isPending}
                >
                  {updateRole.isPending ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No activity recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {user.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                    >
                      <div>
                        <div className="font-medium text-sm capitalize">
                          {activity.action.toLowerCase()} {activity.entityType.toLowerCase()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(activity.createdAt, true)}
                        </div>
                      </div>
                      {activity.entityId && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {activity.entityId.slice(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funds Tab */}
        {user.funds.length > 0 && (
          <TabsContent value="funds">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Managed Funds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.funds.map((fund) => (
                    <Link
                      key={fund.id}
                      href={`/admin/funds/${fund.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{fund.name}</div>
                        <div className="text-xs text-slate-500">
                          Created {formatDate(fund.createdAt)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          fund.status === "APPROVED"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : fund.status === "PENDING_REVIEW"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : ""
                        }
                      >
                        {fund.status.replace(/_/g, " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
