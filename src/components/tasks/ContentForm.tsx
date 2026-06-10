"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Field, ToggleChip, SuggestTextarea, ChipInput } from "./shared";
import { AudioPreview } from "./AudioPreview";
import type { AudioPreviewState } from "./AudioPreview";
import { ImagePreview } from "./ImagePreview";
import type { ImagePreviewState } from "./ImagePreview";
import type { FormState, ValidationErrors } from "@/hooks/useTaskForm";
import { deriveImageSide } from "@/lib/task-defaults";
import type { OptionGroup } from "@/lib/task-defaults";
import { generateImage } from "@/lib/api";
import { buildImagePrompt } from "@/lib/imagePromptTemplate";

interface ContentFormProps {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  toggleList: (key: "grade_band" | "error_targets", item: string) => void;
  groups: OptionGroup[];
  errors: ValidationErrors;
  taskType: string;
  audioPreview: AudioPreviewState | null;
  onAudioGenerated: (state: AudioPreviewState) => void;
  imagePreview: ImagePreviewState | null;
  onImageGenerated: (state: ImagePreviewState) => void;
}

type SubProps = Pick<ContentFormProps, "form" | "set" | "errors" | "audioPreview" | "onAudioGenerated" | "imagePreview" | "onImageGenerated">;

// ─── Per-type prompt suggestions ─────────────────────────────────────────────

const PROMPT_SUGGESTIONS: Record<string, string[]> = {
  listen_choice: [
    "Аудио сонсоод зөв үгийг сонго.",
    "Аудиог сонсоод зөв хариултыг сонго.",
    "Сонсоод тохирох үгийг сонго.",
  ],
  image_choice: [
    "Зурагт тохирох үгийг сонго.",
    "Зурагт тохирох зөв хариултыг сонго.",
    "Зурагт харж тохирох үгийг сонго.",
  ],
  choice: [
    "Зөв хариултыг сонго.",
    "Тохирох хариултыг сонгоно уу.",
    "Зөв үгийг сонго.",
  ],
  match_pairs: [
    "Холбож тааруулна уу.",
    "Тохирох хосуудыг холбоно уу.",
    "Зөв хосыг олж холбоно уу.",
  ],
  assemble_syllable: [
    "Үеүүдийг зөв дарааллаар угсра.",
    "Холилдсон үеүүдийг зөв дарааллаар угсра.",
    "Үеүүдийг зөв байрлуулна уу.",
  ],
  assemble_word: [
    "Үсгүүдийг зөв дарааллаар угсра.",
    "Холилдсон үсгүүдийг зөв дарааллаар угсра.",
    "Үсгүүдийг зөв байрлуулна уу.",
  ],
  word_fill: [
    "Дутуу үсгийг бөгл.",
    "Үгийн дутуу үсгийг нөхө.",
    "Цоорхой үсгийг бичнэ үү.",
  ],
  sentence_fill: [
    "Цоорхойг зөв үгээр бөгл.",
    "Дутуу үгийг нөхнө үү.",
    "Тохирох үгийг цоорхойд бичнэ үү.",
  ],
  correction: [
    "Алдааг ол, засвар хий.",
    "Алдаатай үгийг зөв хэлбэрт оруул.",
    "Буруу бичигдсэн үгийг засна уу.",
  ],
  tap_correction: [
    "Тэмдэглэгүй байрыг ол, товш.",
    "Оноо/таслал орох байрыг олж товшино уу.",
    "Тэмдэглэгүй байрыг олж товш.",
  ],
  dictation: [
    "Аудио сонсоод бич.",
    "Сонсоод бичнэ үү.",
    "Аудиог сонсоод дагаж бич.",
  ],
  mini_text: [
    "Аудио сонсоод бич.",
    "Эхийг сонсоод бичнэ үү.",
    "Аудиог сонсоод дагаж бич.",
  ],
  copy: [
    "Дараах үгсийг хуулж бич.",
    "Дараах текстийг хуулж бичнэ үү.",
    "Харж хуулж бична уу.",
  ],
  visual_memory: [
    "Санаж ав, дараа бич.",
    "Текстийг тогтоогоод бичнэ үү.",
    "Санаж авч бичнэ үү.",
  ],
  audio_fill: [
    "Аудио сонсоод дутуу үсгийг нөхө.",
    "Сонсоод цоорхой үсгийг бичнэ үү.",
    "Аудиог сонсоод дутуу үсгийг бичнэ үү.",
  ],
  image_fill: [
    "Зурагт харж дутуу үсгийг нөхө.",
    "Зурагт харж цоорхой үсгийг бичнэ үү.",
    "Зургийг харж дутуу үсгийг нөхнө үү.",
  ],
  audio_sentence_fill: [
    "Аудио сонсоод цоорхойг бөгл.",
    "Сонсоод дутуу үгийг нөхнө үү.",
    "Аудиог сонсоод цоорхойд зөв үг бичнэ үү.",
  ],
  tap_find_error: [
    "Алдаатай үгийг ол, товш.",
    "Өгүүлбэрийн алдаатай үгийг олж товшино уу.",
    "Буруу бичигдсэн үгийг олж товш.",
  ],
  self_check: [
    "Бичвэрийг жишиг хариулттай харьцуул.",
    "Өөрийн хариултыг шалгана уу.",
    "Жишиг хариулттай харьцуулж шалгана уу.",
  ],
};

