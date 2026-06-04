"use client";

import { cn } from "@/lib/utils";

/* ── Table layout classNames ── */

export const tableStyles = {
  wrapper: "overflow-x-auto rounded-lg border border-border bg-card shadow-sm",
  table: "w-full text-sm",
  thead: "border-b border-border bg-muted/40 sticky top-0 z-10",
  th: "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap",
  thCenter: "px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap",
  tbody: "divide-y divide-border",
  row: "cursor-pointer transition-colors duration-100 hover:bg-accent/50",
  rowSelected: "bg-accent/30 outline outline-1 outline-primary/30",
  rowUnvisited: "border-l-2 border-l-primary/40",
  cell: "px-3 py-2.5",
  cellMono: "px-3 py-2.5 font-mono text-xs tabular-nums",
  cellMuted: "px-3 py-2.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap",
};

/* ── SortableTh ── */

type SortDir = "asc" | "desc" | undefined;

interface SortableThProps {
  children: React.ReactNode;
  sortDir?: SortDir;
  onSort?: () => void;
  className?: string;
}

export function SortableTh({ children, sortDir, onSort, className }: SortableThProps) {
  return (
    <th
      className={cn(tableStyles.th, onSort && "cursor-pointer select-none", className)}
      aria-sort={sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none"}
    >
      <button
        type="button"
        onClick={onSort}
        className="flex items-center gap-1 group"
        disabled={!onSort}
      >
        {children}
        {onSort && (
          <span className="ml-0.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            {sortDir === "asc" ? "↑" : sortDir === "desc" ? "↓" : "↕"}
          </span>
        )}
      </button>
    </th>
  );
}

/* ── TableToolbar ── */

interface TableToolbarProps {
  resultCount?: number | undefined;
  resultLabel?: string;
  loading?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function TableToolbar({
  resultCount,
  resultLabel = "нийт",
  loading,
  left,
  right,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border", className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex items-center gap-3 shrink-0">
        {right}
        {resultCount !== undefined && !loading && (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {resultCount} {resultLabel}
          </span>
        )}
        {loading && <div className="h-3.5 w-12 animate-pulse rounded bg-muted" />}
      </div>
    </div>
  );
}

/* ── TableFooter ── */

interface TableFooterProps {
  count: number;
  label?: string;
  className?: string;
}

export function TableFooter({ count, label = "нийт мөр", className }: TableFooterProps) {
  return (
    <div className={cn("flex items-center justify-end px-4 py-2 border-t border-border text-xs text-muted-foreground tabular-nums", className)}>
      {count} {label}
    </div>
  );
}

/* ── SkeletonRows ── */

export function SkeletonRows({ count = 6, cols = 7 }: { count?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className={tableStyles.cell}>
              <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${50 + ((i * 3 + j * 7) % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
