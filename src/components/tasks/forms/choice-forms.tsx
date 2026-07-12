"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, ChipInput, ReusedWordImage } from "../shared";
import { AudioPreview } from "../AudioPreview";
import { ImagePreview } from "../ImagePreview";
import { CommonFields, FeedbackFields } from "./sections";
import { PROMPT_SUGGESTIONS } from "./prompt-suggestions";
import type { SubProps } from "./types";

// ─── choice ──────────────────────────────────────────────────────────────────

export function ChoiceContent({ form, set, errors, onImageGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
        Сурагч хэд хэдэн сонголтоос зөв үгийг сонгоно.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={onImageGenerated}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.choice}
      />
      <Separator />
      <Field label="Зөв хариулт" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Зөв сонголт"
          className="border-green-500/30"
        />
      </Field>
      <Field label="Буруу сонголтууд (2–3)" required error={errors.expected_answers} hint="Enter дарж нэмнэ, хамгийн ихдээ 3">
        <ChipInput
          value={form.expected_answers}
          onChange={(v) => set("expected_answers", v)}
          placeholder="Буруу сонголт бичээд Enter дарна..."
        />
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── choice + audio (TT_LISTEN_CHOOSE) ───────────────────────────────────────

export function ListenChoiceContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Аудио сонсоод зөв үгийг сонгоно. Сонгох хэд хэдэн сонголт бичиж, аудио үүсгэнэ үү.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={onAudioGenerated} onImageGenerated={() => {}}
        audioPreview={audioPreview} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.listen_choice}
      />
      <Separator />
      <Field label="Зөв хариулт" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Зөв сонголт"
          className="border-green-500/30"
        />
      </Field>
      <Field label="Буруу сонголтууд (2–3)" required error={errors.expected_answers} hint="Enter дарж нэмнэ, хамгийн ихдээ 3">
        <ChipInput
          value={form.expected_answers}
          onChange={(v) => set("expected_answers", v)}
          placeholder="Буруу сонголт бичээд Enter дарна..."
        />
      </Field>
      <AudioPreview
        text={form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── choice + image (TT_IMAGE_WORD_MATCH) ────────────────────────────────────

export function ImageChoiceContent({ form, set, errors, imagePreview, onImageGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-pink-200 bg-pink-50/50 p-3 text-xs text-pink-800 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-200">
        Зурагт тохирох зөв үгийг сонгоно.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={onImageGenerated}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.image_choice}
      />
      <Separator />
      <Field label="Зөв хариулт" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: нар"
          className="border-green-500/30"
        />
      </Field>
      <Field label="Буруу сонголтууд (2–3)" required error={errors.expected_answers}>
        <ChipInput
          value={form.expected_answers}
          onChange={(v) => set("expected_answers", v)}
          placeholder="Буруу сонголт бичээд Enter дарна..."
        />
      </Field>
      {imagePreview?.url ? (
        <ReusedWordImage url={imagePreview.url} onClear={() => onImageGenerated({ tempId: "", base64: "" })} />
      ) : (
        <ImagePreview
          correctAnswer={form.correct_answer}
          imageDescription={form.image_description}
          onDescriptionChange={(desc) => set("image_description", desc)}
          onGenerated={onImageGenerated}
          gradeBand={form.grade_band}
        />
      )}
      <FeedbackFields form={form} set={set} />
    </>
  );
}
