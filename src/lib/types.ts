export interface TaskOptions {
  // dictation / listening
  audio_text?: string;
  word_count?: number;
  expected_answers?: string[];
  allow_partial?: boolean;
  // correction (TT3_CORRECTION)
  incorrect_text?: string;
  correct_text?: string;
  hint?: string;
  error_type?: string;
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
  review_after_days: number[];
  lesson_slot_fit: string;
  feedback_text: string;
  initial_text?: string;
}

// Shape returned by GET /content/tasks and GET /content/tasks/:task_id
export interface TaskVariant extends TaskContent {
  id: string;
  stage: string;
  ai_flags: string[];
  ai_scores: {
    spelling: boolean | null;
    distractor: boolean | null;
    pedagogical: boolean | null;
  };
  created_at: string;
  reviewer_note?: string;
  reviewed_by?: string;
}

export interface TaskListResponse {
  success: boolean;
  data: {
    stage: string;
    total: number;
    tasks: TaskVariant[];
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
  ai_scores: {
    spelling: boolean | null;
    distractor: boolean | null;
    pedagogical: boolean | null;
  };
  ai_flags: string[];
  status: ReviewStatus;
  created_at: string;
  reviewed_by?: string;
  reviewer_note?: string;
}

export interface ReviewAction {
  action: "approve" | "reject" | "request_revision";
  note?: string;
  edited_task?: Partial<TaskContent>;
}

export interface ContentStats {
  pipeline: {
    stage1: number;
    stage2: number;
    validated: number;
    flagged: number;
    rejected: number;
    needs_revision: number;
  };
  llm_review: unknown;
}
