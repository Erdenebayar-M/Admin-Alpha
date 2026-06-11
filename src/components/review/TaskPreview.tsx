"use client";

import { cn } from "@/lib/utils";
import type { TaskContent } from "@/lib/types";
import { TASK_TYPE_INFO, deriveImageSide } from "@/lib/task-defaults";
import { SectionCard } from "@/components/ui/section-card";
import { generateImage, uploadImageToUrl, editVariant } from "@/lib/api";
import { buildImagePrompt } from "@/lib/imagePromptTemplate";
import { useState } from "react";
import { MediaGenerator } from "./MediaGenerator";

// Handles both full https:// R2 URLs and legacy /content/... local paths
function resolveAssetUrl(url: string): string {
  return url.startsWith("http") ? url : url;
}


function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

interface Props {
  task: TaskContent;
  variantId: string;
  createdAt?: string;
  showSaveInHeader?: boolean;
  mediaStage?: string;
  readOnly?: boolean;
  isEditMode: boolean;
  isSaving: boolean;
  editDraft: Partial<TaskContent>;
  onEnterEdit: () => void;
  onDraftChange: (patch: Partial<TaskContent>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onMediaAccepted: () => void;
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const textareaClass = `${inputClass} resize-none`;

export function TaskPreview({
  task,
  variantId,
  createdAt,
  showSaveInHeader = false,
  mediaStage,
  readOnly = false,
  isEditMode,
  isSaving,
  editDraft,
  onEnterEdit,
  onDraftChange,
  onSaveEdit,
  onCancelEdit,
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

      {/* ── Card 1: Агуулга ─────────────────────────────────────────────────── */}
      <SectionCard title="Агуулга">
        <Field label="Асуулт">
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
        </Field>

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
          <Field label="Сонголтууд">
            <div className="flex flex-wrap gap-1.5">
              {opts.choices!.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-sm font-medium",
                    c.is_correct
                      ? "border-green-400 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-800",
                  )}
                >
                  {c.text}
                </span>
              ))}
            </div>
            {opts.audio_trigger && (
              <p className="mt-1 text-xs text-muted-foreground">Аудио trigger идэвхтэй</p>
            )}
          </Field>
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

      {/* ── Card 4: Санал хүсэлт ────────────────────────────────────────────── */}
      <SectionCard title="Санал хүсэлт">
        <Field label="Дүрмийн тайлбар">
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
        </Field>

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

function FillSection({
  opts, isEditMode, onDraftChange, allOpts,
}: { opts: TaskContent["options"]; isEditMode: boolean; onDraftChange: (p: Partial<TaskContent>) => void; allOpts: TaskContent["options"]; }) {
  return (
    <>
      <Field label="Дисплей текст">
        {isEditMode ? (
          <input className={inputClass} value={opts.display_text ?? ""} onChange={(e) => onDraftChange({ options: { ...allOpts, display_text: e.target.value } })} />
        ) : (
          <span className="font-mono text-sm">{opts.display_text || "—"}</span>
        )}
      </Field>
      <Field label="Цоорхойн байрлал (0-based)">
        {isEditMode ? (
          <input className={inputClass} type="number" min={0} value={opts.blank_position ?? 0} onChange={(e) => onDraftChange({ options: { ...allOpts, blank_position: parseInt(e.target.value, 10) } })} />
        ) : (
          <span className="font-mono text-sm">{opts.blank_position ?? "—"}</span>
        )}
      </Field>
      <Field label="Цоорхойн хариулт">
        {isEditMode ? (
          <input className={cn(inputClass, "border-green-400 bg-green-50 text-green-900")} value={opts.blank_answer ?? ""} onChange={(e) => onDraftChange({ options: { ...allOpts, blank_answer: e.target.value } })} />
        ) : (
          <span className="inline-block rounded-md border border-green-400 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">{opts.blank_answer || "—"}</span>
        )}
      </Field>
      {opts.context_word && (
        <Field label="Контекст үг">
          <span className="font-mono text-sm">{opts.context_word}</span>
        </Field>
      )}
    </>
  );
}

function SentenceFillSection({
  opts, isEditMode, onDraftChange, allOpts,
}: { opts: TaskContent["options"]; isEditMode: boolean; onDraftChange: (p: Partial<TaskContent>) => void; allOpts: TaskContent["options"]; }) {
  return (
    <>
      <Field label="Өгүүлбэрийн загвар">
        {isEditMode ? (
          <input className={inputClass} value={opts.sentence_template ?? ""} onChange={(e) => onDraftChange({ options: { ...allOpts, sentence_template: e.target.value } })} />
        ) : (
          <p className="text-sm font-medium">{opts.sentence_template || "—"}</p>
        )}
      </Field>
      {opts.context_sentence && (
        <Field label="Контекст өгүүлбэр">
          <p className="text-sm text-muted-foreground">{opts.context_sentence}</p>
        </Field>
      )}
      {opts.hint && (
        <Field label="Санамж">
          <p className="text-sm text-muted-foreground">{opts.hint}</p>
        </Field>
      )}
    </>
  );
}

