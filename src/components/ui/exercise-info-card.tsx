import { useState } from "react";
import {
  ERROR_LABELS,
  ERROR_GROUPS,
  LESSON_SLOT_LABELS,
  LESSON_SLOTS,
  SKILL_LABELS,
  LEVELS,
  LEVEL_LABELS,
  TASK_TYPE_INFO,
  GRADE_CODES,
  GRADE_LABELS,
  deriveInteractionForm,
  INTERACTION_FORM_LABELS,
} from "@/lib/task-defaults";
import { TaskTypeSelector } from "@/components/tasks/TaskTypeSelector";
import type { TaskContent } from "@/lib/types";
import { DifficultyDots } from "@/components/ui/difficulty-dots";
import { ComboSelect } from "@/components/tasks/shared";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";

interface Props {
  task: Pick<
    TaskContent,
    | "task_type"
    | "primary_skill"
    | "level_target"
    | "grade_band"
    | "difficulty"
    | "estimated_time_seconds"
    | "lesson_slot_fit"
    | "error_targets"
  >;
  isEditing?: boolean;
  draft?: Partial<TaskContent>;
  onDraftChange?: (patch: Partial<TaskContent>) => void;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-muted-foreground mb-0.5">
        {label}
      </p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function ExerciseInfoCard({ task, isEditing, draft, onDraftChange }: Props) {
  const [errorsOpen, setErrorsOpen] = useState(false);

  // helpers to read current value (draft overrides task when editing)
  const v = <K extends keyof typeof task>(key: K) =>
    (isEditing && draft && key in draft ? draft[key] : task[key]) as (typeof task)[K];

  const patch = (p: Partial<TaskContent>) => onDraftChange?.(p);

  const currentGrades = v("grade_band") as string[];
  const currentErrors = v("error_targets") as string[];

  const skillLabel = SKILL_LABELS[task.primary_skill];
  const slotLabel = LESSON_SLOT_LABELS[task.lesson_slot_fit] ?? task.lesson_slot_fit;
  const typeInfo = TASK_TYPE_INFO[task.task_type];
  const interactionForm = deriveInteractionForm(task.task_type);
  const interactionFormLabel = interactionForm ? INTERACTION_FORM_LABELS[interactionForm] : null;

  const toggleGrade = (g: string) => {
    const next = currentGrades.includes(g)
      ? currentGrades.filter((x) => x !== g)
      : [...currentGrades, g];
    patch({ grade_band: next });
  };

  const toggleError = (code: string) => {
    const next = currentErrors.includes(code)
      ? currentErrors.filter((x) => x !== code)
      : [...currentErrors, code];
    patch({ error_targets: next });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="space-y-3">
        {/* Task type — list selector in edit, inline summary in read */}
        <div>
          <p className="text-sm font-bold text-muted-foreground mb-1">Дасгалын төрөл</p>
          {isEditing ? (
            <TaskTypeSelector
              value={v("task_type") as string}
              onChange={(val) => patch({ task_type: val })}
              selectedGrades={currentGrades}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium">{typeInfo?.label ?? task.task_type}</span>
              {interactionFormLabel && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {interactionFormLabel}
                </span>
              )}
              <DifficultyDots n={task.difficulty} />
            </div>
          )}
        </div>

        {/* Difficulty — only shown in edit mode (read mode merges it above) */}
        {isEditing && (
          <MetaRow label="Хүндийн түвшин">
            <Input
              type="number"
              min={1}
              max={5}
              value={v("difficulty") as number}
              onChange={(e) => patch({ difficulty: Number(e.target.value) })}
              className="h-8 w-20"
            />
          </MetaRow>
        )}

        <MetaRow label="Түвшин">
          {isEditing ? (
            <ComboSelect
              value={v("level_target") as string}
              onChange={(val) => patch({ level_target: val })}
              placeholder="Сонгох…"
              options={LEVELS.map((l) => ({ value: l, label: `${l} — ${LEVEL_LABELS[l]}` }))}
            />
          ) : (
            <span className="font-mono">{task.level_target}</span>
          )}
        </MetaRow>

        <MetaRow label="Ур чадвар">
          {isEditing ? (
            <ComboSelect
              value={v("primary_skill") as string}
              onChange={(val) => patch({ primary_skill: val })}
              placeholder="Сонгох…"
              options={SKILLS.map((s) => ({ value: s, label: `${s} — ${SKILL_LABELS[s]}` }))}
            />
          ) : (
            <>
              <span className="font-mono text-primary">{task.primary_skill}</span>
              {skillLabel && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">{skillLabel}</span>
              )}
            </>
          )}
        </MetaRow>

        <MetaRow label="Анги">
          {isEditing ? (
            <div className="flex flex-wrap gap-1">
              {GRADE_CODES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs font-medium transition-colors",
                    currentGrades.includes(g)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {GRADE_LABELS[g]}
                </button>
              ))}
            </div>
          ) : (
            <span>{task.grade_band.length > 0 ? task.grade_band.join(", ") : "—"}</span>
          )}
        </MetaRow>

        <MetaRow label="Хугацаа">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={v("estimated_time_seconds") as number}
                onChange={(e) => patch({ estimated_time_seconds: Number(e.target.value) })}
                className="h-8 w-20"
              />
              <span className="text-xs text-muted-foreground">с</span>
            </div>
          ) : (
            <span>{task.estimated_time_seconds ? `${task.estimated_time_seconds}с` : "—"}</span>
          )}
        </MetaRow>

        {!isEditing && (
          <MetaRow label="Алдааны оношилгоо">
            {task.error_targets.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {task.error_targets.map((code) => (
                  <span
                    key={code}
                    className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-normal"
                  >
                    {code}{ERROR_LABELS[code] ? ` — ${ERROR_LABELS[code]}` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </MetaRow>
        )}

        <MetaRow label="Хичээлийн үе">
          {isEditing ? (
            <ComboSelect
              value={v("lesson_slot_fit") as string}
              onChange={(val) => patch({ lesson_slot_fit: val })}
              placeholder="Сонгох…"
              options={LESSON_SLOTS.map((s) => ({ value: s, label: LESSON_SLOT_LABELS[s] }))}
            />
          ) : (
            <span>{slotLabel || "—"}</span>
          )}
        </MetaRow>
      </div>

      {/* Error targets — collapsible, shown in edit mode as full-width section */}
      {isEditing && (
        <div className="animate-in fade-in-0 duration-200 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setErrorsOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Алдааны оношилгоо</span>
              {currentErrors.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                  {currentErrors.length}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{errorsOpen ? "▲" : "▼"}</span>
          </button>

          {!errorsOpen && (
            <p className="px-4 pb-3 text-[11px] text-muted-foreground">
              {currentErrors.length === 0
                ? "Алдааны төрөл сонгоогүй."
                : currentErrors.join(", ")}
            </p>
          )}

          {errorsOpen && (
            <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200 border-t border-border px-4 pb-4 pt-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ERROR_GROUPS.map((group) => (
                  <SectionCard key={group.key} title={`${group.label} — ${group.description}`}>
                    <div className="flex flex-wrap gap-1.5">
                      {group.codes.map((code) => {
                        const active = currentErrors.includes(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => toggleError(code)}
                            className={cn(
                              "rounded border px-2.5 py-1 text-xs font-medium transition-colors",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-foreground hover:border-primary/40 hover:bg-muted/50",
                            )}
                          >
                            {ERROR_LABELS[code]}
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
