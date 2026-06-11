import type { TaskOptions } from "@/lib/types";
import { parseLines, deriveImageSide, type OptionGroup } from "@/lib/task-defaults";
import type { FormState } from "./state";

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildOptions(form: FormState, group: OptionGroup): TaskOptions {
  switch (group) {
    case "choice": {
      const wrong = parseLines(form.expected_answers);
      return {
        choices: [
          { text: form.correct_answer, is_correct: true },
          ...wrong.slice(0, 3).map((t) => ({ text: t, is_correct: false })),
        ],
        audio_trigger: form.audio_trigger,
      };
    }
    case "fill": {
      const ctx = form.context_word.trim();
      const pos = form.blank_position;
      const blankAnswer = ctx[pos] ?? form.correct_answer;
      const displayText = form.display_text.trim() ||
        (ctx ? ctx.substring(0, pos) + "_" + ctx.substring(pos + 1) : "");
      return {
        display_text: displayText,
        blank_position: pos,
        blank_answer: blankAnswer,
        context_word: ctx,
      };
    }
    case "sentence_fill": {
      return {
        sentence_template: form.sentence_template,
        blank_answer: form.correct_answer,
        context_sentence: form.sentence_template.replace("___", form.correct_answer),
        ...(form.hint ? { hint: form.hint } : {}),
      };
    }
    case "correction": {
      return {
        incorrect_text: form.incorrect_text,
        correct_text: form.correct_text,
      };
    }
    case "dictation": {
      const audioText = form.audio_text || form.correct_answer;
      const wordCount = audioText.trim().split(/\s+/).filter(Boolean).length;
      return {
        audio_text: audioText,
        word_count: wordCount > 0 ? wordCount : 1,
        expected_answers: [audioText],
        allow_partial: form.allow_partial,
      };
    }
    case "mini_text": {
      const audioText = form.audio_text || form.correct_answer;
      const autoCount = (audioText.match(/[.!?]/g) || []).length;
      return {
        audio_text: audioText,
        sentence_count: Math.min(5, Math.max(2, autoCount || 2)),
        expected_answers: [audioText],
      };
    }
    case "self_check": {
      return {
        original_attempt: form.original_attempt,
        model_answer: form.model_answer || form.correct_answer,
        comparison_mode: (form.comparison_mode as "side_by_side" | "highlight_diff") || "side_by_side",
      };
    }
    case "match_pairs": {
      const rawPairs = parseLines(form.pairs_text)
        .map((line) => {
          const sep = line.includes("|") ? "|" : "—";
          const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
          return { left, right };
        })
        .filter((p) => p.left && p.right);
      const side = deriveImageSide(form.task_type);
      // UI always uses "text | imageword"; for TT_3_3 the DB expects left=imageword
      const pairs = side === "left"
        ? rawPairs.map((p) => ({ left: p.right, right: p.left }))
        : rawPairs;
      return { pairs, image_side: side };
    }
    case "assemble_word": {
      const segments = form.tiles_text.trim().split(/\s+/).filter(Boolean);
      return { correct_order: segments, tiles: shuffleArray(segments) };
    }
    case "tap_find_error": {
      return {
        sentence: form.sentence,
        error_word_index: form.error_word_index,
        correct_text: form.correct_text,
      };
    }
    case "copy": {
      return { text_to_copy: form.text_to_copy };
    }
    case "visual_memory": {
      return {
        text_to_memorize: form.correct_answer,
        display_seconds: Math.min(10, Math.max(2, form.display_seconds)),
      };
    }
    default:
      return {};
  }
}

export function deriveCorrectAnswer(form: FormState, group: OptionGroup): string {
  if (group === "match_pairs") {
    const pairs = parseLines(form.pairs_text)
      .map((line) => {
        const sep = line.includes("|") ? "|" : "—";
        const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
        return left && right ? `${left}—${right}` : "";
      })
      .filter(Boolean);
    return pairs.join(", ") || form.correct_answer;
  }
  if (group === "assemble_word") {
    const segments = form.tiles_text.trim().split(/\s+/).filter(Boolean);
    return segments.join("") || form.correct_answer;
  }
  if (group === "tap_find_error") {
    return form.correct_text || form.correct_answer;
  }
  if (group === "correction") {
    return form.correct_text || form.correct_answer;
  }
  if (group === "fill") {
    return form.context_word || form.correct_answer;
  }
  if (group === "self_check") {
    return form.model_answer || form.correct_answer;
  }
  if (group === "copy") {
    return form.text_to_copy || form.correct_answer;
  }
  return form.correct_answer;
}
