"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Field, ComboSelect } from "./shared";
import type { FormState, ValidationErrors } from "@/hooks/useTaskForm";
import {
  SKILLS,
  SKILL_LABELS,
  LEVELS,
  LEVEL_LABELS,
  LESSON_SLOTS,
  LESSON_SLOT_LABELS,
  ERROR_GROUPS,
  ERROR_LABELS,
} from "@/lib/task-defaults";

interface ClassificationFormProps {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  toggleList: (key: "grade_band" | "error_targets", item: string) => void;
  errors: ValidationErrors;
}

export function ClassificationForm({
  form,
  set,
  toggleList,
  errors,
}: ClassificationFormProps) {
  const [errorsOpen, setErrorsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Metadata fields card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Мета өгөгдөл</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Field label="Үндсэн чадвар" required error={errors.primary_skill}>
              <ComboSelect
                value={form.primary_skill}
                onChange={(v) => set("primary_skill", v)}
                placeholder="Сонгох…"
                options={SKILLS.map((s) => ({
                  value: s,
                  label: `${s} — ${SKILL_LABELS[s]}`,
                }))}
              />
            </Field>
            <Field label="Дэд чадвар">
              <ComboSelect
                value={form.secondary_skill}
                onChange={(v) => set("secondary_skill", v)}
                placeholder="—"
                options={[
                  { value: "", label: "Байхгүй" },
                  ...SKILLS.map((s) => ({
                    value: s,
                    label: `${s} — ${SKILL_LABELS[s]}`,
                  })),
                ]}
              />
            </Field>
            <Field label="Түвшин" required error={errors.level_target}>
              <ComboSelect
                value={form.level_target}
                onChange={(v) => set("level_target", v)}
                placeholder="Сонгох…"
                options={LEVELS.map((l) => ({
                  value: l,
                  label: `${l} — ${LEVEL_LABELS[l]}`,
                }))}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <Field label="Хүндийн түвшин (1–5)" required error={errors.difficulty}>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
              />
            </Field>
            <Field label="Хичээлийн үе" required error={errors.lesson_slot_fit}>
              <ComboSelect
                value={form.lesson_slot_fit}
                onChange={(v) => set("lesson_slot_fit", v)}
                placeholder="Сонгох…"
                options={LESSON_SLOTS.map((s) => ({
                  value: s,
                  label: LESSON_SLOT_LABELS[s],
                }))}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible error types card */}
      <Card>
        <button
          type="button"
          onClick={() => setErrorsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Алдааны төрөл</span>
            {form.error_targets.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                {form.error_targets.length}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{errorsOpen ? "▲" : "▼"}</span>
        </button>

        {!errorsOpen && (
          <p className="px-6 pb-4 text-[11px] text-muted-foreground">
            {form.error_targets.length === 0
              ? "Даалгаврын төрлөөс автоматаар тогтооно. Гараар өөрчлөх боломжтой."
              : form.error_targets.join(", ")}
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
                      const active = form.error_targets.includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => toggleList("error_targets", code)}
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
