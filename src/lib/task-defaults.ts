export type OptionGroup =
  | "choice"
  | "fill"
  | "sentence_fill"
  | "dictation"
  | "mini_text"
  | "correction"
  | "self_check"
  | "match_pairs"
  | "assemble_word"
  | "tap_find_error";

export interface TaskBlueprint {
  primary_skill: string;
  secondary_skill?: string;
  level_target: string;
  error_targets: string[];
}

// Skill, level, and error defaults per task type derived from Task_Bank_Blueprint docs.
export const TASK_TYPE_BLUEPRINT: Record<string, TaskBlueprint> = {
  // G12
  TT_LISTEN_CHOOSE: {
    primary_skill: "S1",
    level_target: "M0",
    error_targets: ["A1"],
  },
  TT_LETTER_FILL: {
    primary_skill: "S1",
    level_target: "M0",
    error_targets: ["A2"],
  },
  TT_IMAGE_WORD_MATCH: {
    primary_skill: "S2",
    level_target: "M0",
    error_targets: ["B1"],
  },
  TT_COPY_WRITE: {
    primary_skill: "S2",
    level_target: "M0",
    error_targets: ["B3"],
  },
  TT_CHOOSE_CORRECT: {
    primary_skill: "S3",
    level_target: "M1",
    error_targets: ["C1"],
  },
  TT_FILL_WRITE: {
    primary_skill: "S3",
    level_target: "M1",
    error_targets: ["C1", "C2"],
  },
  TT_MISSING_LETTER: {
    primary_skill: "S4",
    level_target: "M1",
    error_targets: ["C4"],
  },
  TT_WORD_SET_DICTATION: {
    primary_skill: "S7",
    level_target: "M1",
    error_targets: ["H1", "B1"],
  },
  TT_CAPITAL_PUNCTUATION: {
    primary_skill: "S6",
    level_target: "M1",
    error_targets: ["G1", "G2"],
  },
  TT_SIMPLE_SUFFIX: {
    primary_skill: "S5",
    level_target: "M1",
    error_targets: ["E1", "E2"],
  },
  TT_FIND_ERROR: {
    primary_skill: "S8",
    level_target: "M1",
    error_targets: ["H4"],
  },
  TT_SELF_CHECK: {
    primary_skill: "S8",
    level_target: "M1",
    error_targets: ["H4"],
  },
  TT_TWO_WORD_DICTATION: {
    primary_skill: "S7",
    level_target: "M1",
    error_targets: ["H1"],
  },
  TT_WORD_ENDING: {
    primary_skill: "S2",
    level_target: "M1",
    error_targets: ["D5"],
  },
  TT_SENTENCE_FILL: {
    primary_skill: "S6",
    level_target: "M1",
    error_targets: ["G2"],
  },
  TT_MIXED_REVIEW: {
    primary_skill: "S2",
    secondary_skill: "S3",
    level_target: "M1",
    error_targets: ["B1", "C1"],
  },
  // G24
  TT_WORD_FORM_CHOOSE: {
    primary_skill: "S2",
    level_target: "M1",
    error_targets: ["B1", "B3"],
  },
  TT_LONG_VOWEL_FILL: {
    primary_skill: "S3",
    level_target: "M1",
    error_targets: ["C1"],
  },
  TT_REDUCED_VOWEL: {
    primary_skill: "S4",
    level_target: "M1",
    error_targets: ["C4"],
  },
  TT_SUFFIX_CHOOSE: {
    primary_skill: "S5",
    level_target: "M2",
    error_targets: ["E2"],
  },
  TT_SHORT_SENTENCE_DICTATION: {
    primary_skill: "S7",
    level_target: "M2",
    error_targets: ["H1", "B4"],
  },
  TT_FIX_ERROR: {
    primary_skill: "S8",
    level_target: "M2",
    error_targets: ["H4"],
  },
  TT_CONSONANT_CONFUSION: {
    primary_skill: "S1",
    level_target: "M1",
    error_targets: ["D3"],
  },
  TT_WORD_FORM_FIX: {
    primary_skill: "S2",
    level_target: "M2",
    error_targets: [],
  },
  TT_LONG_VOWEL_IN_SENTENCE: {
    primary_skill: "S3",
    level_target: "M2",
    error_targets: ["C1", "C2"],
  },
  TT_REDUCED_VOWEL_IN_SENTENCE: {
    primary_skill: "S4",
    level_target: "M2",
    error_targets: ["C4", "C5"],
  },
  TT_CASE_SUFFIX: {
    primary_skill: "S5",
    level_target: "M2",
    error_targets: ["E2"],
  },
  TT_BASIC_COMMA: {
    primary_skill: "S6",
    level_target: "M2",
    error_targets: ["G1", "G2"],
  },
  TT_TWO_SENTENCE_DICTATION: {
    primary_skill: "S7",
    level_target: "M2",
    error_targets: ["H1"],
  },
  TT_FIND_OMITTED_LETTER: {
    primary_skill: "S8",
    level_target: "M2",
    error_targets: ["B1"],
  },
  TT_MIXED_WORD_SET: {
    primary_skill: "S2",
    secondary_skill: "S3",
    level_target: "M2",
    error_targets: ["B1", "C1"],
  },
  TT_SUFFIX_WRITE: {
    primary_skill: "S5",
    level_target: "M2",
    error_targets: ["E7"],
  },
  TT_SENTENCE_BOUNDARY: {
    primary_skill: "S6",
    level_target: "M2",
    error_targets: ["G2"],
  },
  TT_MINI_TEXT_DICTATION: {
    primary_skill: "S7",
    level_target: "M3",
    error_targets: ["H1", "B4"],
  },
  TT_OWN_WRITING_CORRECTION: {
    primary_skill: "S8",
    level_target: "M3",
    error_targets: ["H4"],
  },
  TT_LONG_VOWEL_CHALLENGE: {
    primary_skill: "S3",
    level_target: "M3",
    error_targets: ["C1", "C2"],
  },
  TT_COMPOUND_SUFFIX: {
    primary_skill: "S5",
    level_target: "M3",
    error_targets: ["E2", "E7"],
  },
  TT_MIXED_CHECKPOINT: {
    primary_skill: "S2",
    secondary_skill: "S7",
    level_target: "M2",
    error_targets: [],
  },
  TT_EXPLAINED_CORRECTION: {
    primary_skill: "S8",
    level_target: "M3",
    error_targets: ["H4"],
  },
  // v3 interaction forms
  TT_MATCH_PAIRS: {
    primary_skill: "S1",
    level_target: "M0",
    error_targets: ["A2"],
  },
  TT_ASSEMBLE_WORD: {
    primary_skill: "S1",
    level_target: "M0",
    error_targets: ["A3", "B3"],
  },
  TT_TAP_FIND_ERROR: {
    primary_skill: "S8",
    level_target: "M2",
    error_targets: ["H4"],
  },
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
  TT_LISTEN_CHOOSE: {
    label: "Сонголтын дасгал",
    shortLabel: "G12-001",
    description: "Аудио сонсоод зөв үгийг сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G12",
  },
  TT_LETTER_FILL: {
    label: "Үсэг нөхөх",
    shortLabel: "G12-002",
    description: "Хоосон зайнд үсгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G12",
  },
  TT_IMAGE_WORD_MATCH: {
    label: "Зургийг хараад зөв үгийг сонгох",
    shortLabel: "G12-003",
    description: "Зургийг хараад тохирох үгийг сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G12",
  },
  TT_COPY_WRITE: {
    label: "Хуулж бичих",
    shortLabel: "G12-004",
    description: "Өгсөн текстийг хуулж бичих",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G12",
  },
  TT_CHOOSE_CORRECT: {
    label: "Зөвийг сонгох",
    shortLabel: "G12-005",
    description: "Хувилбаруудаас зөвийг нь сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G12",
  },
  TT_FILL_WRITE: {
    label: "Нөхөж бичих",
    shortLabel: "G12-006",
    description: "Эгшгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G12",
  },
  TT_MISSING_LETTER: {
    label: "Дутуу үсэг",
    shortLabel: "G12-007",
    description: "Аудиог сонсоод балархай эгшгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G12",
  },
  TT_WORD_SET_DICTATION: {
    label: "Үгийн багц диктант",
    shortLabel: "G12-008",
    description: "Сонсоод дарааллаар бичих",
    groups: ["dictation"],
    category: "dictation",
    gradeBand: "G12",
  },
  TT_CAPITAL_PUNCTUATION: {
    label: "Том үсэг, цэг",
    shortLabel: "G12-009",
    description: "Өгүүлбэртийн том үсэг, цэгийн алдааг засах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "both",
  },
  TT_SIMPLE_SUFFIX: {
    label: "Энгийн залгавар",
    shortLabel: "G12-010",
    description: "Түгээмэл залгаврын зөв хэлбэрийг сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G12",
  },
  TT_FIND_ERROR: {
    label: "Алдаа олох",
    shortLabel: "G12-011",
    description: "Алдаатай үгийг олж засах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G12",
  },
  TT_SELF_CHECK: {
    label: "Өөрийгөө шалгах",
    shortLabel: "G12-012",
    description: "Зөв хариутай харьцуулан өөрийн хариуг шалгах",
    groups: ["self_check"],
    category: "self_check",
    gradeBand: "G12",
  },
  TT_TWO_WORD_DICTATION: {
    label: "2 үгийн диктант",
    shortLabel: "G12-013",
    description: "Үгсийг сонсоод дарааллаар бичих",
    groups: ["dictation"],
    category: "dictation",
    gradeBand: "G12",
  },
  TT_WORD_ENDING: {
    label: "Үгийн төгсгөл",
    shortLabel: "G12-014",
    description: "Үгийн төгсгөлийн дутуу үсгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G12",
  },
  TT_SENTENCE_FILL: {
    label: "Өгүүлбэр нөхөх",
    shortLabel: "G12-015",
    description: "Өгүүлбэрийн дутууг нөхнө",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    gradeBand: "G12",
  },
  TT_MIXED_REVIEW: {
    label: "Холимог давталт",
    shortLabel: "G12-016",
    description: "Үг ба эгшгийг хамт шалгах",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G12",
  },
  // ── G24 ──────────────────────────────────────────────────────────────────────
  TT_WORD_FORM_CHOOSE: {
    label: "Үгийн зөв хэлбэр сонгох",
    shortLabel: "G24-001",
    description: "Зөв бичсэнийг сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G24",
  },
  TT_LONG_VOWEL_FILL: {
    label: "Урт эгшиг нөхөх",
    shortLabel: "G24-002",
    description: "Урт эгшгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G24",
  },
  TT_REDUCED_VOWEL: {
    label: "Балархай эгшиг",
    shortLabel: "G24-003",
    description: "Балархай эгшгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G24",
  },
  TT_SUFFIX_CHOOSE: {
    label: "Залгавар сонгох",
    shortLabel: "G24-004",
    description: "Зохих залгаврыг сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G24",
  },
  TT_SHORT_SENTENCE_DICTATION: {
    label: "Богино өгүүлбэрийн диктант",
    shortLabel: "G24-006",
    description: "Богино өгүүлбэр сонсоод бичих",
    groups: ["dictation"],
    category: "dictation",
    gradeBand: "G24",
  },
  TT_FIX_ERROR: {
    label: "Алдаа засах",
    shortLabel: "G24-007",
    description: "Алдаатай үгийг олж засах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G24",
  },
  TT_CONSONANT_CONFUSION: {
    label: "Гийгүүлэгч андуурал",
    shortLabel: "G24-008",
    description: "Төстэй гийгүүлэгчийг ялгах",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G24",
  },
  TT_WORD_FORM_FIX: {
    label: "Үгийн хэлбэр засах",
    shortLabel: "G24-009",
    description: "Буруу үгийг засах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G24",
  },
  TT_LONG_VOWEL_IN_SENTENCE: {
    label: "Урт эгшиг өгүүлбэрт",
    shortLabel: "G24-010",
    description: "Өгүүлбэр доторх урт эгшгийг ялгах",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    gradeBand: "G24",
  },
  TT_REDUCED_VOWEL_IN_SENTENCE: {
    label: "Балархай эгшиг өгүүлбэрт",
    shortLabel: "G24-011",
    description: "Өгүүлбэрт балархай эгшгийг нөхөх",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    gradeBand: "G24",
  },
  TT_CASE_SUFFIX: {
    label: "Тийн ялгал",
    shortLabel: "G24-012",
    description: "Тийн ялгалын зөв хэлбэрийг сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G24",
  },
  TT_BASIC_COMMA: {
    label: "Таслалын анхан хэрэглээ",
    shortLabel: "G24-013",
    description: "Таслалыг зөв байрлуулах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G24",
  },
  TT_TWO_SENTENCE_DICTATION: {
    label: "2 өгүүлбэрийн диктант",
    shortLabel: "G24-014",
    description: "Хоёр өгүүлбэр сонсоод бичих",
    groups: ["dictation"],
    category: "dictation",
    gradeBand: "G24",
  },
  TT_FIND_OMITTED_LETTER: {
    label: "Үсэг орхигдол олох",
    shortLabel: "G24-015",
    description: "Орхигдсон үсгийг олж засах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G24",
  },
  TT_MIXED_WORD_SET: {
    label: "Холимог үгийн багц",
    shortLabel: "G24-016",
    description: "Үг+эгшгийн хосолсон хэлбэрийг сонгох",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G24",
  },
  TT_SUFFIX_WRITE: {
    label: "Залгавар бичлэг",
    shortLabel: "G24-017",
    description: "Залгаврыг зөв нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G24",
  },
  TT_SENTENCE_BOUNDARY: {
    label: "Өгүүлбэрийн хил зааг",
    shortLabel: "G24-018",
    description: "Өгүүлбэрүүдийг зөв салгах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G24",
  },
  TT_MINI_TEXT_DICTATION: {
    label: "Мини эхийн диктант",
    shortLabel: "G24-019",
    description: "2–3 өгүүлбэртэй эхийг сонсоод бичих",
    groups: ["mini_text"],
    category: "mini_text",
    gradeBand: "G24",
  },
  TT_OWN_WRITING_CORRECTION: {
    label: "Өөрийн бичвэр засвар",
    shortLabel: "G24-020",
    description: "Өөрийн бичвэрийг шалгаж засах",
    groups: ["self_check"],
    category: "self_check",
    gradeBand: "G24",
  },
  TT_LONG_VOWEL_CHALLENGE: {
    label: "Урт эгшиг challenge",
    shortLabel: "G24-021",
    description: "Давхардсан урт эгшгийг ялгах",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G24",
  },
  TT_COMPOUND_SUFFIX: {
    label: "Нийлмэл залгавар",
    shortLabel: "G24-022",
    description: "Нийлмэл залгаврыг нөхөх",
    groups: ["fill"],
    category: "fill",
    gradeBand: "G24",
  },
  TT_MIXED_CHECKPOINT: {
    label: "Холимог checkpoint",
    shortLabel: "G24-023",
    description: "Долоо хоногийн холимог шалгалт",
    groups: ["choice"],
    category: "choice",
    gradeBand: "G24",
  },
  TT_EXPLAINED_CORRECTION: {
    label: "Тайлбартай засвар",
    shortLabel: "G24-024",
    description: "Алдааны шалтгааныг тайлбарлаж засах",
    groups: ["correction"],
    category: "correction",
    gradeBand: "G24",
  },
  // v3 interaction forms
  TT_MATCH_PAIRS: {
    label: "Холбож тааруулах",
    shortLabel: "v3-001",
    description: "Зүүн баганы зүйлийг баруун баганы зүйлтэй холбох",
    groups: ["match_pairs"],
    category: "match_pairs",
    gradeBand: "both",
  },
  TT_ASSEMBLE_WORD: {
    label: "Угсрах",
    shortLabel: "v3-002",
    description: "Холилдсон үсэг/үеүдийг зөв дарааллаар угсрах",
    groups: ["assemble_word"],
    category: "assemble_word",
    gradeBand: "both",
  },
  TT_TAP_FIND_ERROR: {
    label: "Алдаа олж товших",
    shortLabel: "v3-003",
    description: "Өгүүлбэрийн алдаатай үгийг олж товших",
    groups: ["tap_find_error"],
    category: "tap_find_error",
    gradeBand: "both",
  },
};

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
] as const;

