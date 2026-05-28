"use client";

import { useQuery } from "@tanstack/react-query";
import { getLiveTasks, getContentStats } from "@/lib/api";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { StatusTrackBar, type PipelineStage } from "./StatusTrackBar";

export function ConnectedStatusBar() {
  const { data: reviewItems = [] } = useReviewQueue();
  const { data: stats } = useQuery({
    queryKey: ["content-stats"],
    queryFn: getContentStats,
    staleTime: 30_000,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["live-tasks", {}],
    queryFn: () => getLiveTasks({}),
    staleTime: 30_000,
  });

  const pendingCount = reviewItems.filter(
    (i) => i.status === "pending" || i.status === "ai_passed" || i.status === "ai_flagged",
  ).length;
  const reviewedCount = reviewItems.filter(
    (i) => i.status === "needs_revision" || i.status === "human_rejected",
  ).length;

  const counts: Partial<Record<PipelineStage, number>> = {
    ai: stats?.pipeline.stage1 ?? 0,
    manual: 0,
    pending: pendingCount,
    reviewed: reviewedCount,
    approved: tasks.length,
  };

  return <StatusTrackBar counts={counts} />;
}
