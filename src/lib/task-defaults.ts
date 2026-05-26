export type OptionGroup = "dictation" | "correction" | "multiple_choice" | "rewrite";

export interface TaskTypeInfo {
  label: string;
  shortLabel: string;
  description: string;
  groups: OptionGroup[];
  category: string;
}

export const TASK_TYPE_INFO: Record<string, TaskTypeInfo> = {
  TT1:  { label: "Диктант (үг)",            shortLabel: "TT1",  description: "Үг сонсоод бичнэ",                       groups: ["dictation"],        category: "dictation" },
  TT2:  { label: "Диктант (өгүүлбэр)",      shortLabel: "TT2",  description: "Өгүүлбэр сонсоод бичнэ",                 groups: ["dictation"],        category: "dictation" },
  TT3:  { label: "Алдаа засах",              shortLabel: "TT3",  description: "Алдаатай текстийг олж засна",             groups: ["correction"],       category: "correction" },
  TT4:  { label: "Диктант (дуу тоглуулах)", shortLabel: "TT4",  description: "Дуу тоглуулан үгийг бичнэ",               groups: ["dictation"],        category: "dictation" },
  TT5:  { label: "Диктант (зурагтай)",      shortLabel: "TT5",  description: "Зургийн дагуу үгийг бичнэ",               groups: ["dictation"],        category: "dictation" },
  TT6:  { label: "Диктант (сонсох)",         shortLabel: "TT6",  description: "Сонсоод бичнэ",                           groups: ["dictation"],        category: "dictation" },
  TT7:  { label: "Зөв үгийг сонгох",        shortLabel: "TT7",  description: "Хэд хэдэн сонголтоос зөв үгийг сонгоно", groups: ["multiple_choice"],  category: "multiple_choice" },
  TT8:  { label: "Цоорхой бөглөх",          shortLabel: "TT8",  description: "Өгүүлбэрийн цоорхойд зөв үг бичнэ",     groups: ["multiple_choice"],  category: "multiple_choice" },
  TT9:  { label: "Үсэг тааруулах",          shortLabel: "TT9",  description: "Холилдсон үсгийг зөв эрэмбэлнэ",         groups: [],                   category: "other" },
  TT10: { label: "Үгийн эхлэл/төгсгөл",    shortLabel: "TT10", description: "Үгийн эхлэл эсвэл төгсгөлийг бичнэ",     groups: [],                   category: "other" },
  TT11: { label: "Зөв/буруу",               shortLabel: "TT11", description: "Өгүүлбэр зөв эсэхийг тодорхойлно",      groups: ["multiple_choice"],  category: "multiple_choice" },
  TT12: { label: "Зурагтай тааруулах",      shortLabel: "TT12", description: "Зурагт тохирох үгийг олно",               groups: ["multiple_choice"],  category: "multiple_choice" },
  TT13: { label: "Дахин бичих",             shortLabel: "TT13", description: "Эх бичвэрийг зөв хэлбэрээр дахин бичнэ", groups: ["rewrite"],          category: "rewrite" },
  TT14: { label: "Чөлөөт бичих",            shortLabel: "TT14", description: "Сэдэвт зориулж чөлөөтэй бичнэ",         groups: [],                   category: "other" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  dictation:       "Диктант",
  correction:      "Алдаа засах",
  multiple_choice: "Сонголтот",
  rewrite:         "Дахин бичих",
  other:           "Бусад",
};

export const CATEGORY_ORDER = ["dictation", "correction", "multiple_choice", "rewrite", "other"] as const;

export const SKILL_LABELS: Record<string, string> = {
  S1: "Үсгийн дараалал (орфографи)",
  S2: "Үгийн зааг (зай)",
  S3: "Том үсэг хэрэглэх",
  S4: "Тэмдэглэгээ ба цэг таслал",
  S5: "Эгшиг зохицол",
  S6: "Нийлмэл үг",
  S7: "Зээлдсэн үг",
  S8: "Үгийн гарвал (этимологи)",
};

export const LEVEL_LABELS: Record<string, string> = {
  M0: "Ойлгоогүй",
  M1: "Танил болж байна",
  M2: "Дасаж байна",
  M3: "Эзэмшсэн",
};

export const GRADE_BAND_LABELS: Record<string, string> = {
  G12: "1–2-р анги",
  G24: "2–4-р анги",
};

export const ERROR_LABELS: Record<string, string> = {
  A:  "Зөв бичих дүрмийн алдаа",
  B:  "Хуурамч хариулт буруу",
  C1: "Үсэг буруу орлуулсан",
  C2: "Үсэг буруу орлуулсан (хувилбар)",
  D:  "Үгийн зааг буруу",
  E1: "Дүрмийн алдаа (1-р төрөл)",
  E2: "Дүрмийн алдаа (2-р төрөл)",
  G1: "Сурган хүмүүжүүлэхийн асуудал (1)",
  G2: "Сурган хүмүүжүүлэхийн асуудал (2)",
  H4: "Агуулгын асуудал",
};

export const LESSON_SLOT_LABELS: Record<string, string> = {
  intro:    "Танилцуулга",
  practice: "Дасгал",
  review:   "Давтлага",
  test:     "Шалгалт",
};

export const TASK_TYPES    = Object.keys(TASK_TYPE_INFO);
export const SKILLS        = Object.keys(SKILL_LABELS);
export const LEVELS        = Object.keys(LEVEL_LABELS);
export const GRADE_BANDS   = Object.keys(GRADE_BAND_LABELS);
export const ERROR_CODES   = Object.keys(ERROR_LABELS);
export const LESSON_SLOTS  = Object.keys(LESSON_SLOT_LABELS);

// Word-level dictation types vs sentence-level
const WORD_DICTATION = new Set(["TT1", "TT4", "TT5"]);

interface DefaultValues {
  difficulty: string;
  level_target: string;
  estimated_time_seconds: string;
  lesson_slot_fit: string;
  review_after_days: string;
}

export function computeDefaults(taskType: string, gradeBands: string[]): DefaultValues {
  const info = TASK_TYPE_INFO[taskType];
  if (!info) {
    return { difficulty: "1", level_target: "M0", estimated_time_seconds: "30", lesson_slot_fit: "practice", review_after_days: "1, 3, 7" };
  }

  const isHighGrade = gradeBands.includes("G24");
  const group = info.groups[0]; // primary group

  let difficulty: number;
  let level: string;
  let time: number;

  if (group === "dictation") {
    if (WORD_DICTATION.has(taskType)) {
      difficulty = isHighGrade ? 2 : 1;
      level     = isHighGrade ? "M1" : "M0";
      time      = 15;
    } else {
      difficulty = isHighGrade ? 3 : 2;
      level     = isHighGrade ? "M2" : "M1";
      time      = 30;
    }
  } else if (group === "correction") {
    difficulty = isHighGrade ? 3 : 2;
    level     = isHighGrade ? "M2" : "M1";
    time      = 45;
  } else if (group === "multiple_choice") {
    difficulty = isHighGrade ? 2 : 1;
    level     = isHighGrade ? "M1" : "M0";
    time      = 20;
  } else if (group === "rewrite") {
    difficulty = isHighGrade ? 3 : 2;
    level     = isHighGrade ? "M2" : "M1";
    time      = 60;
  } else {
    difficulty = isHighGrade ? 3 : 2;
    level     = isHighGrade ? "M2" : "M1";
    time      = 120;
  }

  return {
    difficulty: String(difficulty),
    level_target: level,
    estimated_time_seconds: String(time),
    lesson_slot_fit: "practice",
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
