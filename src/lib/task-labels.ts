export const CATEGORY_LABELS: Record<string, string> = {
  choice: "Сонгох",
  fill: "Үсэг/үг нөхөх",
  sentence_fill: "Өгүүлбэр нөхөх",
  dictation: "Цээжээр бичих",
  mini_text: "Мини эхийн диктант",
  correction: "Алдааг засах",
  self_check: "Өөрийгөө шалгах",
  match_pairs: "Холбож тааруулах",
  assemble_word: "Угсрах",
  tap_find_error: "Алдаа олж товших",
  copy: "Хуулж бичих",
  visual_memory: "Харж тогтоон бичих",
};

export const CATEGORY_ORDER = [
  "choice",
  "fill",
  "sentence_fill",
  "dictation",
  "mini_text",
  "correction",
  "self_check",
  "match_pairs",
  "assemble_word",
  "tap_find_error",
  "copy",
  "visual_memory",
] as const;

export const SKILL_LABELS: Record<string, string> = {
  S1: "Үсэг авиаг зөв таних",
  S2: "Үгийг зөв бичих",
  S3: "Урт богино, Балархай эгшгийг зөв ялгах",
  S4: "Гийгүүлэгчийг зөв ялгах",
  S5: "Залгаварыг зөв залгах",
  S6: "Өгүүлбэрийн тэмдэглэгээг зөв хийх",
  S7: "Сонсоод зөв буулгах",
  S8: "Алдаагаа зөв таних",
};

export const LEVEL_LABELS: Record<string, string> = {
  M0: "M0 — Суурь",
  M1: "M1 — Эхлэл",
  M2: "M2 — Хөгжил",
  M3: "M3 — Чадвар",
  M4: "M4 — Ахисан",
  M5: "M5 — Эзэмшсэн",
};

export const GRADE_LABELS: Record<string, string> = {
  G1: "1-р анги",
  G2: "2-р анги",
  G3: "3-р анги",
  G4: "4-р анги",
};

export const ERROR_LABELS: Record<string, string> = {
  A1: "Авиа андуурах",
  A2: "Ижил төстэй үсэг андуурах",
  A3: "Үеийн бүтэц алдах",
  B1: "Үсэг орхих",
  B2: "Үсэг илүү бичих",
  B3: "Үсгийн байрлал солих",
  B4: "Үгийн хэсэг орхих",
  C1: "Урт эгшиг орхиж бичих",
  C2: "Урт эгшиг илүү бичих",
  C3: "Эгшиг андуурч бичих",
  C4: "Балархай эгшиг орхиж бичих",
  C5: "Балархай эгшиг илүүдэх",
  C6: "Эгшгийн зохицох ёсны алдаа",
  D1: "Гийгүүлэгч орхиж бичих",
  D2: "Гийгүүлэгч илүү бичих",
  D3: "Гийгүүлэгч андуурах",
  D4: "Давхар гийгүүлэгчийн алдаа",
  D5: "Үгийн төгсгөлийн гийгүүлэгчийн алдаа",
  E1: "Залгавар орхиж бичих",
  E2: "Буруу залгавар сонгож бичих",
  E3: "Эр/эм үгийн залгаврын алдаа",
  E4: "Тийн ялгалын алдаа",
  E5: "Олон тоо харьяаллын алдаа",
  E6: "Үйл үгийн хувиллын алдаа",
  E7: "Залгаврын бичлэгийн алдаа",
  F1: "Язгуур үгийн хэлбэрийн алдаа",
  F2: "Нийлмэл үгийн алдаа",
  F3: "Үгийн аймагтай холбоотой хэлбэрийн алдаа",
  F4: "Давталттай буруу хэвшил",
  G1: "Том үсгийн алдаа",
  G2: "Цэг орхигдол",
  G3: "Асуулт/анхааруулах тэмдгийн алдаа",
  G4: "Таслалын алдаа",
  G5: "Өгүүлбэрийн хил заагийн алдаа",
  H1: "Сонсгол тасарсан алдаа",
  H2: "Хурдны алдаа",
  H3: "Анхаарлын хэлбэлзлийн алдаа",
  H4: "Өөрийгөө шалгаагүй алдаа",
};

export const ERROR_GROUPS: {
  key: string;
  label: string;
  description: string;
  codes: string[];
}[] = [
  {
    key: "A",
    label: "A бүлэг",
    description: "Үсэг авиаг андуурах алдаа",
    codes: ["A1", "A2", "A3"],
  },
  {
    key: "B",
    label: "B бүлэг",
    description: "Үсэг орхих, илүү бичих, үсгийн байрыг солих",
    codes: ["B1", "B2", "B3", "B4"],
  },
  {
    key: "C",
    label: "C бүлэг",
    description: "Эгшгийн алдаа",
    codes: ["C1", "C2", "C3", "C4", "C5", "C6"],
  },
  {
    key: "D",
    label: "D бүлэг",
    description: "Гийгүүлэгчийн алдаа",
    codes: ["D1", "D2", "D3", "D4", "D5"],
  },
  {
    key: "E",
    label: "E бүлэг",
    description: "Залгавар, нөхцөлийн алдаа",
    codes: ["E1", "E2", "E3", "E4", "E5", "E6", "E7"],
  },
  {
    key: "F",
    label: "F бүлэг",
    description: "Үгийн хэлбэр ба бүтцийн алдаа",
    codes: ["F1", "F2", "F3", "F4"],
  },
  {
    key: "G",
    label: "G бүлэг",
    description: "Өгүүлбэрийн цэг, таслал, тэмдэглэгээний алдаа",
    codes: ["G1", "G2", "G3", "G4", "G5"],
  },
  {
    key: "H",
    label: "H бүлэг",
    description: "Сонсголт, анхаарал, төвлөрлийн алдаа",
    codes: ["H1", "H2", "H3", "H4"],
  },
];

export const LESSON_SLOT_LABELS: Record<string, string> = {
  WARM_UP: "Бие халаалт",
  CORE: "Үндсэн",
  MIXED: "Холимог",
  END: "Төгсгөл",
};

export const INTERACTION_FORM_LABELS: Record<string, string> = {
  CHOOSE:     "Сонгох",
  FILL:       "Бөглөх",
  TRANSCRIBE: "Бичих",
  CORRECT:    "Засах",
  MATCH:      "Холбох",
  ASSEMBLE:   "Угсрах",
  TAP:        "Товших",
};

export const SKILLS = Object.keys(SKILL_LABELS);
export const LEVELS = Object.keys(LEVEL_LABELS);
export const ERROR_CODES = Object.keys(ERROR_LABELS);
export const LESSON_SLOTS = Object.keys(LESSON_SLOT_LABELS);

export const GRADE_CODES = ["G1", "G2", "G3", "G4"] as const;
