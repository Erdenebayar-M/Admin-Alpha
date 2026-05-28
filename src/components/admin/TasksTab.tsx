"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLiveTasks, getContentStats, type LiveTaskFilters } from "@/lib/api";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { StatusTrackBar, type PipelineStage } from "@/components/admin/StatusTrackBar";
import { cn } from "@/lib/utils";
import type { LiveTask } from "@/lib/types";

const SKILL_NAMES: Record<string, string> = {
  S1: "Үсэг-авиа ялгалт",
  S2: "Үгийн зөв бичлэг",
  S3: "Урт/богино эгшиг",
  S4: "Балархай эгшиг",
  S5: "Залгавар/нөхцөл",
  S6: "Өгүүлбэрийн тэмдэглэгээ",
  S7: "Сонсголоор буулгах",
  S8: "Алдаа засах",
};

function difficultyStars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function TaskCard({
  task,
  selected,
  onSelect,
}: {
  task: LiveTask;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(task.task_id)}
      className={cn(
        "block w-full rounded-lg border p-4 text-left transition-all",
        selected
          ? "border-green-400 bg-green-50/40 dark:bg-green-950/20 shadow-sm ring-2 ring-green-400/30"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{task.task_type}</span>
        <div className="flex gap-1">
          {task.grade_band.map((g) => (
            <span
              key={g}
              className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {g}
            </span>
          ))}
        </div>
        {task.is_diagnostic && (
          <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
            Оношилгоо
          </span>
        )}
      </div>
      <p className="mb-1 text-sm font-medium line-clamp-1">{task.title || task.prompt_text}</p>
      <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{task.prompt_text}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{SKILL_NAMES[task.primary_skill] ?? task.primary_skill}</span>
        <span className="text-yellow-500">{difficultyStars(task.difficulty)}</span>
      </div>
    </button>
  );
}

function TaskCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex gap-1.5">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-4 w-8 rounded bg-muted" />
      </div>
      <div className="mb-1 h-4 w-3/4 rounded bg-muted" />
      <div className="mb-2 h-3 w-full rounded bg-muted" />
      <div className="h-3 w-1/3 rounded bg-muted" />
    </div>
  );
}

type GradeFilter = "all" | "G12" | "G24";

export function TasksTab() {
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filters: LiveTaskFilters = grade !== "all" ? { grade } : {};

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["live-tasks", filters],
    queryFn: () => getLiveTasks(filters),
    staleTime: 30_000,
  });

  const { data: reviewItems = [] } = useReviewQueue();

  const { data: stats } = useQuery({
    queryKey: ["content-stats"],
    queryFn: getContentStats,
    staleTime: 30_000,
  });

  // Pipeline stage counts
  const pendingCount =
    reviewItems.filter(
      (i) => i.status === "pending" || i.status === "ai_passed" || i.status === "ai_flagged",
    ).length;
  const reviewedCount = reviewItems.filter(
    (i) => i.status === "needs_revision" || i.status === "human_rejected",
  ).length;

  const stageCounts: Partial<Record<PipelineStage, number>> = {
    ai: stats?.pipeline.stage1 ?? 0,
    manual: 0,
    pending: pendingCount,
    reviewed: reviewedCount,
    approved: tasks.length,
  };

  // Determine highlighted stage for selected task
  // All live tasks are in "approved" stage
  const highlightedStage: PipelineStage | null = selectedTaskId ? "approved" : null;

  function handleTaskSelect(id: string) {
    setSelectedTaskId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="px-4 py-6">
      {/* Status track bar */}
      <div className="mb-6">
        <StatusTrackBar
          counts={stageCounts}
          highlightedStage={highlightedStage}
          onStageClick={() => {}}
        />
      </div>

      {/* Selected task stage detail */}
      {selectedTaskId && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <span className="font-medium text-green-800 dark:text-green-300">
              Сонгосон даалгаврын статус:
            </span>
            <span className="text-green-700 dark:text-green-400">Баталгаажсан</span>
            <span className="ml-auto font-mono text-xs text-green-600 dark:text-green-500">
              {selectedTaskId}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-green-600 dark:text-green-500">
            {(["AI үүсгэсэн", "Гараар үүсгэсэн", "Хянахыг хүлээж буй", "Хянасан"] as const).map(
              (label, i) => (
                <span key={label} className="flex items-center gap-1 opacity-50">
                  {i > 0 && <span>→</span>}
                  {label}
                </span>
              ),
            )}
            <span className="flex items-center gap-1 font-semibold opacity-100">
              <span>→</span>
              <span className="text-green-700 dark:text-green-300">Баталгаажсан ✓</span>
            </span>
          </div>
        </div>
      )}

      {/* Grade filter */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "G12", "G24"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                grade === g
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              )}
            >
              {g === "all" ? "Бүгд" : g === "G12" ? "1–2-р анги" : "2–4-р анги"}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {tasksLoading ? "—" : `${tasks.length} даалгавар`}
        </span>
      </div>

      {/* Task grid */}
      {tasksLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Батлагдсан даалгавар олдсонгүй.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.task_id}
              task={task}
              selected={selectedTaskId === task.task_id}
              onSelect={handleTaskSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
