"use client";

import { cn } from "@/lib/utils";
import {
  TASK_TYPE_INFO,
  TASK_TYPE_BLUEPRINT,
  SKILL_LABELS,
  SKILLS,
  TASK_TYPES,
  computeDefaults,
  deriveInteractionForm,
  INTERACTION_FORM_LABELS,
} from "@/lib/task-defaults";
import { DifficultyDots } from "@/components/ui/difficulty-dots";

interface TaskTypeSelectorProps {
  value: string;
  onChange: (taskType: string) => void;
  selectedGrades?: string[];
}

export function TaskTypeSelector({ value, onChange, selectedGrades }: TaskTypeSelectorProps) {
  const gradeSet = new Set(selectedGrades ?? []);

  const grouped = SKILLS
    .map((skill) => ({
      skill,
      label: SKILL_LABELS[skill],
      types: TASK_TYPES.filter((t) => {
        if (TASK_TYPE_BLUEPRINT[t]?.primary_skill !== skill) return false;
        if (gradeSet.size === 0) return true;
        return TASK_TYPE_INFO[t].grades.some((g) => gradeSet.has(g));
      }),
    }))
    .filter((g) => g.types.length > 0);

  return (
    <div className="divide-y divide-border">
      {grouped.map(({ skill, label, types }) => (
        <div key={skill} className="py-3 first:pt-0 last:pb-0">
          <p className="mb-1 px-2 text-sm font-bold text-foreground">{label}</p>
          <div>
            {types.map((t) => {
              const info = TASK_TYPE_INFO[t];
              const selected = value === t;
              const form = deriveInteractionForm(t);
              const formLabel = form ? INTERACTION_FORM_LABELS[form] : null;
              const difficulty = Number(computeDefaults(t, selectedGrades ?? []).difficulty);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange(t)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded px-2 py-2 text-left transition-colors",
                    selected ? "bg-green-50 dark:bg-green-950/30" : "hover:bg-muted/50",
                  )}
                >
                  <span className={cn(
                    "mt-0.5 w-3 shrink-0 text-xs font-bold",
                    selected ? "text-green-600" : "text-transparent select-none",
                  )}>✓</span>
                  <div className="flex flex-1 min-w-0 items-center gap-2 flex-wrap">
                    <p className={cn(
                      "text-sm leading-tight",
                      selected ? "font-semibold text-green-900 dark:text-green-100" : "text-foreground",
                    )}>
                      {info.label}
                    </p>
                    {formLabel && (
                      <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                        {formLabel}
                      </span>
                    )}
                    <DifficultyDots n={difficulty} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
