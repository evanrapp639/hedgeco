"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedAvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { container: "h-6 w-6", text: "text-xs", icon: "h-3 w-3" },
  sm: { container: "h-8 w-8", text: "text-sm", icon: "h-4 w-4" },
  md: { container: "h-10 w-10", text: "text-sm", icon: "h-5 w-5" },
  lg: { container: "h-16 w-16", text: "text-xl", icon: "h-8 w-8" },
  xl: { container: "h-24 w-24", text: "text-2xl", icon: "h-12 w-12" },
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

// Simple blur placeholder - tiny base64 image
const blurDataURL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2UyZThmMCIvPjwvc3ZnPg==";

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email) {
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  }
  return "??";
}

// Generate consistent color from string
function stringToColor(str: string): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-rose-100 text-rose-700",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function OptimizedAvatar({
  src,
  alt = "",
  firstName,
  lastName,
  email,
  size = "md",
  className,
}: OptimizedAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const sizeClasses = sizeMap[size];
  const pixels = sizePx[size];

  const initials = getInitials(firstName, lastName, email);
  const colorClass = stringToColor(email || firstName || "default");

  const showImage = src && !imageError;

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses.container,
        className
      )}
      role="img"
      aria-label={alt || `Avatar for ${firstName || email || "user"}`}
    >
      {showImage ? (
        <>
          {/* Fallback shown while loading */}
          {!imageLoaded && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full font-medium",
                colorClass
              )}
            >
              <span className={sizeClasses.text}>{initials}</span>
            </div>
          )}
          <Image
            src={src}
            alt={alt}
            width={pixels}
            height={pixels}
            className={cn(
              "aspect-square h-full w-full object-cover transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            placeholder="blur"
            blurDataURL={blurDataURL}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </>
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full font-medium",
            colorClass
          )}
        >
          <span className={sizeClasses.text}>{initials}</span>
        </div>
      )}
    </div>
  );
}

export default OptimizedAvatar;
