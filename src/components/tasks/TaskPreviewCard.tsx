"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/hooks/useTaskForm";
import type { OptionGroup } from "@/lib/task-defaults";
import type { AudioPreviewState } from "@/components/tasks/AudioPreview";
import type { ImagePreviewState } from "@/components/tasks/ImagePreview";
import {
  TASK_TYPE_INFO,
  parseLines,
} from "@/lib/task-defaults";

interface TaskPreviewCardProps {
  form: FormState;
  groups: OptionGroup[];
  taskType: string;
  onGoToStep: (step: number) => void;
  audioPreview?: AudioPreviewState | null;
  imagePreview?: ImagePreviewState | null;
}

export function TaskPreviewCard({
  form,
  groups,
  taskType,
  onGoToStep,
  audioPreview,
  imagePreview,
}: TaskPreviewCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const typeInfo = TASK_TYPE_INFO[form.task_type];

  const hasMedia = !!(audioPreview || imagePreview);

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

          {/* Audio preview */}
          {audioPreview && (
            <audio controls src={audioPreview.blobUrl} className="w-full h-10" />
          )}

          {/* Image preview */}
          {imagePreview && (
            <img
              src={`data:image/jpeg;base64,${imagePreview.base64}`}
              alt="Зураг"
              className="w-full rounded-md border object-cover max-h-48"
            />
          )}

          {/* Dictation */}
          {groups.includes("dictation") && (
            <div className="flex items-center gap-3 rounded-md border border-dashed p-3 text-muted-foreground">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12V4.5" />
              </svg>
              <span className="text-sm">{form.audio_text || "Аудио текст"}</span>
            </div>
          )}

          {/* Correction */}
          {groups.includes("correction") && form.incorrect_text && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive mb-1">Буруу текст:</p>
              <p className="text-sm">{form.incorrect_text}</p>
            </div>
          )}

          {/* Choice */}
          {groups.includes("choice") && (
            <div className="space-y-2">
              {[form.correct_answer, ...parseLines(form.expected_answers)]
                .filter(Boolean)
                .map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                    {opt}
                  </div>
                ))}
            </div>
          )}

          {/* Match pairs */}
          {groups.includes("match_pairs") && form.pairs_text && (
            <div className="space-y-1.5">
              {form.pairs_text.split("\n").map((line, i) => {
                const sep = line.includes("|") ? "|" : "—";
                const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
                if (!left || !right) return null;
                const pairImage = form.pairImages?.[i];
                return (
                  <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    {pairImage ? (
                      <img
                        src={`data:image/jpeg;base64,${pairImage}`}
                        alt={left}
                        className="h-10 w-10 rounded object-cover border shrink-0"
                      />
                    ) : (
                      <span className="font-medium">{left}</span>
                    )}
                    <span className="text-muted-foreground mx-1">⟷</span>
                    <span className="rounded border border-dashed px-2 py-0.5 text-muted-foreground">?</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Assemble word */}
          {groups.includes("assemble_word") && form.tiles_text && (
            <div className="flex flex-wrap gap-1.5 rounded-md border border-dashed p-3">
              {form.tiles_text.trim().split(/\s+/).filter(Boolean).map((seg, i) => (
                <span key={i} className="rounded border bg-background px-2.5 py-1.5 font-mono text-sm font-medium shadow-sm">
                  {seg}
                </span>
              ))}
            </div>
          )}

          {/* Tap find error */}
          {groups.includes("tap_find_error") && form.sentence && (
            <div className="flex flex-wrap gap-1.5 rounded-md border p-3">
              {form.sentence.trim().split(/\s+/).map((word, i) => (
                <span
                  key={i}
                  className={`rounded px-2 py-1 text-sm font-medium ${
                    i === form.error_word_index
                      ? "border border-destructive/50 bg-destructive/10 text-destructive"
                      : "border border-transparent"
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
          )}

          {/* Fill */}
          {groups.includes("fill") && (
            <div className="rounded-md border p-3 text-sm">
              {form.display_text ? (
                <span>{form.display_text}</span>
              ) : (
                <span className="inline-block min-w-16 border-b-2 border-foreground/50 text-center text-muted-foreground">___</span>
              )}
            </div>
          )}

          {/* Sentence fill */}
          {groups.includes("sentence_fill") && form.sentence_template && (
            <div className="rounded-md border p-3 text-sm">
              {form.sentence_template.split("___").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block min-w-12 border-b-2 border-foreground/60 mx-1 text-center text-muted-foreground align-bottom">
                      &nbsp;&nbsp;&nbsp;&nbsp;
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Fallback */}
          {!groups.includes("choice") &&
            !groups.includes("correction") &&
            !groups.includes("dictation") &&
            !groups.includes("match_pairs") &&
            !groups.includes("assemble_word") &&
            !groups.includes("tap_find_error") &&
            !groups.includes("fill") &&
            !groups.includes("sentence_fill") && (
              <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                Хариулт оруулах талбар
              </div>
            )}

          {/* Dictation answer area */}
          {groups.includes("dictation") && (
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
            <div className="mt-2 rounded-md border-l-4 border-green-500 bg-green-50 p-3 dark:bg-green-950/30 space-y-2">
              {/* Per-group correct answer */}
              {groups.includes("match_pairs") ? (
                <div className="space-y-1">
                  {form.pairs_text.split("\n").filter(Boolean).map((line, i) => {
                    const sep = line.includes("|") ? "|" : "—";
                    const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
                    return (
                      <p key={i} className="text-sm font-medium">
                        {left} → {right}
                      </p>
                    );
                  })}
                </div>
              ) : groups.includes("assemble_word") ? (
                <div className="flex flex-wrap gap-1">
                  {form.tiles_text.trim().split(/\s+/).filter(Boolean).map((seg, i) => (
                    <span key={i} className="rounded border border-green-400 bg-white px-2 py-0.5 text-sm font-mono font-medium dark:bg-green-950/50">
                      {seg}
                    </span>
                  ))}
                </div>
              ) : groups.includes("dictation") ? (
                <div className="space-y-0.5">
                  {parseLines(form.expected_answers).length > 0
                    ? parseLines(form.expected_answers).map((ans, i) => (
                        <p key={i} className="text-sm font-medium">{ans}</p>
                      ))
                    : <p className="text-sm font-medium">{form.audio_text || "—"}</p>
                  }
                </div>
              ) : groups.includes("correction") || groups.includes("tap_find_error") ? (
                <p className="text-sm font-medium">{form.correct_text || "—"}</p>
              ) : (
                <p className="text-sm font-medium">
                  {form.correct_answer || form.model_answer || "—"}
                </p>
              )}

              {form.feedback_text && (
                <p className="text-xs text-muted-foreground">{form.feedback_text}</p>
              )}
              {(form.feedback_correct || form.feedback_wrong) && (
                <div className="grid grid-cols-2 gap-2">
                  {form.feedback_correct && (
                    <div className="rounded border border-green-300 bg-green-50 px-2 py-1 dark:bg-green-950/30">
                      <p className="text-[10px] font-medium text-green-700">Зөв хариулсан үед</p>
                      <p className="text-xs text-green-900">{form.feedback_correct}</p>
                    </div>
                  )}
                  {form.feedback_wrong && (
                    <div className="rounded border border-red-300 bg-red-50 px-2 py-1 dark:bg-red-950/30">
                      <p className="text-[10px] font-medium text-red-700">Буруу хариулсан үед</p>
                      <p className="text-xs text-red-900">{form.feedback_wrong}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
