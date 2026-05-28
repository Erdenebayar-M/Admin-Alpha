"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { TaskQueueCard, TaskQueueCardSkeleton } from "@/components/review/TaskQueueCard";
import { approveVariant, getContentStats } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import type { ReviewItem } from "@/lib/types";

type Tab = "all" | "needs-review" | "ai-passed" | "done";
type SortOrder = "flagged-first" | "newest" | "oldest";

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
    case "needs-review":
      return items.filter((i) => i.status === "ai_flagged" || i.status === "pending");
    case "ai-passed":
      return items.filter((i) => i.status === "ai_passed");
    case "done":
      return items.filter((i) => i.status === "human_approved" || i.status === "human_rejected");
    default:
      return items;
  }
}

function sortItems(items: ReviewItem[], order: SortOrder): ReviewItem[] {
  const arr = [...items];
  switch (order) {
    case "flagged-first":
      return arr.sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 2;
        const pb = STATUS_PRIORITY[b.status] ?? 2;
        return pa - pb;
      });
    case "newest":
      return arr.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "oldest":
      return arr.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "yellow" | "green";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular-nums text-2xl font-semibold",
          accent === "yellow" && "text-yellow-600",
          accent === "green" && "text-green-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ReviewTab() {
  const queryClient = useQueryClient();
  const { openReviewDetail } = useModalStore();

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortOrder>("flagged-first");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const { data: allItems = [], isLoading } = useReviewQueue();
  const { data: stats } = useQuery({
    queryKey: ["content-stats"],
    queryFn: getContentStats,
    staleTime: 30_000,
  });

  const showToast = useCallback((message: string, duration = 2500) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  const tabItems = useMemo(() => filterByTab(allItems, activeTab), [allItems, activeTab]);
  const visibleItems = useMemo(() => sortItems(tabItems, sort), [tabItems, sort]);

  const pendingCount = useMemo(
    () => allItems.filter((i) => i.status === "pending").length,
    [allItems],
  );
  const flaggedCount = useMemo(
    () => allItems.filter((i) => i.status === "ai_flagged").length,
    [allItems],
  );
  const approvedTodayCount = stats?.pipeline.approved_today ?? 0;
  const aiPassedInView = useMemo(
    () => visibleItems.filter((i) => i.status === "ai_passed").length,
    [visibleItems],
  );

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

  const bulkMutation = useMutation({
    mutationFn: async (ids: string[]): Promise<void> => {
      const items = allItems.filter((i) => ids.includes(i.id));
      await Promise.all(items.map((i) => approveVariant(i.task.task_id, i.variant_id)));
    },
    onMutate: (ids) => {
      showToast(`${ids.length} зүйл батлаж байна…`, 2000);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
      setSelectedIds(new Set());
      setTimeout(() => showToast(`${ids.length} батлагдлаа`), 300);
    },
    onError: () => {
      showToast("Олноор батлахад алдаа гарлаа. Дахин оролдоно уу.");
    },
  });

  const hasSelection = selectedIds.size > 0;

  return (
    <div className={cn("px-4 py-6", hasSelection && "pb-24")}>
      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Хүлээж буй" value={isLoading ? "—" : String(pendingCount)} />
        <StatCard
          label="AI тэмдэглэсэн"
          value={isLoading ? "—" : String(flaggedCount)}
          accent="yellow"
        />
        <StatCard
          label="Өнөөдөр батлагдсан"
          value={isLoading ? "—" : String(approvedTodayCount)}
          accent="green"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const count = isLoading ? null : filterByTab(allItems, tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {count !== null && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mb-3 mt-3 flex min-h-[28px] items-center justify-between gap-3">
        <div>
          {!isLoading && aiPassedInView > 0 && (
            <button
              type="button"
              onClick={handleSelectAllAiPassed}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              AI дамжсан бүгдийг сонгох ({aiPassedInView})
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <label htmlFor="review-sort" className="text-xs text-muted-foreground">
            Эрэмбэлэх:
          </label>
          <select
            id="review-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="flagged-first">AI тэмдэглэснийг эхэнд</option>
            <option value="newest">Шинийг эхэнд</option>
            <option value="oldest">Хуучнийг эхэнд</option>
          </select>
        </div>
      </div>

      {/* Queue list — clicking opens detail modal */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <TaskQueueCardSkeleton key={i} />)
        ) : visibleItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Энэ ангилалд зүйл байхгүй.
          </p>
        ) : (
          visibleItems.map((item) => (
            <TaskQueueCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onSelect={handleSelect}
              onOpen={openReviewDetail}
            />
          ))
        )}
      </div>

      {/* Bulk action bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-200",
          hasSelection ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!hasSelection}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Сонгогдсон: {selectedIds.size}</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Цуцлах
            </button>
          </div>
          <button
            type="button"
            onClick={() => bulkMutation.mutate([...selectedIds])}
            disabled={bulkMutation.isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:pointer-events-none disabled:opacity-60"
          >
            {bulkMutation.isPending ? "Батлаж байна…" : `Олноор батлах (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg transition-all duration-300",
          hasSelection && "bottom-[72px]",
          toast.visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        {toast.message}
      </div>
    </div>
  );
}
