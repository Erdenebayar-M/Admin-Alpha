"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { approveVariant } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TASK_TYPE_INFO } from "@/lib/task-defaults";
import type { ReviewItem } from "@/lib/types";

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

type Tab = "all" | "needs-review" | "ai-passed" | "done";
type SortOrder = "flagged-first" | "newest" | "oldest";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "needs-review", label: "Хянах шаардлагатай" },
  { id: "ai-passed", label: "AI дамжсан" },
  { id: "done", label: "Дуусгасан" },
];

const STATUS_STYLES: Record<ReviewItem["status"], string> = {
  ai_flagged:     "bg-[#E91D26] text-white",
  pending:        "bg-gray-500 text-white",
  ai_passed:      "bg-[#69BF68] text-white",
  human_approved: "bg-[#48A145] text-white",
  human_rejected: "bg-[#90251D] text-white",
  needs_revision: "bg-[#DC2B33] text-white",
};

const STATUS_LABELS: Record<ReviewItem["status"], string> = {
  ai_flagged:     "AI тэмдэглэсэн",
  pending:        "Хүлээгдэж буй",
  ai_passed:      "AI дамжсан",
  human_approved: "Батлагдсан",
  human_rejected: "Татгалзсан",
  needs_revision: "Засах шаардлагатай",
};

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

function sortItems(items: ReviewItem[], order: SortOrder): ReviewItem[] {
  const arr = [...items];
  switch (order) {
    case "flagged-first":
      return arr.sort((a, b) => (STATUS_PRIORITY[a.status] ?? 2) - (STATUS_PRIORITY[b.status] ?? 2));
    case "newest":
      return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "oldest":
      return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
}

function PromptCell({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="group relative">
      <span className="line-clamp-1 cursor-default text-xs text-muted-foreground">{text}</span>
      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-72 rounded-md border border-border bg-popover p-3 text-xs leading-relaxed text-foreground shadow-lg group-hover:block">
        {text}
      </div>
    </div>
  );
}

export function ReviewTab() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortOrder>("flagged-first");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const { data: allItems = [], isLoading } = useReviewQueue();

  const showToast = useCallback((message: string, duration = 2500) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  const tabItems = useMemo(() => filterByTab(allItems, activeTab), [allItems, activeTab]);
  const visibleItems = useMemo(() => sortItems(tabItems, sort), [tabItems, sort]);
  const aiPassedInView = useMemo(() => visibleItems.filter((i) => i.status === "ai_passed").length, [visibleItems]);

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
    onMutate: (ids) => showToast(`${ids.length} зүйл батлаж байна…`, 2000),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
      setSelectedIds(new Set());
      setTimeout(() => showToast(`${ids.length} батлагдлаа`), 300);
    },
    onError: () => showToast("Олноор батлахад алдаа гарлаа. Дахин оролдоно уу."),
  });

  const hasSelection = selectedIds.size > 0;

  return (
    <div className={cn("px-4 py-6", hasSelection && "pb-24")}>
      {/* Filter tabs + sort */}
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-border">
        <div className="flex gap-1">
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
        <div className="flex items-center gap-2 pb-2 shrink-0">
          {!isLoading && aiPassedInView > 0 && (
            <button
              type="button"
              onClick={handleSelectAllAiPassed}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              AI дамжсан бүгдийг сонгох ({aiPassedInView})
            </button>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/30"
          >
            <option value="flagged-first">AI тэмдэглэснийг эхэнд</option>
            <option value="newest">Шинийг эхэнд</option>
            <option value="oldest">Хуучнийг эхэнд</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Энэ ангилалд зүйл байхгүй.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="w-8 px-3 py-2.5" />
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Төрөл</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Гарчиг</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Анги</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Чадвар</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Төлөв</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => router.push(`/admin/review/${item.id}`)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedIds.has(item.id) && "bg-blue-50/40 dark:bg-blue-950/20",
                  )}
                >
                  <td
                    className="px-3 py-2.5"
                    onClick={(e) => { e.stopPropagation(); handleSelect(item.id, !selectedIds.has(item.id)); }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => handleSelect(item.id, !selectedIds.has(item.id))}
                      className="h-4 w-4 cursor-pointer rounded border-border"
                      aria-label={`Select ${item.task.task_id}`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-sm leading-tight">
                      {TASK_TYPE_INFO[item.task.task_type]?.label ?? item.task.task_type}
                    </div>
                    <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {item.task.task_type}
                    </span>
                  </td>
                  <td className="max-w-[180px] px-3 py-2.5">
                    <span className="line-clamp-1 font-medium">{item.task.title}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {item.task.grade_band.map((g) => (
                        <span key={g} className="rounded border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-medium text-foreground">
                      {SKILL_NAMES[item.task.primary_skill] ?? item.task.primary_skill}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{item.task.primary_skill}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", STATUS_STYLES[item.status])}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:pointer-events-none disabled:opacity-40"
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
