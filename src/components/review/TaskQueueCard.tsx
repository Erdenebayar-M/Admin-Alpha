"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReviewItem } from "@/lib/types";

const FLAG_LABELS: Record<string, string> = {
  A:  "Зөв бичих дүрмийн алдаа",
  B:  "Хуурамч хариулт буруу",
  C1: "Үсэг буруу орлуулсан",
  C2: "Үсэг буруу орлуулсан (хувилбар)",
  D:  "Үгийн зааг буруу",
  E1: "Дүрмийн алдаа (1-р төрөл)",
  E2: "Дүрмийн алдаа (2-р төрөл)",
  G1: "Сурган хүмүүжүүлэхийн асуудал (1)",
  G2: "Сурган хүмүүжүүлэхийн асуудал (2)",
  H4: "Агуулгын асуудал",
};

const STATUS_STYLES: Record<ReviewItem["status"], string> = {
  ai_flagged:     "bg-[#E91D26] text-white border-[#E91D26]",
  pending:        "bg-gray-500 text-white border-gray-500",
  ai_passed:      "bg-[#69BF68] text-white border-[#69BF68]",
  human_approved: "bg-[#48A145] text-white border-[#48A145]",
  human_rejected: "bg-[#90251D] text-white border-[#90251D]",
  needs_revision: "bg-[#DC2B33] text-white border-[#DC2B33]",
};

const STATUS_LABELS: Record<ReviewItem["status"], string> = {
  ai_flagged:     "AI тэмдэглэсэн",
  pending:        "Хүлээгдэж буй",
  ai_passed:      "AI дамжсан",
  human_approved: "Батлагдсан",
  human_rejected: "Татгалзсан",
  needs_revision: "Засах шаардлагатай",
};

interface Props {
  item: ReviewItem;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onOpen?: (id: string) => void;
}

function CardBody({
  item,
  onOpen,
}: {
  item: ReviewItem;
  onOpen?: (id: string) => void;
}) {
  const { task } = item;
  const flagLabels = item.ai_review_issues
    .map((code) => FLAG_LABELS[code] ?? code)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const bodyClass =
    "flex min-w-0 flex-1 items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded";

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{task.task_id}</span>
          <span className="rounded bg-muted px-1 py-0.5 text-xs">{task.task_type}</span>
        </div>
        <p className="mb-1 text-sm font-medium">{task.title}</p>
        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{task.prompt_text}</p>
        {item.ai_review_issues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flagLabels.map((label, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded border border-yellow-200 bg-yellow-50 px-1.5 py-0.5 text-xs text-yellow-800"
              >
                ⚠ {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
            STATUS_STYLES[item.status],
          )}
        >
          {STATUS_LABELS[item.status]}
        </span>
        <div className="flex gap-1">
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {task.grade_band.join("/")}
          </span>
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {task.primary_skill}
          </span>
        </div>
      </div>
    </>
  );

  if (onOpen) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(item.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen(item.id);
        }}
        className={cn(bodyClass, "cursor-pointer")}
      >
        {content}
      </div>
    );
  }

  return (
    <Link href={`/admin/review/${item.id}`} className={bodyClass}>
      {content}
    </Link>
  );
}

export function TaskQueueCard({ item, selected = false, onSelect, onOpen }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors",
        selected ? "border-blue-400 bg-blue-50/40" : "border-border hover:bg-muted/50",
      )}
    >
      {onSelect && (
        <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(item.id, !selected)}
            className="h-4 w-4 cursor-pointer rounded border-border"
            aria-label={`Select ${item.task.task_id}`}
          />
        </div>
      )}
      <CardBody item={item} onOpen={onOpen} />
    </div>
  );
}

export function TaskQueueCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="h-5 w-20 rounded bg-muted" />
          <div className="flex gap-1">
            <div className="h-5 w-9 rounded bg-muted" />
            <div className="h-5 w-7 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
