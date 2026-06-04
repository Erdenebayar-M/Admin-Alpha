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
  | "tap_find_error"
  | "copy"
  | "visual_memory";

export interface TaskBlueprint {
  primary_skill: string;
  secondary_skill?: string;
  level_target: string;
  error_targets: string[];
}

export const TASK_TYPE_BLUEPRINT: Record<string, TaskBlueprint> = {
  // S1 — Үсэг-авиаг зөв таних
  TT_1_1: { primary_skill: "S1", level_target: "M0", error_targets: ["A1"] },
  TT_1_2: { primary_skill: "S1", level_target: "M0", error_targets: ["A1"] },
  TT_1_3: { primary_skill: "S1", level_target: "M0", error_targets: ["A2"] },
  TT_1_4: { primary_skill: "S1", level_target: "M0", error_targets: ["A3"] },
  TT_1_5: { primary_skill: "S1", level_target: "M0", error_targets: ["A2"] },
  // S2 — Үгийг зөв бичих
  TT_2_1: { primary_skill: "S2", level_target: "M1", error_targets: ["B1"] },
  TT_2_2: { primary_skill: "S2", level_target: "M1", error_targets: ["B3"] },
  TT_2_3: { primary_skill: "S2", level_target: "M1", error_targets: ["B1", "B2"] },
  TT_2_4: { primary_skill: "S2", level_target: "M1", error_targets: ["B1"] },
  TT_2_5: { primary_skill: "S2", level_target: "M2", error_targets: ["F2"] },
  TT_2_6: { primary_skill: "S2", level_target: "M3", error_targets: ["F1", "F3", "F4"] },
  // S3 — Урт/богино, балархай эгшиг
  TT_3_1: { primary_skill: "S3", level_target: "M1", error_targets: ["C1", "C2"] },
  TT_3_2: { primary_skill: "S3", level_target: "M1", error_targets: ["C4"] },
  TT_3_3: { primary_skill: "S3", level_target: "M1", error_targets: ["C1", "C3"] },
  TT_3_4: { primary_skill: "S3", level_target: "M2", error_targets: ["C6"] },
  TT_3_5: { primary_skill: "S3", level_target: "M2", error_targets: ["C5"] },
  // S4 — Гийгүүлэгчийг зөв ялгах
  TT_4_1: { primary_skill: "S4", level_target: "M1", error_targets: ["D3"] },
  TT_4_2: { primary_skill: "S4", level_target: "M2", error_targets: ["D5"] },
  TT_4_3: { primary_skill: "S4", level_target: "M2", error_targets: ["D4"] },
  TT_4_4: { primary_skill: "S4", level_target: "M2", error_targets: ["D1"] },
  TT_4_5: { primary_skill: "S4", level_target: "M2", error_targets: ["D2"] },
  // S5 — Залгаварыг зөв залгах
  TT_5_1: { primary_skill: "S5", level_target: "M2", error_targets: ["E2", "E4"] },
  TT_5_2: { primary_skill: "S5", level_target: "M2", error_targets: ["E2"] },
  TT_5_3: { primary_skill: "S5", level_target: "M2", error_targets: ["E3"] },
  TT_5_4: { primary_skill: "S5", level_target: "M2", error_targets: ["E6"] },
  TT_5_5: { primary_skill: "S5", level_target: "M2", error_targets: ["E1"] },
  TT_5_6: { primary_skill: "S5", level_target: "M2", error_targets: ["E5"] },
  TT_5_7: { primary_skill: "S5", level_target: "M2", error_targets: ["E7"] },
  // S6 — Өгүүлбэрийн тэмдэглэгээ
  TT_6_1: { primary_skill: "S6", level_target: "M1", error_targets: ["G1"] },
  TT_6_2: { primary_skill: "S6", level_target: "M2", error_targets: ["G2", "G3"] },
  TT_6_3: { primary_skill: "S6", level_target: "M2", error_targets: ["G5"] },
  TT_6_4: { primary_skill: "S6", level_target: "M2", error_targets: ["G4"] },
  // S7 — Цээж бичиг
  TT_7_1: { primary_skill: "S7", level_target: "M0", error_targets: ["B1"] },
  TT_7_2: { primary_skill: "S7", level_target: "M1", error_targets: ["B4", "H4"] },
  TT_7_3: { primary_skill: "S7", level_target: "M1", error_targets: ["H1", "B1"] },
  TT_7_4: { primary_skill: "S7", level_target: "M2", error_targets: ["H1"] },
  TT_7_5: { primary_skill: "S7", level_target: "M2", error_targets: ["B4", "E1"] },
  TT_7_6: { primary_skill: "S7", level_target: "M3", error_targets: ["H1", "B4"] },
  TT_7_7: { primary_skill: "S7", level_target: "M2", error_targets: ["H1"] },
  // S8 — Алдаагаа зөв таних / засах
  TT_8_1: { primary_skill: "S8", level_target: "M2", error_targets: ["H4"] },
  TT_8_2: { primary_skill: "S8", level_target: "M2", error_targets: ["H4"] },
  TT_8_3: { primary_skill: "S8", level_target: "M2", error_targets: ["H4"] },
  TT_8_4: { primary_skill: "S8", level_target: "M2", error_targets: ["H4"] },
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
  TT_1_1: {
    label: "Авиа сонсоод үсэг сонгох",
    shortLabel: "1.1",
    description: "Аудио сонсоод тохирох үсгийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G1"],
  },
  TT_1_2: {
    label: "Зурагт юу зурсныг үсгээр таних",
    shortLabel: "1.2",
    description: "Зургийг харж тохирох үсгийг таних",
    groups: ["choice"],
    category: "choice",
    grades: ["G1"],
  },
  TT_1_3: {
    label: "Үсгүүдийг тохирох зургуудтай холбох",
    shortLabel: "1.3",
    description: "Үсэг ба зургийн хосыг холбох",
    groups: ["match_pairs"],
    category: "match_pairs",
    grades: ["G1"],
  },
  TT_1_4: {
    label: "Үг угсрах",
    shortLabel: "1.4",
    description: "Холилдсон үсгүүдийг зөв дарааллаар угсрах",
    groups: ["assemble_word"],
    category: "assemble_word",
    grades: ["G1"],
  },
  TT_1_5: {
    label: "Төсөөтэй үсгүүдийг ялгах",
    shortLabel: "1.5",
    description: "Ижил төстэй үсгүүдийг ялгаж сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G1"],
  },
  // S2 — Үгийг зөв бичих
  TT_2_1: {
    label: "Зураг харж дутуу үсэг нөхөх",
    shortLabel: "2.1",
    description: "Зургийг харж хоосон зайд үсэг нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G1", "G2"],
  },
  TT_2_2: {
    label: "Үсэг угсарч үг болгох",
    shortLabel: "2.2",
    description: "Тарааж өгсөн үсгүүдийг зөв дарааллаар угсрах",
    groups: ["assemble_word"],
    category: "assemble_word",
    grades: ["G2"],
  },
  TT_2_3: {
    label: "Зөв бичлэгийг сонгох",
    shortLabel: "2.3",
    description: "Зургийг харж зөв бичигдсэн үгийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2"],
  },
  TT_2_4: {
    label: "Сонсоод үгт дутуу байгаа үсгийг нөхөх",
    shortLabel: "2.4",
    description: "Аудио сонсоод дутуу үсгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G2"],
  },
  TT_2_5: {
    label: "Нийлмэл үг зөв бичих",
    shortLabel: "2.5",
    description: "Нийлмэл үгийн алдааг олж засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G3"],
  },
  TT_2_6: {
    label: "Үгийн хэлбэр/бүтэц засах",
    shortLabel: "2.6",
    description: "Үгийн буруу хэлбэр/бүтцийг засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G3", "G4"],
  },
  // S3 — Урт/богино, балархай эгшиг
  TT_3_1: {
    label: "Урт/богино эгшиг сонсоод сонгох",
    shortLabel: "3.1",
    description: "Аудио сонсоод урт/богино эгшгийг ялгах",
    groups: ["choice"],
    category: "choice",
    grades: ["G2"],
  },
  TT_3_2: {
    label: "Балархай эгшиг нөхөх",
    shortLabel: "3.2",
    description: "Аудио сонсоод балархай эгшгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G2", "G3"],
  },
  TT_3_3: {
    label: "Зургуудийг тохирох үгтэй нь холбох",
    shortLabel: "3.3",
    description: "Зураг ба үгийн хосыг холбох",
    groups: ["match_pairs"],
    category: "match_pairs",
    grades: ["G2"],
  },
  TT_3_4: {
    label: "Эгшгийн зохицол шалгах",
    shortLabel: "3.4",
    description: "Эгшгийн зохицлын алдааг олж засах",
    groups: ["choice"],
    category: "choice",
    grades: ["G3"],
  },
  TT_3_5: {
    label: "Илүү эгшиг олж засах",
    shortLabel: "3.5",
    description: "Илүүдсэн эгшгийг олж засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G3"],
  },
  // S4 — Гийгүүлэгчийг зөв ялгах
  TT_4_1: {
    label: "Төстэй сонсогддог гийгүүлэгчүүдийг ялгах",
    shortLabel: "4.1",
    description: "Аудио сонсоод төстэй гийгүүлэгчийг ялгах",
    groups: ["choice"],
    category: "choice",
    grades: ["G2"],
  },
  TT_4_2: {
    label: "Үгийн төгсгөлийн гийгүүлэгч сонгох",
    shortLabel: "4.2",
    description: "Аудио сонсоод үгийн төгсгөлийн гийгүүлэгчийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_4_3: {
    label: "Дараалж орох гийгүүлэгчийг нөхөх",
    shortLabel: "4.3",
    description: "Давхар гийгүүлэгчийн дутуу хэсгийг нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G3"],
  },
  TT_4_4: {
    label: "Орхигдсон гийгүүлэгч нөхөх",
    shortLabel: "4.4",
    description: "Аудио сонсоод орхигдсон гийгүүлэгчийг нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G2", "G3"],
  },
  TT_4_5: {
    label: "Илүү гийгүүлэгч олж засах",
    shortLabel: "4.5",
    description: "Илүүдсэн гийгүүлэгчийг олж засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G3"],
  },
  // S5 — Залгаварыг зөв залгах
  TT_5_1: {
    label: "Зөв нөхцлийг сонгох",
    shortLabel: "5.1",
    description: "Тохирох нөхцлийг хувилбаруудаас сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_5_2: {
    label: "Чиглэлийн нөхцөл нөхөх",
    shortLabel: "5.2",
    description: "Өгүүлбэрт чиглэлийн нөхцлийг нөхөх",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    grades: ["G3"],
  },
  TT_5_3: {
    label: "Үгийн зөв залгаврыг холбох",
    shortLabel: "5.3",
    description: "Үг ба зохих залгаврыг холбох",
    groups: ["match_pairs"],
    category: "match_pairs",
    grades: ["G3"],
  },
  TT_5_4: {
    label: "Үйл үгийн цаг сонгох",
    shortLabel: "5.4",
    description: "Үйл үгийн зөв цагийн хэлбэрийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G3", "G4"],
  },
  TT_5_5: {
    label: "Тохирох залгаврыг нөхөх",
    shortLabel: "5.5",
    description: "Хоосон зайд зохих залгаврыг нөхөх",
    groups: ["fill"],
    category: "fill",
    grades: ["G3"],
  },
  TT_5_6: {
    label: "Олон тоо/харьяалал сонгох",
    shortLabel: "5.6",
    description: "Олон тоо эсвэл харьяаллын зөв хэлбэрийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G3"],
  },
  TT_5_7: {
    label: "Залгаврын зөв бичлэг сонгох",
    shortLabel: "5.7",
    description: "Залгаврын зөв бичлэгийн хувилбарыг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G3", "G4"],
  },
  // S6 — Өгүүлбэрийн тэмдэглэгээ
  TT_6_1: {
    label: "Өгүүлбэрийн эхэнд орох зөв хариулт сонгох",
    shortLabel: "6.1",
    description: "Өгүүлбэрийн эхний том үсгийн хувилбарыг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2"],
  },
  TT_6_2: {
    label: "Өгүүлбэрийн төгсгөлийн тэмдэг сонгох",
    shortLabel: "6.2",
    description: "Зохих төгсгөлийн тэмдэгтийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  TT_6_3: {
    label: "Өгүүлбэрийн төгсгөлийг олох",
    shortLabel: "6.3",
    description: "Өгүүлбэрийн хил заагийн алдааг засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G3", "G4"],
  },
  TT_6_4: {
    label: "Таслал нэмэх",
    shortLabel: "6.4",
    description: "Өгүүлбэрт таслал нэмэх",
    groups: ["correction"],
    category: "correction",
    grades: ["G3", "G4"],
  },
  // S7 — Цээж бичиг
  TT_7_1: {
    label: "Хуулж бичих",
    shortLabel: "7.1",
    description: "Өгсөн текстийг хуулж бичих",
    groups: ["copy"],
    category: "copy",
    grades: ["G1"],
  },
  TT_7_2: {
    label: "Харж тогтоон бичих",
    shortLabel: "7.2",
    description: "Текстийг харж тогтоон, нуусны дараа бичих",
    groups: ["visual_memory"],
    category: "visual_memory",
    grades: ["G2"],
  },
  TT_7_3: {
    label: "Сонсож бичих — үг",
    shortLabel: "7.3",
    description: "Аудио сонсоод үг бичих",
    groups: ["dictation"],
    category: "dictation",
    grades: ["G2"],
  },
  TT_7_4: {
    label: "Сонсож бичих — өгүүлбэр",
    shortLabel: "7.4",
    description: "Аудио сонсоод өгүүлбэр бичих",
    groups: ["dictation"],
    category: "dictation",
    grades: ["G3"],
  },
  TT_7_5: {
    label: "Нөхөж бичих цээж бичиг",
    shortLabel: "7.5",
    description: "Аудио сонсоод өгүүлбэрийн дутуу хэсгийг нөхөж бичих",
    groups: ["sentence_fill"],
    category: "sentence_fill",
    grades: ["G3"],
  },
  TT_7_6: {
    label: "Сонсож бичих — мини эх",
    shortLabel: "7.6",
    description: "Аудио сонсоод мини эхийг бичих",
    groups: ["mini_text"],
    category: "mini_text",
    grades: ["G4"],
  },
  TT_7_7: {
    label: "Сонсоод зөв хувилбар сонгох",
    shortLabel: "7.7",
    description: "Аудио сонсоод зөв бичлэгийн хувилбарыг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G2", "G3"],
  },
  // S8 — Алдаагаа зөв таних / засах
  TT_8_1: {
    label: "Алдаа олж товших",
    shortLabel: "8.1",
    description: "Өгүүлбэрийн алдаатай үгийг олж товших",
    groups: ["tap_find_error"],
    category: "tap_find_error",
    grades: ["G2", "G3"],
  },
  TT_8_2: {
    label: "Алдааг засах",
    shortLabel: "8.2",
    description: "Олсон алдааг засах",
    groups: ["correction"],
    category: "correction",
    grades: ["G3"],
  },
  TT_8_3: {
    label: "Зөв/буруу өгүүлбэр сонгох",
    shortLabel: "8.3",
    description: "Зөв бичигдсэн өгүүлбэрийг сонгох",
    groups: ["choice"],
    category: "choice",
    grades: ["G3"],
  },
  TT_8_4: {
    label: "Өөрийн хариуг дахин шалгах",
    shortLabel: "8.4",
    description: "Өөрийн хариуг загвар хариутай харьцуулан шалгах",
    groups: ["self_check"],
    category: "self_check",
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
      time = taskType === "TT_7_4" ? 90 : 60;
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
    case "copy":
      difficulty = 1;
      level = "M0";
      time = 30;
      slot = "CORE";
      break;
    case "visual_memory":
      difficulty = 2;
      level = "M1";
      time = 45;
      slot = "CORE";
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

// TT_1_3: letters (left) → images of words (right)
// TT_3_3: images of words (left) → word text (right)
const MATCH_PAIRS_IMAGE_SIDE: Record<string, "left" | "right"> = {
  TT_1_3: "right",
  TT_3_3: "left",
};

export function deriveImageSide(taskType: string): "left" | "right" | "none" {
  return MATCH_PAIRS_IMAGE_SIDE[taskType] ?? "none";
}
