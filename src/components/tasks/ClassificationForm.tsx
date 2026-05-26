"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, ToggleChip, ComboSelect } from "./shared";
import type { FormState, ValidationErrors } from "@/hooks/useTaskForm";
import {
  GRADE_BANDS,
  GRADE_BAND_LABELS,
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
  toggleGradeBand: (gb: string) => void;
  errors: ValidationErrors;
}

export function ClassificationForm({ form, set, toggleGradeBand, errors }: ClassificationFormProps) {
  return (
    <div className="space-y-4">
      <Separator />

      <Field label="Анги" required error={errors.grade_band}>
        <div className="flex gap-2">
          {GRADE_BANDS.map((gb) => (
            <ToggleChip
              key={gb}
              label={`${gb} — ${GRADE_BAND_LABELS[gb]}`}
              selected={form.grade_band.includes(gb)}
              onClick={() => toggleGradeBand(gb)}
            />
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Үндсэн чадвар" required error={errors.primary_skill}>
          <ComboSelect
            value={form.primary_skill}
            onChange={(v) => set("primary_skill", v)}
            placeholder="Сонгох…"
            options={SKILLS.map((s) => ({ value: s, label: `${s} — ${SKILL_LABELS[s]}` }))}
          />
        </Field>
        <Field label="Дэд чадвар">
          <ComboSelect
            value={form.secondary_skill}
            onChange={(v) => set("secondary_skill", v)}
            placeholder="—"
            options={[
              { value: "", label: "Байхгүй" },
              ...SKILLS.map((s) => ({ value: s, label: `${s} — ${SKILL_LABELS[s]}` })),
            ]}
          />
        </Field>
        <Field label="Түвшин" required error={errors.level_target}>
          <ComboSelect
            value={form.level_target}
            onChange={(v) => set("level_target", v)}
            placeholder="Сонгох…"
            options={LEVELS.map((l) => ({ value: l, label: `${l} — ${LEVEL_LABELS[l]}` }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Хэцүү байдал (1–5)" required error={errors.difficulty}>
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
            options={LESSON_SLOTS.map((s) => ({ value: s, label: LESSON_SLOT_LABELS[s] }))}
          />
        </Field>
      </div>
    </div>
  );
}
