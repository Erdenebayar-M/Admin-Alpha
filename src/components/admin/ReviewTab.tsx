"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useVisited } from "@/hooks/useVisited";
import { approveVariant, bulkDeleteDrafts } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import { TASK_TYPE_INFO, GRADE_LABELS, SKILL_LABELS } from "@/lib/task-defaults";
import { REVIEW_STATUS_META } from "@/lib/status";
import { EmptyState } from "@/components/ui/empty-state";
import { tableStyles, TableToolbar, TableFooter, SkeletonRows } from "@/components/admin/data-table";
import type { ReviewItem } from "@/lib/types";
import { MediaCell } from "./MediaCell";
import { DifficultyDots } from "@/components/ui/difficulty-dots";

const SKILL_NAMES = SKILL_LABELS;

type Tab = "all" | "needs-review" | "ai-passed" | "done";
type SortOrder = "flagged-first" | "newest" | "oldest";
type GradeFilter = "all" | "G1" | "G2" | "G3" | "G4";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "needs-review", label: "Хянах шаардлагатай" },
  { id: "ai-passed", label: "AI дамжсан" },
  { id: "done", label: "Дуусгасан" },
];

const STATUS_PRIORITY: Partial<Record<ReviewItem["status"], number>> = {
  ai_flagged: 0,
  pending: 1,
};

function filterByTab(items: ReviewItem[], tab: Tab): ReviewItem[] {
  switch (tab) {
    case "needs-review": return items.filter((i) => i.status === "ai_flagged" || i.status === "pending");
    case "ai-passed":    return items.filter((i) => i.status === "ai_passed");
    case "done":         return items.filter((i) => i.status === "human_approved" || i.status === "human_rejected");
    default:             return items;
  }
}

