import {
  createTask,
  saveImageAndUpdateTask,
  saveAudioAndUpdateTask,
  uploadImageToUrl,
  editVariant,
  patchWord,
} from "@/lib/api";
import type { CreateTaskPayload, CreateTaskResult } from "@/lib/api";
import {
  TASK_TYPE_INFO,
  deriveInteractionForm,
  deriveImageSide,
  type OptionGroup,
} from "@/lib/task-defaults";
import type { AudioPreviewState } from "@/components/tasks/AudioPreview";
import type { ImagePreviewState } from "@/components/tasks/ImagePreview";
import type { FormState } from "./state";
import { buildOptions, deriveCorrectAnswer } from "./build-options";

export interface SubmitTaskArgs {
  form: FormState;
  audioPreview: AudioPreviewState | null;
  imagePreview: ImagePreviewState | null;
  /** Word the author picked from WordSuggestions, if any — transient, not
   * persisted to the task; only used to target the word-audio dual-write. */
  selectedWordId?: string | null;
  saveAudioToWord?: boolean;
}

/**
 * Creates a task from the current form, then uploads any previewed media
 * (audio, image, per-pair images) and patches the created variant. Resolves
 * only once all media saves complete so callers can keep a pending state.
 */
export async function runTaskSubmission({
  form,
  audioPreview,
  imagePreview,
  selectedWordId,
  saveAudioToWord,
}: SubmitTaskArgs): Promise<CreateTaskResult> {
  const currentGroup = (TASK_TYPE_INFO[form.task_type]?.groups[0] ?? "choice") as OptionGroup;
  const canonicalGradeBand = [...new Set(form.grade_band)];
  const payload: CreateTaskPayload = {
    task_type: form.task_type,
    prompt_text: form.prompt_text,
    correct_answer: deriveCorrectAnswer(form, currentGroup),
    options: buildOptions(form, currentGroup),
    primary_skill: form.primary_skill,
    secondary_skill: form.secondary_skill || null,
    level_target: form.level_target,
    error_targets: form.error_targets,
    grade_band: canonicalGradeBand,
    grade_levels: form.grade_levels.length > 0
      ? form.grade_levels
      : canonicalGradeBand.map((g) => `${g}:${form.level_target || 'M0'}`),
    difficulty: parseInt(form.difficulty, 10) || 1,
    estimated_time_seconds: parseInt(form.estimated_time_seconds, 10) || 30,
    lesson_slot_fit: form.lesson_slot_fit,
    feedback_text: form.feedback_text,
    feedback_correct: form.feedback_correct || undefined,
    feedback_wrong: form.feedback_wrong || undefined,
    initial_text: form.initial_text || undefined,
    audio_url: null,
    // A reused word image (imagePreview.url) is already a stable, hosted URL —
    // set it directly at creation, skipping the AI-generate/upload round trip
    // used for imagePreview.base64 below.
    image_url: imagePreview?.url ?? null,
    interaction_form: deriveInteractionForm(form.task_type),
  };
  const result = await createTask(payload);

  try {
    localStorage.setItem("last_created_task", JSON.stringify(form));
  } catch { /* localStorage full — non-critical */ }

  // Upload media and update DB before resolving — keeps isPending true until done.
  // POST /tasks always creates a TaskDraft (stage=STAGE2), never a live Task, so
  // these must use a non-"validated" stage or /update-audio and /update-image
  // look for the row in the wrong table and 404.
  const mediaWarnings: string[] = [];
  const saves: Promise<unknown>[] = [];
  if (audioPreview?.base64) {
    saves.push(
      saveAudioAndUpdateTask(audioPreview.base64, result.variant_id, audioPreview.slot, 'stage2')
        .then((res) => {
          if (selectedWordId && saveAudioToWord) {
            return patchWord(selectedWordId, { audio_url: res.url })
              .catch((err) => { console.error('Failed to save audio to word bank:', err); mediaWarnings.push('word-audio'); });
          }
        })
        .catch((err) => { console.error('Failed to save audio:', err); mediaWarnings.push('audio'); }),
    );
  }
  if (imagePreview?.base64) {
    saves.push(
      saveImageAndUpdateTask(imagePreview.base64, result.variant_id, 'stage2')
        .catch((err) => { console.error('Failed to save image:', err); mediaWarnings.push('image'); }),
    );
  }
  await Promise.all(saves);

  // Upload per-pair images and patch options
  const pairEntries = Object.entries(form.pairImages);
  if (pairEntries.length > 0) {
    const builtPairs = (buildOptions(form, currentGroup) as { pairs?: Array<{ left: string; right: string; left_image_url?: string; right_image_url?: string }> }).pairs ?? [];
    const side = deriveImageSide(form.task_type);
    const field = side === 'right' ? 'right_image_url' : 'left_image_url';
    const updatedPairs = [...builtPairs];
    await Promise.all(
      pairEntries.map(async ([idx, base64]) => {
        try {
          const url = await uploadImageToUrl(base64);
          updatedPairs[Number(idx)] = { ...updatedPairs[Number(idx)], [field]: url };
        } catch (err) {
          console.error(`Failed to save pair image ${idx}:`, err);
        }
      }),
    );
    await editVariant(result.variant_id, { options: { ...buildOptions(form, currentGroup), pairs: updatedPairs } }).catch((err) => console.error('Failed to update pair images:', err));
  }

  return mediaWarnings.length > 0 ? { ...result, mediaWarnings } : result;
}
