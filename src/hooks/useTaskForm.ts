"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { createTask } from "@/lib/api";
import type { CreateTaskPayload, CreateTaskResult } from "@/lib/api";
import type { TaskOptions } from "@/lib/types";
import { acceptAudio, acceptImage, saveImageAndUpdateTask, saveAudioAndUpdateTask } from "@/lib/api";
import {
  TASK_TYPE_INFO,
  TASK_TYPE_BLUEPRINT,
  computeDefaults,
  parseLines,
  deriveInteractionForm,
  BAND_TO_GRADES,
  type OptionGroup,
  type TaskTypeInfo,
} from "@/lib/task-defaults";
import type { AudioPreviewState } from "@/components/tasks/AudioPreview";
import type { ImagePreviewState } from "@/components/tasks/ImagePreview";

export type FormState = {
  task_type: string;
  title: string;
  prompt_text: string;
  correct_answer: string;
  image_description: string;
  primary_skill: string;
  secondary_skill: string;
  level_target: string;
  grade_band: string[];
  error_targets: string[];
  difficulty: string;
  estimated_time_seconds: string;
  lesson_slot_fit: string;
  feedback_text: string;
  feedback_correct: string;
  feedback_wrong: string;
  initial_text: string;
  incorrect_text: string;
  correct_text: string;
  hint: string;
  error_type: string;
  audio_text: string;
  word_count: string;
  allow_partial: boolean;
  expected_answers: string;
  // fill (word-level): fillOptions
  display_text: string;
  blank_position: number;
  context_word: string;
  // sentence_fill: sentenceFillOptions
  sentence_template: string;
  context_sentence: string;
  // mini_text: miniTextOptions
  sentence_count: number;
  // self_check: selfCheckOptions
  original_attempt: string;
  model_answer: string;
  comparison_mode: string;
  // choice extra
  audio_trigger: boolean;
  // correction extra
  explanation: string;
  // TT_MATCH_PAIRS: one "left | right" per line
  pairs_text: string;
  // TT_ASSEMBLE_WORD: space-separated segments in correct order
  tiles_text: string;
  // TT_TAP_FIND_ERROR
  sentence: string;
  error_word_index: number;
};

export const INITIAL_FORM: FormState = {
  task_type: "",
  title: "",
  prompt_text: "",
  correct_answer: "",
  image_description: "",
  primary_skill: "",
  secondary_skill: "",
  level_target: "",
  grade_band: [],
  error_targets: [],
  difficulty: "1",
  estimated_time_seconds: "30",
  lesson_slot_fit: "CORE",
  feedback_text: "",
  feedback_correct: "",
  feedback_wrong: "",
  initial_text: "",
  incorrect_text: "",
  correct_text: "",
  hint: "",
  error_type: "",
  audio_text: "",
  word_count: "",
  allow_partial: false,
  expected_answers: "",
  // fill
  display_text: "",
  blank_position: 0,
  context_word: "",
  // sentence_fill
  sentence_template: "",
  context_sentence: "",
  // mini_text
  sentence_count: 3,
  // self_check
  original_attempt: "",
  model_answer: "",
  comparison_mode: "side_by_side",
  // choice extra
  audio_trigger: false,
  // correction extra
  explanation: "",
  // v3
  pairs_text: "",
  tiles_text: "",
  sentence: "",
  error_word_index: -1,
};

export interface ValidationErrors {
  task_type?: string;
  grade_band?: string;
  primary_skill?: string;
  level_target?: string;
  difficulty?: string;
  lesson_slot_fit?: string;
  title?: string;
  prompt_text?: string;
  correct_answer?: string;
  incorrect_text?: string;
  correct_text?: string;
  audio_text?: string;
  expected_answers?: string;
  initial_text?: string;
  // fill
  context_word?: string;
  display_text?: string;
  // sentence_fill
  sentence_template?: string;
  blank_answer?: string;
  context_sentence?: string;
  // mini_text
  sentence_count?: string;
  // self_check
  model_answer?: string;
  comparison_mode?: string;
  // v3
  pairs_text?: string;
  tiles_text?: string;
  sentence?: string;
  error_word_index?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  created_at: string;
  task_type: string;
  grade_band: string[];
  primary_skill: string;
  secondary_skill: string;
  level_target: string;
  difficulty: string;
  lesson_slot_fit: string;
  error_targets: string[];
  estimated_time_seconds: string;
}