function DictationSection({
  opts, isEditMode, onDraftChange, allOpts,
}: { opts: TaskContent["options"]; isEditMode: boolean; onDraftChange: (p: Partial<TaskContent>) => void; allOpts: TaskContent["options"]; }) {
  return (
    <>
      {opts.audio_text && (
        <Field label="Аудио текст">
          {isEditMode ? (
            <textarea className={textareaClass} rows={2} value={opts.audio_text} onChange={(e) => onDraftChange({ options: { ...allOpts, audio_text: e.target.value } })} />
          ) : (
            <p className="font-mono text-sm">{opts.audio_text}</p>
          )}
        </Field>
      )}
      {(opts.expected_answers?.length ?? 0) > 0 && (
        <Field label="Зөвшөөрөгдсөн хариултууд">
          <div className="flex flex-wrap gap-1.5">
            {opts.expected_answers!.map((a, i) => (
              <span key={i} className="rounded-md border border-green-300 bg-green-50 px-2.5 py-1 text-sm font-medium text-green-800">{a}</span>
            ))}
          </div>
          <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
            {opts.word_count !== undefined && <span>{opts.word_count} үг</span>}
            {opts.allow_partial !== undefined && <span>Хэсэгчилсэн: {opts.allow_partial ? "тийм" : "үгүй"}</span>}
          </div>
        </Field>
      )}
    </>
  );
}

function MiniTextSection({
  opts, isEditMode, onDraftChange, allOpts,
}: { opts: TaskContent["options"]; isEditMode: boolean; onDraftChange: (p: Partial<TaskContent>) => void; allOpts: TaskContent["options"]; }) {
  return (
    <>
      {opts.audio_text && (
        <Field label="Аудио эх">
          {isEditMode ? (
            <textarea className={textareaClass} rows={3} value={opts.audio_text} onChange={(e) => onDraftChange({ options: { ...allOpts, audio_text: e.target.value } })} />
          ) : (
            <p className="font-mono text-sm whitespace-pre-wrap">{opts.audio_text}</p>
          )}
        </Field>
      )}
      {opts.sentence_count !== undefined && (
        <Field label="Өгүүлбэрийн тоо">
          <span className="font-mono text-sm">{opts.sentence_count}</span>
        </Field>
      )}
      {(opts.expected_answers?.length ?? 0) > 0 && (
        <Field label="Зөвшөөрөгдсөн хариултууд">
          <div className="space-y-1">
            {opts.expected_answers!.map((a, i) => (
              <p key={i} className="rounded border border-green-300 bg-green-50 px-2 py-1 text-sm text-green-800">{a}</p>
            ))}
          </div>
        </Field>
      )}
    </>
  );
}

function SelfCheckSection({
  opts, isEditMode, onDraftChange, allOpts,
}: { opts: TaskContent["options"]; isEditMode: boolean; onDraftChange: (p: Partial<TaskContent>) => void; allOpts: TaskContent["options"]; }) {
  return (
    <>
      {opts.original_attempt && (
        <Field label="Анхны оролдлого">
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 font-mono text-sm text-red-900 whitespace-pre-wrap">{opts.original_attempt}</p>
        </Field>
      )}
      <Field label="Жишиг хариулт">
        {isEditMode ? (
          <textarea className={cn(textareaClass, "border-green-300 bg-green-50 text-green-900")} rows={3} value={opts.model_answer ?? ""} onChange={(e) => onDraftChange({ options: { ...allOpts, model_answer: e.target.value } })} />
        ) : (
          <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900 whitespace-pre-wrap">{opts.model_answer || "—"}</p>
        )}
      </Field>
      {opts.comparison_mode && (
        <Field label="Харьцуулах горим">
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{opts.comparison_mode}</span>
        </Field>
      )}
    </>
  );
}

type PairImgStatus = "idle" | "generating" | "preview" | "uploading" | "saved" | "error";

