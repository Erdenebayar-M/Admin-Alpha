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
  lesson_slot_fit: string;
  feedback_text: string;
  initial_text?: string;
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
