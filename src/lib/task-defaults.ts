export type OptionGroup = "choice" | "fill" | "dictation" | "correction" | "self_check" | "copy";

export interface TaskBlueprint {
  primary_skill: string;
  secondary_skill?: string;
  level_target: string;
  error_targets: string[];
}

// Skill, level, and error defaults per task type derived from Task_Bank_Blueprint docs.
export const TASK_TYPE_BLUEPRINT: Record<string, TaskBlueprint> = {
  // G12
  TT_LISTEN_CHOOSE:            { primary_skill: "S1",                           level_target: "M0", error_targets: ["A1"] },
  TT_LETTER_FILL:              { primary_skill: "S1",                           level_target: "M0", error_targets: ["A2"] },
  TT_IMAGE_WORD_MATCH:         { primary_skill: "S2",                           level_target: "M0", error_targets: ["B1"] },
  TT_COPY_WRITE:               { primary_skill: "S2",                           level_target: "M0", error_targets: ["B3"] },
  TT_CHOOSE_CORRECT:           { primary_skill: "S3",                           level_target: "M1", error_targets: ["C1"] },
  TT_FILL_WRITE:               { primary_skill: "S3",                           level_target: "M1", error_targets: ["C1", "C2"] },
  TT_MISSING_LETTER:           { primary_skill: "S4",                           level_target: "M1", error_targets: ["C4"] },
  TT_WORD_SET_DICTATION:       { primary_skill: "S7",                           level_target: "M1", error_targets: ["H1", "B1"] },
  TT_CAPITAL_PUNCTUATION:      { primary_skill: "S6",                           level_target: "M1", error_targets: ["G1", "G2"] },
  TT_SIMPLE_SUFFIX:            { primary_skill: "S5",                           level_target: "M1", error_targets: ["E1", "E2"] },
  TT_FIND_ERROR:               { primary_skill: "S8",                           level_target: "M1", error_targets: ["H4"] },
  TT_SELF_CHECK:               { primary_skill: "S8",                           level_target: "M1", error_targets: ["H4"] },
  TT_TWO_WORD_DICTATION:       { primary_skill: "S7",                           level_target: "M1", error_targets: ["H1"] },
  TT_WORD_ENDING:              { primary_skill: "S2",                           level_target: "M1", error_targets: ["D5"] },
  TT_SENTENCE_FILL:            { primary_skill: "S6",                           level_target: "M1", error_targets: ["G2"] },
  TT_MIXED_REVIEW:             { primary_skill: "S2", secondary_skill: "S3",   level_target: "M1", error_targets: ["B1", "C1"] },
  // G24
  TT_WORD_FORM_CHOOSE:         { primary_skill: "S2",                           level_target: "M1", error_targets: ["B1", "B3"] },
  TT_LONG_VOWEL_FILL:          { primary_skill: "S3",                           level_target: "M1", error_targets: ["C1"] },
  TT_REDUCED_VOWEL:            { primary_skill: "S4",                           level_target: "M1", error_targets: ["C4"] },
  TT_SUFFIX_CHOOSE:            { primary_skill: "S5",                           level_target: "M2", error_targets: ["E2"] },
  TT_SHORT_SENTENCE_DICTATION: { primary_skill: "S7",                           level_target: "M2", error_targets: ["H1", "B4"] },
  TT_FIX_ERROR:                { primary_skill: "S8",                           level_target: "M2", error_targets: ["H4"] },
  TT_CONSONANT_CONFUSION:      { primary_skill: "S1",                           level_target: "M1", error_targets: ["D3"] },
  TT_WORD_FORM_FIX:            { primary_skill: "S2",                           level_target: "M2", error_targets: [] },
  TT_LONG_VOWEL_IN_SENTENCE:   { primary_skill: "S3",                           level_target: "M2", error_targets: ["C1", "C2"] },
  TT_REDUCED_VOWEL_IN_SENTENCE:{ primary_skill: "S4",                           level_target: "M2", error_targets: ["C4", "C5"] },
  TT_CASE_SUFFIX:              { primary_skill: "S5",                           level_target: "M2", error_targets: ["E2"] },
  TT_BASIC_COMMA:              { primary_skill: "S6",                           level_target: "M2", error_targets: ["G1", "G2"] },
  TT_TWO_SENTENCE_DICTATION:   { primary_skill: "S7",                           level_target: "M2", error_targets: ["H1"] },
  TT_FIND_OMITTED_LETTER:      { primary_skill: "S8",                           level_target: "M2", error_targets: ["B1"] },
  TT_MIXED_WORD_SET:           { primary_skill: "S2", secondary_skill: "S3",   level_target: "M2", error_targets: ["B1", "C1"] },
  TT_SUFFIX_WRITE:             { primary_skill: "S5",                           level_target: "M2", error_targets: ["E7"] },
  TT_SENTENCE_BOUNDARY:        { primary_skill: "S6",                           level_target: "M2", error_targets: ["G2"] },
  TT_MINI_TEXT_DICTATION:      { primary_skill: "S7",                           level_target: "M3", error_targets: ["H1", "B4"] },
  TT_OWN_WRITING_CORRECTION:   { primary_skill: "S8",                           level_target: "M3", error_targets: ["H4"] },
  TT_LONG_VOWEL_CHALLENGE:     { primary_skill: "S3",                           level_target: "M3", error_targets: ["C1", "C2"] },
  TT_COMPOUND_SUFFIX:          { primary_skill: "S5",                           level_target: "M3", error_targets: ["E2", "E7"] },
  TT_MIXED_CHECKPOINT:         { primary_skill: "S2", secondary_skill: "S7",   level_target: "M2", error_targets: [] },
  TT_EXPLAINED_CORRECTION:     { primary_skill: "S8",                           level_target: "M3", error_targets: ["H4"] },
};

