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
  TT_2_3: {
    primary_skill: "S2",
    level_target: "M1",
    error_targets: ["B1", "B2"],
  },
  TT_2_4: { primary_skill: "S2", level_target: "M1", error_targets: ["B1"] },
  TT_2_5: { primary_skill: "S2", level_target: "M2", error_targets: ["F2"] },
  TT_2_6: {
    primary_skill: "S2",
    level_target: "M3",
    error_targets: ["F1", "F3", "F4"],
  },
  // S3 — Урт/богино, балархай эгшиг
  TT_3_1: {
    primary_skill: "S3",
    level_target: "M1",
    error_targets: ["C1", "C2"],
  },
  TT_3_2: { primary_skill: "S3", level_target: "M1", error_targets: ["C4"] },
  TT_3_3: {
    primary_skill: "S3",
    level_target: "M1",
    error_targets: ["C1", "C3"],
  },
  TT_3_4: { primary_skill: "S3", level_target: "M2", error_targets: ["C6"] },
  TT_3_5: { primary_skill: "S3", level_target: "M2", error_targets: ["C5"] },
  // S4 — Гийгүүлэгчийг зөв ялгах
  TT_4_1: { primary_skill: "S4", level_target: "M1", error_targets: ["D3"] },
  TT_4_2: { primary_skill: "S4", level_target: "M2", error_targets: ["D5"] },
  TT_4_3: { primary_skill: "S4", level_target: "M2", error_targets: ["D4"] },
  TT_4_4: { primary_skill: "S4", level_target: "M2", error_targets: ["D1"] },
  TT_4_5: { primary_skill: "S4", level_target: "M2", error_targets: ["D2"] },
  // S5 — Залгаварыг зөв залгах
  TT_5_1: {
    primary_skill: "S5",
    level_target: "M2",
    error_targets: ["E2", "E4"],
  },
  TT_5_2: { primary_skill: "S5", level_target: "M2", error_targets: ["E2"] },
  TT_5_3: { primary_skill: "S5", level_target: "M2", error_targets: ["E3"] },
  TT_5_4: { primary_skill: "S5", level_target: "M2", error_targets: ["E6"] },
  TT_5_5: { primary_skill: "S5", level_target: "M2", error_targets: ["E1"] },
  TT_5_6: { primary_skill: "S5", level_target: "M2", error_targets: ["E5"] },
  TT_5_7: { primary_skill: "S5", level_target: "M2", error_targets: ["E7"] },
  // S6 — Өгүүлбэрийн тэмдэглэгээ
  TT_6_1: { primary_skill: "S6", level_target: "M1", error_targets: ["G1"] },
  TT_6_2: {
    primary_skill: "S6",
    level_target: "M2",
    error_targets: ["G2", "G3"],
  },
  TT_6_3: { primary_skill: "S6", level_target: "M2", error_targets: ["G5"] },
  TT_6_4: { primary_skill: "S6", level_target: "M2", error_targets: ["G4"] },
  // S7 — Цээж бичиг
  TT_7_1: { primary_skill: "S7", level_target: "M0", error_targets: ["B1"] },
  TT_7_2: {
    primary_skill: "S7",
    level_target: "M1",
    error_targets: ["B4", "H4"],
  },
  TT_7_3: {
    primary_skill: "S7",
    level_target: "M1",
    error_targets: ["H1", "B1"],
  },
  TT_7_4: { primary_skill: "S7", level_target: "M2", error_targets: ["H1"] },
  TT_7_5: {
    primary_skill: "S7",
    level_target: "M2",
    error_targets: ["B4", "E1"],
  },
  TT_7_6: {
    primary_skill: "S7",
    level_target: "M3",
    error_targets: ["H1", "B4"],
  },
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
    label: "Үгийг үеээр угсрах",
    shortLabel: "1.4",
    description: "Холилдсон үеүүдийг зөв дарааллаар угсрах",
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

export const TASK_TYPES = Object.keys(TASK_TYPE_INFO);
