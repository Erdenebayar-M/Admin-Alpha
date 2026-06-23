import { TASK_TYPE_INFO } from "./task-types";

// Re-export task-type data and label maps so existing imports of
// "@/lib/task-defaults" keep working unchanged after the split.
export * from "./task-types";
export * from "./task-labels";

const LEVEL_CODES_ADMIN = ["M0", "M1", "M2", "M3", "M4", "M5"] as const;

function buildGradeLevels(gradeBands: string[], levelTarget: string): string[] {
  const rangeMatch = levelTarget.match(/^(M[0-5])-(M[0-5])$/);
  let levels: string[];
  if (rangeMatch) {
    const start = (LEVEL_CODES_ADMIN as readonly string[]).indexOf(rangeMatch[1]);
    const end = (LEVEL_CODES_ADMIN as readonly string[]).indexOf(rangeMatch[2]);
    levels = start >= 0 && end >= 0 ? [...LEVEL_CODES_ADMIN].slice(start, end + 1) : ["M0"];
  } else {
    levels = (LEVEL_CODES_ADMIN as readonly string[]).includes(levelTarget) ? [levelTarget] : ["M0"];
  }
  const cells: string[] = [];
  for (const g of gradeBands) {
    for (const l of levels) cells.push(`${g}:${l}`);
  }
  return cells;
}

interface DefaultValues {
  difficulty: string;
  level_target: string;
  grade_levels: string[];
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
      grade_levels: buildGradeLevels(gradeBands, "M0"),
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
    grade_levels: buildGradeLevels(gradeBands, level),
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
