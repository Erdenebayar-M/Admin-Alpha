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

export const TASK_TYPE_BLUEPRINT: Record<string, TaskBlueprint> = {
  // S1 — Үсэг-авиаг зөв таних
  TT_LISTEN_CHOOSE:             { primary_skill: "S1", level_target: "M0", error_targets: ["B1"] },
  TT_LETTER_FILL:               { primary_skill: "S1", level_target: "M0", error_targets: ["B1"] },
  TT_MISSING_LETTER:            { primary_skill: "S1", level_target: "M1", error_targets: ["B1"] },
  TT_CONSONANT_CONFUSION:       { primary_skill: "S1", level_target: "M2", error_targets: ["D3"] },
  TT_MATCH_PAIRS:               { primary_skill: "S1", level_target: "M0", error_targets: ["A2"] },
  TT_ASSEMBLE_WORD:             { primary_skill: "S1", level_target: "M0", error_targets: ["A3", "B3"] },
  // S2 — Үгийг зөв бичих
  TT_IMAGE_WORD_MATCH:          { primary_skill: "S2", level_target: "M0", error_targets: ["B1"] },
  TT_COPY_WRITE:                { primary_skill: "S2", level_target: "M0", error_targets: ["B1"] },
  TT_CHOOSE_CORRECT:            { primary_skill: "S2", level_target: "M1", error_targets: ["B1"] },
  TT_FILL_WRITE:                { primary_skill: "S2", level_target: "M1", error_targets: ["B1"] },
  TT_SENTENCE_FILL:             { primary_skill: "S2", level_target: "M1", error_targets: ["B1"] },
  TT_MIXED_REVIEW:              { primary_skill: "S2", level_target: "M1", error_targets: ["B1", "E1"] },
  TT_FIND_OMITTED_LETTER:       { primary_skill: "S2", level_target: "M2", error_targets: ["B1"] },
  TT_MIXED_WORD_SET:            { primary_skill: "S2", level_target: "M2", error_targets: ["C1", "E2"] },
  TT_MIXED_CHECKPOINT:          { primary_skill: "S2", level_target: "M3", error_targets: ["C1", "E2", "G2"] },
  // S3 — Урт эгшиг
  TT_LONG_VOWEL_FILL:           { primary_skill: "S3", level_target: "M2", error_targets: ["C1", "C2"] },
  TT_LONG_VOWEL_IN_SENTENCE:    { primary_skill: "S3", level_target: "M2", error_targets: ["C1", "C2"] },
  TT_LONG_VOWEL_CHALLENGE:      { primary_skill: "S3", level_target: "M3", error_targets: ["C1", "C2"] },
  // S4 — Балархай эгшиг
  TT_REDUCED_VOWEL:             { primary_skill: "S4", level_target: "M2", error_targets: ["C4"] },
  TT_REDUCED_VOWEL_IN_SENTENCE: { primary_skill: "S4", level_target: "M2", error_targets: ["C4"] },
  // S5 — Залгаварыг зөв залгах
  TT_SIMPLE_SUFFIX:             { primary_skill: "S5", level_target: "M1", error_targets: ["E1", "E2"] },
  TT_WORD_ENDING:               { primary_skill: "S5", level_target: "M1", error_targets: ["E2"] },
  TT_WORD_FORM_CHOOSE:          { primary_skill: "S5", level_target: "M2", error_targets: ["E2"] },
  TT_SUFFIX_CHOOSE:             { primary_skill: "S5", level_target: "M2", error_targets: ["E2"] },
  TT_CASE_SUFFIX:               { primary_skill: "S5", level_target: "M2", error_targets: ["E2"] },
  TT_WORD_FORM_FIX:             { primary_skill: "S5", level_target: "M2", error_targets: ["E2"] },
  TT_SUFFIX_WRITE:              { primary_skill: "S5", level_target: "M3", error_targets: ["E2", "E7"] },
  TT_COMPOUND_SUFFIX:           { primary_skill: "S5", level_target: "M3", error_targets: ["E2", "E7"] },
  // S6 — Өгүүлбэрийн тэмдэглэгээ
  TT_CAPITAL_PUNCTUATION:       { primary_skill: "S6", level_target: "M1", error_targets: ["G1", "G2"] },
  TT_BASIC_COMMA:               { primary_skill: "S6", level_target: "M2", error_targets: ["G2"] },
  TT_SENTENCE_BOUNDARY:         { primary_skill: "S6", level_target: "M2", error_targets: ["G1", "G2"] },
  // S7 — Цээж бичиг
  TT_WORD_SET_DICTATION:        { primary_skill: "S7", level_target: "M1", error_targets: ["B1"] },
  TT_TWO_WORD_DICTATION:        { primary_skill: "S7", level_target: "M1", error_targets: ["B1"] },
  TT_SHORT_SENTENCE_DICTATION:  { primary_skill: "S7", level_target: "M2", error_targets: ["C1"] },
  TT_TWO_SENTENCE_DICTATION:    { primary_skill: "S7", level_target: "M2", error_targets: ["C1"] },
  TT_MINI_TEXT_DICTATION:       { primary_skill: "S7", level_target: "M3", error_targets: ["C1", "C4", "E1"] },
  // S8 — Алдаагаа зөв таних / засах
  TT_FIND_ERROR:                { primary_skill: "S8", level_target: "M1", error_targets: ["B1"] },
  TT_FIX_ERROR:                 { primary_skill: "S8", level_target: "M2", error_targets: ["C1", "E2"] },
  TT_SELF_CHECK:                { primary_skill: "S8", level_target: "M1", error_targets: ["H4"] },
  TT_OWN_WRITING_CORRECTION:    { primary_skill: "S8", level_target: "M2", error_targets: ["H4"] },
  TT_TAP_FIND_ERROR:            { primary_skill: "S8", level_target: "M2", error_targets: ["H4"] },
  TT_EXPLAINED_CORRECTION:      { primary_skill: "S8", level_target: "M3", error_targets: ["C1", "E2"] },
};

