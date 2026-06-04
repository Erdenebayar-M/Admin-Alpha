"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Field, ToggleChip, SuggestInput, SuggestTextarea, ChipInput } from "./shared";
import { AudioPreview } from "./AudioPreview";
import type { AudioPreviewState } from "./AudioPreview";
import { ImagePreview } from "./ImagePreview";
import type { ImagePreviewState } from "./ImagePreview";
import type { FormState, ValidationErrors } from "@/hooks/useTaskForm";
import type { OptionGroup } from "@/lib/task-defaults";

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

// ─── Shared: title + prompt + feedback ───────────────────────────────────────

function CommonFields({ form, set, errors, titleSuggestions = [], promptSuggestions = [] }: SubProps & { titleSuggestions?: string[]; promptSuggestions?: string[] }) {
  return (
    <>
      <Field label="Гарчиг" required error={errors.title}>
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Даалгаврын товч нэр"
          suggestions={titleSuggestions}
        />
      </Field>
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
        titleSuggestions={["Зөв бичигдсэн үгийг сонго", "Аль нь зөв вэ?", "Зөв хэлбэрийг сонго"]}
        promptSuggestions={["Аль нь зөв бичигдсэн бэ?", "Зөв үгийг сонгоно уу.", "Зөв бичигдсэн хэлбэрийг сонго."]}
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
      <Field label="Аудио trigger">
        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="audio_trigger"
            checked={form.audio_trigger}
            onCheckedChange={(c) => set("audio_trigger", c === true)}
          />
          <label htmlFor="audio_trigger" className="cursor-pointer text-sm text-muted-foreground">
            Аудио тоглуулах trigger байна
          </label>
        </div>
      </Field>
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
        titleSuggestions={["Зурагт тохирох үг олох", "Зургийн нэр сонгох"]}
        promptSuggestions={["Зураг дээрх зүйлийн нэрийг сонгоно уу.", "Зурагт тохирох үгийг сонгоно уу."]}
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
      <Field label="Аудио trigger">
        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="audio_trigger_img"
            checked={form.audio_trigger}
            onCheckedChange={(c) => set("audio_trigger", c === true)}
          />
          <label htmlFor="audio_trigger_img" className="cursor-pointer text-sm text-muted-foreground">
            Аудио trigger байна
          </label>
        </div>
      </Field>
      <ImagePreview
        correctAnswer={form.correct_answer}
        imageDescription={form.image_description}
        onDescriptionChange={(desc) => set("image_description", desc)}
        onGenerated={onImageGenerated}
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
        titleSuggestions={["Дутуу үсэг нөхөх", "Цоорхой бөглөх"]}
        promptSuggestions={["Дутуу үсгийг бөглөнө үү.", "Зөв үсгийг нөхнэ үү."]}
      />
      <Separator />
      <Field label="Бүтэн зөв үг" required error={errors.context_word} hint="Үгийн бүх үсгийг оруулна">
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
        titleSuggestions={["Өгүүлбэр нөхөх", "Цоорхой бөглөх дасгал"]}
        promptSuggestions={["Цоорхойг зөв үгээр бөглөнө үү.", "Дутуу үгийг нөхнэ үү."]}
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
      <Field label="Бүтэн контекст өгүүлбэр" required error={errors.context_sentence} hint="Эх өгүүлбэрийг бүтнээр нь оруулна">
        <SuggestTextarea
          rows={2}
          value={form.context_sentence}
          onChange={(v) => set("context_sentence", v)}
          placeholder="Жнэ: Бид сургууль руу явна."
          suggestions={[]}
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
        titleSuggestions={["Алдаа олж зас", "Бичгийн алдаа засах"]}
        promptSuggestions={["Доорх текстийн алдааг олж засна уу.", "Алдааг олж, зөв хэлбэрийг бич."]}
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
      <Field label="Алдааны код" hint="Алдааны ангилал (заавал биш)">
        <Input
          value={form.error_type}
          onChange={(e) => set("error_type", e.target.value)}
          placeholder="Жнэ: C1"
        />
      </Field>
      <Field label="Санамж" hint="Сурагчид тусална (заавал биш)">
        <Input
          value={form.hint}
          onChange={(e) => set("hint", e.target.value)}
          placeholder="Жнэ: 'уу' ба 'у'-г ялга"
        />
      </Field>
      <Field label="Тайлбар" hint="Дэлгэрэнгүй тайлбар (заавал биш)">
        <Textarea
          rows={2}
          value={form.explanation}
          onChange={(e) => set("explanation", e.target.value)}
          placeholder="Жнэ: 'сургууль' үгэнд урт эгшиг хэрэглэнэ."
          className="resize-y"
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
        titleSuggestions={["Үгийн диктант", "Өгүүлбэрийн диктант", "Сонсоод бич"]}
        promptSuggestions={["Сонсоод бичнэ үү.", "Аудиог сонсоод бичнэ үү.", "Анхааралтай сонсоод бичнэ үү."]}
      />
      <Separator />
      <Field label="Цээжлэх текст" required error={errors.audio_text} hint="Аудио энэ текстийн дагуу үүснэ">
        <Textarea
          rows={2}
          value={form.audio_text}
          onChange={(e) => set("audio_text", e.target.value)}
          placeholder="Жнэ: Бид сургууль руу явна."
          className="resize-y"
        />
      </Field>
      <Field
        label="Зөвшөөрөгдсөн хариултууд"
        hint="Нэг мөрт нэг хариулт — олон зөв хэлбэр байж болно. Хоосон бол текстийг л хэрэглэнэ."
      >
        <Textarea
          rows={3}
          value={form.expected_answers}
          onChange={(e) => set("expected_answers", e.target.value)}
          placeholder={"Жнэ:\nсургууль руу явна\nСургууль руу явна."}
          className="resize-y font-mono text-xs"
        />
      </Field>
      <Field label="Хэсэгчилсэн оноо">
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
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч 2–5 өгүүлбэртэй мини эхийг сонсоод бичнэ.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={onAudioGenerated} onImageGenerated={() => {}}
        audioPreview={audioPreview} imagePreview={null}
        titleSuggestions={["Мини эхийн диктант", "Богино эх бичих"]}
        promptSuggestions={["Сонсоод бичнэ үү.", "Мини эхийг сонсоод бичнэ үү."]}
      />
      <Separator />
      <Field label="Цээжлэх эх" required error={errors.audio_text}>
        <Textarea
          rows={4}
          value={form.audio_text}
          onChange={(e) => set("audio_text", e.target.value)}
          placeholder="Жнэ: Бид сургууль руу явна. Маргааш бид далайд очно."
          className="resize-y"
        />
      </Field>
      <Field label="Өгүүлбэрийн тоо (2–5)" required error={errors.sentence_count}>
        <Input
          type="number"
          min={2}
          max={5}
          value={form.sentence_count}
          onChange={(e) => set("sentence_count", parseInt(e.target.value, 10) || 3)}
        />
      </Field>
      <Field label="Зөвшөөрөгдсөн хариултууд" hint="Нэг мөрт нэг хариулт. Хоосон бол аудио текстийг л хэрэглэнэ.">
        <Textarea
          rows={3}
          value={form.expected_answers}
          onChange={(e) => set("expected_answers", e.target.value)}
          placeholder={"Жнэ:\nБид сургууль руу явна. Маргааш бид далайд очно."}
          className="resize-y font-mono text-xs"
        />
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
        titleSuggestions={["Өөрийгөө шалгах", "Өөрийн бичвэр засвар"]}
        promptSuggestions={["Өөрийн хариуг жишиг хариулттай харьцуулна уу.", "Алдаагаа шалгана уу."]}
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

function MatchPairsContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-xs text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
        Мөр бүрт{" "}
        <code className="rounded bg-violet-200 px-1 dark:bg-violet-800">зүүн | баруун</code>{" "}
        хэлбэрээр бичнэ үү.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        titleSuggestions={["Холбож тааруулах дасгал", "Хосоор тааруулах"]}
        promptSuggestions={["Тохирох хосуудыг холбоно уу."]}
      />
      <Separator />
      <Field label="Хосуудын жагсаалт" required error={errors.pairs_text} hint="Мөр бүрт нэг хос — 'зүүн | баруун' (2–6 хос)">
        <textarea
          rows={6}
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.pairs_text}
          onChange={(e) => set("pairs_text", e.target.value)}
          placeholder={"м | нар\nн | мод\nг | гэр"}
        />
      </Field>
      {form.pairs_text && (
        <div className="rounded-md bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Урьдчилан харагдац</p>
          <div className="space-y-1.5">
            {form.pairs_text
              .split("\n")
              .map((line) => {
                const sep = line.includes("|") ? "|" : "—";
                const [left = "", right = ""] = line.split(sep).map((s) => s.trim());
                return left && right ? { left, right } : null;
              })
              .filter(Boolean)
              .map((pair, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="rounded border px-2 py-0.5 font-medium">{pair!.left}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded border px-2 py-0.5 font-medium">{pair!.right}</span>
                </div>
              ))}
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

  return (
    <>
      <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
        Сурагч холилдсон сегментүүдийг зөв дарааллаар угсрана. Сегментүүдийг{" "}
        <strong>зайгаар тусгаарлаж</strong> зөв дарааллаар бичнэ үү.
      </div>
      <Separator />
      <CommonFields
        form={form} set={set} errors={errors}
        onAudioGenerated={() => {}} onImageGenerated={() => {}}
        audioPreview={null} imagePreview={null}
        titleSuggestions={["Үсэг угсрах дасгал", "Угсрах"]}
        promptSuggestions={["Үсгүүдийг зөв байрлуулж үг бүтээнэ үү."]}
      />
      <Separator />
      <Field label="Зөв дарааллын сегментүүд" required error={errors.tiles_text} hint="Зайгаар тусгаарлан зөв дарааллаар бичнэ үү (≥2 хэсэг)">
        <input
          type="text"
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.tiles_text}
          onChange={(e) => set("tiles_text", e.target.value)}
          placeholder="Жнэ: г э р э л"
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
        titleSuggestions={["Алдаатай үгийг олж товш", "Алдаа олох дасгал"]}
        promptSuggestions={["Алдаатай үгийг олоод товшино уу.", "Буруу бичигдсэн үгийг товш."]}
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

// ─── TYPE_CONTENT_MAP ─────────────────────────────────────────────────────────

const TYPE_CONTENT_MAP: Record<string, React.FC<SubProps>> = {
  // G12 — choice
  TT_LISTEN_CHOOSE:          ChoiceContent,
  TT_CHOOSE_CORRECT:         ChoiceContent,
  TT_SIMPLE_SUFFIX:          ChoiceContent,
  TT_MIXED_REVIEW:           ChoiceContent,
  // G12 — choice + image
  TT_IMAGE_WORD_MATCH:       ImageChoiceContent,
  // G12 — word fill
  TT_LETTER_FILL:            WordFillContent,
  TT_FILL_WRITE:             WordFillContent,
  TT_MISSING_LETTER:         WordFillContent,
  TT_WORD_ENDING:            WordFillContent,
  // G12 — sentence fill
  TT_SENTENCE_FILL:          SentenceFillContent,
  // G12 — correction
  TT_COPY_WRITE:             CorrectionContent,
  TT_CAPITAL_PUNCTUATION:    CorrectionContent,
  TT_FIND_ERROR:             CorrectionContent,
  // G12 — dictation
  TT_WORD_SET_DICTATION:     DictationContent,
  TT_TWO_WORD_DICTATION:     DictationContent,
  // G12 — self_check
  TT_SELF_CHECK:             SelfCheckContent,
  // G24 — choice
  TT_WORD_FORM_CHOOSE:       ChoiceContent,
  TT_SUFFIX_CHOOSE:          ChoiceContent,
  TT_CONSONANT_CONFUSION:    ChoiceContent,
  TT_CASE_SUFFIX:            ChoiceContent,
  TT_MIXED_WORD_SET:         ChoiceContent,
  TT_LONG_VOWEL_CHALLENGE:   ChoiceContent,
  TT_MIXED_CHECKPOINT:       ChoiceContent,
  // G24 — word fill
  TT_LONG_VOWEL_FILL:        WordFillContent,
  TT_REDUCED_VOWEL:          WordFillContent,
  TT_REDUCED_VOWEL_IN_SENTENCE: SentenceFillContent,
  TT_SUFFIX_WRITE:           WordFillContent,
  TT_COMPOUND_SUFFIX:        WordFillContent,
  // G24 — sentence fill
  TT_LONG_VOWEL_IN_SENTENCE: SentenceFillContent,
  // G24 — correction
  TT_FIX_ERROR:              CorrectionContent,
  TT_WORD_FORM_FIX:          CorrectionContent,
  TT_BASIC_COMMA:            CorrectionContent,
  TT_FIND_OMITTED_LETTER:    CorrectionContent,
  TT_SENTENCE_BOUNDARY:      CorrectionContent,
  TT_EXPLAINED_CORRECTION:   CorrectionContent,
  // G24 — dictation
  TT_SHORT_SENTENCE_DICTATION: DictationContent,
  TT_TWO_SENTENCE_DICTATION:   DictationContent,
  // G24 — mini_text
  TT_MINI_TEXT_DICTATION:    MiniTextContent,
  // G24 — self_check
  TT_OWN_WRITING_CORRECTION: SelfCheckContent,
  // v3 interaction forms
  TT_MATCH_PAIRS:            MatchPairsContent,
  TT_ASSEMBLE_WORD:          AssembleWordContent,
  TT_TAP_FIND_ERROR:         TapFindErrorContent,
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
