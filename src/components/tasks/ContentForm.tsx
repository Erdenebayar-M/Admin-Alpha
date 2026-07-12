"use client";

import {
  ChoiceContent,
  ListenChoiceContent,
  ImageChoiceContent,
} from "./forms/choice-forms";
import {
  WordFillContent,
  SentenceFillContent,
  AudioFillContent,
  ImageFillContent,
  AudioSentenceFillContent,
} from "./forms/fill-forms";
import {
  CorrectionContent,
  TapCorrectionContent,
  TapFindErrorContent,
} from "./forms/correction-forms";
import {
  DictationContent,
  MiniTextContent,
  CopyContent,
  VisualMemoryContent,
} from "./forms/dictation-forms";
import { MatchPairsContent, AssembleWordContent } from "./forms/match-assemble-forms";
import { SelfCheckContent } from "./forms/self-check-form";
import type { ContentFormProps, SubProps } from "./forms/types";

export type { ContentFormProps };

// The only task types wired to <ImagePreview> in their content form (see
// choice-forms.tsx's ImageChoiceContent and fill-forms.tsx's ImageFillContent).
// Exported for WordSuggestions' showImageAction, rendered as its own column
// in CreateTaskModal.tsx rather than nested inside this component.
export const IMAGE_CAPABLE_TASK_TYPES = new Set(["TT_1_2", "TT_2_1", "TT_2_3"]);

// ─── TYPE_CONTENT_MAP ─────────────────────────────────────────────────────────

const TYPE_CONTENT_MAP: Record<string, React.FC<SubProps>> = {
  // S1 — Үсэг-авиаг зөв таних
  TT_1_1: ListenChoiceContent,
  TT_1_2: ImageChoiceContent,
  TT_1_3: MatchPairsContent,
  TT_1_4: AssembleWordContent,
  TT_1_5: ListenChoiceContent,
  // S2 — Үгийг зөв бичих
  TT_2_1: ImageFillContent,
  TT_2_2: AssembleWordContent,
  TT_2_3: ImageChoiceContent,
  TT_2_4: AudioFillContent,
  TT_2_5: CorrectionContent,
  TT_2_6: CorrectionContent,
  // S3 — Урт/богино, балархай эгшиг
  TT_3_1: ListenChoiceContent,
  TT_3_2: AudioFillContent,
  TT_3_3: MatchPairsContent,
  TT_3_4: ChoiceContent,
  TT_3_5: CorrectionContent,
  // S4 — Гийгүүлэгчийг зөв ялгах
  TT_4_1: ListenChoiceContent,
  TT_4_2: ListenChoiceContent,
  TT_4_3: WordFillContent,
  TT_4_4: AudioFillContent,
  TT_4_5: CorrectionContent,
  // S5 — Залгаварыг зөв залгах
  TT_5_1: ChoiceContent,
  TT_5_2: SentenceFillContent,
  TT_5_3: MatchPairsContent,
  TT_5_4: ChoiceContent,
  TT_5_5: WordFillContent,
  TT_5_6: ChoiceContent,
  TT_5_7: ChoiceContent,
  // S6 — Өгүүлбэрийн тэмдэглэгээ
  TT_6_1: ChoiceContent,
  TT_6_2: ChoiceContent,
  TT_6_3: TapCorrectionContent,
  TT_6_4: TapCorrectionContent,
  // S7 — Цээж бичиг
  TT_7_1: CopyContent,
  TT_7_2: VisualMemoryContent,
  TT_7_3: DictationContent,
  TT_7_4: DictationContent,
  TT_7_5: AudioSentenceFillContent,
  TT_7_6: MiniTextContent,
  TT_7_7: ListenChoiceContent,
  // S8 — Алдаагаа зөв таних / засах
  TT_8_1: TapFindErrorContent,
  TT_8_2: CorrectionContent,
  TT_8_3: ChoiceContent,
  TT_8_4: SelfCheckContent,
};

// ─── Main export ─────────────────────────────────────────────────────────────

export function ContentForm({
  form, set, errors, taskType, audioPreview, onAudioGenerated, imagePreview, onImageGenerated,
  selectedWordId = null, saveAudioToWord = false, onSaveAudioToWordChange = () => {},
}: ContentFormProps) {
  const TypeContent = TYPE_CONTENT_MAP[taskType];

  if (!TypeContent) {
    return <p className="text-sm text-muted-foreground">Даалгаврын төрөл сонгоно уу.</p>;
  }

  return (
    <TypeContent
      form={form}
      set={set}
      errors={errors}
      audioPreview={audioPreview}
      onAudioGenerated={onAudioGenerated}
      imagePreview={imagePreview}
      onImageGenerated={onImageGenerated}
      selectedWordId={selectedWordId}
      saveAudioToWord={saveAudioToWord}
      onSaveAudioToWordChange={onSaveAudioToWordChange}
    />
  );
}
