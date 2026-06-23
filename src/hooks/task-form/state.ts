import {
  TASK_TYPE_INFO,
  parseLines,
  type OptionGroup,
} from "@/lib/task-defaults";

export type FormState = {
  task_type: string;
  prompt_text: string;
  correct_answer: string;
  image_description: string;
  primary_skill: string;
  secondary_skill: string;
  level_target: string;
  grade_band: string[];
  grade_levels: string[];
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
  audio_text: string;
  word_count: string;
  allow_partial: boolean;
  expected_answers: string;
  // fill (word-level): fillOptions
  display_text: string;
  blank_position: number;
  context_word: string;
  // sentence_fill: sentenceFillOptions
  sentence_template: string;
  context_sentence: string;
  // mini_text: miniTextOptions
  sentence_count: number;
  // self_check: selfCheckOptions
  original_attempt: string;
  model_answer: string;
  comparison_mode: string;
  // choice extra
  audio_trigger: boolean;
  // TT_MATCH_PAIRS: one "left | right" per line
  pairs_text: string;
  // per-pair generated images: index → base64
  pairImages: Record<number, string>;
  // TT_ASSEMBLE_WORD: space-separated segments in correct order
  tiles_text: string;
  // TT_TAP_FIND_ERROR
  sentence: string;
  error_word_index: number;
  // copy
  text_to_copy: string;
  // visual_memory
  display_seconds: number;
};

export const INITIAL_FORM: FormState = {
  task_type: "",
  prompt_text: "",
  correct_answer: "",
  image_description: "",
  primary_skill: "",
  secondary_skill: "",
  level_target: "",
  grade_band: [],
  grade_levels: [],
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
  audio_text: "",
  word_count: "",
  allow_partial: false,
  expected_answers: "",
  // fill
  display_text: "",
  blank_position: 0,
  context_word: "",
  // sentence_fill
  sentence_template: "",
  context_sentence: "",
  // mini_text
  sentence_count: 3,
  // self_check
  original_attempt: "",
  model_answer: "",
  comparison_mode: "side_by_side",
  // choice extra
  audio_trigger: false,
  // v3
  pairs_text: "",
  pairImages: {},
  tiles_text: "",
  sentence: "",
  error_word_index: -1,
  // copy
  text_to_copy: "",
  // visual_memory
  display_seconds: 3,
};

