import type { ReviewItem, ReviewStatus, TaskVariant } from "./types";

function deriveStatus(variant: TaskVariant): ReviewStatus {
  const s = variant.stage?.toLowerCase() ?? "";
  if (s === "validated") return "human_approved";
  if (s.startsWith("rejected")) return "human_rejected";
  if (s === "needs_revision") return "needs_revision";
  if (s === "flagged") return "ai_flagged";

  const flags = variant.ai_flags ?? [];
  if (flags.length > 0) return "ai_flagged";

  const scores = variant.ai_scores ?? {};
  const { spelling, distractor, pedagogical } = scores;
  if (spelling === null && distractor === null && pedagogical === null) return "pending";
  if (spelling && distractor && pedagogical) return "ai_passed";
  return "ai_flagged";
}

export function variantToReviewItem(v: TaskVariant): ReviewItem {
  return {
    id: v.id,
    variant_id: v.id,
    task: {
      task_id: String(v.id).replace(/-v\d+$/, ""),
      task_type: v.task_type ?? "",
      title: v.title ?? "",
      prompt_text: v.prompt_text ?? "",
      correct_answer: v.correct_answer ?? "",
      options: v.options ?? {},
      audio_url: v.audio_url ?? null,
      image_url: v.image_url ?? null,
      primary_skill: v.primary_skill ?? "",
      secondary_skill: v.secondary_skill ?? null,
      level_target: v.level_target ?? "",
      error_targets: v.error_targets ?? [],
      grade_band: Array.isArray(v.grade_band) ? v.grade_band : [],
      difficulty: v.difficulty ?? 0,
      estimated_time_seconds: v.estimated_time_seconds ?? 0,
      review_after_days: v.review_after_days ?? [],
      lesson_slot_fit: v.lesson_slot_fit ?? "",
      feedback_text: v.feedback_text ?? "",
      initial_text: v.initial_text ?? undefined,
    },
    ai_scores: v.ai_scores ?? { spelling: null, distractor: null, pedagogical: null },
    ai_flags: v.ai_flags ?? [],
    status: deriveStatus(v),
    created_at: v.created_at ?? new Date().toISOString(),
    reviewed_by: v.reviewed_by,
    reviewer_note: v.reviewer_note,
  };
}
