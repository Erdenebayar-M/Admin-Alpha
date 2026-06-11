import {
  createTask,
  saveImageAndUpdateTask,
  saveAudioAndUpdateTask,
  uploadImageToUrl,
  editVariant,
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
      saveAudioAndUpdateTask(audioPreview.base64, result.variant_id, audioPreview.slot)
        .catch((err) => console.error('Failed to save audio:', err)),
    );
  }
  if (imagePreview?.base64) {
    saves.push(
      saveImageAndUpdateTask(imagePreview.base64, result.variant_id)
        .catch((err) => console.error('Failed to save image:', err)),
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

  return result;
}
