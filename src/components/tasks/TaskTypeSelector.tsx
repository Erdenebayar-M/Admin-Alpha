"use client";

import { cn } from "@/lib/utils";
import {
  TASK_TYPE_INFO,
  TASK_TYPE_BLUEPRINT,
  CATEGORY_LABELS,
  SKILL_LABELS,
  SKILLS,
  TASK_TYPES,
} from "@/lib/task-defaults";
import { SectionCard } from "@/components/ui/section-card";

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {grouped.map(({ skill, label, types }) => (
        <SectionCard key={skill} title={label}>
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
                    "flex flex-col items-start rounded-md border px-2.5 py-1.5 text-left text-sm font-medium leading-tight transition-all",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground"
                      : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/50",
                  )}
                >
                  {info.label}
                  <span className="mt-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                    {CATEGORY_LABELS[info.category]}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