export interface TaskTypeInfo {
  label: string;
  shortLabel: string;
  description: string;
  groups: OptionGroup[];
  category: string;
  gradeBand: "G12" | "G24" | "both";
}

export const TASK_TYPE_INFO: Record<string, TaskTypeInfo> = {
  // ── G12 ──────────────────────────────────────────────────────────────────────
  TT_LISTEN_CHOOSE:         { label: "Сонсож сонгох",          shortLabel: "G12-001", description: "Аудио сонсоод зөв үгийг сонгоно",              groups: ["choice"],     category: "choice",     gradeBand: "G12" },
  TT_LETTER_FILL:           { label: "Үсэг нөхөх",             shortLabel: "G12-002", description: "Цоорхой үсгийг нөхнө",                         groups: ["fill"],       category: "fill",       gradeBand: "G12" },
  TT_IMAGE_WORD_MATCH:      { label: "Зураг-үг тааруулах",     shortLabel: "G12-003", description: "Зурагт тохирох үгийг сонгоно",                  groups: ["choice"],     category: "choice",     gradeBand: "G12" },
  TT_COPY_WRITE:            { label: "Хуулж бичих",            shortLabel: "G12-004", description: "Өгсөн текстийг хуулж бичнэ",                    groups: ["copy"],       category: "copy",       gradeBand: "G12" },
  TT_CHOOSE_CORRECT:        { label: "Зөвийг сонгох",          shortLabel: "G12-005", description: "Хэд хэдэн хувилбараас зөв бичлэгийг сонгоно",   groups: ["choice"],     category: "choice",     gradeBand: "G12" },
  TT_FILL_WRITE:            { label: "Нөхөж бичих",            shortLabel: "G12-006", description: "Үгийн дутуу эгшгийг нөхнө",                     groups: ["fill"],       category: "fill",       gradeBand: "G12" },
  TT_MISSING_LETTER:        { label: "Дутуу үсэг",             shortLabel: "G12-007", description: "Балархай эгшгийг аудиотой нөхнө",               groups: ["fill"],       category: "fill",       gradeBand: "G12" },
  TT_WORD_SET_DICTATION:    { label: "Үгийн багц диктант",     shortLabel: "G12-008", description: "Хэд хэдэн үг сонсоод дарааллаар бичнэ",         groups: ["dictation"],  category: "dictation",  gradeBand: "G12" },
  TT_CAPITAL_PUNCTUATION:   { label: "Том үсэг, цэг",          shortLabel: "G12-009", description: "Том үсэг, цэгийн алдааг засна",                  groups: ["correction"], category: "correction", gradeBand: "both" },
  TT_SIMPLE_SUFFIX:         { label: "Энгийн залгавар",        shortLabel: "G12-010", description: "Түгээмэл залгаврын зөв хэлбэрийг сонгоно",       groups: ["choice"],     category: "choice",     gradeBand: "G12" },
  TT_FIND_ERROR:            { label: "Алдаа олох",             shortLabel: "G12-011", description: "Алдаатай үгийг олж засна",                       groups: ["correction"], category: "correction", gradeBand: "G12" },
  TT_SELF_CHECK:            { label: "Өөрийгөө шалгах",        shortLabel: "G12-012", description: "Зөв хариутай харьцуулан өөрийн хариуг шалгана",  groups: ["self_check"], category: "self_check", gradeBand: "G12" },
  TT_TWO_WORD_DICTATION:    { label: "2 үгийн диктант",        shortLabel: "G12-013", description: "Хоёр үг сонсоод дарааллаар бичнэ",               groups: ["dictation"],  category: "dictation",  gradeBand: "G12" },
  TT_WORD_ENDING:           { label: "Үгийн төгсгөл",          shortLabel: "G12-014", description: "Үгийн төгсгөлийн дутуу үсгийг нөхнө",            groups: ["fill"],       category: "fill",       gradeBand: "G12" },
  TT_SENTENCE_FILL:         { label: "Өгүүлбэр нөхөх",         shortLabel: "G12-015", description: "Өгүүлбэрийн цоорхойг нөхнө",                    groups: ["fill"],       category: "fill",       gradeBand: "G12" },
  TT_MIXED_REVIEW:          { label: "Холимог давталт",        shortLabel: "G12-016", description: "Үг ба эгшгийг хамт шалгана",                     groups: ["choice"],     category: "choice",     gradeBand: "G12" },
  // ── G24 ──────────────────────────────────────────────────────────────────────
  TT_WORD_FORM_CHOOSE:      { label: "Үгийн зөв хэлбэр сонгох",    shortLabel: "G24-001", description: "Суурь зөв бичлэгийн хэлбэрийг сонгоно",         groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_LONG_VOWEL_FILL:       { label: "Урт эгшиг нөхөх",            shortLabel: "G24-002", description: "Урт эгшгийн дутуу хэсгийг нөхнө",               groups: ["fill"],       category: "fill",       gradeBand: "G24" },
  TT_REDUCED_VOWEL:         { label: "Балархай эгшиг",             shortLabel: "G24-003", description: "Балархай эгшгийг нөхнө",                         groups: ["fill"],       category: "fill",       gradeBand: "G24" },
  TT_SUFFIX_CHOOSE:         { label: "Залгавар сонгох",            shortLabel: "G24-004", description: "Зохих залгаврыг сонгоно",                        groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_SHORT_SENTENCE_DICTATION: { label: "Богино өгүүлбэрийн диктант", shortLabel: "G24-006", description: "Богино өгүүлбэр сонсоод бичнэ",             groups: ["dictation"],  category: "dictation",  gradeBand: "G24" },
  TT_FIX_ERROR:             { label: "Алдаа засах",               shortLabel: "G24-007", description: "Алдаатай үгийг олж засна",                       groups: ["correction"], category: "correction", gradeBand: "G24" },
  TT_CONSONANT_CONFUSION:   { label: "Гийгүүлэгч андуурал",       shortLabel: "G24-008", description: "Төстэй гийгүүлэгчийг ялгаж сонгоно",             groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_WORD_FORM_FIX:         { label: "Үгийн хэлбэр засах",        shortLabel: "G24-009", description: "Буруу хэлбэрийг засна",                          groups: ["correction"], category: "correction", gradeBand: "G24" },
  TT_LONG_VOWEL_IN_SENTENCE:{ label: "Урт эгшиг өгүүлбэрт",      shortLabel: "G24-010", description: "Өгүүлбэр дотор урт эгшгийг ялгаж сонгоно",      groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_REDUCED_VOWEL_IN_SENTENCE: { label: "Балархай эгшиг өгүүлбэрт", shortLabel: "G24-011", description: "Өгүүлбэрт балархай эгшгийг нөхнө",          groups: ["fill"],       category: "fill",       gradeBand: "G24" },
  TT_CASE_SUFFIX:           { label: "Тийн ялгал",                shortLabel: "G24-012", description: "Тийн ялгалын зөв хэлбэрийг сонгоно",             groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_BASIC_COMMA:           { label: "Таслалын анхан хэрэглээ",   shortLabel: "G24-013", description: "Таслалыг зөв байрлуулна",                        groups: ["correction"], category: "correction", gradeBand: "G24" },
  TT_TWO_SENTENCE_DICTATION:{ label: "2 өгүүлбэрийн диктант",     shortLabel: "G24-014", description: "Хоёр өгүүлбэр сонсоод бичнэ",                   groups: ["dictation"],  category: "dictation",  gradeBand: "G24" },
  TT_FIND_OMITTED_LETTER:   { label: "Үсэг орхигдол олох",        shortLabel: "G24-015", description: "Орхигдсон үсгийг олж засна",                     groups: ["correction"], category: "correction", gradeBand: "G24" },
  TT_MIXED_WORD_SET:        { label: "Холимог үгийн багц",        shortLabel: "G24-016", description: "Үг+эгшгийн хосолсон хэлбэрийг сонгоно",         groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_SUFFIX_WRITE:          { label: "Залгавар бичлэг",           shortLabel: "G24-017", description: "Залгаврыг зөв нөхнө",                            groups: ["fill"],       category: "fill",       gradeBand: "G24" },
  TT_SENTENCE_BOUNDARY:     { label: "Өгүүлбэрийн хил зааг",     shortLabel: "G24-018", description: "Өгүүлбэрүүдийг зөв салгана",                     groups: ["correction"], category: "correction", gradeBand: "G24" },
  TT_MINI_TEXT_DICTATION:   { label: "Мини эхийн диктант",        shortLabel: "G24-019", description: "2–3 өгүүлбэртэй эхийг сонсоод бичнэ",            groups: ["dictation"],  category: "dictation",  gradeBand: "G24" },
  TT_OWN_WRITING_CORRECTION:{ label: "Өөрийн бичвэр засвар",     shortLabel: "G24-020", description: "Өөрийн бичвэрийг шалгаж засна",                  groups: ["self_check"], category: "self_check", gradeBand: "G24" },
  TT_LONG_VOWEL_CHALLENGE:  { label: "Урт эгшиг challenge",       shortLabel: "G24-021", description: "Ахисан урт эгшгийн ялгалт",                      groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_COMPOUND_SUFFIX:       { label: "Нийлмэл залгавар",         shortLabel: "G24-022", description: "Нийлмэл залгаврыг нөхнө",                        groups: ["fill"],       category: "fill",       gradeBand: "G24" },
  TT_MIXED_CHECKPOINT:      { label: "Холимог checkpoint",        shortLabel: "G24-023", description: "Долоо хоногийн холимог шалгалт",                  groups: ["choice"],     category: "choice",     gradeBand: "G24" },
  TT_EXPLAINED_CORRECTION:  { label: "Тайлбартай засвар",        shortLabel: "G24-024", description: "Алдааны шалтгааныг тайлбарлаж засна",             groups: ["correction"], category: "correction", gradeBand: "G24" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  choice:     "Сонголтот",
  fill:       "Нөхөх",
  dictation:  "Диктант",
  correction: "Засвар",
  self_check: "Өөрийгөө шалгах",
  copy:       "Хуулж бичих",
};

export const CATEGORY_ORDER = ["choice", "fill", "dictation", "correction", "self_check", "copy"] as const;

export const SKILL_LABELS: Record<string, string> = {
  S1: "Үсэг-авиа ялгалт",
  S2: "Үгийн зөв бичлэг",
  S3: "Урт/богино эгшиг",
  S4: "Балархай эгшиг",
  S5: "Залгавар, нөхцөл",
  S6: "Өгүүлбэрийн тэмдэглэгээ",
  S7: "Сонсголоор буулгах",
  S8: "Алдаа засах",
};

export const LEVEL_LABELS: Record<string, string> = {
  M0: "M0 — Суурь",
  M1: "M1 — Эхлэл",
  M2: "M2 — Хөгжил",
  M3: "M3 — Чадвар",
  M4: "M4 — Ахисан",
  M5: "M5 — Эзэмшсэн",
};

export const GRADE_BAND_LABELS: Record<string, string> = {
  G12: "1–2-р анги",
  G24: "2–4-р анги",
};

export const ERROR_LABELS: Record<string, string> = {
  A1: "Үсэг орхих",
  A2: "Үсэг нэмэх",
  A3: "Үсэг буруу орлуулах",
  B1: "Үгийн зөв хэлбэр",
  B2: "Хуурамч найз үг",
  B3: "Үсгийн дараалал",
  B4: "Үгийн төгсгөл",
  C1: "Урт эгшиг орхих",
  C2: "Богино эгшиг орхих",
  C3: "Эгшиг андуурах",
  C4: "Балархай эгшиг",
  C5: "Балархай эгшиг (өгүүлбэрт)",
  C6: "Эгшиг нэмэх",
  D3: "Гийгүүлэгч андуурал",
  D5: "Үгийн төгсгөлийн гийгүүлэгч",
  E1: "Залгавар (1-р бүлэг)",
  E2: "Залгавар (2-р бүлэг)",
  E7: "Залгавар бичлэг",
  G1: "Том үсгийн хэрэглээ",
  G2: "Цэгийн хэрэглээ",
  H1: "Диктантын алдаа",
  H4: "Засварын алдаа",
};

export const LESSON_SLOT_LABELS: Record<string, string> = {
  WARM_UP: "Дулаацуулга",
  CORE:    "Үндсэн",
  MIXED:   "Холимог",
  END:     "Төгсгөл",
};

export const TASK_TYPES   = Object.keys(TASK_TYPE_INFO);
export const SKILLS       = Object.keys(SKILL_LABELS);
export const LEVELS       = Object.keys(LEVEL_LABELS);
export const GRADE_BANDS  = Object.keys(GRADE_BAND_LABELS);
export const ERROR_CODES  = Object.keys(ERROR_LABELS);
export const LESSON_SLOTS = Object.keys(LESSON_SLOT_LABELS);

interface DefaultValues {
  difficulty: string;
  level_target: string;
  estimated_time_seconds: string;
  lesson_slot_fit: string;
  review_after_days: string;
}

export function computeDefaults(taskType: string, gradeBands: string[]): DefaultValues {
  const isG24 = gradeBands.includes("G24");
  const info = TASK_TYPE_INFO[taskType];
  if (!info) return { difficulty: "1", level_target: "M0", estimated_time_seconds: "30", lesson_slot_fit: "CORE", review_after_days: "1, 3, 7" };

  const group = info.groups[0];
  let difficulty: number, level: string, time: number, slot: string;

  switch (group) {
    case "choice":
      difficulty = isG24 ? 3 : 1; level = isG24 ? "M2" : "M0"; time = 20; slot = "WARM_UP"; break;
    case "fill":
      difficulty = isG24 ? 3 : 2; level = isG24 ? "M2" : "M1"; time = 45; slot = "CORE"; break;
    case "dictation":
      difficulty = isG24 ? 3 : 2; level = isG24 ? "M2" : "M1";
      time = (taskType === "TT_MINI_TEXT_DICTATION" || taskType === "TT_TWO_SENTENCE_DICTATION") ? 120 : 60;
      slot = "CORE"; break;
    case "correction":
      difficulty = isG24 ? 3 : 2; level = isG24 ? "M2" : "M1"; time = 45; slot = "CORE"; break;
    case "self_check":
      difficulty = isG24 ? 3 : 2; level = isG24 ? "M2" : "M1"; time = 60; slot = "END"; break;
    case "copy":
      difficulty = 1; level = "M0"; time = 45; slot = "CORE"; break;
    default:
      difficulty = 2; level = "M1"; time = 30; slot = "CORE";
  }

  return {
    difficulty: String(difficulty),
    level_target: level,
    estimated_time_seconds: String(time),
    lesson_slot_fit: slot,
    review_after_days: "1, 3, 7",
  };
}

export function parseNumberList(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

export function parseLines(raw: string): string[] {
  return raw.split("\n").map((s) => s.trim()).filter(Boolean);
}
