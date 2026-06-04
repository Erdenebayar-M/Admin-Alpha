import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

const ICON_TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info:    "bg-primary/10 text-primary",
  success: "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  danger:  "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
};

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  icon: React.ReactNode;
  tone?: Tone;
  subLine?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon, tone = "info", subLine, loading, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card px-5 py-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground leading-none">
              {value ?? "—"}
            </p>
          )}
          {subLine && !loading && (
            <p className="mt-1.5 text-xs text-muted-foreground">{subLine}</p>
          )}
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", ICON_TONE_CLASSES[tone])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
