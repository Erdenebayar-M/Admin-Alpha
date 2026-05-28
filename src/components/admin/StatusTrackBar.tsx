"use client";

import { cn } from "@/lib/utils";

export type PipelineStage = "ai" | "manual" | "pending" | "reviewed" | "approved";

export const STAGE_LABELS: Record<PipelineStage, string> = {
  ai: "AI үүсгэсэн",
  manual: "Гараар үүсгэсэн",
  pending: "Хянахыг хүлээж буй",
  reviewed: "Хянасан",
  approved: "Баталгаажсан",
};

const STAGE_ORDER: PipelineStage[] = ["ai", "manual", "pending", "reviewed", "approved"];

const STAGE_COLORS: Record<PipelineStage, { active: string; dot: string; count: string }> = {
  ai:       { active: "border-blue-400 bg-blue-50 dark:bg-blue-950/40",     dot: "bg-blue-500",   count: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  manual:   { active: "border-violet-400 bg-violet-50 dark:bg-violet-950/40", dot: "bg-violet-500", count: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300" },
  pending:  { active: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/40", dot: "bg-yellow-500", count: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  reviewed: { active: "border-orange-400 bg-orange-50 dark:bg-orange-950/40", dot: "bg-orange-500", count: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  approved: { active: "border-green-400 bg-green-50 dark:bg-green-950/40",   dot: "bg-green-500",  count: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
};

interface StatusTrackBarProps {
  counts: Partial<Record<PipelineStage, number>>;
  selectedStage?: PipelineStage | null;
  highlightedStage?: PipelineStage | null;
  onStageClick?: (stage: PipelineStage) => void;
}

export function StatusTrackBar({
  counts,
  selectedStage,
  highlightedStage,
  onStageClick,
}: StatusTrackBarProps) {
  return (
    <div className="flex items-stretch gap-0">
      {STAGE_ORDER.map((stage, idx) => {
        const count = counts[stage] ?? 0;
        const isSelected = selectedStage === stage;
        const isHighlighted = highlightedStage === stage;
        const colors = STAGE_COLORS[stage];
        const isLast = idx === STAGE_ORDER.length - 1;

        return (
          <div key={stage} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onStageClick?.(stage)}
              className={cn(
                "group flex-1 rounded-lg border-2 px-3 py-3 text-left transition-all",
                isSelected || isHighlighted
                  ? colors.active + " shadow-sm"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", colors.dot)} />
                  <span className="text-xs font-medium leading-none">{STAGE_LABELS[stage]}</span>
                </div>
                {isHighlighted && (
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    ←
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  isSelected || isHighlighted ? colors.count : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>

            {!isLast && (
              <div className="shrink-0 mx-1 flex flex-col items-center">
                <svg className="h-4 w-4 text-muted-foreground/40" fill="none" viewBox="0 0 16 16">
                  <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
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
