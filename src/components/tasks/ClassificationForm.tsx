"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, ComboSelect } from "./shared";
import type { FormState, ValidationErrors } from "@/hooks/useTaskForm";
import {
  SKILLS,
  SKILL_LABELS,
  LEVELS,
  LEVEL_LABELS,
  LESSON_SLOTS,
  LESSON_SLOT_LABELS,
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
  errors,
}: Omit<ClassificationFormProps, "toggleList">) {
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

    </div>
  );
}