export const SKILL_LABELS: Record<string, string> = {
  S1: "Үсэг авиаг таних",
  S2: "Үг зөв бичих",
  S3: "Урт/богино эгшиг",
  S4: "Балархай эгшиг",
  S5: "Залгавар, нөхцөл",
  S6: "Өгүүлбэрийн тэмдэглэгээ",
  S7: "Цээжээр бичих",
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

// Maps UI band selector values to canonical grade codes sent to the backend
export const BAND_TO_GRADES: Record<string, string[]> = {
  G12: ["G1", "G2"],
  G24: ["G3", "G4"],
};

// Display labels for canonical per-grade codes stored in the DB
export const GRADE_LABELS: Record<string, string> = {
  G1: "1-р анги",
  G2: "2-р анги",
  G3: "3-р анги",
  G4: "4-р анги",
};

export const ERROR_LABELS: Record<string, string> = {
  // Үсэг авиаг андуурах алдаа
  A1: "Авиа андуурах",
  A2: "Үсэг солих",
  A3: "Үеийн бүтэц алдах",
  // B — Үсгийн орхигдол, илүүдэл, байрлалын алдаа
  B1: "Үсэг орхих",
  B2: "Үсэг илүү бичих",
  B3: "Үсгийн байрлал солих",
  B4: "Үгийн хэсэг орхих",
  // C — Эгшгийн алдаа
  C1: "Урт эгшиг орхих",
  C2: "Урт эгшиг илүүдэх",
  C3: "Эгшиг андуурах",
  C4: "Балархай эгшиг орхих",
  C5: "Балархай эгшиг илүүдэх",
  C6: "Эгшгийн зохицлын алдаа",
  // D — Гийгүүлэгчийн алдаа
  D1: "Гийгүүлэгч орхих",
  D2: "Гийгүүлэгч илүүдэх",
  D3: "Гийгүүлэгч андуурах",
  D4: "Давхар гийгүүлэгчийн алдаа",
  D5: "Үгийн төгсгөлийн гийгүүлэгчийн алдаа",
  // E — Залгавар, нөхцөлийн алдаа
  E1: "Залгавар орхигдол",
  E2: "Буруу залгавар сонголт",
  E3: "Эр/эм үгийн залгаврын алдаа",
  E4: "Тийн ялгалын алдаа",
  E5: "Олон тоо харьяаллын алдаа",
  E6: "Үйл үгийн хувиллын алдаа",
  E7: "Залгаврын бичлэгийн алдаа",
  // F — Үгийн хэлбэр ба бүтцийн алдаа
  F1: "Язгуур үгийн хэлбэрийн алдаа",
  F2: "Нийлмэл үгийн алдаа",
  F3: "Үгийн аймагтай холбоотой хэлбэрийн алдаа",
  F4: "Давталттай буруу хэвшил",
  // G — Өгүүлбэрийн тэмдэглэгээний алдаа
  G1: "Том үсгийн алдаа",
  G2: "Цэг орхигдол",
  G3: "Асуулт/анхааруулах тэмдгийн алдаа",
  G4: "Таслалын алдаа",
  G5: "Өгүүлбэрийн хил заагийн алдаа",
  // H — Сонсголт, анхаарал, тогтвортой байдлын алдаа
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

export const TASK_TYPES = Object.keys(TASK_TYPE_INFO);
export const SKILLS = Object.keys(SKILL_LABELS);
export const LEVELS = Object.keys(LEVEL_LABELS);
export const GRADE_BANDS = Object.keys(GRADE_BAND_LABELS);
export const ERROR_CODES = Object.keys(ERROR_LABELS);
export const LESSON_SLOTS = Object.keys(LESSON_SLOT_LABELS);

interface DefaultValues {
  difficulty: string;
  level_target: string;
  estimated_time_seconds: string;
  lesson_slot_fit: string;
}

export function computeDefaults(
  taskType: string,
  gradeBands: string[],
): DefaultValues {
  const isG24 = gradeBands.includes("G24");
  const info = TASK_TYPE_INFO[taskType];
  if (!info)
    return {
      difficulty: "1",
      level_target: "M0",
      estimated_time_seconds: "30",
      lesson_slot_fit: "CORE",
    };

  const group = info.groups[0];
  let difficulty: number, level: string, time: number, slot: string;

  switch (group) {
    case "choice":
      difficulty = isG24 ? 3 : 1;
      level = isG24 ? "M2" : "M0";
      time = 20;
      slot = "WARM_UP";
      break;
    case "fill":
    case "sentence_fill":
      difficulty = isG24 ? 3 : 2;
      level = isG24 ? "M2" : "M1";
      time = 45;
      slot = "CORE";
      break;
    case "dictation":
      difficulty = isG24 ? 3 : 2;
      level = isG24 ? "M2" : "M1";
      time = taskType === "TT_TWO_SENTENCE_DICTATION" ? 120 : 60;
      slot = "CORE";
      break;
    case "mini_text":
      difficulty = isG24 ? 3 : 2;
      level = isG24 ? "M3" : "M2";
      time = 120;
      slot = "CORE";
      break;
    case "correction":
      difficulty = isG24 ? 3 : 2;
      level = isG24 ? "M2" : "M1";
      time = 45;
      slot = "CORE";
      break;
    case "self_check":
      difficulty = isG24 ? 3 : 2;
      level = isG24 ? "M2" : "M1";
      time = 60;
      slot = "END";
      break;
    case "match_pairs":
      difficulty = 1;
      level = "M0";
      time = 40;
      slot = "WARM_UP";
      break;
    case "assemble_word":
      difficulty = 1;
      level = "M0";
      time = 35;
      slot = "WARM_UP";
      break;
    case "tap_find_error":
      difficulty = isG24 ? 2 : 2;
      level = "M2";
      time = 30;
      slot = "MIXED";
      break;
    default:
      difficulty = 2;
      level = "M1";
      time = 30;
      slot = "CORE";
  }

  return {
    difficulty: String(difficulty),
    level_target: level,
    estimated_time_seconds: String(time),
    lesson_slot_fit: slot,
  };
}

const CATEGORY_TO_INTERACTION_FORM: Record<string, string> = {
  choice: "CHOOSE",
  fill: "FILL",
  sentence_fill: "FILL",
  dictation: "TRANSCRIBE",
  mini_text: "TRANSCRIBE",
  correction: "CORRECT",
  self_check: "CORRECT",
  match_pairs: "MATCH",
  assemble_word: "ASSEMBLE",
  tap_find_error: "TAP",
};

export function deriveInteractionForm(taskType: string): string | null {
  const info = TASK_TYPE_INFO[taskType];
  if (!info) return null;
  return CATEGORY_TO_INTERACTION_FORM[info.category] ?? null;
}

export function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