// ─── Shared: title + prompt + feedback ───────────────────────────────────────

function CommonFields({ form, set, errors, promptSuggestions = [] }: SubProps & { promptSuggestions?: string[] }) {
  return (
    <>
      <Field label="Заавар / Асуулт" required error={errors.prompt_text}>
        <SuggestTextarea
          rows={2}
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Сурагчид харуулах заавар"
          suggestions={promptSuggestions}
        />
      </Field>
    </>
  );
}

function FeedbackFields({ form, set }: Pick<SubProps, "form" | "set">) {
  return (
    <>
      <Field label="Дүрмийн тайлбар" hint="Хариултаас үл хамааран харуулах">
        <Textarea
          rows={2}
          value={form.feedback_text}
          onChange={(e) => set("feedback_text", e.target.value)}
          placeholder="Жнэ: 'гэрэл' — г+э+р+э+л"
          className="resize-y"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Зөв хариулсан үед">
          <Textarea
            rows={2}
            value={form.feedback_correct}
            onChange={(e) => set("feedback_correct", e.target.value)}
            placeholder="Жнэ: Маш сайн!"
            className="resize-y border-green-500/40 bg-green-50/30 dark:bg-green-950/20"
          />
        </Field>
        <Field label="Буруу хариулсан үед">
          <Textarea
            rows={2}
            value={form.feedback_wrong}
            onChange={(e) => set("feedback_wrong", e.target.value)}
            placeholder="Жнэ: Дахин оролдоно уу."
            className="resize-y border-destructive/40 bg-red-50/30 dark:bg-red-950/20"
          />
        </Field>
      </div>
    </>
  );
}

// ─── choice ──────────────────────────────────────────────────────────────────

