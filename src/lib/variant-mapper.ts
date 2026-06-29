import type { ReviewItem, ReviewStatus, TaskVariant } from "./types";

function deriveStatus(variant: TaskVariant): ReviewStatus {
  const s = variant.stage?.toLowerCase() ?? "";
  if (s === "validated") return "human_approved";
  if (s === "rejected") return "human_rejected";
  if (s === "needs_revision") return "needs_revision";
  if (s === "flagged") return "ai_flagged";

  if (variant.ai_review_severity === "ok") return "ai_passed";
  if (variant.ai_review_severity === "minor" || variant.ai_review_severity === "blocker") return "ai_flagged";
  if (variant.ai_review_issues.length > 0) return "ai_flagged";

  return "pending";
}

export function variantToReviewItem(v: TaskVariant): ReviewItem {
  return {
    id: v.id,
    variant_id: v.id,
    task: {
      task_id: v.task_id,
      task_type: v.task_type ?? "",
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
      grade_levels: Array.isArray(v.grade_levels) ? v.grade_levels : [],
      difficulty: v.difficulty ?? 0,
      estimated_time_seconds: v.estimated_time_seconds ?? 0,
      lesson_slot_fit: v.lesson_slot_fit ?? "",
      feedback_text: v.feedback_text ?? "",
      feedback_correct: v.feedback_correct ?? undefined,
      feedback_wrong: v.feedback_wrong ?? undefined,
      initial_text: v.initial_text ?? undefined,
      source: v.source,
    },
    ai_review_severity:  v.ai_review_severity,
    ai_review_issues:    v.ai_review_issues ?? [],
    ai_fix_suggestion:   v.ai_fix_suggestion,
    status:              deriveStatus(v),
    created_at:          v.created_at ?? new Date().toISOString(),
    reviewer_notes:      v.reviewer_notes,
    flag_reason:         v.flag_reason,
    revision_reason:     v.revision_reason,
    rejection_reason:    v.rejection_reason,
  };
}
