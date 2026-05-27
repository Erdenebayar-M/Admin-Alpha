"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Field, ToggleChip, ComboSelect } from "./shared";
import type { FormState, ValidationErrors } from "@/hooks/useTaskForm";
import {
  SKILLS,
  SKILL_LABELS,
  LEVELS,
  LEVEL_LABELS,
  LESSON_SLOTS,
  LESSON_SLOT_LABELS,
  ERROR_CODES,
  ERROR_LABELS,
} from "@/lib/task-defaults";

interface ClassificationFormProps {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  toggleList: (key: "grade_band" | "error_targets", item: string) => void;
  errors: ValidationErrors;
}

export function ClassificationForm({ form, set, toggleList, errors }: ClassificationFormProps) {
  return (
    <div className="space-y-4">
      <Separator />

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

      <Field label="Алдааны төрөл">
        <div className="flex flex-wrap gap-1.5">
          {ERROR_CODES.map((code) => {
            const active = form.error_targets.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleList("error_targets", code)}
                className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors"
                style={active ? undefined : undefined}
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="pointer-events-none text-[10px]"
                >
                  {code}
                </Badge>
                <span className={active ? "text-foreground" : "text-muted-foreground"}>
                  {ERROR_LABELS[code]}
                </span>
              </button>
            );
          })}
        </div>
        {form.error_targets.length === 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Даалгаврын төрлөөс автоматаар тогтооно. Гараар өөрчлөх боломжтой.
          </p>
        )}
      </Field>
    </div>
  );
}