export interface ValidationErrors {
  task_type?: string;
  grade_band?: string;
  primary_skill?: string;
  level_target?: string;
  difficulty?: string;
  lesson_slot_fit?: string;
  prompt_text?: string;
  correct_answer?: string;
  incorrect_text?: string;
  correct_text?: string;
  audio_text?: string;
  expected_answers?: string;
  initial_text?: string;
  // fill
  context_word?: string;
  display_text?: string;
  // sentence_fill
  sentence_template?: string;
  blank_answer?: string;
  context_sentence?: string;
  // mini_text
  sentence_count?: string;
  // self_check
  model_answer?: string;
  comparison_mode?: string;
  // v3
  pairs_text?: string;
  tiles_text?: string;
  sentence?: string;
  error_word_index?: string;
  // copy
  text_to_copy?: string;
  // visual_memory
  display_seconds?: string;
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

export const DEFAULT_TRACKABLE_KEYS = new Set([
  "difficulty",
  "level_target",
  "estimated_time_seconds",
  "lesson_slot_fit",
]);

export const STEP1_KEYS: (keyof ValidationErrors)[] = [
  "task_type",
  "grade_band",
  "primary_skill",
  "level_target",
  "difficulty",
  "lesson_slot_fit",
];

export const STEP2_KEYS: (keyof ValidationErrors)[] = [
  "prompt_text",
  "correct_answer",
  "incorrect_text",
  "correct_text",
  "audio_text",
  "expected_answers",
  "initial_text",
  "context_word",
  "display_text",
  "sentence_template",
  "blank_answer",
  "sentence_count",
  "model_answer",
  "comparison_mode",
  "pairs_text",
  "tiles_text",
  "sentence",
  "error_word_index",
  "text_to_copy",
  "display_seconds",
];

export function validateForm(form: FormState): ValidationErrors {
  const e: ValidationErrors = {};
  if (!form.task_type) e.task_type = "Даалгаврын төрөл сонгоно уу";
  if (form.grade_band.length === 0) e.grade_band = "Ангийн бүлэг сонгоно уу";
  if (!form.primary_skill) e.primary_skill = "Үндсэн чадвар сонгоно уу";
  if (!form.level_target) e.level_target = "Түвшин сонгоно уу";

  const d = parseInt(form.difficulty, 10);
  if (isNaN(d) || d < 1 || d > 5) e.difficulty = "1-5 хоорондох тоо оруулна уу";
  if (!form.lesson_slot_fit) e.lesson_slot_fit = "Хичээлийн үе сонгоно уу";

  if (!form.prompt_text.trim()) e.prompt_text = "Даалгаврын текст оруулна уу";
  else if (form.prompt_text.length > 1000) e.prompt_text = "1000 тэмдэгтээс хэтрэхгүй";

  const tt = form.task_type;
  const currentGroup = tt ? ((TASK_TYPE_INFO[tt]?.groups[0] ?? "choice") as OptionGroup) : null;

  if (currentGroup === "choice") {
    if (!form.correct_answer.trim()) e.correct_answer = "Зөв хариулт оруулна уу";
    const lines = parseLines(form.expected_answers);
    if (lines.length < 2) e.expected_answers = "Хамгийн багадаа 2 буруу сонголт оруулна уу";
  } else if (currentGroup === "fill") {
    if (!form.context_word.trim()) e.context_word = "Бүтэн үгийг оруулна уу";
  } else if (currentGroup === "sentence_fill") {
    if (!form.sentence_template.trim()) e.sentence_template = "Өгүүлбэрийн загварыг оруулна уу";
    else if (!form.sentence_template.includes("___")) e.sentence_template = "Загварт ___ цоорхой байх ёстой";
    if (!form.correct_answer.trim()) e.correct_answer = "Цоорхойд орох зөв үгийг оруулна уу";
  } else if (currentGroup === "correction") {
    if (!form.incorrect_text.trim()) e.incorrect_text = "Буруу текст оруулна уу";
    if (!form.correct_text.trim()) e.correct_text = "Зөв текст оруулна уу";
  } else if (currentGroup === "dictation") {
    if (!form.correct_answer.trim() && !form.audio_text.trim()) e.audio_text = "Аудио болгох текстийг оруулна уу";
  } else if (currentGroup === "mini_text") {
    if (!form.correct_answer.trim() && !form.audio_text.trim()) e.audio_text = "Аудио болгох текстийг оруулна уу";
  } else if (currentGroup === "self_check") {
    if (!form.model_answer.trim() && !form.correct_answer.trim()) e.model_answer = "Жишиг хариултыг оруулна уу";
  } else if (currentGroup === "match_pairs") {
    const pairs = parseLines(form.pairs_text).filter((l) => l.includes("|") || l.includes("—"));
    if (pairs.length < 2) e.pairs_text = "Хамгийн багадаа 2 хос оруулна уу (зүүн | баруун)";
  } else if (currentGroup === "assemble_word") {
    const segments = form.tiles_text.trim().split(/\s+/).filter(Boolean);
    if (segments.length < 2) e.tiles_text = "Хамгийн багадаа 2 хэсэг оруулна уу";
  } else if (currentGroup === "tap_find_error") {
    if (!form.sentence.trim()) e.sentence = "Өгүүлбэр оруулна уу";
    if (form.error_word_index < 0) e.error_word_index = "Алдаатай үгийг сонгоно уу";
    if (!form.correct_text.trim()) e.correct_text = "Засварласан өгүүлбэр оруулна уу";
  } else if (currentGroup === "copy") {
    if (!form.text_to_copy.trim()) e.text_to_copy = "Хуулах текстийг оруулна уу";
  } else if (currentGroup === "visual_memory") {
    if (!form.correct_answer.trim()) e.correct_answer = "Тогтоох текстийг оруулна уу";
    if (form.display_seconds < 2 || form.display_seconds > 10) e.display_seconds = "Харуулах хугацаа 2–10 секунд байх ёстой";
  } else if (!form.correct_answer.trim()) {
    e.correct_answer = "Зөв хариулт оруулна уу";
  }

  return e;
}
