"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GripVertical, 
  X, 
  Maximize2, 
  Minimize2,
  Settings,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  size: "sm" | "md" | "lg" | "xl";
  settings?: Record<string, unknown>;
}

interface WidgetProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: WidgetConfig["size"]) => void;
  onConfigure?: (id: string) => void;
  isDraggable?: boolean;
  isEditing?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "col-span-1 row-span-1",
  md: "col-span-1 md:col-span-2 row-span-1",
  lg: "col-span-1 md:col-span-2 row-span-2",
  xl: "col-span-1 md:col-span-2 lg:col-span-3 row-span-2",
};

export function Widget({
  widget,
  children,
  onRemove,
  onResize,
  onConfigure,
  isDraggable = true,
  isEditing = false,
  className,
}: WidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: widget.id,
    disabled: !isDraggable || !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const nextSize = (current: WidgetConfig["size"]): WidgetConfig["size"] => {
    const sizes: WidgetConfig["size"][] = ["sm", "md", "lg", "xl"];
    const idx = sizes.indexOf(current);
    return sizes[(idx + 1) % sizes.length];
  };

  const prevSize = (current: WidgetConfig["size"]): WidgetConfig["size"] => {
    const sizes: WidgetConfig["size"][] = ["sm", "md", "lg", "xl"];
    const idx = sizes.indexOf(current);
    return sizes[(idx - 1 + sizes.length) % sizes.length];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeClasses[widget.size],
        isDragging && "opacity-50",
        "transition-all duration-200",
        className
      )}
    >
      <Card className={cn(
        "h-full relative group",
        isEditing && "ring-2 ring-dashed ring-slate-300 hover:ring-blue-400",
        isDragging && "shadow-2xl"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isEditing && isDraggable && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-slate-100 touch-none"
              >
                <GripVertical className="h-4 w-4 text-slate-400" />
              </button>
            )}
            {widget.title}
          </CardTitle>
          {isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onConfigure && (
                    <DropdownMenuItem onClick={() => onConfigure(widget.id)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                  )}
                  {onResize && (
                    <>
                      <DropdownMenuItem onClick={() => onResize(widget.id, nextSize(widget.size))}>
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Increase Size
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResize(widget.id, prevSize(widget.size))}>
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Decrease Size
                      </DropdownMenuItem>
                    </>
                  )}
                  {onRemove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onRemove(widget.id)}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardHeader>
        <CardContent className="h-[calc(100%-60px)]">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export default Widget;
