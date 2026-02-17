"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FollowButton } from "./FollowButton";
import {
  Search,
  Building2,
  User,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowedEntity {
  id: string;
  type: "fund" | "manager" | "provider";
  name: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
}

interface FollowingListProps {
  entities: FollowedEntity[];
  className?: string;
  title?: string;
  showSearch?: boolean;
  compact?: boolean;
  onUnfollow?: (entityId: string) => void;
}

const entityIcons = {
  fund: Building2,
  manager: User,
  provider: Briefcase,
};

const entityColors = {
  fund: "bg-blue-100 text-blue-700",
  manager: "bg-emerald-100 text-emerald-700",
  provider: "bg-violet-100 text-violet-700",
};

export function FollowingList({
  entities,
  className,
  title = "Following",
  showSearch = true,
  compact = false,
  onUnfollow,
}: FollowingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localEntities, setLocalEntities] = useState(entities);

  const filteredEntities = localEntities.filter((entity) =>
    entity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnfollow = (entityId: string) => {
    setLocalEntities(prev => prev.filter(e => e.id !== entityId));
    onUnfollow?.(entityId);
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {entities.slice(0, 5).map((entity) => {
          const Icon = entityIcons[entity.type];
          return (
            <Link
              key={entity.id}
              href={entity.href}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Avatar className="h-8 w-8">
                {entity.imageUrl ? (
                  <AvatarImage src={entity.imageUrl} alt={entity.name} />
                ) : (
                  <AvatarFallback className={entityColors[entity.type]}>
                    <Icon className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="flex-1 text-sm font-medium text-slate-900 truncate">
                {entity.name}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          );
        })}
        {entities.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full text-slate-500">
            View all {entities.length} followed
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {showSearch && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search followed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredEntities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {searchQuery ? "No matches found" : "Not following anyone yet"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntities.map((entity) => {
              const Icon = entityIcons[entity.type];
              return (
                <div
                  key={entity.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    {entity.imageUrl ? (
                      <AvatarImage src={entity.imageUrl} alt={entity.name} />
                    ) : (
                      <AvatarFallback className={entityColors[entity.type]}>
                        <Icon className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={entity.href} className="hover:underline">
                      <p className="font-medium text-slate-900 truncate">
                        {entity.name}
                      </p>
                    </Link>
                    {entity.subtitle && (
                      <p className="text-sm text-slate-500 truncate">
                        {entity.subtitle}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-1 text-xs capitalize">
                      {entity.type}
                    </Badge>
                  </div>
                  <FollowButton
                    entityId={entity.id}
                    entityType={entity.type}
                    initialFollowing={true}
                    size="sm"
                    onFollowChange={(following) => {
                      if (!following) handleUnfollow(entity.id);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FollowingList;
