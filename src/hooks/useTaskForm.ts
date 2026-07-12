"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { CreateTaskResult } from "@/lib/api";
import {
  TASK_TYPE_INFO,
  TASK_TYPE_BLUEPRINT,
  computeDefaults,
  type OptionGroup,
  type TaskTypeInfo,
} from "@/lib/task-defaults";
import type { AudioPreviewState } from "@/components/tasks/AudioPreview";
import type { ImagePreviewState } from "@/components/tasks/ImagePreview";
import {
  INITIAL_FORM,
  DEFAULT_TRACKABLE_KEYS,
  STEP1_KEYS,
  STEP2_KEYS,
  validateForm,
  type FormState,
  type ValidationErrors,
  type TaskTemplate,
} from "./task-form/state";
import { runTaskSubmission } from "./task-form/mutations";

// Re-exported so existing imports of these symbols from "@/hooks/useTaskForm"
// keep working after the split.
export { INITIAL_FORM };
export type { FormState, ValidationErrors, TaskTemplate };

export function useTaskForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const dirtyFields = useRef(new Set<string>());
  const [audioPreview, setAudioPreview] = useState<AudioPreviewState | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);
  // Transient — which suggested Word the author is basing this task on. Not
  // persisted to the task itself; only used to target the word-bank audio
  // dual-write for word-dictation types (TT_7_3).
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [saveAudioToWord, setSaveAudioToWord] = useState(true);

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
      if (next.task_type) {
        const info = TASK_TYPE_INFO[next.task_type];
        if (info && !info.grades.includes(gb)) {
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

      // Clear task type if no selected grade matches it
      if (updated.task_type && next.length > 0) {
        const info = TASK_TYPE_INFO[updated.task_type];
        if (info && !next.some((g) => info.grades.includes(g))) {
          updated.task_type = "";
          updated.primary_skill = "";
          updated.secondary_skill = "";
          updated.level_target = "";
          updated.error_targets = [];
        }
      }

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
    setSelectedWordId(null);
    setSaveAudioToWord(true);
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
      setSelectedWordId(null); // don't carry a stale word-audio target into the duplicated task
      setForm({
        ...last,
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
        pairs_text: "",
        tiles_text: "",
        sentence: "",
        error_word_index: -1,
        text_to_copy: "",
        display_seconds: 3,
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
  const errors = useMemo((): ValidationErrors => validateForm(form), [form]);

  const stepErrors: [boolean, boolean, boolean] = useMemo(() => [
    STEP1_KEYS.some((k) => errors[k]),
    STEP2_KEYS.some((k) => errors[k]),
    false,
  ], [errors]);

  const validateStep = useCallback((step: number): boolean => {
    setShowErrors(true);
    return !stepErrors[step];
  }, [stepErrors]);

  const canSubmit = Object.keys(errors).length === 0;

  // Submission
  const mutation = useMutation({
    mutationFn: async () => runTaskSubmission({ form, audioPreview, imagePreview, selectedWordId, saveAudioToWord }),
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
    selectedWordId,
    setSelectedWordId,
    saveAudioToWord,
    setSaveAudioToWord,
  };
}