const DEFAULT_TRACKABLE_KEYS = new Set([
  "difficulty",
  "level_target",
  "estimated_time_seconds",
  "lesson_slot_fit",
]);

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(form: FormState, group: OptionGroup): TaskOptions {
  switch (group) {
    case "choice": {
      const wrong = parseLines(form.expected_answers);
      return {
        choices: [
          { text: form.correct_answer, is_correct: true },
          ...wrong.slice(0, 3).map((t) => ({ text: t, is_correct: false })),
        ],
        audio_trigger: form.audio_trigger,
      };
    }
    case "fill": {
      const ctx = form.context_word.trim();
      const pos = form.blank_position;
      const blankAnswer = ctx[pos] ?? form.correct_answer;
      const displayText = form.display_text.trim() ||
        (ctx ? ctx.substring(0, pos) + "_" + ctx.substring(pos + 1) : "");
      return {
        display_text: displayText,
        blank_position: pos,
        blank_answer: blankAnswer,
        context_word: ctx,
      };
    }
    case "sentence_fill": {
      return {
        sentence_template: form.sentence_template,
        blank_answer: form.correct_answer,
        context_sentence: form.context_sentence,
        ...(form.hint ? { hint: form.hint } : {}),
      };
    }
    case "correction": {
      return {
        incorrect_text: form.incorrect_text,
        correct_text: form.correct_text,
        error_type: form.error_type || "B1",
        hint: form.hint,
        ...(form.explanation ? { explanation: form.explanation } : {}),
      };
    }
    case "dictation": {
      const audioText = form.audio_text || form.correct_answer;
      const wordCount = audioText.trim().split(/\s+/).filter(Boolean).length;
      const expected = parseLines(form.expected_answers);
      return {
        audio_text: audioText,
        word_count: wordCount > 0 ? wordCount : 1,
        expected_answers: expected.length > 0 ? expected : [form.correct_answer],
        allow_partial: form.allow_partial,
      };
    }
    case "mini_text": {
      const audioText = form.audio_text || form.correct_answer;
      const expected = parseLines(form.expected_answers);
      return {
        audio_text: audioText,
        sentence_count: Math.min(5, Math.max(2, form.sentence_count)),
        expected_answers: expected.length > 0 ? expected : [form.correct_answer],
      };
    }
    case "self_check": {
      return {
        original_attempt: form.original_attempt,
        model_answer: form.model_answer || form.correct_answer,
        comparison_mode: (form.comparison_mode as "side_by_side" | "highlight_diff") || "side_by_side",
      };
    }
    case "match_pairs": {
      const pairs = parseLines(form.pairs_text)
        .map((line) => {
          const sep = line.includes("|") ? "|" : "—";
          const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
          return { left, right };
        })
        .filter((p) => p.left && p.right);
      return { pairs };
    }
    case "assemble_word": {
      const segments = form.tiles_text.trim().split(/\s+/).filter(Boolean);
      return { correct_order: segments, tiles: shuffleArray(segments) };
    }
    case "tap_find_error": {
      return {
        sentence: form.sentence,
        error_word_index: form.error_word_index,
        correct_text: form.correct_text,
      };
    }
    default:
      return {};
  }
}

function deriveCorrectAnswer(form: FormState, group: OptionGroup): string {
  if (group === "match_pairs") {
    const pairs = parseLines(form.pairs_text)
      .map((line) => {
        const sep = line.includes("|") ? "|" : "—";
        const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
        return left && right ? `${left}—${right}` : "";
      })
      .filter(Boolean);
    return pairs.join(", ") || form.correct_answer;
  }
  if (group === "assemble_word") {
    const segments = form.tiles_text.trim().split(/\s+/).filter(Boolean);
    return segments.join("") || form.correct_answer;
  }
  if (group === "tap_find_error") {
    return form.correct_text || form.correct_answer;
  }
  if (group === "correction") {
    return form.correct_text || form.correct_answer;
  }
  if (group === "fill") {
    return form.context_word || form.correct_answer;
  }
  if (group === "self_check") {
    return form.model_answer || form.correct_answer;
  }
  return form.correct_answer;
}

