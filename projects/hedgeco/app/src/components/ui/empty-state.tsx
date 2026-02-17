"use client";

import * as React from "react";
import { 
  Inbox, 
  Search, 
  AlertCircle, 
  Construction,
  FileQuestion,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "no-data" | "error" | "no-results" | "coming-soon" | "custom";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const variantConfig: Record<Exclude<EmptyStateVariant, "custom">, { 
  icon: LucideIcon; 
  title: string; 
  description: string;
  iconClass: string;
}> = {
  "no-data": {
    icon: Inbox,
    title: "No data yet",
    description: "There's nothing here yet. Get started by adding your first item.",
    iconClass: "text-slate-300",
  },
  "error": {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We couldn't load this content. Please try again.",
    iconClass: "text-red-300",
  },
  "no-results": {
    icon: Search,
    title: "No results found",
    description: "We couldn't find anything matching your search. Try different keywords.",
    iconClass: "text-slate-300",
  },
  "coming-soon": {
    icon: Construction,
    title: "Coming soon",
    description: "This feature is under development. Check back later!",
    iconClass: "text-amber-300",
  },
};

const sizeConfig = {
  sm: {
    container: "py-8",
    icon: "h-10 w-10",
    title: "text-base",
    description: "text-sm",
  },
  md: {
    container: "py-12",
    icon: "h-12 w-12",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    container: "py-16",
    icon: "h-16 w-16",
    title: "text-xl",
    description: "text-base",
  },
};

export function EmptyState({
  variant = "no-data",
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const config = variant !== "custom" ? variantConfig[variant] : null;
  const sizes = sizeConfig[size];
  
  const Icon = icon || config?.icon || FileQuestion;
  const displayTitle = title || config?.title || "Nothing here";
  const displayDescription = description || config?.description;
  const iconClass = config?.iconClass || "text-slate-300";

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      <div className={cn(
        "rounded-full bg-slate-50 p-4 mb-4",
        variant === "error" && "bg-red-50",
        variant === "coming-soon" && "bg-amber-50"
      )}>
        <Icon className={cn(sizes.icon, iconClass)} />
      </div>
      <h3 className={cn("font-semibold text-slate-900 mb-2", sizes.title)}>
        {displayTitle}
      </h3>
      {displayDescription && (
        <p className={cn("text-slate-500 max-w-sm mb-4", sizes.description)}>
          {displayDescription}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

// Convenience components for common use cases
export function NoDataState(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState variant="no-data" {...props} />;
}

export function ErrorState(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState variant="error" {...props} />;
}

export function NoResultsState(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState variant="no-results" {...props} />;
}

export function ComingSoonState(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState variant="coming-soon" {...props} />;
}

export default EmptyState;
