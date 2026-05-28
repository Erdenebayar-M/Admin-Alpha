"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import {
  TaskQueueCard,
  TaskQueueCardSkeleton,
} from "@/components/review/TaskQueueCard";
import { approveVariant, getContentStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ReviewItem } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "all" | "needs-review" | "ai-passed" | "done";
type SortOrder = "flagged-first" | "newest" | "oldest";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs-review", label: "Needs Review" },
  { id: "ai-passed", label: "AI Passed" },
  { id: "done", label: "Done" },
];

const STATUS_PRIORITY: Partial<Record<ReviewItem["status"], number>> = {
  ai_flagged: 0,
  pending: 1,
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function filterByTab(items: ReviewItem[], tab: Tab): ReviewItem[] {
  switch (tab) {
    case "needs-review":
      return items.filter(
        (i) => i.status === "ai_flagged" || i.status === "pending",
      );
    case "ai-passed":
      return items.filter((i) => i.status === "ai_passed");
    case "done":
      return items.filter(
        (i) => i.status === "human_approved" || i.status === "human_rejected",
      );
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
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "oldest":
      return arr.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReviewQueuePage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortOrder>("flagged-first");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const { data: allItems = [], isLoading, error } = useReviewQueue();
  if (error) console.error("[ReviewQueue] fetch error:", error);
  const { data: stats } = useQuery({
    queryKey: ["content-stats"],
    queryFn: getContentStats,
    staleTime: 30_000,
  });

  const showToast = useCallback((message: string, duration = 2500) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  // Derived data
  const tabItems = useMemo(
    () => filterByTab(allItems, activeTab),
    [allItems, activeTab],
  );
  const visibleItems = useMemo(
    () => sortItems(tabItems, sort),
    [tabItems, sort],
  );

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

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleSelectAllAiPassed() {
    const ids = visibleItems
      .filter((i) => i.status === "ai_passed")
      .map((i) => i.id);
    setSelectedIds((prev) => new Set([...prev, ...ids]));
  }

  // ─── Bulk approve mutation ──────────────────────────────────────────────────

  const bulkMutation = useMutation({
    mutationFn: async (ids: string[]): Promise<void> => {
      const items = allItems.filter((i) => ids.includes(i.id));
      await Promise.all(
        items.map((i) => approveVariant(i.task.task_id, i.variant_id)),
      );
    },
    onMutate: (ids) => {
      showToast(
        `Approving ${ids.length} item${ids.length === 1 ? "" : "s"}…`,
        2000,
      );
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
      setSelectedIds(new Set());
      setTimeout(() => showToast(`${ids.length} approved`), 300);
    },
    onError: () => {
      showToast("Bulk approve failed. Please try again.");
    },
  });

  const hasSelection = selectedIds.size > 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn("mx-auto max-w-3xl px-4 py-8", hasSelection && "pb-24")}>
      <h1 className="mb-6 text-xl font-semibold">Review Queue</h1>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard
          label="Pending"
          value={isLoading ? "—" : String(pendingCount)}
        />
        <StatCard
          label="AI Flagged"
          value={isLoading ? "—" : String(flaggedCount)}
          accent="yellow"
        />
        <StatCard
          label="Approved today"
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
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar: select-all + sort */}
      <div className="mb-3 mt-3 flex min-h-[28px] items-center justify-between gap-3">
        <div>
          {!isLoading && aiPassedInView > 0 && (
            <button
              type="button"
              onClick={handleSelectAllAiPassed}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Select all AI Passed ({aiPassedInView})
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <label htmlFor="sort-order" className="text-xs text-muted-foreground">
            Sort:
          </label>
          <select
            id="sort-order"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="flagged-first">AI Flagged first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Queue list */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <TaskQueueCardSkeleton key={i} />
          ))
        ) : visibleItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No items in this category.
          </p>
        ) : (
          visibleItems.map((item) => (
            <TaskQueueCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>

      {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-200",
          hasSelection ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!hasSelection}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"}{" "}
              selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Clear selection
            </button>
          </div>

          <button
            type="button"
            onClick={() => bulkMutation.mutate([...selectedIds])}
            disabled={bulkMutation.isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:pointer-events-none disabled:opacity-60"
          >
            {bulkMutation.isPending
              ? "Approving…"
              : `Bulk Approve (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg transition-all duration-300",
          // Shift up when bulk bar is visible so they don't overlap
          hasSelection && "bottom-[72px]",
          toast.visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        {toast.message}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
