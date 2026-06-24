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
  grade_levels: string[];
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

// ─── Word bank ──────────────────────────────────────────────────────────────

export interface WordBankEntry {
  id: string;
  word: string;
  category: string;
  grade_band: string[];
  char_count: number;
  syllable_count: number;
  grade: number | null;
  app_level: string | null;
  meaning_complexity: number | null;
  spelling_complexity: number | null;
  morph_complexity: number | null;
  suggested_exercises: string | null;
  spelling_tag: string | null;
  part_of_speech: string | null;
  meaning_type: string | null;
}

export interface WordsListResponse {
  success: boolean;
  data: { words: WordBankEntry[]; total: number; meta: PaginationMeta };
}

export interface WordFacets {
  grades: number[];
  categories: string[];
  app_levels: string[];
}

export interface WordImportSummary {
  parsed: number;
  kept: number;
  removed_review: number;
  removed_duplicate: number;
  removed_orthography: number;
}

export interface WordImportDropped {
  no: number;
  word: string;
  reason: "review" | "duplicate" | "orthography";
  detail?: string;
}

export interface WordImportResult {
  committed: boolean;
  grade: number | null;
  prefix: string;
  summary: WordImportSummary;
  dropped?: WordImportDropped[];
  imported?: number;
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

/** Summary row from GET /api/admin/learners */
export interface AdminLearner {
  id: string;
  name: string;
  grade: number;
  variant: string;
  daily_minutes: number;
  created_at: string;
  parent_email: string;
  general_level: string;
  current_streak: number;
  longest_streak: number;
  weak_skills: string[];
  top_error_codes: string[];
  attempt_count: number;
  lesson_count: number;
}

export interface AdminLearnerSkillState {
  general_level: string;
  s1_score: number; s2_score: number; s3_score: number; s4_score: number;
  s5_score: number; s6_score: number; s7_score: number; s8_score: number;
  s1_level: string; s2_level: string; s3_level: string; s4_level: string;
  s5_level: string; s6_level: string; s7_level: string; s8_level: string;
  s1_confidence: string; s2_confidence: string; s3_confidence: string; s4_confidence: string;
  s5_confidence: string; s6_confidence: string; s7_confidence: string; s8_confidence: string;
  top_error_codes: string[];
  weak_skills: string[];
  recent_error_codes: string[];
  preferred_session_length: number;
  current_streak: number;
  longest_streak: number;
  updated_at: string;
}

export interface AdminPlanLesson {
  id: string;
  day_number: number;
  status: string;
  accuracy: number | null;
  primary_skill: string;
  scheduled_date: string;
  completed_at: string | null;
}

export interface AdminCheckpoint {
  status: string;
  decision: string | null;
  scheduled_date: string;
  completed_at: string | null;
  result: unknown;
}

export interface AdminActivePlan {
  template: string;
  status: string;
  source: string;
  priority_skills: string[];
  target_errors: string[];
  current_day: number;
  total_days: number;
  daily_minutes: number;
  started_at: string;
  ended_at: string | null;
  lesson_counts: { total: number; completed: number; in_progress: number; pending: number };
  schedule: AdminPlanLesson[];
  checkpoints: AdminCheckpoint[];
}

export interface AdminRecentLesson {
  id: string;
  day_number: number;
  accuracy: number | null;
  completed_at: string | null;
  primary_skill: string;
}

export interface AdminDiagnosticResult {
  general_level: string | null;
  skill_levels: Record<string, string>;
  top_errors: string[];
  priority_skills: string[];
}

export interface AdminDiagnostic {
  status: string;
  current_phase: string;
  phase_a_completed: boolean;
  phase_b_completed: boolean;
  phase_c_completed: boolean;
  phase_counts: {
    a_expected: number;
    b_expected: number | null;
    c_expected: number;
  } | null;
  weak_skills_detected: string[];
  result: AdminDiagnosticResult | null;
  started_at: string;
  completed_at: string | null;
  attempt_count: number;
}

/** Full detail from GET /api/admin/learners/:id */
export interface AdminLearnerDetail {
  id: string;
  name: string;
  grade: number;
  variant: string;
  daily_minutes: number;
  created_at: string;
  parent_email: string;
  skill_state: AdminLearnerSkillState | null;
  active_plan: AdminActivePlan | null;
  recent_lessons: AdminRecentLesson[];
  diagnostic: AdminDiagnostic | null;
}

/** User-activity stats from GET /api/admin/stats (learner data, not content). */
export interface ActivityStats {
  totals: {
    parents: number;
    learners: number;
    diagnostic_sessions: number;
    plans: number;
    lessons: number;
    attempts: number;
    error_logs: number;
    checkpoints: number;
  };
  learners_by_variant: Record<string, number>;
  learners_by_grade: Record<string, number>;
  diagnostic_by_status: Record<string, number>;
  plans_by_template: Record<string, number>;
  lessons_by_status: Record<string, number>;
  level_distribution: Record<string, number>;
  score_distribution: Record<string, number>;
  top_error_codes: Array<{ code: string; count: number }>;
  averages: {
    lesson_accuracy: number | null;
    attempt_score: number | null;
    attempt_time_seconds: number | null;
    current_streak: number | null;
  };
  longest_streak: number;
  activity: {
    attempts_last_hour: number;
    last_attempt_at: string | null;
  };
}
