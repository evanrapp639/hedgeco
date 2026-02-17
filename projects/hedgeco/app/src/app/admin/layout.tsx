"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Building2,
  FileText,
  Settings,
  Shield,
  ChevronRight,
  Activity,
} from "lucide-react";

// Admin sidebar navigation items
const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Funds",
    href: "/admin/funds",
    icon: TrendingUp,
  },
  {
    title: "Service Providers",
    href: "/admin/providers",
    icon: Building2,
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: FileText,
  },
  {
    title: "Activity Log",
    href: "/admin/activity",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

// Generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  // Check admin access
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/admin");
      } else if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white md:block">
          <div className="flex h-full flex-col">
            {/* Admin Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-900">Admin Panel</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {sidebarNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-blue-600" : "text-slate-400"
                    )} />
                    {item.title}
                  </Link>
                );
              })}
            </nav>

            {/* User info */}
            <div className="border-t border-slate-200 p-4">
              <div className="text-xs text-slate-500">Logged in as</div>
              <div className="text-sm font-medium text-slate-700 truncate">
                {user?.email}
              </div>
              <div className="text-xs text-blue-600 capitalize">{user?.role?.toLowerCase().replace("_", " ")}</div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64">
          {/* Breadcrumbs */}
          <div className="border-b border-slate-200 bg-white px-6 py-3">
            <nav className="flex items-center text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="mx-2 h-4 w-4 text-slate-400" />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-slate-900">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Page content */}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
