export interface TaskOptions {
  // choice: choiceOptions
  choices?: Array<{ text: string; is_correct: boolean }>;
  audio_trigger?: boolean;
  // fill (word-level): fillOptions
  display_text?: string;
  blank_position?: number;
  blank_answer?: string;
  context_word?: string;
  // sentence_fill: sentenceFillOptions
  sentence_template?: string;
  context_sentence?: string;
  // sentence_fill
  hint?: string;
  // correction: correctionOptions
  incorrect_text?: string;
  correct_text?: string;
  // dictation: dictationOptions
  audio_text?: string;
  word_count?: number;
  expected_answers?: string[];
  allow_partial?: boolean;
  // mini_text: miniTextOptions
  sentence_count?: number;
  // self_check: selfCheckOptions
  original_attempt?: string;
  model_answer?: string;
  comparison_mode?: "side_by_side" | "highlight_diff";
  // match_pairs: matchPairsOptions
  pairs?: Array<{ left: string; right: string; left_image_url?: string; right_image_url?: string }>;
  image_side?: "left" | "right" | "none";
  // assemble_word: assembleWordOptions
  tiles?: string[];
  correct_order?: string[];
  // tap_find_error: tapFindErrorOptions
  sentence?: string;
  error_word_index?: number;
  // copy: copyOptions
  text_to_copy?: string;
  // visual_memory: visualMemoryOptions
  text_to_memorize?: string;
  display_seconds?: number;
}

export interface TaskContent {
  task_id: string;
  task_type: string;
  title: string;
  prompt_text: string;
  correct_answer: string;
  options: TaskOptions;
  audio_url: string | null;
  image_url: string | null;
  primary_skill: string;
  secondary_skill: string | null;
  level_target: string;
  error_targets: string[];
  grade_band: string[];
  difficulty: number;
  estimated_time_seconds: number;
  lesson_slot_fit: string;
  feedback_text: string;
  feedback_correct?: string;
  feedback_wrong?: string;
  initial_text?: string;
  interaction_form?: string | null;
  source?: string;
}

// Shape returned by GET /content/tasks and GET /content/tasks/:task_id
export interface TaskVariant extends TaskContent {
  id: string;
  stage: string;
  ai_review_severity: string | null;
  ai_review_issues: string[];
  ai_fix_suggestion: string | null;
  ai_reviewed_at: string | null;
  reviewer_notes: string | null;
  flag_reason: string | null;
  revision_reason: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  has_next: boolean;
}

export interface TaskListResponse {
  success: boolean;
  data: {
    stage: string;
    total: number;
    tasks: TaskVariant[];
    meta: PaginationMeta;
  };
}

export interface TaskVariantResponse {
  success: boolean;
  data: {
    stage: string;
    task_id: string;
    variant_count: number;
    variants: TaskVariant[];
  };
}

export type ReviewStatus =
  | "pending"
  | "ai_passed"
  | "ai_flagged"
  | "human_approved"
  | "human_rejected"
  | "needs_revision";

export interface ReviewItem {
  id: string;
  variant_id: string;
  task: TaskContent;
  ai_review_severity: string | null;
  ai_review_issues: string[];
  ai_fix_suggestion: string | null;
  status: ReviewStatus;
  created_at: string;
  reviewer_notes: string | null;
  flag_reason: string | null;
  revision_reason: string | null;
  rejection_reason: string | null;
}

export interface ReviewAction {
  action: "approve" | "reject" | "request_revision";
  note?: string;
  edited_task?: Partial<TaskContent>;
}

export interface LiveTask extends TaskContent {
  is_diagnostic: boolean;
  created_at: string;
}

export interface LiveTaskListResponse {
  success: boolean;
  data: { total: number; tasks: LiveTask[]; meta: PaginationMeta };
}

export interface ContentStats {
  pipeline: {
    stage1: number;
    stage2: number;
    validated: number;
    flagged: number;
    rejected: number;
    needs_revision: number;
    approved_today: number;
  };
}