function ChoiceContent({ form, set, errors, onImageGenerated }: SubProps) {
  const isImageMatch = false; // detected by caller via taskType prop if needed
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

function ListenChoiceContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
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

function ImageChoiceContent({ form, set, errors, onImageGenerated }: SubProps) {
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
      <ImagePreview
        correctAnswer={form.correct_answer}
        imageDescription={form.image_description}
        onDescriptionChange={(desc) => set("image_description", desc)}
        onGenerated={onImageGenerated}
        gradeBand={form.grade_band}
      />
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── fill (word-level) ────────────────────────────────────────────────────────

function WordFillContent({ form, set, errors }: SubProps) {
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

function SentenceFillContent({ form, set, errors }: SubProps) {
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

// ─── correction ───────────────────────────────────────────────────────────────

function CorrectionContent({ form, set, errors }: SubProps) {
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

function TapCorrectionContent({ form, set, errors }: SubProps) {
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

// ─── dictation ────────────────────────────────────────────────────────────────

function DictationContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч аудио сонсоод бичнэ. Хүлээгдэж буй хариулт(ууд)-ыг оруулна уу.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={onAudioGenerated} onImageGenerated={() => {}}
        audioPreview={audioPreview} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.dictation}
      />
      <Separator />
      <Field label="Аудио болгох текст" required error={errors.audio_text} hint="Энэ текстийг аудио болгоно — сурагч сонсоод бичнэ">
        <Textarea
          rows={2}
          value={form.audio_text}
          onChange={(e) => set("audio_text", e.target.value)}
          placeholder="Жнэ: Бид сургууль руу явна."
          className="resize-y"
        />
      </Field>
      <Field label="Хэсэгчилсэн оноо" hint="Зөв бичсэн үгийн тоогоор хэсэгчилсэн оноо авна (бүхэлд нь биш)">
        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="allow_partial"
            checked={form.allow_partial}
            onCheckedChange={(c) => set("allow_partial", c === true)}
          />
          <label htmlFor="allow_partial" className="cursor-pointer text-sm text-muted-foreground">
            Хэсэгчилсэн хариулт зөвшөөрнө
          </label>
        </div>
      </Field>
      <AudioPreview
        text={form.audio_text || form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── mini_text ────────────────────────────────────────────────────────────────

function MiniTextContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  const autoSentenceCount = (form.audio_text.match(/[.!?]/g) || []).length;

  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч 2–5 өгүүлбэртэй мини эхийг сонсоод бичнэ. Сурагч бичих талбар нь сурагчдын апп дээр харагдана — энд зөвхөн агуулга тодорхойлно.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={onAudioGenerated} onImageGenerated={() => {}}
        audioPreview={audioPreview} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.mini_text}
      />
      <Separator />
      <Field label="Аудио болгох текст" required error={errors.audio_text} hint="Энэ текстийг аудио болгоно — сурагч сонсоод бичнэ">
        <Textarea
          rows={4}
          value={form.audio_text}
          onChange={(e) => set("audio_text", e.target.value)}
          placeholder="Жнэ: Бид сургууль руу явна. Маргааш бид далайд очно."
          className="resize-y"
        />
        {form.audio_text.trim() && (
          <p className="mt-1 text-xs text-muted-foreground">
            Илрүүлсэн өгүүлбэрийн тоо:{" "}
            <span className={`font-semibold ${autoSentenceCount < 2 || autoSentenceCount > 5 ? "text-destructive" : "text-foreground"}`}>
              {autoSentenceCount}
            </span>
            {(autoSentenceCount < 2 || autoSentenceCount > 5) && " — 2–5 байх ёстой"}
          </p>
        )}
      </Field>
      <AudioPreview
        text={form.audio_text || form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── self_check ───────────────────────────────────────────────────────────────

function SelfCheckContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-xs text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
        Сурагч өөрийн хариуг жишиг хариулттай харьцуулан шалгана.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.self_check}
      />
      <Separator />
      <Field label="Анхны оролдлого (original_attempt)" hint="Сурагчийн бичсэн эх (AI/seed-ийн тохиолдолд)">
        <Textarea
          rows={3}
          value={form.original_attempt}
          onChange={(e) => set("original_attempt", e.target.value)}
          placeholder="Жнэ: Сурагчийн буруу бичсэн эх…"
          className="resize-y"
        />
      </Field>
      <Field label="Жишиг хариулт" required error={errors.model_answer}>
        <Textarea
          rows={3}
          value={form.model_answer}
          onChange={(e) => {
            set("model_answer", e.target.value);
            set("correct_answer", e.target.value);
          }}
          placeholder="Жнэ: Зөв бичигдсэн хувилбар…"
          className="resize-y border-green-500/30"
        />
      </Field>
      <Field label="Харьцуулах горим">
        <div className="flex gap-3">
          {(["side_by_side", "highlight_diff"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set("comparison_mode", mode)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                form.comparison_mode === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {mode === "side_by_side" ? "Хажуу тал" : "Ялгааг тодруулах"}
            </button>
          ))}
        </div>
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── v3: match_pairs ──────────────────────────────────────────────────────────

type PairGenStatus = "idle" | "generating" | "ready" | "error";

function MatchPairsContent({ form, set, errors }: SubProps) {
  const imageSide = deriveImageSide(form.task_type);
  const isImageTask = imageSide !== "none";

  // per-pair generation status (UI only; base64 stored in form.pairImages)
  const [genStatus, setGenStatus] = useState<Record<number, PairGenStatus>>({});

  const parsedPairs = form.pairs_text
    .split("\n")
    .map((line) => {
      const sep = line.includes("|") ? "|" : "—";
      const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
      return left && right ? { left, right } : null;
    })
    .filter(Boolean) as Array<{ left: string; right: string }>;

  async function handleGenerate(i: number, subject: string) {
    setGenStatus((s) => ({ ...s, [i]: "generating" }));
    try {
      const res = await generateImage(buildImagePrompt(subject), form.grade_band);
      set("pairImages", { ...form.pairImages, [i]: res.base64 });
      setGenStatus((s) => ({ ...s, [i]: "ready" }));
    } catch {
      setGenStatus((s) => ({ ...s, [i]: "error" }));
    }
  }

  function handleDiscard(i: number) {
    const next = { ...form.pairImages };
    delete next[i];
    set("pairImages", next);
    setGenStatus((s) => ({ ...s, [i]: "idle" }));
  }

  const bannerText = isImageTask
    ? "Зүүн талд текст, баруун талд зургийн үг бичнэ үү."
    : null;

  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-xs text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
        {bannerText ?? (
          <>
            Мөр бүрт{" "}
            <code className="rounded bg-violet-200 px-1 dark:bg-violet-800">зүүн | баруун</code>{" "}
            хэлбэрээр бичнэ үү.
          </>
        )}
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.match_pairs}
      />
      <Separator />
      <Field label="Хосуудын жагсаалт" required error={errors.pairs_text} hint="Мөр бүрт нэг хос — 'зүүн | баруун' (2–6 хос)">
        <textarea
          rows={6}
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.pairs_text}
          onChange={(e) => {
            set("pairs_text", e.target.value);
            // reset pair images when pairs change
            set("pairImages", {});
            setGenStatus({});
          }}
          placeholder={"м | нар\nн | мод\nг | гэр"}
        />
      </Field>

      {/* Per-pair image generation panel */}
      {isImageTask && parsedPairs.length > 0 && (
        <div className="rounded-md border border-border">
          <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Зургийн хосууд
          </p>
          <div className="divide-y divide-border">
            {parsedPairs.map((pair, i) => {
              const subject = pair.right;
              const textSide = pair.left;
              const status = genStatus[i] ?? (form.pairImages[i] ? "ready" : "idle");
              const base64 = form.pairImages[i];

              return (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                  {/* text chip */}
                  <span className="mt-0.5 rounded border px-2 py-0.5 text-xs font-medium shrink-0">
                    {textSide}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground shrink-0">→</span>

                  {/* image side */}
                  <div className="flex flex-1 items-start gap-2 flex-wrap">
                    <span className="mt-0.5 rounded border border-dashed border-violet-400 bg-violet-50 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 shrink-0">
                      {subject}
                    </span>

                    {status === "idle" && (
                      <button
                        type="button"
                        onClick={() => handleGenerate(i, subject)}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Зураг үүсгэх
                      </button>
                    )}
                    {status === "generating" && (
                      <span className="text-xs text-muted-foreground animate-pulse">Үүсгэж байна…</span>
                    )}
                    {status === "error" && (
                      <button
                        type="button"
                        onClick={() => handleGenerate(i, subject)}
                        className="rounded border border-destructive/40 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Дахин оролдох
                      </button>
                    )}
                    {status === "ready" && base64 && (
                      <div className="flex items-start gap-2">
                        <img
                          src={`data:image/png;base64,${base64}`}
                          alt={subject}
                          className="h-12 w-12 rounded border border-border object-contain"
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleGenerate(i, subject)}
                            className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Дахин үүсгэх
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDiscard(i)}
                            className="rounded border border-destructive/40 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Устгах
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── v3: assemble_word ────────────────────────────────────────────────────────

function AssembleWordContent({ form, set, errors }: SubProps) {
  const segments = form.tiles_text.trim().split(/\s+/).filter(Boolean);
  const isSyllable = form.task_type === "TT_1_4";

  return (
    <>
      <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
        {isSyllable ? (
          <>Сурагч холилдсон үеүүдийг зөв дарааллаар угсрана. Үеүүдийг{" "}
          <strong>зайгаар тусгаарлаж</strong> зөв дарааллаар бичнэ үү.</>
        ) : (
          <>Сурагч холилдсон сегментүүдийг зөв дарааллаар угсрана. Сегментүүдийг{" "}
          <strong>зайгаар тусгаарлаж</strong> зөв дарааллаар бичнэ үү.</>
        )}
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={isSyllable ? PROMPT_SUGGESTIONS.assemble_syllable : PROMPT_SUGGESTIONS.assemble_word}
      />
      <Separator />
      <Field
        label={isSyllable ? "Зөв дарааллын үеүүд" : "Зөв дарааллын сегментүүд"}
        required
        error={errors.tiles_text}
        hint={isSyllable ? "Зайгаар тусгаарлан зөв дарааллаар бичнэ үү (≥2 үе)" : "Зайгаар тусгаарлан зөв дарааллаар бичнэ үү (≥2 хэсэг)"}
      >
        <input
          type="text"
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.tiles_text}
          onChange={(e) => set("tiles_text", e.target.value)}
          placeholder={isSyllable ? "Жнэ: гэр эл" : "Жнэ: г э р э л"}
        />
      </Field>
      {segments.length >= 2 && (
        <div className="rounded-md bg-muted/40 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Урьдчилан харагдац</p>
          <div className="flex flex-wrap gap-1.5">
            {segments.map((seg, i) => (
              <span key={i} className="rounded border border-primary/30 bg-primary/5 px-2.5 py-1 font-mono text-sm font-medium">
                {seg}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Угсраад:{" "}
            <span className="font-mono font-semibold text-foreground">{segments.join("")}</span>
          </p>
        </div>
      )}
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── v3: tap_find_error ───────────────────────────────────────────────────────

function TapFindErrorContent({ form, set, errors }: SubProps) {
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

// ─── Metadata ────────────────────────────────────────────────────────────────

function MetadataSection({ form, set, groups }: Pick<ContentFormProps, "form" | "set" | "toggleList" | "groups">) {
  const showPartial = groups.includes("dictation") || groups.includes("mini_text");

  return (
    <>
      <Separator />
      <p className="text-sm font-semibold">Мета өгөгдөл</p>
      <div className={`grid gap-4 ${showPartial ? "grid-cols-2" : "grid-cols-1"}`}>
        <Field label="Зарцуулах хугацаа (секунд)">
          <Input
            type="number"
            min={5}
            value={form.estimated_time_seconds}
            onChange={(e) => set("estimated_time_seconds", e.target.value)}
          />
        </Field>
        {showPartial && (
          <Field label="Хэсэгчилсэн оноо">
            <div className="flex h-9 items-center gap-2">
              <Checkbox
                id="allow_partial_meta"
                checked={form.allow_partial}
                onCheckedChange={(c) => set("allow_partial", c === true)}
              />
              <label htmlFor="allow_partial_meta" className="cursor-pointer text-sm text-muted-foreground">
                Тийм
              </label>
            </div>
          </Field>
        )}
      </div>
    </>
  );
}

// ─── copy (TT_7_1) ────────────────────────────────────────────────────────────

function CopyContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-200">
        Сурагч харуулсан текстийг хуулж бичнэ.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.copy}
      />
      <Separator />
      <Field label="Хуулах текст" required error={errors.text_to_copy}>
        <Textarea
          rows={3}
          value={form.text_to_copy}
          onChange={(e) => set("text_to_copy", e.target.value)}
          placeholder="Жнэ: нар мод гэр"
          className="resize-y font-medium"
        />
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── visual_memory (TT_7_2) ──────────────────────────────────────────────────

function VisualMemoryContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200">
        Текстийг товч харуулаад нуун, сурагч санасан зүйлээ бичнэ.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        promptSuggestions={PROMPT_SUGGESTIONS.visual_memory}
      />
      <Separator />
      <Field label="Тогтоох текст" required error={errors.correct_answer}>
        <Textarea
          rows={2}
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: нар гэрэл"
          className="resize-y font-medium"
        />
      </Field>
      <Field label="Харуулах хугацаа (секунд, 2–10)" error={errors.display_seconds}>
        <Input
          type="number"
          min={2}
          max={10}
          value={form.display_seconds}
          onChange={(e) => set("display_seconds", parseInt(e.target.value, 10) || 3)}
        />
      </Field>
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── audio fill (TT_2_4, TT_3_2, TT_4_4) ────────────────────────────────────

function AudioFillContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
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

function ImageFillContent({ form, set, errors, onImageGenerated }: SubProps) {
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
      <ImagePreview
        correctAnswer={form.context_word || form.correct_answer}
        imageDescription={form.image_description}
        onDescriptionChange={(desc) => set("image_description", desc)}
        onGenerated={onImageGenerated}
        gradeBand={form.grade_band}
      />
      <FeedbackFields form={form} set={set} />
    </>
  );
}

// ─── audio sentence fill (TT_7_5) ────────────────────────────────────────────

function AudioSentenceFillContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
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

export function ContentForm({ form, set, toggleList, groups, errors, taskType, audioPreview, onAudioGenerated, imagePreview, onImageGenerated }: ContentFormProps) {
  const TypeContent = TYPE_CONTENT_MAP[taskType];

  if (!TypeContent) {
    return <p className="text-sm text-muted-foreground">Даалгаврын төрөл сонгоно уу.</p>;
  }

  return (
    <div className="space-y-4">
      <TypeContent
        form={form}
        set={set}
        errors={errors}
        audioPreview={audioPreview}
        onAudioGenerated={onAudioGenerated}
        imagePreview={imagePreview}
        onImageGenerated={onImageGenerated}
      />
      <MetadataSection form={form} set={set} toggleList={toggleList} groups={groups} />
    </div>
  );
}