function toMs(iso: string) {
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function sortItems(items: ReviewItem[], order: SortOrder): ReviewItem[] {
  const arr = [...items];
  switch (order) {
    case "flagged-first":
      return arr.sort((a, b) => {
        const priority = (STATUS_PRIORITY[a.status] ?? 2) - (STATUS_PRIORITY[b.status] ?? 2);
        if (priority !== 0) return priority;
        return toMs(b.created_at) - toMs(a.created_at);
      });
    case "newest":
      return arr.sort((a, b) => toMs(b.created_at) - toMs(a.created_at));
    case "oldest":
      return arr.sort((a, b) => toMs(a.created_at) - toMs(b.created_at));
  }
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DOT_COLOR: Record<string, string> = {
  neutral: "bg-zinc-400",
  info:    "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
};

function StatusDot({ item }: { item: ReviewItem }) {
  const meta = REVIEW_STATUS_META[item.status];
  const dotColor = DOT_COLOR[meta.tone] ?? "bg-zinc-400";

  let tooltipContent: React.ReactNode;
  if (item.status === "ai_passed") {
    tooltipContent = <span className="font-medium text-green-400">AI давсан</span>;
  } else if (item.status === "ai_flagged") {
    tooltipContent = (
      <div className="space-y-1.5">
        <span className="font-medium text-red-400">AI даваагүй</span>
        {item.flag_reason && (
          <p className="text-muted-foreground">{item.flag_reason}</p>
        )}
        {item.ai_review_issues.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-3.5 text-muted-foreground">
            {item.ai_review_issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        )}
        {item.ai_fix_suggestion && (
          <p className="border-t border-border pt-1.5 text-blue-400/80">{item.ai_fix_suggestion}</p>
        )}
      </div>
    );
  } else {
    tooltipContent = <span>{meta.label}</span>;
  }

  return (
    <div className="group relative flex items-center justify-center">
      <span className={`block h-2.5 w-2.5 rounded-full ${dotColor} ring-1 ring-white/10`} />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-xs leading-relaxed text-foreground shadow-lg group-hover:block">
        {tooltipContent}
      </div>
    </div>
  );
}

function PromptCell({ text }: { text: string }) {
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

export function ReviewTab() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: "success" | "error" }>({ message: "", visible: false });
  const { visited, markVisited } = useVisited("visited_review");
  const { pageToast, clearPageToast } = useModalStore();

  const { data: allItems = [], isLoading } = useReviewQueue();

  const showToast = useCallback((message: string, duration = 2500, type?: "success" | "error") => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  useEffect(() => {
    if (!pageToast) return;
    const id = setTimeout(() => {
      showToast(pageToast.message, 2500, pageToast.type);
      clearPageToast();
    }, 0);
    return () => clearTimeout(id);
  }, [pageToast, showToast, clearPageToast]);

  const gradeFilteredItems = useMemo(
    () => grade === "all" ? allItems : allItems.filter((i) => i.task.grade_band.includes(grade)),
    [allItems, grade],
  );
  const availableTypes = useMemo(
    () => Array.from(new Set(gradeFilteredItems.map((i) => i.task.task_type))).sort(),
    [gradeFilteredItems],
  );
  const typeFilteredItems = useMemo(
    () => typeFilter === "all" ? gradeFilteredItems : gradeFilteredItems.filter((i) => i.task.task_type === typeFilter),
    [gradeFilteredItems, typeFilter],
  );
  const tabItems = useMemo(() => filterByTab(typeFilteredItems, activeTab), [typeFilteredItems, activeTab]);
  const visibleItems = useMemo(() => sortItems(tabItems, sort), [tabItems, sort]);
  const aiPassedInView = useMemo(() => visibleItems.filter((i) => i.status === "ai_passed").length, [visibleItems]);
  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((i) => selectedIds.has(i.id));
  const someVisibleSelected = !allVisibleSelected && visibleItems.some((i) => selectedIds.has(i.id));

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleSelectAllAiPassed() {
    const ids = visibleItems.filter((i) => i.status === "ai_passed").map((i) => i.id);
    setSelectedIds((prev) => new Set([...prev, ...ids]));
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => new Set([...prev, ...visibleItems.map((i) => i.id)]));
    } else {
      const visibleSet = new Set(visibleItems.map((i) => i.id));
      setSelectedIds((prev) => new Set([...prev].filter((id) => !visibleSet.has(id))));
    }
  }

  const bulkMutation = useMutation({
    mutationFn: async (ids: string[]): Promise<void> => {
      const items = allItems.filter((i) => ids.includes(i.id));
      await Promise.all(items.map((i) => approveVariant(i.variant_id)));
    },
    onMutate: (ids) => showToast(`${ids.length} зүйл батлаж байна…`, 2000),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
      setSelectedIds(new Set());
      setTimeout(() => showToast(`${ids.length} батлагдлаа`), 300);
    },
    onError: () => showToast("Олноор батлахад алдаа гарлаа. Дахин оролдоно уу."),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]): Promise<void> => {
      const items = allItems.filter((i) => ids.includes(i.id));
      await bulkDeleteDrafts(items.map((i) => i.variant_id));
    },
    onMutate: (ids) => showToast(`${ids.length} зүйл устгаж байна…`, 2000),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
      setSelectedIds(new Set());
      setTimeout(() => showToast(`${ids.length} устгагдлаа`), 300);
    },
    onError: () => showToast("Олноор устгахад алдаа гарлаа. Дахин оролдоно уу."),
  });

  const hasSelection = selectedIds.size > 0;

  return (
    <div className={cn("px-4 py-6 sm:px-6", hasSelection && "pb-24")}>
      {/* Filter card */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-6">
          {/* Grade chips */}
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

          {/* Task type */}
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
                  <option key={t} value={t}>{TASK_TYPE_INFO[t]?.label ?? t}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status chips */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Төлөв</span>
            <div className="flex gap-1.5">
              {TABS.map((tab) => {
                const count = isLoading ? null : filterByTab(typeFilteredItems, tab.id).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    {count !== null && (
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                        activeTab === tab.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort + AI select */}
          <div className="ml-auto flex items-end gap-4 shrink-0">
            {!isLoading && aiPassedInView > 0 && (
              <div className="flex flex-col gap-2">
                <span className="select-none text-[11px] uppercase tracking-wider opacity-0">—</span>
                <button
                  type="button"
                  onClick={handleSelectAllAiPassed}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  AI дамжсан бүгдийг сонгох ({aiPassedInView})
                </button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Эрэмбэлэх</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOrder)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="flagged-first">AI тэмдэглэснийг эхэнд</option>
                <option value="newest">Шинийг эхэнд</option>
                <option value="oldest">Хуучнийг эхэнд</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={tableStyles.wrapper}>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={cn(tableStyles.th, "w-8")}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => { if (el) el.indeterminate = someVisibleSelected; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                    aria-label="Select all"
                  />
                </th>
                <th className={tableStyles.th}>Дасгалын төрөл</th>
                <th className={tableStyles.th}>Дасгалын асуулт</th>
                <th className={tableStyles.th}>Дасгалын хариулт</th>
                <th className={tableStyles.th}>Ур чадвар</th>
                <th className={tableStyles.th}>Хүндийн түвшин</th>
                <th className={tableStyles.th}>Медиа</th>
                <th className={tableStyles.th}>Эх үүсвэр</th>
                <th className={tableStyles.th}>Төлөв</th>
                <th className={tableStyles.th}>Огноо</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {isLoading ? (
                <SkeletonRows count={7} cols={10} />
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      message="Энэ ангилалд зүйл байхгүй"
                      subMessage="Шүүлтүүрийг өөрчилж дахин оролдоно уу"
                    />
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => {
                  const isUnvisited = !visited.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => { markVisited(item.id); router.push(`/admin/review/${item.id}`); }}
                      className={cn(
                        tableStyles.row,
                        isUnvisited && tableStyles.rowUnvisited,
                        selectedIds.has(item.id) && "bg-accent/30 outline outline-1 outline-primary/30",
                      )}
                    >
                      <td
                        className={tableStyles.cell}
                        onClick={(e) => { e.stopPropagation(); handleSelect(item.id, !selectedIds.has(item.id)); }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => handleSelect(item.id, !selectedIds.has(item.id))}
                          className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                          aria-label={`Select ${item.task.task_id}`}
                        />
                      </td>
                      <td className={tableStyles.cell}>
                        <span className="text-xs font-medium text-foreground leading-tight">
                          {TASK_TYPE_INFO[item.task.task_type]?.label ?? item.task.task_type}
                        </span>
                      </td>
                      <td className={cn(tableStyles.cell, "max-w-[200px]")}>
                        <PromptCell text={item.task.prompt_text} />
                      </td>
                      <td className={cn(tableStyles.cell, "max-w-[120px]")}>
                        <span className="line-clamp-1 text-xs">{item.task.correct_answer || "—"}</span>
                      </td>
                      <td className={tableStyles.cell}>
                        <div className="text-xs font-medium text-foreground leading-tight">
                          {SKILL_NAMES[item.task.primary_skill] ?? item.task.primary_skill}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{item.task.primary_skill}</div>
                      </td>
                      <td className={tableStyles.cell}>
                        <DifficultyDots n={item.task.difficulty} />
                      </td>
                      <td className={tableStyles.cell}>
                        <MediaCell audioUrl={item.task.audio_url} imageUrl={item.task.image_url} />
                      </td>
                      <td className={tableStyles.cell}>
                        <span className="text-base" title={item.task.source === "AI" ? "AI" : "Хүн"}>
                          {item.task.source === "AI" ? "🤖" : "👤"}
                        </span>
                      </td>
                      <td className={tableStyles.cell}>
                        <StatusDot item={item} />
                      </td>
                      <td className={tableStyles.cellMuted}>
                        {fmtDate(item.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && visibleItems.length > 0 && (
          <TableFooter count={visibleItems.length} label="зүйл" />
        )}
      </div>

      {/* Bulk action bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-200",
          hasSelection ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!hasSelection}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Сонгогдсон: {selectedIds.size}</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Цуцлах
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bulkDeleteMutation.mutate([...selectedIds])}
              disabled={bulkDeleteMutation.isPending || bulkMutation.isPending}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors disabled:pointer-events-none disabled:opacity-40"
            >
              {bulkDeleteMutation.isPending ? "Устгаж байна…" : `Устгах (${selectedIds.size})`}
            </button>
            <button
              type="button"
              onClick={() => bulkMutation.mutate([...selectedIds])}
              disabled={bulkMutation.isPending || bulkDeleteMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:pointer-events-none disabled:opacity-40"
            >
              {bulkMutation.isPending ? "Батлаж байна…" : `Бүгдийг батлах (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300",
          toast.type === "error" ? "bg-destructive text-white" : "bg-primary text-primary-foreground",
          hasSelection && "bottom-[72px]",
          toast.visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
        role="status"
        aria-live="polite"
      >
        {toast.message}
      </div>
    </div>
  );
}
