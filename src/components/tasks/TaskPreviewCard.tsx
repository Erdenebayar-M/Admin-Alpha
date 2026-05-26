"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FormState } from "@/hooks/useTaskForm";
import type { OptionGroup } from "@/lib/task-defaults";
import {
  TASK_TYPE_INFO,
  SKILL_LABELS,
  LEVEL_LABELS,
  GRADE_BAND_LABELS,
  LESSON_SLOT_LABELS,
  ERROR_LABELS,
  parseLines,
} from "@/lib/task-defaults";

interface TaskPreviewCardProps {
  form: FormState;
  groups: OptionGroup[];
  taskType: string;
  onGoToStep: (step: number) => void;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function TaskPreviewCard({ form, groups, taskType, onGoToStep }: TaskPreviewCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const typeInfo = TASK_TYPE_INFO[form.task_type];

  return (
    <div className="space-y-6">
      {/* Student view simulation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Сурагчийн харагдац</p>
          <Button variant="ghost" size="sm" onClick={() => onGoToStep(1)}>
            Засах →
          </Button>
        </div>
        <div className="rounded-lg border bg-muted/30 p-5 space-y-4">
          <p className="text-base font-medium">{form.prompt_text || "—"}</p>

          {groups.includes("dictation") && (
            <div className="flex items-center gap-3 rounded-md border border-dashed p-3 text-muted-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12V4.5" />
              </svg>
              <span className="text-sm">{form.audio_text || "Аудио текст"}</span>
            </div>
          )}

          {groups.includes("correction") && form.incorrect_text && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive mb-1">Буруу текст:</p>
              <p className="text-sm">{form.incorrect_text}</p>
            </div>
          )}

          {groups.includes("multiple_choice") && (
            <div className="space-y-2">
              {[form.correct_answer, ...parseLines(form.expected_answers)].filter(Boolean).map((opt, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                  {opt}
                </div>
              ))}
            </div>
          )}

          {groups.includes("rewrite") && form.initial_text && (
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Эх бичвэр:</p>
              <p className="text-sm">{form.initial_text}</p>
            </div>
          )}

          {taskType === "TT9" && form.initial_text && (
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Холилдсон үсгүүд:</p>
              <p className="text-lg font-mono tracking-[0.5em] text-center py-2">{form.initial_text}</p>
            </div>
          )}

          {taskType === "TT10" && form.initial_text && (
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Дутуу үг:</p>
              <p className="text-lg font-mono text-center py-2">{form.initial_text}</p>
            </div>
          )}

          {taskType === "TT11" && (
            <div className="flex gap-3 justify-center py-2">
              {["Зөв", "Буруу"].map((opt) => (
                <div key={opt} className="flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                  {opt}
                </div>
              ))}
            </div>
          )}

          {!groups.includes("multiple_choice") && !groups.includes("correction") && !groups.includes("rewrite") && !groups.includes("dictation") && taskType !== "TT9" && taskType !== "TT10" && taskType !== "TT11" && (
            <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Сурагч энд хариулт бичнэ...
            </div>
          )}

          {(groups.includes("dictation") || groups.includes("rewrite")) && !form.initial_text && taskType !== "TT9" && taskType !== "TT10" && (
            <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Сурагч энд хариулт бичнэ...
            </div>
          )}
        </div>

        {/* Answer reveal */}
        <div>
          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-xs text-primary hover:underline"
          >
            {showAnswer ? "Зөв хариулт нуух ▲" : "Зөв хариулт харах ▼"}
          </button>
          {showAnswer && (
            <div className="mt-2 rounded-md border-l-4 border-green-500 bg-green-50 p-3 dark:bg-green-950/30">
              <p className="text-sm font-medium">
                {groups.includes("correction") ? form.correct_text : form.correct_answer || "—"}
              </p>
              {form.feedback_text && (
                <p className="mt-1 text-xs text-muted-foreground">{form.feedback_text}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Metadata summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Мета өгөгдөл</p>
          <Button variant="ghost" size="sm" onClick={() => onGoToStep(0)}>
            Засах →
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <MetaItem label="Төрөл" value={typeInfo ? `${typeInfo.shortLabel} — ${typeInfo.label}` : "—"} />
          <MetaItem
            label="Анги"
            value={form.grade_band.map((g) => `${g} (${GRADE_BAND_LABELS[g]})`).join(", ") || "—"}
          />
          <MetaItem
            label="Үндсэн чадвар"
            value={form.primary_skill ? `${form.primary_skill} — ${SKILL_LABELS[form.primary_skill]}` : "—"}
          />
          <MetaItem
            label="Дэд чадвар"
            value={form.secondary_skill ? `${form.secondary_skill} — ${SKILL_LABELS[form.secondary_skill]}` : "—"}
          />
          <MetaItem
            label="Түвшин"
            value={form.level_target ? `${form.level_target} — ${LEVEL_LABELS[form.level_target]}` : "—"}
          />
          <MetaItem label="Хэцүү байдал" value={`${form.difficulty} / 5`} />
          <MetaItem
            label="Хичээлийн үе"
            value={LESSON_SLOT_LABELS[form.lesson_slot_fit] || "—"}
          />
          <MetaItem label="Хугацаа" value={`${form.estimated_time_seconds} секунд`} />
          <MetaItem label="Давтах өдрүүд" value={form.review_after_days || "—"} />
        </div>

        {form.error_targets.length > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Алдааны зорилтууд</p>
            <div className="flex flex-wrap gap-1.5">
              {form.error_targets.map((code) => (
                <Badge key={code} variant="secondary" className="text-xs">
                  {code} — {ERROR_LABELS[code]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
