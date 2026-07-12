"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, SuggestTextarea, ReusedWordImage } from "../shared";
import { AudioPreview } from "../AudioPreview";
import { ImagePreview } from "../ImagePreview";
import { CommonFields, FeedbackFields } from "./sections";
import { PROMPT_SUGGESTIONS } from "./prompt-suggestions";
import type { SubProps } from "./types";

// ─── fill (word-level) ────────────────────────────────────────────────────────

export function WordFillContent({ form, set, errors }: SubProps) {
  const ctx = form.context_word.trim();
  const pos = form.blank_position;
  const preview = ctx
    ? ctx.split("").map((ch, i) => (i === pos ? "_" : ch)).join("")
    : "";

  return (
    <>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        Сурагч үгийн нэг дутуу үсгийг бөглөнө. Бүтэн үгийг оруулаад дутуу байрлалыг сонгоно уу.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.word_fill}
      />
      <Separator />
      <Field label="Нөхөх үг" required error={errors.context_word} hint="Бүтэн хэлбэрээр бичнэ — доор дутуу үсгийг сонгоно">
        <Input
          value={form.context_word}
          onChange={(e) => {
            set("context_word", e.target.value);
            set("blank_position", 0);
          }}
          placeholder="Жнэ: гэрэл"
          className="border-green-500/30"
        />
      </Field>
      {ctx.length > 0 && (
        <Field label="Дутуу байрлалыг сонгоно уу" hint="Товшиход тухайн үсгийг цоорхой болгоно">
          <div className="flex flex-wrap gap-1.5">
            {ctx.split("").map((ch, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set("blank_position", i)}
                className={`rounded border px-2.5 py-1 font-mono text-sm font-medium transition-colors ${
                  i === pos
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
          {preview && (
            <p className="mt-1 text-xs text-muted-foreground">
              Сурагчид харагдах:{" "}
              <span className="font-mono font-semibold text-foreground">{preview}</span>
              {" "}→ зөв хариулт:{" "}
              <span className="font-mono font-semibold text-green-700">{ctx[pos]}</span>
            </p>
          )}
        </Field>
      )}
      <Field label="Харуулах текст" hint="Хоосон үлдвэл үгнээс автоматаар үүснэ">
        <Input
          value={form.display_text}
          onChange={(e) => set("display_text", e.target.value)}
          placeholder="Жнэ: Г_рэл мандана"
        />
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── sentence_fill ────────────────────────────────────────────────────────────

export function SentenceFillContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        Өгүүлбэр дэх цоорхойг зөв үгээр бөглөнө.{" "}
        <code className="rounded bg-emerald-200 px-1 dark:bg-emerald-800">___</code> тэмдгийг цоорхой болгоно.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.sentence_fill}
      />
      <Separator />
      <Field label="Өгүүлбэрийн загвар (___-аар цоорхой тэмдэглэ)" required error={errors.sentence_template}>
        <SuggestTextarea
          rows={2}
          value={form.sentence_template}
          onChange={(v) => set("sentence_template", v)}
          placeholder="Жнэ: Бид ___ руу явна."
          suggestions={[]}
          className="font-medium"
        />
      </Field>
      <Field label="Цоорхойд орох зөв үг" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: сургууль"
          className="border-green-500/30"
        />
      </Field>
      <Field label="Санамж" hint="Сурагчид тусална (заавал биш)">
        <Input
          value={form.hint}
          onChange={(e) => set("hint", e.target.value)}
          placeholder="Жнэ: Газрын нэр"
        />
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── audio fill (TT_2_4, TT_3_2, TT_4_4) ────────────────────────────────────

export function AudioFillContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  const ctx = form.context_word.trim();
  const pos = form.blank_position;
  const preview = ctx
    ? ctx.split("").map((ch, i) => (i === pos ? "_" : ch)).join("")
    : "";

  return (
    <>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        Аудио сонсоод дутуу үсгийг нөхөнө.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={onAudioGenerated} onImageGenerated={() => {}}
        audioPreview={audioPreview} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.audio_fill}
      />
      <Separator />
      <Field label="Нөхөх үг" required error={errors.context_word} hint="Бүтэн хэлбэрээр бичнэ — доор дутуу үсгийг сонгоно">
        <Input
          value={form.context_word}
          onChange={(e) => {
            set("context_word", e.target.value);
            set("blank_position", 0);
          }}
          placeholder="Жнэ: гэрэл"
          className="border-green-500/30"
        />
      </Field>
      {ctx.length > 0 && (
        <Field label="Дутуу байрлалыг сонгоно уу">
          <div className="flex flex-wrap gap-1.5">
            {ctx.split("").map((ch, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set("blank_position", i)}
                className={`rounded border px-2.5 py-1 font-mono text-sm font-medium transition-colors ${
                  i === pos
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
          {preview && (
            <p className="mt-1 text-xs text-muted-foreground">
              Сурагчид:{" "}
              <span className="font-mono font-semibold text-foreground">{preview}</span>
            </p>
          )}
        </Field>
      )}
      <Field label="Харуулах текст" hint="Хоосон үлдвэл үгнээс автоматаар үүснэ">
        <Input
          value={form.display_text}
          onChange={(e) => set("display_text", e.target.value)}
          placeholder="Жнэ: Г_рэл мандана"
        />
      </Field>
      <AudioPreview
        text={form.context_word || form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── image fill (TT_2_1) ─────────────────────────────────────────────────────

export function ImageFillContent({ form, set, errors, imagePreview, onImageGenerated }: SubProps) {
  const ctx = form.context_word.trim();
  const pos = form.blank_position;
  const preview = ctx
    ? ctx.split("").map((ch, i) => (i === pos ? "_" : ch)).join("")
    : "";

  return (
    <>
      <div className="rounded-lg border border-pink-200 bg-pink-50/50 p-3 text-xs text-pink-800 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-200">
        Зурагт харж дутуу үсгийг нөхөнө.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={onImageGenerated}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.image_fill}
      />
      <Separator />
      <Field label="Нөхөх үг" required error={errors.context_word} hint="Бүтэн хэлбэрээр бичнэ — доор дутуу үсгийг сонгоно">
        <Input
          value={form.context_word}
          onChange={(e) => {
            set("context_word", e.target.value);
            set("blank_position", 0);
          }}
          placeholder="Жнэ: нар"
          className="border-green-500/30"
        />
      </Field>
      {ctx.length > 0 && (
        <Field label="Дутуу байрлалыг сонгоно уу">
          <div className="flex flex-wrap gap-1.5">
            {ctx.split("").map((ch, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set("blank_position", i)}
                className={`rounded border px-2.5 py-1 font-mono text-sm font-medium transition-colors ${
                  i === pos
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
          {preview && (
            <p className="mt-1 text-xs text-muted-foreground">
              Сурагчид:{" "}
              <span className="font-mono font-semibold text-foreground">{preview}</span>
            </p>
          )}
        </Field>
      )}
      <Field label="Харуулах текст" hint="Хоосон үлдвэл үгнээс автоматаар үүснэ">
        <Input
          value={form.display_text}
          onChange={(e) => set("display_text", e.target.value)}
          placeholder="Жнэ: _ар тусгална"
        />
      </Field>
      {imagePreview?.url ? (
        <ReusedWordImage url={imagePreview.url} onClear={() => onImageGenerated({ tempId: "", base64: "" })} />
      ) : (
        <ImagePreview
          correctAnswer={form.context_word || form.correct_answer}
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

// ─── audio sentence fill (TT_7_5) ────────────────────────────────────────────

export function AudioSentenceFillContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        Аудио сонсоод өгүүлбэрийн цоорхойг бөглөнө.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={onAudioGenerated} onImageGenerated={() => {}}
        audioPreview={audioPreview} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.audio_sentence_fill}
      />
      <Separator />
      <Field label="Өгүүлбэрийн загвар (___-аар цоорхой тэмдэглэ)" required error={errors.sentence_template}>
        <SuggestTextarea
          rows={2}
          value={form.sentence_template}
          onChange={(v) => set("sentence_template", v)}
          placeholder="Жнэ: Бид ___ руу явна."
          suggestions={[]}
          className="font-medium"
        />
      </Field>
      <Field label="Цоорхойд орох зөв үг" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: сургууль"
          className="border-green-500/30"
        />
      </Field>
      <AudioPreview
        text={form.sentence_template.replace("___", form.correct_answer) || form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackFields form={form} set={set} />
    </>
  );
}
