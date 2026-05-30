"use client";

import { cn } from "@/lib/utils";
import type { TaskContent } from "@/lib/types";
import { TASK_TYPE_INFO } from "@/lib/task-defaults";
import { MediaGenerator } from "./MediaGenerator";

// Handles both full https:// R2 URLs and legacy /content/... local paths
function resolveAssetUrl(url: string): string {
  return url.startsWith("http") ? url : url;
}

const SKILL_LABELS: Record<string, string> = {
  S1: "Үсэг-авиа ялгалт",
  S2: "Үгийн зөв бичлэг",
  S3: "Урт/богино эгшиг",
  S4: "Балархай эгшиг",
  S5: "Залгавар/нөхцөл",
  S6: "Өгүүлбэрийн тэмдэглэгээ",
  S7: "Сонсголоор буулгах",
  S8: "Алдаа засах",
};

const ERROR_LABELS: Record<string, string> = {
  A: "Эгшгийн зохилдолын алдаа",
  B: "Буруу сонголт — тасалдуулагч",
  C1: "Гийгүүлэгч үсэг орхигдсон",
  C2: "Эгшиг үсэг орхигдсон",
  D: "Үгийн бичлэгийн алдаа",
  E1: "Нийлмэл үгийн алдаа",
  E2: "Угтвар, дагаврын алдаа",
  G1: "Өгүүлбэр том үсгээр эхлэх",
  G2: "Цэг тэмдэглэгээний алдаа",
  H4: "Агуулга тохирохгүй",
};

const LEVEL_LABELS: Record<string, string> = {
  M0: "M0 — Анхан шат",
  M1: "M1 — Суурь",
  M2: "M2 — Дунд шат",
  M3: "M3 — Ахисан шат",
};

const LESSON_SLOT_LABELS: Record<string, string> = {
  WARM_UP: "Дулаалга",
  MID: "Дундуур",
  END: "Төгсгөл",
  MIXED: "Холимог",
};

function formatGradeBand(bands: string[]): string {
  return bands.map((g) => `${g.replace("G", "")}-р анги`).join(", ") || "—";
}