function MatchPairsSection({
  pairs,
  isEditMode,
  onDraftChange,
  allOpts,
  taskType,
  gradeBand,
  variantId,
}: {
  pairs: Array<{ left: string; right: string; left_image_url?: string; right_image_url?: string }>;
  isEditMode: boolean;
  onDraftChange: (patch: Partial<TaskContent>) => void;
  allOpts: TaskContent["options"];
  taskType: string;
  gradeBand: string[];
  variantId: string;
}) {
  const imageSide = deriveImageSide(taskType);
  const imageUrlField = imageSide === "right" ? "right_image_url" : "left_image_url";

  const [pairStatus, setPairStatus] = useState<Record<number, PairImgStatus>>({});
  const [pairBase64, setPairBase64] = useState<Record<number, string>>({});
  const [pairErrors, setPairErrors] = useState<Record<number, string>>({});
  const [zoomedPair, setZoomedPair] = useState<number | null>(null);

  async function handleGenerate(i: number, subject: string) {
    setPairStatus((s) => ({ ...s, [i]: "generating" }));
    setPairErrors((e) => { const n = { ...e }; delete n[i]; return n; });
    try {
      const res = await generateImage(buildImagePrompt(subject), gradeBand);
      setPairBase64((b) => ({ ...b, [i]: res.base64 }));
      setPairStatus((s) => ({ ...s, [i]: "preview" }));
    } catch (err) {
      setPairErrors((e) => ({ ...e, [i]: err instanceof Error ? err.message : "Алдаа" }));
      setPairStatus((s) => ({ ...s, [i]: "error" }));
    }
  }

  async function handleAccept(i: number) {
    const base64 = pairBase64[i];
    if (!base64) return;
    setPairStatus((s) => ({ ...s, [i]: "uploading" }));
    try {
      const url = await uploadImageToUrl(base64);
      const updatedPairs = pairs.map((p, idx) =>
        idx === i ? { ...p, [imageUrlField]: url } : p,
      );
      await editVariant(variantId, { options: { ...allOpts, pairs: updatedPairs } });
      onDraftChange({ options: { ...allOpts, pairs: updatedPairs } });
      setPairBase64((b) => { const n = { ...b }; delete n[i]; return n; });
      setPairStatus((s) => ({ ...s, [i]: "saved" }));
      setTimeout(() => setPairStatus((s) => ({ ...s, [i]: "idle" })), 1500);
    } catch (err) {
      setPairErrors((e) => ({ ...e, [i]: err instanceof Error ? err.message : "Upload алдаа" }));
      setPairStatus((s) => ({ ...s, [i]: "error" }));
    }
  }

  function handleDiscard(i: number) {
    setPairBase64((b) => { const n = { ...b }; delete n[i]; return n; });
    setPairStatus((s) => ({ ...s, [i]: "idle" }));
  }

  const raw = pairs.map((p) => `${p.left} | ${p.right}`).join("\n");

  return (
    <Field label="Хосуудын жагсаалт">
      {isEditMode ? (
        <textarea
          className={textareaClass}
          rows={Math.max(4, pairs.length + 1)}
          value={raw}
          placeholder={"м | нар\nн | мод"}
          onChange={(e) => {
            const updated = e.target.value
              .split("\n")
              .map((line) => {
                const [left = "", right = ""] = line.split("|").map((s) => s.trim());
                return { left, right };
              })
              .filter((p) => p.left && p.right);
            onDraftChange({ options: { ...allOpts, pairs: updated } });
          }}
        />
      ) : imageSide === "none" ? (
        /* TT_5_3 — plain horizontal pairs, no image UI */
        <div className="space-y-1.5">
          {pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="rounded border px-2 py-0.5 font-medium">{p.left}</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded border px-2 py-0.5 font-medium">{p.right}</span>
            </div>
          ))}
        </div>
      ) : (
        /* TT_1_3 / TT_3_3 — vertical cards with inline hover-to-generate */
        <div className="flex flex-wrap gap-6">
          {pairs.map((p, i) => {
            const subject   = imageSide === "right" ? p.right : p.left;
            const textChip  = imageSide === "right" ? p.left  : p.right;
            const existingUrl = imageSide === "right" ? p.right_image_url : p.left_image_url;
            const status = pairStatus[i] ?? "idle";
            const base64 = pairBase64[i];
            const errMsg = pairErrors[i];

            /* image-side cell — rendered differently per status */
            const imageSideNode = (
              <div className="flex flex-col items-center gap-1">
                {/* idle / error: chip + always-visible generate button below */}
                {(status === "idle" || status === "error" || status === "saved") && (
                  <div className="flex flex-col items-center gap-1">
                    {existingUrl ? (
                      <>
                        <div
                          className="relative"
                          onMouseEnter={() => setZoomedPair(i)}
                          onMouseLeave={() => setZoomedPair(null)}
                        >
                          <img
                            src={existingUrl}
                            alt={subject}
                            className="h-14 w-14 rounded border border-border object-contain cursor-zoom-in"
                          />
                          {zoomedPair === i && (
                            <div className="pointer-events-none absolute left-full top-0 ml-2 z-50 w-48">
                              <img
                                src={existingUrl}
                                alt={subject}
                                className="w-48 h-48 rounded-md border border-border bg-card object-contain shadow-xl"
                              />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{subject}</span>
                      </>
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-violet-300 bg-violet-50 text-xs font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-700">
                        {subject}
                      </span>
                    )}
                    {status === "saved" ? (
                      <span className="mt-0.5 text-[10px] font-medium text-green-600">Хадгаллаа ✓</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerate(i, subject)}
                        className="mt-0.5 text-[10px] text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors"
                      >
                        {existingUrl ? "Дахин үүсгэх" : "Зураг үүсгэх"}
                      </button>
                    )}
                    {errMsg && <p className="text-[10px] text-destructive text-center max-w-[80px]">{errMsg}</p>}
                  </div>
                )}

                {/* generating */}
                {status === "generating" && (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-violet-300 bg-violet-50 text-[10px] text-violet-500 animate-pulse dark:bg-violet-950/30 dark:border-violet-700">
                      {subject}
                    </span>
                    <span className="text-[10px] text-muted-foreground animate-pulse">Үүсгэж байна…</span>
                  </>
                )}

                {/* preview / uploading */}
                {(status === "preview" || status === "uploading") && base64 && (
                  <>
                    <div
                      className="relative"
                      onMouseEnter={() => setZoomedPair(i)}
                      onMouseLeave={() => setZoomedPair(null)}
                    >
                      <img
                        src={`data:image/png;base64,${base64}`}
                        alt={subject}
                        className="h-14 w-14 rounded border border-border object-contain cursor-zoom-in"
                      />
                      {zoomedPair === i && (
                        <div className="pointer-events-none absolute left-full top-0 ml-2 z-50 w-48">
                          <img
                            src={`data:image/png;base64,${base64}`}
                            alt={subject}
                            className="w-48 h-48 rounded-md border border-border bg-card object-contain shadow-xl"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => handleAccept(i)}
                        disabled={status === "uploading"}
                        className={cn(
                          "rounded border border-green-400 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-800 hover:bg-green-100 transition-colors disabled:opacity-50",
                          status === "uploading" && "animate-pulse",
                        )}
                      >
                        {status === "uploading" ? "Хадгалж байна…" : "Хадгалах"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDiscard(i)}
                        disabled={status === "uploading"}
                        className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        Болих
                      </button>
                    </div>
                  </>
                )}
              </div>
            );

            return (
              <div key={i} className="flex flex-col items-center gap-1 text-sm min-w-[56px]">
                {imageSide === "right" ? (
                  <>
                    <span className="rounded border px-2 py-0.5 font-medium">{textChip}</span>
                    <span className="text-xs text-muted-foreground">↓</span>
                    {imageSideNode}
                  </>
                ) : (
                  <>
                    {imageSideNode}
                    <span className="text-xs text-muted-foreground">↓</span>
                    <span className="rounded border px-2 py-0.5 font-medium">{textChip}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

    </Field>
  );
}

function AssembleWordSection({
  tiles,
  correctOrder,
  isEditMode,
  onDraftChange,
  allOpts,
}: {
  tiles: string[];
  correctOrder: string[];
  isEditMode: boolean;
  onDraftChange: (patch: Partial<TaskContent>) => void;
  allOpts: TaskContent["options"];
}) {
  return (
    <>
      <Field label="Зөв дараалал (сегментүүд)">
        {isEditMode ? (
          <input
            className={inputClass}
            value={correctOrder.join(" ")}
            placeholder="г э р э л"
            onChange={(e) => {
              const segs = e.target.value.trim().split(/\s+/).filter(Boolean);
              const shuffled = [...segs].sort(() => Math.random() - 0.5);
              onDraftChange({ options: { ...allOpts, correct_order: segs, tiles: shuffled } });
            }}
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {correctOrder.map((s, i) => (
              <span key={i} className="rounded border border-green-400 bg-green-50 px-2 py-0.5 font-mono text-sm font-medium text-green-800">
                {s}
              </span>
            ))}
          </div>
        )}
      </Field>
      <Field label="Сурагчид харуулах холилдсон хэсгүүд">
        <div className="flex flex-wrap gap-1.5">
          {tiles.map((s, i) => (
            <span key={i} className="rounded border px-2 py-0.5 font-mono text-sm font-medium">
              {s}
            </span>
          ))}
        </div>
      </Field>
    </>
  );
}

function TapFindErrorSection({
  opts,
  isEditMode,
  onDraftChange,
  allOpts,
}: {
  opts: TaskContent["options"];
  isEditMode: boolean;
  onDraftChange: (patch: Partial<TaskContent>) => void;
  allOpts: TaskContent["options"];
}) {
  const words = (opts.sentence ?? "").trim().split(/\s+/).filter(Boolean);

  return (
    <>
      <Field label="Алдаатай өгүүлбэр">
        {isEditMode ? (
          <input
            className={inputClass}
            value={opts.sentence ?? ""}
            onChange={(e) =>
              onDraftChange({ options: { ...allOpts, sentence: e.target.value } })
            }
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {words.map((word, i) => (
              <span
                key={i}
                className={`rounded px-2 py-1 text-sm font-medium ${
                  i === opts.error_word_index
                    ? "border border-destructive/50 bg-destructive/10 text-destructive"
                    : "border border-border"
                }`}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </Field>
      <Field label="Алдаатай үгийн индекс (0-based)">
        {isEditMode ? (
          <input
            className={inputClass}
            type="number"
            min={0}
            max={words.length - 1}
            value={opts.error_word_index ?? ""}
            onChange={(e) =>
              onDraftChange({
                options: { ...allOpts, error_word_index: parseInt(e.target.value, 10) },
              })
            }
          />
        ) : (
          <span className="font-mono text-sm">
            {opts.error_word_index ?? "—"}{" "}
            {opts.error_word_index !== undefined && words[opts.error_word_index]
              ? `→ "${words[opts.error_word_index]}"`
              : ""}
          </span>
        )}
      </Field>
      <Field label="Засварласан өгүүлбэр">
        {isEditMode ? (
          <input
            className={inputClass}
            value={opts.correct_text ?? ""}
            onChange={(e) =>
              onDraftChange({ options: { ...allOpts, correct_text: e.target.value } })
            }
          />
        ) : (
          <span className="inline-block rounded-md border border-green-400 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
            {opts.correct_text || "—"}
          </span>
        )}
      </Field>
    </>
  );
}

function CorrectionSection({
  initialText,
  opts,
  isEditMode,
  onDraftChange,
}: {
  initialText: string;
  opts: TaskContent["options"];
  isEditMode: boolean;
  onDraftChange: (patch: Partial<TaskContent>) => void;
}) {
  // Only warn in view mode — in edit mode the fields are kept in sync
  const mismatch = false;

  return (
    <>
      {/* Side-by-side comparison */}
      <div>
        <p className="mb-2 text-xs font-medium">Засварын харьцуулалт</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Initial (incorrect) text */}
          <div>
            <p className="mb-1 text-xs text-red-600 font-medium">
              Сурагчид харуулах текст
            </p>
            {isEditMode ? (
              <textarea
                className={cn(
                  textareaClass,
                  "border-red-300 bg-red-50 text-red-900 font-mono",
                )}
                rows={3}
                value={initialText}
                onChange={(e) =>
                  onDraftChange({
                    options: { ...opts, incorrect_text: e.target.value },
                  })
                }
              />
            ) : (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2.5 font-mono text-sm text-red-900 whitespace-pre-wrap min-h-[60px]">
                {initialText || <span className="text-red-400 italic">—</span>}
              </div>
            )}
          </div>

          {/* Correct text */}
          <div>
            <p className="mb-1 text-xs text-green-600 font-medium">
              Зөв хэлбэр
            </p>
            {isEditMode ? (
              <textarea
                className={cn(
                  textareaClass,
                  "border-green-300 bg-green-50 text-green-900 font-mono",
                )}
                rows={3}
                value={opts.correct_text ?? ""}
                onChange={(e) =>
                  onDraftChange({
                    options: { ...opts, correct_text: e.target.value },
                  })
                }
              />
            ) : (
              <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2.5 font-mono text-sm text-green-900 whitespace-pre-wrap min-h-[60px]">
                {opts.correct_text || (
                  <span className="text-green-400 italic">—</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Consistency warning */}
        {mismatch && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2">
            <span className="text-yellow-600 text-sm shrink-0">⚠</span>
            <p className="text-xs text-yellow-800">
              <strong>Өгөгдлийн зөрчил:</strong> <code>initial_text</code> нь{" "}
              <code>options.incorrect_text</code>-тэй таарахгүй байна.
              Батлахаасаа өмнө аль нь зөв эсэхийг шалгана уу.
            </p>
          </div>
        )}
      </div>

    </>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium">{label}</p>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

