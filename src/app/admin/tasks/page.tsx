"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getLiveTasks, type LiveTaskFilters } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { LiveTask } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaskCard({ task }: { task: LiveTask }) {
  return (
    <Link
      href={`/admin/tasks/${task.task_id}`}
      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{task.task_type}</span>
        <div className="flex gap-1">
          {task.grade_band.map((g) => (
            <span key={g} className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
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
    </Link>
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

// ─── Page ────────────────────────────────────────────────────────────────────

type GradeFilter = "all" | "G12" | "G24";

export default function LiveTasksPage() {
  const [grade, setGrade] = useState<GradeFilter>("all");

  const filters: LiveTaskFilters = {
    ...(grade !== "all" ? { grade } : {}),
  };

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["live-tasks", filters],
    queryFn: () => getLiveTasks(filters),
    staleTime: 30_000,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Даалгаврууд</h1>
        <span className="text-sm text-muted-foreground">
          {isLoading ? "—" : `${tasks.length} даалгавар`}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
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

      {/* Grid */}
      {isLoading ? (
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
            <TaskCard key={task.task_id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
