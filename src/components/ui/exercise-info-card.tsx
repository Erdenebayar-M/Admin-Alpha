import { useState } from "react";
import {
  ERROR_LABELS,
  ERROR_GROUPS,
  LESSON_SLOT_LABELS,
  LESSON_SLOTS,
  SKILL_LABELS,
  SKILLS,
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
import { ComboSelect, Field } from "@/components/tasks/shared";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <p className="text-sm font-bold text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function ExerciseInfoCard({ task, isEditing, draft, onDraftChange }: Props) {
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const v = <K extends keyof typeof task>(key: K) =>
    (isEditing && draft && key in draft ? draft[key] : task[key]) as (typeof task)[K];

  const patch = (p: Partial<TaskContent>) => onDraftChange?.(p);

  const currentGrades = v("grade_band") as string[];
  const currentErrors = v("error_targets") as string[];
  const currentType = v("task_type") as string;

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

  // ── Read mode ─────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Дасгалын тайлбар
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <MetaRow label="Дасгалын төрөл">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium">{typeInfo?.label ?? task.task_type}</span>
              {interactionFormLabel && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {interactionFormLabel}
                </span>
              )}
              <DifficultyDots n={task.difficulty} />
            </div>
          </MetaRow>

          <MetaRow label="Түвшин">
            <span className="font-mono">{task.level_target}</span>
          </MetaRow>

          <MetaRow label="Ур чадвар">
            <>
              <span className="font-mono text-primary">{task.primary_skill}</span>
              {skillLabel && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">{skillLabel}</span>
              )}
            </>
          </MetaRow>

          <MetaRow label="Хүндийн түвшин">
            <DifficultyDots n={task.difficulty} />
          </MetaRow>

          <MetaRow label="Анги">
            <span>{task.grade_band.length > 0 ? task.grade_band.join(", ") : "—"}</span>
          </MetaRow>

          <MetaRow label="Хугацаа">
            <span>{task.estimated_time_seconds ? `${task.estimated_time_seconds}с` : "—"}</span>
          </MetaRow>

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

          <MetaRow label="Хичээлийн үе">
            <span>{slotLabel || "—"}</span>
          </MetaRow>
        </div>
      </div>
    );
  }

  // ── Edit mode — matches ClassificationForm style ───────────────────────────
  return (
    <div className="space-y-4">
      {/* Collapsible task type card */}
      <Card>
        <button
          type="button"
          onClick={() => setTypeOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold">Дасгалын төрөл</span>
            {currentType && (
              <span className="truncate text-xs text-muted-foreground">
                — {TASK_TYPE_INFO[currentType]?.label ?? currentType}
              </span>
            )}
          </div>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">{typeOpen ? "▲" : "▼"}</span>
        </button>
        {typeOpen && (
          <CardContent className="animate-in fade-in-0 slide-in-from-top-2 duration-200 border-t border-border pt-4">
            <TaskTypeSelector
              value={currentType}
              onChange={(val) => patch({ task_type: val })}
              selectedGrades={currentGrades}
            />
          </CardContent>
        )}
      </Card>

      {/* Metadata fields card — matches ClassificationForm layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Мета өгөгдөл</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Field label="Үндсэн чадвар">
              <ComboSelect
                value={v("primary_skill") as string}
                onChange={(val) => patch({ primary_skill: val })}
                placeholder="Сонгох…"
                options={SKILLS.map((s) => ({ value: s, label: `${s} — ${SKILL_LABELS[s]}` }))}
              />
            </Field>
            <Field label="Түвшин">
              <ComboSelect
                value={v("level_target") as string}
                onChange={(val) => patch({ level_target: val })}
                placeholder="Сонгох…"
                options={LEVELS.map((l) => ({ value: l, label: `${l} — ${LEVEL_LABELS[l]}` }))}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <Field label="Хүндийн түвшин (1–5)">
              <Input
                type="number"
                min={1}
                max={5}
                value={v("difficulty") as number}
                onChange={(e) => patch({ difficulty: Number(e.target.value) })}
              />
            </Field>
            <Field label="Хичээлийн үе">
              <ComboSelect
                value={v("lesson_slot_fit") as string}
                onChange={(val) => patch({ lesson_slot_fit: val })}
                placeholder="Сонгох…"
                options={LESSON_SLOTS.map((s) => ({ value: s, label: LESSON_SLOT_LABELS[s] }))}
              />
            </Field>
            <Field label="Хугацаа (секунд)">
              <Input
                type="number"
                min={0}
                value={v("estimated_time_seconds") as number}
                onChange={(e) => patch({ estimated_time_seconds: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Анги">
            <div className="flex flex-wrap gap-2">
              {GRADE_CODES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={cn(
                    "rounded-lg border px-5 py-3 text-sm font-semibold transition-all",
                    currentGrades.includes(g)
                      ? "border-primary bg-primary/5 ring-2 ring-primary text-foreground"
                      : "border-border hover:border-foreground/20 hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  {GRADE_LABELS[g]}
                </button>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>

      {/* Collapsible error types card — matches ClassificationForm style */}
      <Card>
        <button
          type="button"
          onClick={() => setErrorsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Алдааны оношилгоо</span>
            {currentErrors.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                {currentErrors.length}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{errorsOpen ? "▲" : "▼"}</span>
        </button>

        {!errorsOpen && (
          <p className="px-6 pb-4 text-[11px] text-muted-foreground">
            {currentErrors.length === 0
              ? "Алдааны төрөл сонгоогүй."
              : currentErrors.join(", ")}
          </p>
        )}

        {errorsOpen && (
          <CardContent className="animate-in fade-in-0 slide-in-from-top-2 duration-200 border-t border-border pt-4">
            <div className="divide-y divide-border">
              {ERROR_GROUPS.map((group) => (
                <div key={group.key} className="py-3 first:pt-0 last:pb-0">
                  <p className="mb-1 px-2 text-sm font-bold text-foreground">
                    {group.label} — {group.description}
                  </p>
                  <div>
                    {group.codes.map((code) => {
                      const active = currentErrors.includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => toggleError(code)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2 py-2 text-left transition-colors",
                            active ? "bg-green-50 dark:bg-green-950/30" : "hover:bg-muted/50",
                          )}
                        >
                          <span className={cn(
                            "w-3 shrink-0 text-xs font-bold",
                            active ? "text-green-600" : "text-transparent select-none",
                          )}>✓</span>
                          <span className={cn(
                            "text-sm",
                            active ? "font-semibold text-green-900 dark:text-green-100" : "text-foreground",
                          )}>
                            {code} — {ERROR_LABELS[code]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
