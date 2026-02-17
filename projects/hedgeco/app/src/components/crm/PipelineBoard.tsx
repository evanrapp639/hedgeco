"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealCard, Deal } from "./DealCard";
import { Plus, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
}

interface PipelineBoardProps {
  stages: PipelineStage[];
  onDealMove?: (dealId: string, fromStage: string, toStage: string) => void;
  onDealClick?: (deal: Deal) => void;
  onAddDeal?: (stageId: string) => void;
  className?: string;
}

function SortableDealCard({
  deal,
  onClick,
}: {
  deal: Deal;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCard
        deal={deal}
        onClick={onClick}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}

function StageColumn({
  stage,
  onDealClick,
  onAddDeal,
}: {
  stage: PipelineStage;
  onDealClick?: (deal: Deal) => void;
  onAddDeal?: () => void;
}) {
  const totalValue = stage.deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Card className="flex-shrink-0 w-[300px] bg-slate-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", stage.color)} />
            <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {stage.deals.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onAddDeal}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <DollarSign className="h-3 w-3" />
          <span>${totalValue.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <SortableContext
          items={stage.deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[200px]">
            {stage.deals.map((deal) => (
              <SortableDealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick?.(deal)}
              />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export function PipelineBoard({
  stages: initialStages,
  onDealMove,
  onDealClick,
  onAddDeal,
  className,
}: PipelineBoardProps) {
  const [stages, setStages] = useState(initialStages);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

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

  const findStageByDealId = (dealId: string) => {
    return stages.find((stage) =>
      stage.deals.some((deal) => deal.id === dealId)
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const stage = findStageByDealId(active.id as string);
    const deal = stage?.deals.find((d) => d.id === active.id);
    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const fromStage = findStageByDealId(activeId);
    let toStage = findStageByDealId(overId);

    // If dropped on a stage (not a deal), find that stage
    if (!toStage) {
      toStage = stages.find((s) => s.id === overId);
    }

    if (!fromStage || !toStage) return;

    if (fromStage.id === toStage.id) {
      // Reorder within same stage
      const oldIndex = fromStage.deals.findIndex((d) => d.id === activeId);
      const newIndex = fromStage.deals.findIndex((d) => d.id === overId);

      if (oldIndex !== newIndex) {
        setStages((prev) =>
          prev.map((stage) => {
            if (stage.id === fromStage.id) {
              const newDeals = [...stage.deals];
              const [removed] = newDeals.splice(oldIndex, 1);
              newDeals.splice(newIndex, 0, removed);
              return { ...stage, deals: newDeals };
            }
            return stage;
          })
        );
      }
    } else {
      // Move to different stage
      const deal = fromStage.deals.find((d) => d.id === activeId);
      if (!deal) return;

      setStages((prev) =>
        prev.map((stage) => {
          if (stage.id === fromStage.id) {
            return {
              ...stage,
              deals: stage.deals.filter((d) => d.id !== activeId),
            };
          }
          if (stage.id === toStage.id) {
            return {
              ...stage,
              deals: [...stage.deals, { ...deal, stage: toStage.id }],
            };
          }
          return stage;
        })
      );

      onDealMove?.(activeId, fromStage.id, toStage.id);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            onDealClick={onDealClick}
            onAddDeal={() => onAddDeal?.(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export default PipelineBoard;
