"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Deal } from "./DealCard";

interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  stages: { id: string; name: string }[];
  onSave: (deal: Partial<Deal>) => Promise<void>;
}

export function DealModal({
  open,
  onOpenChange,
  deal,
  stages,
  onSave,
}: DealModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: deal?.title || "",
    contactName: deal?.contactName || "",
    company: deal?.company || "",
    value: deal?.value?.toString() || "",
    stage: deal?.stage || stages[0]?.id || "",
    probability: deal?.probability?.toString() || "20",
    expectedCloseDate: deal?.expectedCloseDate
      ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
      : "",
  });

  const isEditing = !!deal?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave({
        id: deal?.id,
        title: formData.title,
        contactName: formData.contactName,
        company: formData.company,
        value: parseFloat(formData.value) || 0,
        stage: formData.stage,
        probability: parseInt(formData.probability) || 20,
        expectedCloseDate: formData.expectedCloseDate
          ? new Date(formData.expectedCloseDate)
          : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save deal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Deal" : "Add New Deal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enterprise License Deal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Acme Corp"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Deal Value ($) *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="50000"
                required
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Win Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                value={formData.probability}
                onChange={(e) => setFormData(prev => ({ ...prev, probability: e.target.value }))}
                placeholder="50"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Deal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DealModal;
