"use client";

import { cn } from "@/lib/utils";
import {
  TASK_TYPE_INFO,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  TASK_TYPES,
} from "@/lib/task-defaults";

interface TaskTypeSelectorProps {
  value: string;
  onChange: (taskType: string) => void;
  selectedGrades?: string[];
}

export function TaskTypeSelector({ value, onChange, selectedGrades }: TaskTypeSelectorProps) {
  const gradeSet = new Set(selectedGrades ?? []);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    types: TASK_TYPES.filter((t) => {
      const info = TASK_TYPE_INFO[t];
      if (info.category !== cat) return false;
      if (gradeSet.size === 0) return true;
      return info.grades.some((g) => gradeSet.has(g));
    }),
  })).filter((g) => g.types.length > 0);

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {grouped.map(({ category, label, types }) => (
        <div key={category}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground">
            {label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => {
              const info = TASK_TYPE_INFO[t];
              const selected = value === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange(t)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-sm font-medium leading-tight transition-all",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground"
                      : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/50",
                  )}
                >
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
