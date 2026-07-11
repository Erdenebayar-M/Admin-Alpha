"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, EyeOff, Eye, Loader2 } from "lucide-react";
import { getLiveTasks, deleteLiveTask, updateLiveTask, type LiveTaskFilters } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import { TASK_TYPE_INFO, GRADE_LABELS, SKILL_LABELS } from "@/lib/task-defaults";
import { EmptyState } from "@/components/ui/empty-state";
import { Lozenge } from "@/components/ui/lozenge";
import { tableStyles, TableFooter, SkeletonRows } from "@/components/admin/data-table";
import type { LiveTask } from "@/lib/types";
import { MediaCell } from "./MediaCell";
import { useVisited } from "@/hooks/useVisited";
import { DifficultyDots } from "@/components/ui/difficulty-dots";

const SKILL_NAMES = SKILL_LABELS;

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

function DeactivateConfirm({
  task,
  onCancel,
  onConfirm,
  loading,
}: {
  task: LiveTask;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-base font-semibold text-foreground">Даалгаврыг идэвхгүй болгох уу?</p>
        <p className="mb-6 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{task.task_id}</span> — устгагдахгүй, зөвхөн нуугдана. Дараа нь дахин идэвхжүүлж болно.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Болих
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Идэвхгүй болгох
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type GradeFilter = "all" | "G1" | "G2" | "G3" | "G4";
type SortOrder = "newest" | "oldest";

export function TasksTab() {
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"true" | "false" | "all">("true");
  const [sort, setSort] = useState<SortOrder>("newest");
  const { visited, markVisited } = useVisited("visited_tasks");
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pageToast, clearPageToast, showPageToast } = useModalStore();

  const [confirmDeactivate, setConfirmDeactivate] = useState<LiveTask | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (!pageToast) return;
    const show = setTimeout(() => setToastVisible(true), 0);
    const hide = setTimeout(() => setToastVisible(false), 2800);
    const clear = setTimeout(() => clearPageToast(), 3200);
    return () => { clearTimeout(show); clearTimeout(hide); clearTimeout(clear); };
  }, [pageToast, clearPageToast]);

  const filters: LiveTaskFilters = {
    ...(grade !== "all" ? { grade } : {}),
    active: activeFilter,
  };

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

  async function handleDeactivateConfirm() {
    if (!confirmDeactivate) return;
    const target = confirmDeactivate;
    setDeactivating(true);
    try {
      await deleteLiveTask(target.task_id);
      await queryClient.invalidateQueries({ queryKey: ["live-tasks"] });
      showPageToast({ type: "success", message: `"${target.task_id}" идэвхгүй болгогдлоо` });
      setConfirmDeactivate(null);
    } catch (e) {
      showPageToast({ type: "error", message: e instanceof Error ? e.message : "Алдаа гарлаа" });
    } finally {
      setDeactivating(false);
    }
  }

  async function handleReactivate(task: LiveTask) {
    try {
      await updateLiveTask(task.task_id, { is_active: true });
      await queryClient.invalidateQueries({ queryKey: ["live-tasks"] });
      showPageToast({ type: "success", message: `"${task.task_id}" дахин идэвхжүүлэгдлээ` });
    } catch (e) {
      showPageToast({ type: "error", message: e instanceof Error ? e.message : "Алдаа гарлаа" });
    }
  }

  return (
    <div className="relative px-4 py-6 sm:px-6">
      {/* Filter card */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-6">
          {/* Grade group */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Анги</span>
            <div className="flex gap-1.5">
              {(["all", "G1", "G2", "G3", "G4"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGrade(g); setTypeFilter("all"); }}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    grade === g
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {g === "all" ? "Бүгд" : GRADE_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          {availableTypes.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Дасгалын төрөл</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">Бүх төрөл</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {TASK_TYPE_INFO[t]?.label ?? t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Төлөв</span>
            <div className="flex gap-1.5">
              {(["true", "false", "all"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setActiveFilter(v)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    activeFilter === v
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {v === "true" ? "Идэвхтэй" : v === "false" ? "Идэвхгүй" : "Бүгд"}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-end gap-4 shrink-0">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Эрэмбэлэх</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOrder)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="newest">Шинийг эхэнд</option>
                <option value="oldest">Хуучнийг эхэнд</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={tableStyles.wrapper}>
        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Дасгалын төрөл</th>
                <th className={tableStyles.th}>Дасгалын асуулт</th>
                <th className={tableStyles.th}>Дасгалын хариулт</th>
                <th className={tableStyles.th}>Ур чадвар</th>
                <th className={tableStyles.th}>Хүндийн түвшин</th>
                <th className={tableStyles.th}>Медиа</th>
                <th className={tableStyles.th}>Эх үүсвэр</th>
                <th className={tableStyles.th}>Огноо</th>
                <th className={tableStyles.th}>Үйлдэл</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {isLoading ? (
                <SkeletonRows count={8} cols={9} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
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
                        !task.is_active && "opacity-50",
                      )}
                    >
                      <td className={tableStyles.cell}>
                        <span className="text-xs font-medium text-foreground leading-tight">
                          {TASK_TYPE_INFO[task.task_type]?.label ?? task.task_type}
                        </span>
                      </td>
                      <td className={cn(tableStyles.cell, "max-w-[200px]")}>
                        <span className="line-clamp-1 font-medium text-sm">{task.prompt_text}</span>
                      </td>
                      <td className={cn(tableStyles.cell, "max-w-[120px]")}>
                        <span className="line-clamp-1 text-xs">{task.correct_answer || "—"}</span>
                      </td>
                      <td className={tableStyles.cell}>
                        <div className="text-xs font-medium text-foreground leading-tight">
                          {SKILL_NAMES[task.primary_skill] ?? task.primary_skill}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{task.primary_skill}</div>
                      </td>
                      <td className={tableStyles.cell}>
                        <DifficultyDots n={task.difficulty} />
                      </td>
                      <td className={tableStyles.cell}>
                        <MediaCell audioUrl={task.audio_url} imageUrl={task.image_url} />
                      </td>
                      <td className={tableStyles.cell}>
                        <span className="text-base" title={task.source === "AI" ? "AI" : "Хүн"}>
                          {task.source === "AI" ? "🤖" : "👤"}
                        </span>
                      </td>
                      <td className={tableStyles.cellMuted}>
                        {fmtDate(task.created_at)}
                      </td>
                      <td className={tableStyles.cell} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Дэлгэрэнгүй / засах"
                            onClick={() => { markVisited(task.task_id); router.push(`/admin/tasks/${task.task_id}`); }}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          {task.is_active ? (
                            <button
                              type="button"
                              title="Идэвхгүй болгох"
                              onClick={() => setConfirmDeactivate(task)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <EyeOff className="size-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Дахин идэвхжүүлэх"
                              onClick={() => handleReactivate(task)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <Eye className="size-3.5" />
                            </button>
                          )}
                        </div>
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

      {/* Deactivate confirm */}
      {confirmDeactivate && (
        <DeactivateConfirm
          task={confirmDeactivate}
          onCancel={() => setConfirmDeactivate(null)}
          onConfirm={handleDeactivateConfirm}
          loading={deactivating}
        />
      )}

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
