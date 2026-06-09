"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLiveTasks, type LiveTaskFilters } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import { TASK_TYPE_INFO, GRADE_LABELS } from "@/lib/task-defaults";
import { EmptyState } from "@/components/ui/empty-state";
import { tableStyles, TableFooter, SkeletonRows } from "@/components/admin/data-table";
import type { LiveTask } from "@/lib/types";
import { MediaCell } from "./MediaCell";
import { useVisited } from "@/hooks/useVisited";

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

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function DescriptionCell({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="group relative">
      <span className="line-clamp-1 cursor-default text-xs text-muted-foreground">{text}</span>
      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-72 rounded-lg border border-border bg-popover p-3 text-xs leading-relaxed text-foreground shadow-lg group-hover:block">
        {text}
      </div>
    </div>
  );
}

type GradeFilter = "all" | "G1" | "G2" | "G3" | "G4";
type SortOrder = "newest" | "oldest";

export function TasksTab() {
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const { visited, markVisited } = useVisited("visited_tasks");
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();
  const { pageToast, clearPageToast } = useModalStore();

  useEffect(() => {
    if (!pageToast) return;
    setToastVisible(true);
    const hide = setTimeout(() => setToastVisible(false), 2800);
    const clear = setTimeout(() => clearPageToast(), 3200);
    return () => { clearTimeout(hide); clearTimeout(clear); };
  }, [pageToast, clearPageToast]);

  const filters: LiveTaskFilters = grade !== "all" ? { grade } : {};

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["live-tasks", filters],
    queryFn: () => getLiveTasks(filters),
    staleTime: 30_000,
  });

  const availableTypes = Array.from(new Set(tasks.map((t) => t.task_type))).sort();
  const filtered = (typeFilter === "all" ? tasks : tasks.filter((t) => t.task_type === typeFilter))
    .slice()
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "newest" ? -diff : diff;
    });

  return (
    <div className="relative px-4 py-6 sm:px-6">
      {/* Filters toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Grade band chips */}
        <div className="flex gap-1.5">
          {(["all", "G1", "G2", "G3", "G4"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { setGrade(g); setTypeFilter("all"); }}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                grade === g
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {g === "all" ? "Бүгд" : GRADE_LABELS[g]}
            </button>
          ))}
        </div>

        {availableTypes.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
          >
            <option value="all">Бүх төрөл</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_INFO[t]?.label ?? t}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring/50"
          >
            <option value="newest">Шинийг эхэнд</option>
            <option value="oldest">Хуучнийг эхэнд</option>
          </select>
          <span className="text-xs text-muted-foreground tabular-nums">
            {isLoading ? "…" : `${filtered.length} даалгавар`}
          </span>
        </div>
      </div>

      {/* Table card */}
      <div className={tableStyles.wrapper}>
        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Төрөл</th>
                <th className={tableStyles.th}>Анги</th>
                <th className={tableStyles.th}>Заавар</th>
                <th className={tableStyles.th}>Чадвар</th>
                <th className={tableStyles.th}>Хүндрэл</th>
                <th className={tableStyles.th}>Медиа</th>
                <th className={tableStyles.th}>Огноо</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {isLoading ? (
                <SkeletonRows count={8} cols={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      message="Батлагдсан даалгавар олдсонгүй"
                      subMessage="Шүүлтүүрийг өөрчилж дахин оролдоно уу"
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((task: LiveTask) => {
                  const isUnvisited = !visited.has(task.task_id);
                  return (
                    <tr
                      key={task.task_id}
                      onClick={() => { markVisited(task.task_id); router.push(`/admin/tasks/${task.task_id}`); }}
                      className={cn(
                        tableStyles.row,
                        isUnvisited && tableStyles.rowUnvisited,
                      )}
                    >
                      <td className={tableStyles.cell}>
                        <span className="text-xs font-medium text-foreground leading-tight">
                          {TASK_TYPE_INFO[task.task_type]?.label ?? task.task_type}
                        </span>
                      </td>
                      <td className={tableStyles.cell}>
                        <div className="flex flex-wrap gap-1">
                          {task.grade_band.map((g) => (
                            <span key={g} className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {GRADE_LABELS[g] ?? g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={cn(tableStyles.cell, "max-w-[200px]")}>
                        <span className="line-clamp-1 font-medium text-sm">{task.prompt_text}</span>
                      </td>
                      <td className={tableStyles.cell}>
                        <div className="text-xs font-medium text-foreground leading-tight">
                          {SKILL_NAMES[task.primary_skill] ?? task.primary_skill}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{task.primary_skill}</div>
                      </td>
                      <td className={cn(tableStyles.cell, "whitespace-nowrap text-xs text-amber-500")}>
                        {difficultyStars(task.difficulty)}
                      </td>
                      <td className={tableStyles.cell}>
                        <MediaCell audioUrl={task.audio_url} imageUrl={task.image_url} />
                      </td>
                      <td className={tableStyles.cellMuted}>
                        {fmtDate(task.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length > 0 && (
          <TableFooter count={filtered.length} label="даалгавар" />
        )}
      </div>

      {/* Page-level toast */}
      {pageToast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300",
            toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
            pageToast.type === "success"
              ? "bg-primary text-primary-foreground"
              : "bg-destructive text-white",
          )}
          role="status"
          aria-live="polite"
        >
          {pageToast.message}
        </div>
      )}
    </div>
  );
}
