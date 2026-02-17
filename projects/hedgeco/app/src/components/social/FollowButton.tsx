"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  entityId: string;
  entityType: "fund" | "manager" | "provider";
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  showIcon?: boolean;
}

export function FollowButton({
  entityId,
  entityType,
  initialFollowing = false,
  onFollowChange,
  size = "default",
  variant = "default",
  className,
  showIcon = true,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // await trpc.social.toggleFollow.mutate({ entityId, entityType });
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      const newFollowingState = !isFollowing;
      setIsFollowing(newFollowingState);
      onFollowChange?.(newFollowingState);
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      );
    }

    if (isFollowing) {
      if (isHovering) {
        return (
          <>
            {showIcon && <UserMinus className="h-4 w-4" />}
            <span>Unfollow</span>
          </>
        );
      }
      return (
        <>
          {showIcon && <Check className="h-4 w-4" />}
          <span>Following</span>
        </>
      );
    }

    return (
      <>
        {showIcon && <UserPlus className="h-4 w-4" />}
        <span>Follow</span>
      </>
    );
  };

  return (
    <Button
      variant={isFollowing ? (isHovering ? "destructive" : "secondary") : variant}
      size={size}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isLoading}
      className={cn(
        "gap-2 transition-all duration-200",
        isFollowing && !isHovering && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        className
      )}
    >
      {getButtonContent()}
    </Button>
  );
}

export default FollowButton;
