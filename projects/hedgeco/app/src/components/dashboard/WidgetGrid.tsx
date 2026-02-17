"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Widget, WidgetConfig } from "./Widget";

interface WidgetGridProps {
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  renderWidget: (widget: WidgetConfig) => React.ReactNode;
  isEditing?: boolean;
  onRemoveWidget?: (id: string) => void;
  onResizeWidget?: (id: string, size: WidgetConfig["size"]) => void;
  onConfigureWidget?: (id: string) => void;
  className?: string;
}

export function WidgetGrid({
  widgets,
  onWidgetsChange,
  renderWidget,
  isEditing = false,
  onRemoveWidget,
  onResizeWidget,
  onConfigureWidget,
  className,
}: WidgetGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      onWidgetsChange(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[200px]",
            className
          )}
        >
          {widgets.map((widget) => (
            <Widget
              key={widget.id}
              widget={widget}
              isEditing={isEditing}
              onRemove={onRemoveWidget}
              onResize={onResizeWidget}
              onConfigure={onConfigureWidget}
            >
              {renderWidget(widget)}
            </Widget>
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeWidget ? (
          <div className="opacity-80 shadow-2xl rounded-xl border bg-white p-4">
            <div className="text-sm font-medium">{activeWidget.title}</div>
            <div className="text-xs text-slate-500 mt-1">Moving...</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default WidgetGrid;
