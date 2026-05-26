"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  TASK_TYPE_INFO,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  TASK_TYPES,
} from "@/lib/task-defaults";

interface TaskTypeSelectorProps {
  value: string;
  onChange: (taskType: string) => void;
}

export function TaskTypeSelector({ value, onChange }: TaskTypeSelectorProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    types: TASK_TYPES.filter((t) => TASK_TYPE_INFO[t].category === cat),
  }));

  return (
    <div className="space-y-5">
      {grouped.map(({ category, label, types }) => (
        <div key={category}>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {types.map((t) => {
              const info = TASK_TYPE_INFO[t];
              const selected = value === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange(t)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:border-foreground/20 hover:bg-muted/50",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <Badge
                      variant={selected ? "default" : "secondary"}
                      className="text-[10px] font-bold"
                    >
                      {info.shortLabel}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium leading-tight">
                    {info.label}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {info.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
