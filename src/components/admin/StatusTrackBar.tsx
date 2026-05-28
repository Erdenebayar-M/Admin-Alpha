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

// dot/count colors intentionally match the STATUS_STYLES in TaskQueueCard
const STAGE_COLORS: Record<PipelineStage, { border: string; dot: string; countBg: string; countText: string }> = {
  ai:       { border: "border-gray-300 dark:border-gray-700",         dot: "bg-gray-400",      countBg: "bg-gray-500",      countText: "text-white" },
  manual:   { border: "border-violet-300 dark:border-violet-700",     dot: "bg-violet-400",    countBg: "bg-violet-500",    countText: "text-white" },
  pending:  { border: "border-[#E91D26]/50 dark:border-[#E91D26]/40", dot: "bg-[#E91D26]",     countBg: "bg-[#E91D26]",     countText: "text-white" },
  reviewed: { border: "border-[#DC2B33]/50 dark:border-[#DC2B33]/40", dot: "bg-[#DC2B33]",     countBg: "bg-[#DC2B33]",     countText: "text-white" },
  approved: { border: "border-[#48A145]/50 dark:border-[#48A145]/40", dot: "bg-[#48A145]",     countBg: "bg-[#48A145]",     countText: "text-white" },
};

interface StatusTrackBarProps {
  counts: Partial<Record<PipelineStage, number>>;
  onStageClick?: (stage: PipelineStage) => void;
}

export function StatusTrackBar({ counts, onStageClick }: StatusTrackBarProps) {
  return (
    <div className="flex items-stretch gap-0">
      {STAGE_ORDER.map((stage, idx) => {
        const count = counts[stage] ?? 0;
        const colors = STAGE_COLORS[stage];
        const isLast = idx === STAGE_ORDER.length - 1;

        return (
          <div key={stage} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onStageClick?.(stage)}
              className={cn(
                "group flex-1 rounded-lg border bg-background dark:bg-card px-3 py-2.5 text-left transition-all hover:shadow-sm",
                colors.border,
              )}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={cn("h-2 w-2 rounded-full shrink-0", colors.dot)} />
                <span className="text-xs font-medium leading-none text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                  colors.countBg,
                  colors.countText,
                )}
              >
                {count}
              </span>
            </button>

            {!isLast && (
              <div className="shrink-0 mx-1 flex flex-col items-center">
                <svg className="h-3.5 w-3.5 text-muted-foreground/30" fill="none" viewBox="0 0 16 16">
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