export function useTaskForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const dirtyFields = useRef(new Set<string>());
  const [audioPreview, setAudioPreview] = useState<AudioPreviewState | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);

  const typeInfo: TaskTypeInfo | null = form.task_type ? TASK_TYPE_INFO[form.task_type] ?? null : null;
  const groups: OptionGroup[] = typeInfo?.groups ?? [];
  const group: OptionGroup = (groups[0] ?? "choice") as OptionGroup;

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    if (DEFAULT_TRACKABLE_KEYS.has(key)) {
      dirtyFields.current.add(key);
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleList = useCallback((key: "grade_band" | "error_targets", item: string) => {
    setForm((prev) => {
      const list = prev[key];
      const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
      return { ...prev, [key]: next };
    });
  }, []);

  const applyDefaults = useCallback((taskType: string, gradeBands: string[]) => {
    if (!taskType || gradeBands.length === 0) return;
    const defaults = computeDefaults(taskType, gradeBands);
    setForm((prev) => {
      const updates: Partial<FormState> = {};
      for (const [k, v] of Object.entries(defaults)) {
        if (!dirtyFields.current.has(k)) {
          (updates as Record<string, unknown>)[k] = v;
        }
      }
      return { ...prev, ...updates };
    });
  }, []);

  const setTaskType = useCallback((type: string) => {
    setForm((prev) => {
      const blueprint = TASK_TYPE_BLUEPRINT[type];
      const next: FormState = { ...prev, task_type: type, allow_partial: false };

      // Always apply blueprint-derived values when task type changes
      if (blueprint) {
        next.primary_skill = blueprint.primary_skill;
        next.secondary_skill = blueprint.secondary_skill ?? "";
        next.level_target = blueprint.level_target;
        next.error_targets = blueprint.error_targets;
      }

      // Apply compute defaults for difficulty/time/slot (only if not user-dirty)
      if (next.grade_band.length > 0) {
        const defaults = computeDefaults(type, next.grade_band);
        for (const [k, v] of Object.entries(defaults)) {
          if (k !== "level_target" && !dirtyFields.current.has(k)) {
            (next as Record<string, unknown>)[k] = v;
          }
        }
      }

      return next;
    });
  }, []);

  const setGradeBand = useCallback((gb: string) => {
    setForm((prev) => {
      const next: FormState = { ...prev, grade_band: [gb] };
      // Clear task type if incompatible with newly selected grade band
      if (next.task_type) {
        const info = TASK_TYPE_INFO[next.task_type];
        if (info && info.gradeBand !== "both" && info.gradeBand !== gb) {
          next.task_type = "";
          next.primary_skill = "";
          next.secondary_skill = "";
          next.level_target = "";
          next.error_targets = [];
        }
      }
      return next;
    });
  }, []);

  const toggleGradeBand = useCallback((gb: string) => {
    setForm((prev) => {
      const list = prev.grade_band;
      const next = list.includes(gb) ? list.filter((x) => x !== gb) : [...list, gb];
      const updated = { ...prev, grade_band: next };

      if (updated.task_type && next.length > 0) {
        const defaults = computeDefaults(updated.task_type, next);
        for (const [k, v] of Object.entries(defaults)) {
          if (!dirtyFields.current.has(k)) {
            (updated as Record<string, unknown>)[k] = v;
          }
        }
      }
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    setForm(INITIAL_FORM);
    setShowErrors(false);
    dirtyFields.current.clear();
    setAudioPreview(null);
    setImagePreview(null);
  }, []);

  const loadFromTemplate = useCallback((template: TaskTemplate) => {
    dirtyFields.current.clear();
    setForm({
      ...INITIAL_FORM,
      task_type: template.task_type,
      grade_band: template.grade_band,
      primary_skill: template.primary_skill,
      secondary_skill: template.secondary_skill,
      level_target: template.level_target,
      difficulty: template.difficulty,
      lesson_slot_fit: template.lesson_slot_fit,
      error_targets: template.error_targets,
      estimated_time_seconds: template.estimated_time_seconds,
    });
    // mark template-loaded fields as dirty so defaults don't overwrite
    for (const key of DEFAULT_TRACKABLE_KEYS) {
      dirtyFields.current.add(key);
    }
    setShowErrors(false);
  }, []);

  const duplicateLastTask = useCallback(() => {
    try {
      const raw = localStorage.getItem("last_created_task");
      if (!raw) return false;
      const last = JSON.parse(raw) as FormState;
      dirtyFields.current.clear();
      setForm({
        ...last,
        title: "",
        prompt_text: "",
        correct_answer: "",
        feedback_text: "",
        feedback_correct: "",
        feedback_wrong: "",
        initial_text: "",
        incorrect_text: "",
        correct_text: "",
        hint: "",
        audio_text: "",
        expected_answers: "",
        display_text: "",
        blank_position: 0,
        context_word: "",
        sentence_template: "",
        context_sentence: "",
        sentence_count: 3,
        original_attempt: "",
        model_answer: "",
        comparison_mode: "side_by_side",
        audio_trigger: false,
        explanation: "",
        pairs_text: "",
        tiles_text: "",
        sentence: "",
        error_word_index: -1,
      });
      for (const key of DEFAULT_TRACKABLE_KEYS) {
        dirtyFields.current.add(key);
      }
      setShowErrors(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Validation
  const errors = useMemo((): ValidationErrors => {
    const e: ValidationErrors = {};
    if (!form.task_type) e.task_type = "Даалгаврын төрөл сонгоно уу";
    if (form.grade_band.length === 0) e.grade_band = "Ангийн бүлэг сонгоно уу";
    if (!form.primary_skill) e.primary_skill = "Үндсэн чадвар сонгоно уу";
    if (!form.level_target) e.level_target = "Түвшин сонгоно уу";

    const d = parseInt(form.difficulty, 10);
    if (isNaN(d) || d < 1 || d > 5) e.difficulty = "1-5 хоорондох тоо оруулна уу";
    if (!form.lesson_slot_fit) e.lesson_slot_fit = "Хичээлийн үе сонгоно уу";

    if (!form.title.trim()) e.title = "Гарчиг оруулна уу";
    else if (form.title.length > 200) e.title = "Гарчиг 200 тэмдэгтээс хэтрэхгүй";

    if (!form.prompt_text.trim()) e.prompt_text = "Даалгаврын текст оруулна уу";
    else if (form.prompt_text.length > 1000) e.prompt_text = "1000 тэмдэгтээс хэтрэхгүй";

    const tt = form.task_type;
    const currentGroup = tt ? ((TASK_TYPE_INFO[tt]?.groups[0] ?? "choice") as OptionGroup) : null;

    if (currentGroup === "choice") {
      if (!form.correct_answer.trim()) e.correct_answer = "Зөв хариулт оруулна уу";
      const lines = parseLines(form.expected_answers);
      if (lines.length < 2) e.expected_answers = "Хамгийн багадаа 2 буруу сонголт оруулна уу";
    } else if (currentGroup === "fill") {
      if (!form.context_word.trim()) e.context_word = "Бүтэн үгийг оруулна уу";
    } else if (currentGroup === "sentence_fill") {
      if (!form.sentence_template.trim()) e.sentence_template = "Өгүүлбэрийн загварыг оруулна уу";
      if (!form.correct_answer.trim()) e.correct_answer = "Цоорхойд орох зөв үгийг оруулна уу";
      if (!form.context_sentence.trim()) e.context_sentence = "Контекст өгүүлбэрийг оруулна уу";
    } else if (currentGroup === "correction") {
      if (!form.incorrect_text.trim()) e.incorrect_text = "Буруу текст оруулна уу";
      if (!form.correct_text.trim()) e.correct_text = "Зөв текст оруулна уу";
    } else if (currentGroup === "dictation") {
      if (!form.correct_answer.trim() && !form.audio_text.trim()) e.audio_text = "Цээжлэх текстийг оруулна уу";
    } else if (currentGroup === "mini_text") {
      if (!form.correct_answer.trim() && !form.audio_text.trim()) e.audio_text = "Цээжлэх эхийг оруулна уу";
      const cnt = form.sentence_count;
      if (cnt < 2 || cnt > 5) e.sentence_count = "Өгүүлбэрийн тоо 2–5 байх ёстой";
    } else if (currentGroup === "self_check") {
      if (!form.model_answer.trim() && !form.correct_answer.trim()) e.model_answer = "Жишиг хариултыг оруулна уу";
    } else if (currentGroup === "match_pairs") {
      const pairs = parseLines(form.pairs_text).filter((l) => l.includes("|") || l.includes("—"));
      if (pairs.length < 2) e.pairs_text = "Хамгийн багадаа 2 хос оруулна уу (зүүн | баруун)";
    } else if (currentGroup === "assemble_word") {
      const segments = form.tiles_text.trim().split(/\s+/).filter(Boolean);
      if (segments.length < 2) e.tiles_text = "Хамгийн багадаа 2 хэсэг оруулна уу";
    } else if (currentGroup === "tap_find_error") {
      if (!form.sentence.trim()) e.sentence = "Өгүүлбэр оруулна уу";
      if (form.error_word_index < 0) e.error_word_index = "Алдаатай үгийг сонгоно уу";
      if (!form.correct_text.trim()) e.correct_text = "Засварласан өгүүлбэр оруулна уу";
    } else if (!form.correct_answer.trim()) {
      e.correct_answer = "Зөв хариулт оруулна уу";
    }

    return e;
  }, [form]);

  const step1Keys: (keyof ValidationErrors)[] = ["task_type", "grade_band", "primary_skill", "level_target", "difficulty", "lesson_slot_fit"];
  const step2Keys: (keyof ValidationErrors)[] = [
    "title", "prompt_text", "correct_answer", "incorrect_text", "correct_text",
    "audio_text", "expected_answers", "initial_text",
    "context_word", "display_text", "sentence_template", "blank_answer", "context_sentence",
    "sentence_count", "model_answer", "comparison_mode",
    "pairs_text", "tiles_text", "sentence", "error_word_index",
  ];

  const stepErrors: [boolean, boolean, boolean] = useMemo(() => [
    step1Keys.some((k) => errors[k]),
    step2Keys.some((k) => errors[k]),
    false,
  ], [errors]);

  const validateStep = useCallback((step: number): boolean => {
    setShowErrors(true);
    return !stepErrors[step];
  }, [stepErrors]);

  const canSubmit = Object.keys(errors).length === 0;

  // Submission
  const mutation = useMutation({
    mutationFn: async () => {
      const currentGroup = (TASK_TYPE_INFO[form.task_type]?.groups[0] ?? "choice") as OptionGroup;
      // Map UI band selectors (G12/G24) → canonical per-grade codes (G1-G4), deduplicated
      const canonicalGradeBand = [
        ...new Set(form.grade_band.flatMap((b) => BAND_TO_GRADES[b] ?? [b])),
      ];
      const payload: CreateTaskPayload = {
        task_type: form.task_type,
        title: form.title,
        prompt_text: form.prompt_text,
        correct_answer: deriveCorrectAnswer(form, currentGroup),
        options: buildOptions(form, currentGroup),
        primary_skill: form.primary_skill,
        secondary_skill: form.secondary_skill || null,
        level_target: form.level_target,
        error_targets: form.error_targets,
        grade_band: canonicalGradeBand,
        difficulty: parseInt(form.difficulty, 10) || 1,
        estimated_time_seconds: parseInt(form.estimated_time_seconds, 10) || 30,
        lesson_slot_fit: form.lesson_slot_fit,
        feedback_text: form.feedback_text,
        feedback_correct: form.feedback_correct || undefined,
        feedback_wrong: form.feedback_wrong || undefined,
        initial_text: form.initial_text || undefined,
        audio_url: null,
        image_url: null,
        interaction_form: deriveInteractionForm(form.task_type),
      };
      const result = await createTask(payload);

      try {
        localStorage.setItem("last_created_task", JSON.stringify(form));
      } catch { /* localStorage full — non-critical */ }

      // Upload media and update DB before resolving — keeps isPending true until done
      const saves: Promise<unknown>[] = [];
      if (audioPreview?.base64) {
        saves.push(
          saveAudioAndUpdateTask(audioPreview.base64, result.task_id, result.variant_id, audioPreview.slot)
            .catch((err) => console.error('Failed to save audio:', err)),
        );
      }
      if (imagePreview?.base64) {
        saves.push(
          saveImageAndUpdateTask(imagePreview.base64, result.task_id, result.variant_id)
            .catch((err) => console.error('Failed to save image:', err)),
        );
      }
      await Promise.all(saves);

      return result;
    },
  });

  return {
    form,
    set,
    toggleList,
    setTaskType,
    setGradeBand,
    toggleGradeBand,
    applyDefaults,
    reset,
    loadFromTemplate,
    duplicateLastTask,

    errors: showErrors ? errors : {} as ValidationErrors,
    allErrors: errors,
    stepErrors,
    validateStep,
    setShowErrors,
    canSubmit,

    submit: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    successResult: mutation.data as CreateTaskResult | undefined,
    submitError: mutation.error,

    typeInfo,
    groups,
    group,

    audioPreview,
    setAudioPreview,
    imagePreview,
    setImagePreview,
  };
}
