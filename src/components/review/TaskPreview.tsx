"use client";

import { cn } from "@/lib/utils";
import type { TaskContent } from "@/lib/types";
import { TASK_TYPE_INFO } from "@/lib/task-defaults";
import { SectionCard } from "@/components/ui/section-card";
import { MediaGenerator } from "./MediaGenerator";
import { resolveAssetUrl, fmtDateTime, Field, inputClass, textareaClass } from "./task-preview/helpers";
import {
  ChoiceSection,
  FillSection,
  SentenceFillSection,
  DictationSection,
  MiniTextSection,
  SelfCheckSection,
  MatchPairsSection,
  AssembleWordSection,
  TapFindErrorSection,
  CorrectionSection,
} from "./task-preview/sections";

interface Props {
  task: TaskContent;
  variantId: string;
  createdAt?: string;
  showSaveInHeader?: boolean;
  mediaStage?: string;
  readOnly?: boolean;
  isEditMode?: boolean;
  isSaving?: boolean;
  editDraft?: Partial<TaskContent>;
  onEnterEdit?: () => void;
  onDraftChange?: (patch: Partial<TaskContent>) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onMediaAccepted: () => void;
}

export function TaskPreview({
  task,
  variantId,
  createdAt,
  showSaveInHeader = false,
  mediaStage,
  readOnly = false,
  isEditMode = false,
  isSaving = false,
  editDraft = {},
  onEnterEdit = () => {},
  onDraftChange = () => {},
  onSaveEdit = () => {},
  onCancelEdit = () => {},
  onMediaAccepted,
}: Props) {
  const promptText =
    isEditMode && editDraft.prompt_text !== undefined
      ? editDraft.prompt_text
      : task.prompt_text;
  const correctAnswer =
    isEditMode && editDraft.correct_answer !== undefined
      ? editDraft.correct_answer
      : task.correct_answer;
  const feedbackText =
    isEditMode && editDraft.feedback_text !== undefined
      ? editDraft.feedback_text
      : task.feedback_text;
  const feedbackCorrect =
    isEditMode && editDraft.feedback_correct !== undefined
      ? editDraft.feedback_correct
      : (task.feedback_correct ?? "");
  const feedbackWrong =
    isEditMode && editDraft.feedback_wrong !== undefined
      ? editDraft.feedback_wrong
      : (task.feedback_wrong ?? "");
  const opts = task.options;
  // Merge editDraft.options into opts so edits to nested fields are reflected
  const currentOpts = isEditMode ? { ...opts, ...editDraft.options } : opts;
  // initial_text lives in options.incorrect_text (AI tasks); root task.initial_text is legacy
  const rawInitialText = opts.incorrect_text ?? task.initial_text ?? "";
  // When editing, read from currentOpts so changes via options patch are reflected immediately
  const initialText = isEditMode
    ? (currentOpts.incorrect_text ?? rawInitialText)
    : rawInitialText;

  const taskGroup = TASK_TYPE_INFO[task.task_type]?.groups[0] ?? "";
  const isChoiceTask = taskGroup === "choice";
  const isCorrectionTask = taskGroup === "correction";
  const isFillTask = taskGroup === "fill";
  const isSentenceFillTask = taskGroup === "sentence_fill";
  const isDictationTask = taskGroup === "dictation";
  const isMiniTextTask = taskGroup === "mini_text";
  const isSelfCheckTask = taskGroup === "self_check";
  // Legacy compatibility: correction layout for old tasks that carry incorrect_text or initial_text
  const isCorrection = isCorrectionTask || Boolean(rawInitialText || opts.correct_text);

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {createdAt && (
            <span className="text-xs text-muted-foreground">
              {fmtDateTime(createdAt)}
            </span>
          )}
        </div>

        {!readOnly && (isEditMode ? (
          <div className="flex shrink-0 gap-2">
            {showSaveInHeader && (
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={isSaving}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isSaving ? "Хадгалж байна…" : "Хадгалах"}
              </button>
            )}
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Болих
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEnterEdit}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Засах
          </button>
        ))}
      </div>

      {/* ── Content section ────────────────────────────────────────────────── */}

      {/* ── Card 1: Асуулт ─────────────────────────────────────────────────── */}
      <SectionCard title="Асуулт">
        {isEditMode ? (
          <textarea
            className={textareaClass}
            rows={2}
            value={promptText}
            onChange={(e) => onDraftChange({ prompt_text: e.target.value })}
          />
        ) : (
          <p className="text-sm">{promptText}</p>
        )}

        {isCorrection && (
          <CorrectionSection
            initialText={initialText}
            opts={currentOpts}
            isEditMode={isEditMode}
            onDraftChange={onDraftChange}
          />
        )}

        {["TT_1_3","TT_3_3","TT_5_3"].includes(task.task_type) && (opts.pairs?.length ?? 0) > 0 && (
          <MatchPairsSection
            pairs={currentOpts.pairs ?? opts.pairs ?? []}
            isEditMode={isEditMode}
            onDraftChange={onDraftChange}
            allOpts={currentOpts}
            taskType={task.task_type}
            gradeBand={task.grade_band}
            variantId={variantId}
          />
        )}

        {["TT_1_4","TT_2_2"].includes(task.task_type) && (opts.correct_order?.length ?? 0) > 0 && (
          <AssembleWordSection
            tiles={opts.tiles ?? []}
            correctOrder={currentOpts.correct_order ?? opts.correct_order ?? []}
            isEditMode={isEditMode}
            onDraftChange={onDraftChange}
            allOpts={currentOpts}
          />
        )}

        {task.task_type === "TT_8_1" && opts.sentence && (
          <TapFindErrorSection
            opts={currentOpts}
            isEditMode={isEditMode}
            onDraftChange={onDraftChange}
            allOpts={currentOpts}
          />
        )}

        {isChoiceTask && (opts.choices?.length ?? 0) > 0 && (
          <ChoiceSection opts={currentOpts} isEditMode={isEditMode} onDraftChange={onDraftChange} allOpts={currentOpts} />
        )}

        {isFillTask && (
          <FillSection opts={currentOpts} isEditMode={isEditMode} onDraftChange={onDraftChange} allOpts={currentOpts} />
        )}

        {isSentenceFillTask && (
          <SentenceFillSection opts={currentOpts} isEditMode={isEditMode} onDraftChange={onDraftChange} allOpts={currentOpts} />
        )}

        {isDictationTask && (
          <DictationSection opts={currentOpts} isEditMode={isEditMode} onDraftChange={onDraftChange} allOpts={currentOpts} />
        )}

        {isMiniTextTask && (
          <MiniTextSection opts={currentOpts} isEditMode={isEditMode} onDraftChange={onDraftChange} allOpts={currentOpts} />
        )}

        {isSelfCheckTask && (
          <SelfCheckSection opts={currentOpts} isEditMode={isEditMode} onDraftChange={onDraftChange} allOpts={currentOpts} />
        )}
      </SectionCard>

      {/* ── Card 2: Хариулт ─────────────────────────────────────────────────── */}
      {!isCorrection && (
        <SectionCard title="Хариулт">
          <Field label="Зөв хариулт">
            {isEditMode ? (
              <input
                className={cn(inputClass, "border-green-400 bg-green-50 text-green-900")}
                value={correctAnswer}
                onChange={(e) => onDraftChange({ correct_answer: e.target.value })}
              />
            ) : (
              <span className="inline-block rounded-md border border-green-400 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
                {correctAnswer}
              </span>
            )}
          </Field>
        </SectionCard>
      )}

      {/* ── Card 3: Медиа ───────────────────────────────────────────────────── */}
      <SectionCard title="Медиа">
        {task.audio_url && (
          <Field label="Аудио">
            <div className="flex flex-col gap-1">
              <audio controls src={resolveAssetUrl(task.audio_url)} className="w-full h-8" />
              <span className="font-mono text-xs text-muted-foreground truncate">{task.audio_url}</span>
            </div>
          </Field>
        )}
        {task.image_url && (
          <Field label="Зураг">
            <img
              src={resolveAssetUrl(task.image_url)}
              alt="Даалгаврын зураг"
              className="rounded-md border border-border max-h-40 object-contain"
            />
          </Field>
        )}
        <MediaGenerator
          task={task}
          variantId={variantId}
          stage={mediaStage}
          onMediaAccepted={onMediaAccepted}
        />
      </SectionCard>

      {/* ── Card 4: Тайлбар ────────────────────────────────────────────── */}
      <SectionCard title="Тайлбар">
        {isEditMode ? (
          <textarea
            className={textareaClass}
            rows={2}
            value={feedbackText}
            onChange={(e) => onDraftChange({ feedback_text: e.target.value })}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{feedbackText}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={<span className="text-green-700">Зөв хариулсан үед</span>}>
            {isEditMode ? (
              <textarea
                className={cn(textareaClass, "border-green-300 bg-green-50 text-green-900")}
                rows={2}
                value={feedbackCorrect}
                placeholder="Зөв хариулсан үед харуулах текст…"
                onChange={(e) => onDraftChange({ feedback_correct: e.target.value })}
              />
            ) : feedbackCorrect ? (
              <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">
                {feedbackCorrect}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">—</p>
            )}
          </Field>
          <Field label={<span className="text-red-700">Буруу хариулсан үед</span>}>
            {isEditMode ? (
              <textarea
                className={cn(textareaClass, "border-red-300 bg-red-50 text-red-900")}
                rows={2}
                value={feedbackWrong}
                placeholder="Буруу хариулсан үед харуулах текст…"
                onChange={(e) => onDraftChange({ feedback_wrong: e.target.value })}
              />
            ) : feedbackWrong ? (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
                {feedbackWrong}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">—</p>
            )}
          </Field>
        </div>
      </SectionCard>


    </div>
  );
}