function formatReviewDays(days: number[]): string {
  if (!days.length) return "—";
  return days.map((d) => `${d}-р өдөр`).join(", ");
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
  isEditMode,
  isSaving,
  editDraft,
  onEnterEdit,
  onDraftChange,
  onSaveEdit,
  onCancelEdit,
  onMediaAccepted,
}: Props) {
  const title =
    isEditMode && editDraft.title !== undefined ? editDraft.title : task.title;
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

  const isChoiceTask = TASK_TYPE_INFO[task.task_type]?.groups.includes("choice") ?? false;
  const hasWrongChoices = (opts.distractors?.length ?? 0) > 0;
  const hasExpectedAnswers = (opts.expected_answers?.length ?? 0) > 0;
  // Render correction layout if task_type matches OR if the data carries initial_text
  const isCorrection =
    task.task_type === "TT3_CORRECTION" ||
    Boolean(rawInitialText || opts.correct_text);

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

        {isEditMode ? (
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
        )}
      </div>

      {/* ── Metadata grid ──────────────────────────────────────────────────── */}
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Дасгалын тайлбар</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 rounded-md bg-muted/40 p-3 text-sm">
        <MetaItem
          label="Чадвар"
          value={
            <span className="flex items-center gap-1.5">
              <Chip>{task.primary_skill}</Chip>
              <span className="text-sm">
                {SKILL_LABELS[task.primary_skill] ?? task.primary_skill}
              </span>
            </span>
          }
        />
        {task.secondary_skill && (
          <MetaItem
            label="Дэд чадвар"
            value={
              <span className="flex items-center gap-1.5">
                <Chip>{task.secondary_skill}</Chip>
                <span className="text-sm">
                  {SKILL_LABELS[task.secondary_skill] ?? task.secondary_skill}
                </span>
              </span>
            }
          />
        )}
        <MetaItem label="Түвшин" value={<Chip>{task.level_target}</Chip>} />
        <MetaItem
          label="Анги"
          value={
            <span className="flex flex-wrap gap-1">
              {task.grade_band.map((g) => (
                <Chip key={g}>{g}</Chip>
              ))}
            </span>
          }
        />
        <MetaItem label="Хүндийн түвшин" value={<span className="text-yellow-500">{"★".repeat(task.difficulty)}{"☆".repeat(5 - task.difficulty)}</span>} />
        <MetaItem label="Хугацаа" value={`${task.estimated_time_seconds}с`} />
        <MetaItem
          label="Хичээлийн үе"
          value={
            task.lesson_slot_fit ? <Chip>{task.lesson_slot_fit}</Chip> : "—"
          }
        />
      </div>

      {/* ── Content section ────────────────────────────────────────────────── */}
      <div className="border-t border-border" />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Дасгалын заавар</p>

      {/* ── Error targets ──────────────────────────────────────────────────── */}
      {task.error_targets.length > 0 && (
        <Field label="Алдааны зорилт">
          <div className="flex flex-wrap gap-1.5">
            {task.error_targets.map((code) => (
              <span
                key={code}
                className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800"
              >
                {code}
                {ERROR_LABELS[code] ? ` — ${ERROR_LABELS[code]}` : ""}
              </span>
            ))}
          </div>
        </Field>
      )}

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <Field label="Дасгалын нэр">
        {isEditMode ? (
          <input
            className={inputClass}
            value={title}
            onChange={(e) => onDraftChange({ title: e.target.value })}
            placeholder="Гарчиг"
          />
        ) : (
          <p className="text-sm font-medium">{task.title}</p>
        )}
      </Field>

      {/* ── Prompt ─────────────────────────────────────────────────────────── */}
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

      {/* ── Correction layout (TT3_CORRECTION only) ───────────────────────── */}
      {isCorrection && (
        <CorrectionSection
          initialText={initialText}
          opts={currentOpts}
          isEditMode={isEditMode}
          onDraftChange={onDraftChange}
        />
      )}

      {/* ── Wrong choices (choice-type tasks) ─────────────────────────────── */}
      {hasWrongChoices && (
        <Field label="Буруу хариултууд (сонголтууд)">
          <div className="flex flex-wrap gap-1.5">
            {opts.distractors!.map((a, i) => (
              <span
                key={i}
                className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-sm font-medium text-red-800"
              >
                {a}
              </span>
            ))}
          </div>
        </Field>
      )}

      {/* ── Expected answers (dictation / listening tasks) ─────────────────── */}
      {hasExpectedAnswers && (
        <Field label="Хүлээгдэж буй хариултууд">
          <div className="flex flex-wrap gap-1.5">
            {opts.expected_answers!.map((a, i) => (
              <span
                key={i}
                className="rounded-md border border-green-300 bg-green-50 px-2.5 py-1 text-sm font-medium text-green-800"
              >
                {a}
              </span>
            ))}
          </div>
          {opts.audio_text && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Аудио текст: &ldquo;{opts.audio_text}&rdquo;
            </p>
          )}
          <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
            {opts.word_count !== undefined && <span>{opts.word_count} үг</span>}
            {opts.allow_partial !== undefined && (
              <span>
                Хэсэгчилсэн оноо: {opts.allow_partial ? "тийм" : "үгүй"}
              </span>
            )}
          </div>
        </Field>
      )}

      {/* ── Correct answer (hidden for correction tasks — shown as "Target correct text") */}
      {!isCorrection && (
        <Field label="Зөв хариулт">
          {isEditMode ? (
            <input
              className={cn(
                inputClass,
                "border-green-400 bg-green-50 text-green-900",
              )}
              value={correctAnswer}
              onChange={(e) =>
                onDraftChange({ correct_answer: e.target.value })
              }
            />
          ) : (
            <span className="inline-block rounded-md border border-green-400 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
              {correctAnswer}
            </span>
          )}
        </Field>
      )}

      {/* ── Feedback ───────────────────────────────────────────────────────── */}
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

      {/* ── Correct / Wrong feedback ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={<span className="text-green-700">Зөв хариулсан үед</span>}
        >
          {isEditMode ? (
            <textarea
              className={cn(
                textareaClass,
                "border-green-300 bg-green-50 text-green-900",
              )}
              rows={2}
              value={feedbackCorrect}
              placeholder="Зөв хариулсан үед харуулах текст…"
              onChange={(e) =>
                onDraftChange({ feedback_correct: e.target.value })
              }
            />
          ) : feedbackCorrect ? (
            <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">
              {feedbackCorrect}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">—</p>
          )}
        </Field>
        <Field
          label={<span className="text-red-700">Буруу хариулсан үед</span>}
        >
          {isEditMode ? (
            <textarea
              className={cn(
                textareaClass,
                "border-red-300 bg-red-50 text-red-900",
              )}
              rows={2}
              value={feedbackWrong}
              placeholder="Буруу хариулсан үед харуулах текст…"
              onChange={(e) =>
                onDraftChange({ feedback_wrong: e.target.value })
              }
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

      {/* ── Media ──────────────────────────────────────────────────────────── */}
      {(task.audio_url || task.image_url) && (
        <Field label="Медиа">
          <div className="space-y-2">
            {task.audio_url && (
              <div className="flex flex-col gap-1">
                <audio
                  controls
                  src={resolveAssetUrl(task.audio_url)}
                  className="w-full h-8"
                />
                <span className="font-mono text-xs text-muted-foreground truncate">
                  {task.audio_url}
                </span>
              </div>
            )}
            {task.image_url && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-12 pt-0.5">
                  Зураг
                </span>
                <img
                  src={resolveAssetUrl(task.image_url)}
                  alt="Даалгаврын зураг"
                  className="rounded-md border border-border max-h-40 object-contain"
                />
              </div>
            )}
          </div>
        </Field>
      )}

      {/* ── Generate media ─────────────────────────────────────────────────── */}
      <MediaGenerator
        task={task}
        variantId={variantId}
        stage={mediaStage}
        onMediaAccepted={onMediaAccepted}
      />

    </div>
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

      {/* Hint row */}
      {(opts.hint || isEditMode) && (
        <div>
          <p className="mb-1 text-xs font-medium">Дохио (hint)</p>
          {isEditMode ? (
            <input
              className={inputClass}
              value={opts.hint ?? ""}
              onChange={(e) =>
                onDraftChange({ options: { ...opts, hint: e.target.value } })
              }
              placeholder="Дохио…"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{opts.hint}</p>
          )}
        </div>
      )}
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
