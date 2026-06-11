"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Field } from "../shared";
import { AudioPreview } from "../AudioPreview";
import { CommonFields, FeedbackFields } from "./sections";
import { PROMPT_SUGGESTIONS } from "./prompt-suggestions";
import type { SubProps } from "./types";

// ─── dictation ────────────────────────────────────────────────────────────────

export function DictationContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
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

export function MiniTextContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
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

// ─── copy (TT_7_1) ────────────────────────────────────────────────────────────

export function CopyContent({ form, set, errors }: SubProps) {
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

export function VisualMemoryContent({ form, set, errors }: SubProps) {
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