export interface TaskTypeInfo {
  label: string;
  shortLabel: string;
  description: string;
  groups: OptionGroup[];
  category: string;
  grades: string[];
}

export const TASK_TYPE_INFO: Record<string, TaskTypeInfo> = {
  // S1 — Үсэг-авиаг зөв таних
  TT_LISTEN_CHOOSE: {
    label: "Сонсож сонгох",
    shortLabel: "1.1",
    description: "Аудио уншиж сонссон үгийг 3 сонголтоос ялгах",
    groups: ["choice"],
    category: "choice",
    grades: ["G1", "G2"],
  },
  TT_LETTER_FILL: {
    label: "Үсэг нөхөх",
    shortLabel: "1.2",
    description: "Үгийн дотор 1 үсгийг blank болгож тэмдэглэх",
    groups: ["fill"],
    category: "fill",
    grades: ["G1", "G2"],
  },
  TT_MISSING_LETTER: {
    label: "Дутуу үсэг",
    shortLabel: "1.3",
    description: "Үгээс нэг үсэг орхигдсон байх",
    groups: ["fill"],
    category: "fill",
    grades: ["G1", "G2"],
  },
  TT_CONSONANT_CONFUSION: {
    label: "Гийгүүлэгч андуурал",
    shortLabel: "1.4",
    description: "Ойролцоо дуудлагатай гийгүүлэгчийг ялгах",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_MATCH_PAIRS: {
    label: "Холбож тааруулах",
    shortLabel: "1.5",
    description: "Зүүн баганад үсэг/дуу, баруун баганад зураг/үг холбох",
    groups: ["match_pairs"],
    category: "match_pairs",
    grades: ["G1", "G2", "G3"],
  },
  TT_ASSEMBLE_WORD: {
    label: "Угсрах (үсэг/үе)",
    shortLabel: "1.6",
    description: "Холимог дарааллыг зөв болгох",
    groups: ["assemble_word"],
    category: "assemble_word",
    grades: ["G1", "G2"],
  },
  // S2 — Үгийг зөв бичих
  TT_IMAGE_WORD_MATCH: {
    label: "Зураг-үг тааруулах",
    shortLabel: "2.1",
    description: "Зурагт харагдаж буй биетийн зөв нэрийг 3 сонголтоос сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G1", "G2"],
  },
  TT_COPY_WRITE: {
    label: "Хуулж бичих",
    shortLabel: "2.2",
    description: "Богино үг эсвэл өгүүлбэрийг яг хуулж бичүүлэх",
    groups: ["correction"],
    category: "correction",
    grades: ["G1", "G2"],
  },
  TT_CHOOSE_CORRECT: {
    label: "Зөвийг сонгох",
    shortLabel: "2.3",
    description: "Үгийн 3 бичлэгээс зөвийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G1", "G2"],
  },
  TT_FILL_WRITE: {
    label: "Нөхөж бичих",
    shortLabel: "2.4",
    description: "Өгүүлбэр эсвэл хэллэгт дутуу үгийг бичих",
    groups: ["fill"],
    category: "fill",
    grades: ["G1", "G2"],
  },
  TT_SENTENCE_FILL: {
    label: "Өгүүлбэр нөхөх",
    shortLabel: "2.5",
    description: "4–7 үгт өгүүлбэрт нэг үгийг blank болгох",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    grades: ["G1", "G2"],
  },
  TT_MIXED_REVIEW: {
    label: "Холимог давталт",
    shortLabel: "2.6",
    description: "Өмнө үзсэн төрөл бүрийн алдааг хольж шалгах сонголтот даалгавар",
    groups: ["choice"],
    category: "choice",
    grades: ["G1", "G2"],
  },
  TT_FIND_OMITTED_LETTER: {
    label: "Үсэг орхигдол олох",
    shortLabel: "2.7",
    description: "Үгийн дотор үсэг орхигдсон — орхигдсон үсгийг нөхөж зөв үгийг бичнэ",
    groups: ["correction"],
    category: "correction",
    grades: ["G2", "G3"],
  },
  TT_MIXED_WORD_SET: {
    label: "Холимог үгийн багц",
    shortLabel: "2.8",
    description: "Өөр өөр алдааны төрлийг хольсон сонголтот даалгавар",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_MIXED_CHECKPOINT: {
    label: "Холимог checkpoint",
    shortLabel: "2.9",
    description: "Checkpoint-д ашиглах олон скиллийг хольсон сонголтот даалгавар",
    groups: ["choice"],
    category: "choice",
    grades: ["G3", "G4"],
  },
  // S3 — Урт эгшиг
  TT_LONG_VOWEL_FILL: {
    label: "Урт эгшиг нөхөх",
    shortLabel: "3.1",
    description: "Үгэнд урт эгшгийн нэг үсгийг орхих",
    groups: ["fill"],
    category: "fill",
    grades: ["G2", "G3"],
  },
  TT_LONG_VOWEL_IN_SENTENCE: {
    label: "Урт эгшиг өгүүлбэрт",
    shortLabel: "3.2",
    description: "4–8 үгт өгүүлбэр, урт эгшигтэй нэг зорилтот үг blank",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    grades: ["G2", "G3"],
  },
  TT_LONG_VOWEL_CHALLENGE: {
    label: "Урт эгшиг challenge",
    shortLabel: "3.3",
    description: "Урт эгшгийн challenge: ойролцоо урт/богино эгшгийн хосыг ялгах",
    groups: ["choice"],
    category: "choice",
    grades: ["G3", "G4"],
  },
  // S4 — Балархай эгшиг
  TT_REDUCED_VOWEL: {
    label: "Балархай эгшиг",
    shortLabel: "4.1",
    description: "Балархай эгшгийг (э/е, ө/о) нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G2", "G3"],
  },
  TT_REDUCED_VOWEL_IN_SENTENCE: {
    label: "Балархай эгшиг өгүүлбэрт",
    shortLabel: "4.2",
    description: "4–8 үгт өгүүлбэр, балархай эгшигтэй нэг зорилтот үг blank",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    grades: ["G2", "G3"],
  },
  // S5 — Залгаварыг зөв залгах
  TT_SIMPLE_SUFFIX: {
    label: "Энгийн залгавар",
    shortLabel: "5.1",
    description: "3–6 үгт өгүүлбэр, нэг үгийн залгавар сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G1", "G2"],
  },
  TT_WORD_ENDING: {
    label: "Үгийн төгсгөл",
    shortLabel: "5.2",
    description: "Үгийн төгсгөлийн үсэг/залгавар дутуу",
    groups: ["fill"],
    category: "fill",
    grades: ["G1", "G2"],
  },
  TT_WORD_FORM_CHOOSE: {
    label: "Үгийн зөв хэлбэр сонгох",
    shortLabel: "5.3",
    description: "Өгүүлбэр доторх үгийн зөв морфологийн хэлбэрийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_SUFFIX_CHOOSE: {
    label: "Залгавар сонгох",
    shortLabel: "5.4",
    description: "Өгүүлбэрт зөв залгаврыг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_CASE_SUFFIX: {
    label: "Тийн ялгал",
    shortLabel: "5.5",
    description: "Тийн ялгалын зөв нөхцөлийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_WORD_FORM_FIX: {
    label: "Үгийн хэлбэр засах",
    shortLabel: "5.6",
    description: "Үгийн морфологийн буруу хэлбэрийг зөв болгох",
    groups: ["correction"],
    category: "correction",
    grades: ["G2", "G3"],
  },
  TT_SUFFIX_WRITE: {
    label: "Залгавар бичлэг",
    shortLabel: "5.7",
    description: "Үгийн залгаврыг өөрөө бичих",
    groups: ["fill"],
    category: "fill",
    grades: ["G3", "G4"],
  },
  TT_COMPOUND_SUFFIX: {
    label: "Нийлмэл залгавар",
    shortLabel: "5.8",
    description: "Олон давхар залгавартай үгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G3", "G4"],
  },
  // S6 — Өгүүлбэрийн тэмдэглэгээ
  TT_CAPITAL_PUNCTUATION: {
    label: "Том үсэг, цэг",
    shortLabel: "6.1",
    description: "3–5 үгт өгүүлбэр — том үсэг + цэгийн алдааг засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G1", "G2"],
  },
  TT_BASIC_COMMA: {
    label: "Таслалын анхан хэрэглээ",
    shortLabel: "6.2",
    description: "Таслал орхигдсон/буруу байрласан өгүүлбэрийг засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G2", "G3"],
  },
  TT_SENTENCE_BOUNDARY: {
    label: "Өгүүлбэрийн хил зааг",
    shortLabel: "6.3",
    description: "Холбоо өгүүлбэрийг зөв хил зааглах (том үсэг + цэг)",
    groups: ["correction"],
    category: "correction",
    grades: ["G2", "G3"],
  },
  // S7 — Цээж бичиг
  TT_WORD_SET_DICTATION: {
    label: "Үгийн багц диктант",
    shortLabel: "7.1",
    description: "3 богино үг (2–5 үсэг, 1–2 үетэй) сонсоод бичих",
    groups: ["dictation"],
    category: "dictation",
    grades: ["G1", "G2"],
  },
  TT_TWO_WORD_DICTATION: {
    label: "2 үгийн диктант",
    shortLabel: "7.2",
    description: "Яг 2 богино үг сонсоод бичих",
    groups: ["dictation"],
    category: "dictation",
    grades: ["G1", "G2"],
  },
  TT_SHORT_SENTENCE_DICTATION: {
    label: "Богино өгүүлбэрийн диктант",
    shortLabel: "7.3",
    description: "3–6 үгт нэг богино өгүүлбэр сонсоод бичих",
    groups: ["dictation"],
    category: "dictation",
    grades: ["G2", "G3"],
  },
  TT_TWO_SENTENCE_DICTATION: {
    label: "2 өгүүлбэрийн диктант",
    shortLabel: "7.4",
    description: "Яг 2 богино өгүүлбэр сонсоод бичих",
    groups: ["dictation"],
    category: "dictation",
    grades: ["G2", "G3"],
  },
  TT_MINI_TEXT_DICTATION: {
    label: "Мини эхийн диктант",
    shortLabel: "7.5",
    description: "2–3 өгүүлбэрт жижиг эх сонсоод бичих",
    groups: ["mini_text"],
    category: "mini_text",
    grades: ["G3", "G4"],
  },
  // S8 — Алдаагаа зөв таних / засах
  TT_FIND_ERROR: {
    label: "Алдаа олох",
    shortLabel: "8.1",
    description: "Богино өгүүлбэрт нэг алдаатай үгийг олж засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G1", "G2"],
  },
  TT_FIX_ERROR: {
    label: "Алдаа засах",
    shortLabel: "8.2",
    description: "Өгүүлбэрт нэг алдаа — засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G2", "G3"],
  },
  TT_SELF_CHECK: {
    label: "Өөрийгөө шалгах",
    shortLabel: "8.3",
    description: "Өөрийн хариуг загвар хариутай харьцуулан шалгах",
    groups: ["self_check"],
    category: "self_check",
    grades: ["G1", "G2"],
  },
  TT_OWN_WRITING_CORRECTION: {
    label: "Өөрийн бичвэр засвар",
    shortLabel: "8.4",
    description: "Өөрийн өмнөх бичвэрийг загвартай харьцуулна",
    groups: ["self_check"],
    category: "self_check",
    grades: ["G2", "G3"],
  },
  TT_TAP_FIND_ERROR: {
    label: "Алдаа олж товших",
    shortLabel: "8.5",
    description: "Өгүүлбэрт нэг алдаатай үг байрлуулах — товшиж олох",
    groups: ["tap_find_error"],
    category: "tap_find_error",
    grades: ["G2", "G3"],
  },
  TT_EXPLAINED_CORRECTION: {
    label: "Тайлбартай засвар",
    shortLabel: "8.6",
    description: "Алдааг засаад яагаад буруу/зөв болохыг тайлбарлах",
    groups: ["correction"],
    category: "correction",
    grades: ["G3", "G4"],
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

export const GRADE_LABELS: Record<string, string> = {
  G1: "1-р анги",
  G2: "2-р анги",
  G3: "3-р анги",
  G4: "4-р анги",
};

export const ERROR_LABELS: Record<string, string> = {
  A1: "Авиа андуурах",
  A2: "Үсэг солих",
  A3: "Үеийн бүтэц алдах",
  B1: "Үсэг орхих",
  B2: "Үсэг илүү бичих",
  B3: "Үсгийн байрлал солих",
  B4: "Үгийн хэсэг орхих",
  C1: "Урт эгшиг орхих",
  C2: "Урт эгшиг илүүдэх",
  C3: "Эгшиг андуурах",
  C4: "Балархай эгшиг орхих",
  C5: "Балархай эгшиг илүүдэх",
  C6: "Эгшгийн зохицлын алдаа",
  D1: "Гийгүүлэгч орхих",
  D2: "Гийгүүлэгч илүүдэх",
  D3: "Гийгүүлэгч андуурах",
  D4: "Давхар гийгүүлэгчийн алдаа",
  D5: "Үгийн төгсгөлийн гийгүүлэгчийн алдаа",
  E1: "Залгавар орхигдол",
  E2: "Буруу залгавар сонголт",
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
  { key: "A", label: "A бүлэг", description: "Үсэг авиаг андуурах алдаа", codes: ["A1", "A2", "A3"] },
  { key: "B", label: "B бүлэг", description: "Үсэг орхих, илүү бичих, үсгийн байрыг солих", codes: ["B1", "B2", "B3", "B4"] },
  { key: "C", label: "C бүлэг", description: "Эгшгийн алдаа", codes: ["C1", "C2", "C3", "C4", "C5", "C6"] },
  { key: "D", label: "D бүлэг", description: "Гийгүүлэгчийн алдаа", codes: ["D1", "D2", "D3", "D4", "D5"] },
  { key: "E", label: "E бүлэг", description: "Залгавар, нөхцөлийн алдаа", codes: ["E1", "E2", "E3", "E4", "E5", "E6", "E7"] },
  { key: "F", label: "F бүлэг", description: "Үгийн хэлбэр ба бүтцийн алдаа", codes: ["F1", "F2", "F3", "F4"] },
  { key: "G", label: "G бүлэг", description: "Өгүүлбэрийн цэг, таслал, тэмдэглэгээний алдаа", codes: ["G1", "G2", "G3", "G4", "G5"] },
  { key: "H", label: "H бүлэг", description: "Сонсголт, анхаарал, төвлөрлийн алдаа", codes: ["H1", "H2", "H3", "H4"] },
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
export const ERROR_CODES = Object.keys(ERROR_LABELS);
export const LESSON_SLOTS = Object.keys(LESSON_SLOT_LABELS);

export const GRADE_CODES = ["G1", "G2", "G3", "G4"] as const;

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
  const isG34 = gradeBands.some((g) => g === "G3" || g === "G4");
  const isG24 = gradeBands.some((g) => g === "G2" || g === "G3" || g === "G4");
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
      difficulty = isG34 ? 3 : isG24 ? 2 : 1;
      level = isG34 ? "M2" : isG24 ? "M1" : "M0";
      time = 20;
      slot = "WARM_UP";
      break;
    case "fill":
      difficulty = isG34 ? 3 : 2;
      level = isG34 ? "M2" : "M1";
      time = 45;
      slot = "CORE";
      break;
    case "sentence_fill":
      difficulty = isG34 ? 3 : 2;
      level = isG34 ? "M2" : "M1";
      time = 60;
      slot = "CORE";
      break;
    case "dictation":
      difficulty = isG34 ? 3 : 2;
      level = isG34 ? "M2" : "M1";
      time = 60;
      slot = "CORE";
      break;
    case "mini_text":
      difficulty = 4;
      level = "M3";
      time = 120;
      slot = "CORE";
      break;
    case "correction":
      difficulty = isG34 ? 3 : 2;
      level = isG34 ? "M2" : "M1";
      time = 45;
      slot = "CORE";
      break;
    case "self_check":
      difficulty = isG34 ? 3 : 2;
      level = isG34 ? "M2" : "M1";
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
      difficulty = 2;
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
  copy: "TRANSCRIBE",
  visual_memory: "TRANSCRIBE",
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

// image_side is set per-task in MatchPairsOptions; this map is kept for future per-type defaults
const MATCH_PAIRS_IMAGE_SIDE: Record<string, "left" | "right"> = {};

export function deriveImageSide(taskType: string): "left" | "right" | "none" {
  return MATCH_PAIRS_IMAGE_SIDE[taskType] ?? "none";
}
