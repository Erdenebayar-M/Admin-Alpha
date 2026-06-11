"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Field } from "../shared";
import { CommonFields, FeedbackFields } from "./sections";
import { PROMPT_SUGGESTIONS } from "./prompt-suggestions";
import type { SubProps } from "./types";

// ─── correction ───────────────────────────────────────────────────────────────

export function CorrectionContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
        Сурагчид алдаатай текст харуулна. Тэд алдааг олж засах ёстой.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.correction}
      />
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Алдаатай текст (буруу)" required error={errors.incorrect_text} hint="Сурагчид харуулах текст">
          <Textarea
            rows={3}
            value={form.incorrect_text}
            onChange={(e) => set("incorrect_text", e.target.value)}
            placeholder="Жнэ: Би сургуль руу явна."
            className="resize-y border-destructive/30"
          />
        </Field>
        <Field label="Зөв хэлбэр" required error={errors.correct_text}>
          <Textarea
            rows={3}
            value={form.correct_text}
            onChange={(e) => set("correct_text", e.target.value)}
            placeholder="Жнэ: Би сургууль руу явна."
            className="resize-y border-green-500/30"
          />
        </Field>
      </div>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── tap_correction (TT_6_3, TT_6_4) ─────────────────────────────────────────

export function TapCorrectionContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        Сурагч текст дотроос тэмдэглэгээ орох байрыг олж товшино (бичдэггүй).
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.tap_correction}
      />
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Тэмдэглэгүйгүй текст" required error={errors.incorrect_text} hint="Оноо/таслалгүй текст">
          <Textarea
            rows={3}
            value={form.incorrect_text}
            onChange={(e) => set("incorrect_text", e.target.value)}
            placeholder="Жнэ: Би сургуульд явав гэртээ ирэв"
            className="resize-y border-amber-400/40"
          />
        </Field>
        <Field label="Зөв хувилбар" required error={errors.correct_text} hint="Зөв тэмдэглэгэлтэй">
          <Textarea
            rows={3}
            value={form.correct_text}
            onChange={(e) => set("correct_text", e.target.value)}
            placeholder="Жнэ: Би сургуульд явав, гэртээ ирэв."
            className="resize-y border-green-500/30"
          />
        </Field>
      </div>
      <Field label="Санамж" hint="Сурагчид тусална (заавал биш)">
        <Input
          value={form.hint}
          onChange={(e) => set("hint", e.target.value)}
          placeholder="Жнэ: Хоёр үйлдэл залгаа явагдаж байна"
        />
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── v3: tap_find_error ───────────────────────────────────────────────────────

export function TapFindErrorContent({ form, set, errors }: SubProps) {
  const words = form.sentence.trim().split(/\s+/).filter(Boolean);

  return (
    <>
      <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
        Өгүүлбэрт нэг алдаатай үг байрлуулна. Сурагч аль үгийг товшиход зөв байх тэр үгийг доороос сонгоно уу.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.tap_find_error}
      />
      <Separator />
      <Field label="Алдаатай өгүүлбэр" required error={errors.sentence} hint="Нэг үг нь буруу бичигдсэн өгүүлбэр">
        <input
          type="text"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.sentence}
          onChange={(e) => {
            set("sentence", e.target.value);
            set("error_word_index", -1);
          }}
          placeholder="Жнэ: Бид сургуль руу явна."
        />
      </Field>
      {words.length > 0 && (
        <Field label="Алдаатай үгийг сонгоно уу" required error={errors.error_word_index}>
          <div className="flex flex-wrap gap-1.5">
            {words.map((word, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set("error_word_index", i)}
                className={`rounded border px-2.5 py-1 text-sm font-medium transition-colors ${
                  form.error_word_index === i
                    ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive"
                    : "border-border bg-background hover:border-foreground/30"
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Засварласан өгүүлбэр" required error={errors.correct_text}>
        <input
          type="text"
          className="w-full rounded-md border border-green-500/30 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.correct_text}
          onChange={(e) => set("correct_text", e.target.value)}
          placeholder="Жнэ: Бид сургууль руу явна."
        />
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}
