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

function buildOptions(form: FormState, groups: OptionGroup[]): TaskOptions {
  const opts: TaskOptions = {};
  if (groups.includes("dictation")) {
    // auto-derive audio_text and word_count from correct_answer
    const audioText = form.audio_text || form.correct_answer;
    if (audioText) opts.audio_text = audioText;
    const wordCount = audioText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 0) opts.word_count = wordCount;
    if (form.allow_partial) opts.allow_partial = true;
  }
  if (groups.includes("correction")) {
    if (form.incorrect_text) opts.incorrect_text = form.incorrect_text;
    if (form.correct_text) opts.correct_text = form.correct_text;
    if (form.hint) opts.hint = form.hint;
    if (form.error_type) opts.error_type = form.error_type;
  }
  if (groups.includes("multiple_choice")) {
    const answers = parseLines(form.expected_answers);
    if (answers.length) opts.expected_answers = answers;
    if (form.allow_partial) opts.allow_partial = true;
  }
  return opts;
}

export function useTaskForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const dirtyFields = useRef(new Set<string>());
  const [audioPreview, setAudioPreview] = useState<AudioPreviewState | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);

  const typeInfo: TaskTypeInfo | null = form.task_type ? TASK_TYPE_INFO[form.task_type] ?? null : null;
  const groups: OptionGroup[] = typeInfo?.groups ?? [];

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
    const currentGroups = tt ? (TASK_TYPE_INFO[tt]?.groups ?? []) : [];

    // Correction types use correct_text instead of correct_answer
    if (currentGroups.includes("correction")) {
      if (!form.incorrect_text.trim()) e.incorrect_text = "Буруу текст оруулна уу";
      if (!form.correct_text.trim()) e.correct_text = "Зөв текст оруулна уу";
    } else if (!form.correct_answer.trim()) {
      e.correct_answer = "Зөв хариулт оруулна уу";
    }

    // Choice and fill types need expected_answers (wrong choices)
    if (currentGroups.includes("choice") || currentGroups.includes("fill")) {
      const lines = parseLines(form.expected_answers);
      if (lines.length < 2) e.expected_answers = "Хамгийн багадаа 2 хариулт оруулна уу";
    }

    return e;
  }, [form]);

  const step1Keys: (keyof ValidationErrors)[] = ["task_type", "grade_band", "primary_skill", "level_target", "difficulty", "lesson_slot_fit"];
  const step2Keys: (keyof ValidationErrors)[] = ["title", "prompt_text", "correct_answer", "incorrect_text", "correct_text", "audio_text", "expected_answers", "initial_text"];

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
    mutationFn: () => {
      const currentGroups = TASK_TYPE_INFO[form.task_type]?.groups ?? [];
      const payload: CreateTaskPayload = {
        task_type: form.task_type,
        title: form.title,
        prompt_text: form.prompt_text,
        correct_answer: form.correct_answer,
        options: buildOptions(form, currentGroups),
        primary_skill: form.primary_skill,
        secondary_skill: form.secondary_skill || null,
        level_target: form.level_target,
        error_targets: form.error_targets,
        grade_band: form.grade_band,
        difficulty: parseInt(form.difficulty, 10) || 1,
        estimated_time_seconds: parseInt(form.estimated_time_seconds, 10) || 30,
        lesson_slot_fit: form.lesson_slot_fit,
        feedback_text: form.feedback_text,
        feedback_correct: form.feedback_correct || undefined,
        feedback_wrong: form.feedback_wrong || undefined,
        initial_text: form.initial_text || undefined,
        audio_url: null,
        image_url: null,
      };
      return createTask(payload);
    },
    onSuccess: (result) => {
      try {
        localStorage.setItem("last_created_task", JSON.stringify(form));
      } catch { /* localStorage full — non-critical */ }
      // auto-accept media generated during Step 2
      if (audioPreview?.base64) {
        saveAudioAndUpdateTask(audioPreview.base64, result.task_id, result.variant_id, audioPreview.slot).catch((err) => {
          console.error('Failed to save audio:', err);
        });
      }
      if (imagePreview?.base64) {
        saveImageAndUpdateTask(imagePreview.base64, result.task_id, result.variant_id).catch((err) => {
          console.error('Failed to save image:', err);
        });
      }
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

    audioPreview,
    setAudioPreview,
    imagePreview,
    setImagePreview,
  };
}
