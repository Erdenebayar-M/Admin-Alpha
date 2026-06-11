"use client";

import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Field } from "../shared";
import { CommonFields, FeedbackFields } from "./sections";
import { PROMPT_SUGGESTIONS } from "./prompt-suggestions";
import type { SubProps } from "./types";

// ─── self_check ───────────────────────────────────────────────────────────────

export function SelfCheckContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-xs text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
        Сурагч өөрийн хариуг жишиг хариулттай харьцуулан шалгана.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.self_check}
      />
      <Separator />
      <Field label="Анхны оролдлого (original_attempt)" hint="Сурагчийн бичсэн эх (AI/seed-ийн тохиолдолд)">
        <Textarea
          rows={3}
          value={form.original_attempt}
          onChange={(e) => set("original_attempt", e.target.value)}
          placeholder="Жнэ: Сурагчийн буруу бичсэн эх…"
          className="resize-y"
        />
      </Field>
      <Field label="Жишиг хариулт" required error={errors.model_answer}>
        <Textarea
          rows={3}
          value={form.model_answer}
          onChange={(e) => {
            set("model_answer", e.target.value);
            set("correct_answer", e.target.value);
          }}
          placeholder="Жнэ: Зөв бичигдсэн хувилбар…"
          className="resize-y border-green-500/30"
        />
      </Field>
      <Field label="Харьцуулах горим">
        <div className="flex gap-3">
          {(["side_by_side", "highlight_diff"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set("comparison_mode", mode)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                form.comparison_mode === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {mode === "side_by_side" ? "Хажуу тал" : "Ялгааг тодруулах"}
            </button>
          ))}
        </div>
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}
