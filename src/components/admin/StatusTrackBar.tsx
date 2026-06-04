"use client";

import { cn } from "@/lib/utils";
import { Lozenge } from "@/components/ui/lozenge";
import { PIPELINE_STAGE_META } from "@/lib/status";

export type PipelineStage = "ai" | "manual" | "pending" | "reviewed" | "approved";

const STAGE_ORDER: PipelineStage[] = ["ai", "manual", "pending", "reviewed", "approved"];

interface StatusTrackBarProps {
  counts: Partial<Record<PipelineStage, number>>;
  onStageClick?: (stage: PipelineStage) => void;
}

export function StatusTrackBar({ counts, onStageClick }: StatusTrackBarProps) {
  return (
    <div className="flex items-stretch gap-1.5">
      {STAGE_ORDER.map((stage, idx) => {
        const count = counts[stage] ?? 0;
        const meta = PIPELINE_STAGE_META[stage];
        const isLast = idx === STAGE_ORDER.length - 1;

        return (
          <div key={stage} className="flex flex-1 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStageClick?.(stage)}
              className="group flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="mb-2 text-[11px] font-medium text-muted-foreground leading-none">
                {meta.label}
              </p>
              <Lozenge tone={meta.tone} className="tabular-nums">
                {count}
              </Lozenge>
            </button>

            {!isLast && (
              <svg className="shrink-0 h-3.5 w-3.5 text-muted-foreground/30" fill="none" viewBox="0 0 16 16">
                <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function getTaskStage(status: string): PipelineStage {
  switch (status) {
    case "pending":
    case "ai_passed":
    case "ai_flagged":
      return "pending";
    case "needs_revision":
    case "human_rejected":
      return "reviewed";
    case "human_approved":
      return "approved";
    default:
      return "ai";
  }
}
