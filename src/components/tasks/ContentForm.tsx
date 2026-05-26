"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Field, ToggleChip, ComboSelect } from "./shared";
import { AudioPreview } from "./AudioPreview";
import type { AudioPreviewState } from "./AudioPreview";
import { ImagePreview } from "./ImagePreview";
import type { ImagePreviewState } from "./ImagePreview";
import type { FormState, ValidationErrors } from "@/hooks/useTaskForm";
import type { OptionGroup } from "@/lib/task-defaults";
import { ERROR_CODES, ERROR_LABELS } from "@/lib/task-defaults";

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

// ─── Dictation types ─────────────────────────────────────────────────────────

function WordDictationContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч дуу сонсоод үгийг бичнэ. Зөв бичигдэх үгээ оруулна уу.
      </div>
      <Field label="Бичигдэх үг" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: гэрэл"
        />
      </Field>
      <Field label="Гарчиг" required error={errors.title} hint="Даалгаврын товч нэр">
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: 'гэрэл' үгийн диктант"
        />
      </Field>
      <Field label="Заавар текст" required error={errors.prompt_text} hint="Сурагчид харуулах заавар">
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Сонсоод бич."
        />
      </Field>
      <AudioPreview
        text={form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackField form={form} set={set} />
    </>
  );
}

function SentenceDictationContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч өгүүлбэр сонсоод бичнэ. Зөв бичигдэх өгүүлбэрээ оруулна уу.
      </div>
      <Field label="Бичигдэх өгүүлбэр" required error={errors.correct_answer}>
        <Textarea
          rows={2}
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: Бид сургууль руу явна."
          className="resize-y"
        />
      </Field>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Өгүүлбэрийн диктант"
        />
      </Field>
      <Field label="Заавар текст" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Өгүүлбэрийг сонсоод бич."
        />
      </Field>
      <AudioPreview
        text={form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackField form={form} set={set} />
    </>
  );
}

function AudioPlayDictationContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч дуу тоглуулж сонсоод үгийг бичнэ.
      </div>
      <Field label="Бичигдэх үг" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: гэрэл"
        />
      </Field>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Дуу сонсоод бич"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Дууг тоглуулж сонсоод үгийг бич."
        />
      </Field>
      <AudioPreview
        text={form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackField form={form} set={set} />
    </>
  );
}

function ImageDictationContent({ form, set, errors, onAudioGenerated, onImageGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч зураг хараад тухайн зүйлийн нэрийг бичнэ.
      </div>
      <Field label="Зурагт харгалзах зөв үг" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: нар"
        />
      </Field>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Зурагт тохирох үг бич"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Зураг дээрх зүйлийн нэрийг бичнэ үү."
        />
      </Field>
      <ImagePreview
        defaultPrompt={form.correct_answer}
        onGenerated={onImageGenerated}
      />
      <AudioPreview
        text={form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackField form={form} set={set} />
    </>
  );
}

function ListenDictationContent({ form, set, errors, audioPreview, onAudioGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Сурагч сонсоод бичнэ.
      </div>
      <Field label="Бичигдэх текст" required error={errors.correct_answer}>
        <Textarea
          rows={2}
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: Бид сургууль руу явна."
          className="resize-y"
        />
      </Field>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Сонсоод бич"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Сайтар сонсоод бичнэ үү."
        />
      </Field>
      <AudioPreview
        text={form.correct_answer}
        slot="dictation"
        onGenerated={onAudioGenerated}
      />
      <FeedbackField form={form} set={set} />
    </>
  );
}

// ─── Non-dictation types ─────────────────────────────────────────────────────

function CorrectionContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
        Сурагчид алдаатай текст харуулна. Тэд алдааг олж засах ёстой.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Алдаа олж зас"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Доорх текстийн алдааг олж засна уу."
        />
      </Field>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Алдаатай текст (буруу)" required error={errors.incorrect_text} hint="Сурагчид энэ текстийг харуулна">
          <Textarea
            rows={3}
            value={form.incorrect_text}
            onChange={(e) => set("incorrect_text", e.target.value)}
            placeholder="Жнэ: Би сургуль руу явна."
            className="resize-y border-destructive/30"
          />
        </Field>
        <Field label="Зөв хэлбэр" required error={errors.correct_text} hint="Зөв засагдсан хувилбар">
          <Textarea
            rows={3}
            value={form.correct_text}
            onChange={(e) => set("correct_text", e.target.value)}
            placeholder="Жнэ: Би сургууль руу явна."
            className="resize-y border-green-500/30"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Алдааны төрөл" hint="Ямар төрлийн алдаа вэ?">
          <ComboSelect
            value={form.error_type}
            onChange={(v) => set("error_type", v)}
            placeholder="Сонгох…"
            options={[
              { value: "", label: "—" },
              ...ERROR_CODES.map((c) => ({ value: c, label: `${c} — ${ERROR_LABELS[c]}` })),
            ]}
          />
        </Field>
        <Field label="Санамж" hint="Сурагчид тусална (заавал биш)">
          <Input
            value={form.hint}
            onChange={(e) => set("hint", e.target.value)}
            placeholder="Жнэ: 'уу' ба 'у'-г ялга"
          />
        </Field>
      </div>
      <Field label="Анхны оруулга" hint="Сурагчийн хариултыг урьдчилан бөглөх (заавал биш)">
        <Input
          value={form.initial_text}
          onChange={(e) => set("initial_text", e.target.value)}
          placeholder="Сурагч энэ текст дээр засвар хийнэ"
        />
      </Field>
      <FeedbackField form={form} set={set} />
    </>
  );
}

function ChooseCorrectContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
        Сурагч хэд хэдэн сонголтоос зөв үгийг сонгоно.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Зөв бичигдсэн үгийг сонго"
        />
      </Field>
      <Field label="Асуулт / Заавар" required error={errors.prompt_text} hint="Сурагчид харуулах асуулт">
        <Textarea
          rows={2}
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Аль нь зөв бичигдсэн бэ?"
          className="resize-y"
        />
      </Field>
      <Separator />
      <Field label="Зөв хариулт" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: гэрэл"
          className="border-green-500/30"
        />
      </Field>
      <Field
        label="Буруу сонголтууд"
        required
        error={errors.expected_answers}
        hint="Мөр бүрд нэг буруу хариулт бичнэ (хамгийн багадаа 2)"
      >
        <Textarea
          rows={4}
          value={form.expected_answers}
          onChange={(e) => set("expected_answers", e.target.value)}
          placeholder={"гэрэлт\nгэрэлтэй\nгэрэлтгэ"}
          className="resize-y font-mono text-sm border-destructive/20"
        />
      </Field>
      <FeedbackField form={form} set={set} />
    </>
  );
}

function FillBlankContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        Өгүүлбэр дэх цоорхойг зөв үгээр бөглөнө. Цоорхойг <code className="rounded bg-emerald-200 px-1 dark:bg-emerald-800">___</code> тэмдэгээр тэмдэглэнэ.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Цоорхой бөглөх"
        />
      </Field>
      <Field label="Цоорхойтой өгүүлбэр" required error={errors.prompt_text} hint="'___' тэмдгээр цоорхойг тэмдэглэ">
        <Textarea
          rows={2}
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Бид ___ руу явна."
          className="resize-y font-medium"
        />
      </Field>
      <Separator />
      <Field label="Цоорхойд орох зөв үг" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: сургууль"
          className="border-green-500/30"
        />
      </Field>
      <Field
        label="Буруу сонголтууд"
        required
        error={errors.expected_answers}
        hint="Мөр бүрд нэг буруу хариулт (хамгийн багадаа 2)"
      >
        <Textarea
          rows={3}
          value={form.expected_answers}
          onChange={(e) => set("expected_answers", e.target.value)}
          placeholder={"сургуль\nсургулий\nсургулиа"}
          className="resize-y font-mono text-sm border-destructive/20"
        />
      </Field>
      <FeedbackField form={form} set={set} />
    </>
  );
}

function LetterArrangeContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 text-xs text-sky-800 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
        Холилдсон үсгүүдийг зөв дарааллаар байрлуулж үг бүтээнэ.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Үсэг тааруулах"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Үсгүүдийг зөв байрлуулж үг бичнэ үү."
        />
      </Field>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Холилдсон үсгүүд" hint="Сурагчид харуулах үсгийн дараалал">
          <Input
            value={form.initial_text}
            onChange={(e) => set("initial_text", e.target.value)}
            placeholder="Жнэ: р э г л э"
            className="font-mono tracking-widest"
          />
        </Field>
        <Field label="Зөв үг" required error={errors.correct_answer}>
          <Input
            value={form.correct_answer}
            onChange={(e) => set("correct_answer", e.target.value)}
            placeholder="Жнэ: гэрэл"
            className="border-green-500/30"
          />
        </Field>
      </div>
      <FeedbackField form={form} set={set} />
    </>
  );
}

function WordPartContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        Үгийн дутуу хэсгийг нөхөж бичнэ (эхлэл эсвэл төгсгөл).
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Үгийн төгсгөлийг бичнэ үү"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text} hint="Ямар хэсгийг бичих вэ гэдгийг тодорхой зааж өгнө">
        <Textarea
          rows={2}
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Дараах үгийн дутуу хэсгийг нөхөж бич: сургу___"
          className="resize-y"
        />
      </Field>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Дутуу үг (сурагчид харуулах)" hint="'___' тэмдгээр дутуу хэсгийг тэмдэглэ">
          <Input
            value={form.initial_text}
            onChange={(e) => set("initial_text", e.target.value)}
            placeholder="Жнэ: сургу___"
            className="font-mono"
          />
        </Field>
        <Field label="Бүтэн зөв үг" required error={errors.correct_answer}>
          <Input
            value={form.correct_answer}
            onChange={(e) => set("correct_answer", e.target.value)}
            placeholder="Жнэ: сургууль"
            className="border-green-500/30"
          />
        </Field>
      </div>
      <FeedbackField form={form} set={set} />
    </>
  );
}

function TrueFalseContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200">
        Сурагч өгүүлбэр зөв эсэхийг тодорхойлно. Зөв/буруу хариултыг сонгоно.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Зөв/буруу тодорхойлох"
        />
      </Field>
      <Field label="Шалгах өгүүлбэр" required error={errors.prompt_text} hint="Сурагч энэ өгүүлбэр зөв эсэхийг шалгана">
        <Textarea
          rows={2}
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder={'Жнэ: "Би сургууль руу явна" гэсэн зөв бичигдсэн үү?'}
          className="resize-y font-medium"
        />
      </Field>
      <Separator />
      <Field label="Зөв хариулт" required error={errors.correct_answer}>
        <div className="flex gap-3">
          {[
            { value: "Зөв", label: "Зөв (тийм)" },
            { value: "Буруу", label: "Буруу (үгүй)" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                set("correct_answer", opt.value);
                set("expected_answers", opt.value === "Зөв" ? "Зөв\nБуруу" : "Буруу\nЗөв");
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                form.correct_answer === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>
      <FeedbackField form={form} set={set} />
    </>
  );
}

function ImageMatchContent({ form, set, errors, onImageGenerated }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-pink-200 bg-pink-50/50 p-3 text-xs text-pink-800 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-200">
        Зурагт тохирох зөв үгийг сонгоно.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Зурагт тохирох үг олох"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Зураг дээрх зүйлийн нэрийг сонгоно уу."
        />
      </Field>
      <Separator />
      <Field label="Зөв хариулт (зурагт тохирох үг)" required error={errors.correct_answer}>
        <Input
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: нар"
          className="border-green-500/30"
        />
      </Field>
      <Field
        label="Буруу сонголтууд"
        required
        error={errors.expected_answers}
        hint="Мөр бүрд нэг буруу хариулт (хамгийн багадаа 2)"
      >
        <Textarea
          rows={3}
          value={form.expected_answers}
          onChange={(e) => set("expected_answers", e.target.value)}
          placeholder={"сар\nод\nүүл"}
          className="resize-y font-mono text-sm border-destructive/20"
        />
      </Field>
      <ImagePreview
        defaultPrompt={form.correct_answer}
        onGenerated={onImageGenerated}
      />
      <FeedbackField form={form} set={set} />
    </>
  );
}

function RewriteContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
        Сурагч эх текстийг зөв хэлбэрээр дахин бичнэ.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Өгүүлбэрийг зөв бичнэ үү"
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <Input
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Дараах текстийг зөв хэлбэрээр дахин бичнэ үү."
        />
      </Field>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Эх бичвэр (алдаатай)" required error={errors.initial_text} hint="Сурагч энэ текстийг дахин бичнэ">
          <Textarea
            rows={3}
            value={form.initial_text}
            onChange={(e) => set("initial_text", e.target.value)}
            placeholder="Жнэ: Би сургуль руу явна. Маргааш бид далайд ошно."
            className="resize-y border-destructive/30"
          />
        </Field>
        <Field label="Зөв хувилбар" required error={errors.correct_answer} hint="Зөв бичигдсэн хувилбар">
          <Textarea
            rows={3}
            value={form.correct_answer}
            onChange={(e) => set("correct_answer", e.target.value)}
            placeholder="Жнэ: Би сургууль руу явна. Маргааш бид далайд очно."
            className="resize-y border-green-500/30"
          />
        </Field>
      </div>
      <FeedbackField form={form} set={set} />
    </>
  );
}

function FreeWriteContent({ form, set, errors }: SubProps) {
  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-xs text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
        Сурагч сэдвийн дагуу чөлөөтэй бичнэ. Зөв хариулт байхгүй — үнэлгээний шалгуур бичнэ.
      </div>
      <Field label="Гарчиг" required error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жнэ: Миний гэр бүл"
        />
      </Field>
      <Field label="Сэдэв / Заавар" required error={errors.prompt_text} hint="Сурагчид ямар сэдвээр бичих вэ">
        <Textarea
          rows={3}
          value={form.prompt_text}
          onChange={(e) => set("prompt_text", e.target.value)}
          placeholder="Жнэ: Өөрийн гэр бүлийнхнийхээ тухай 3-5 өгүүлбэр бичнэ үү."
          className="resize-y"
        />
      </Field>
      <Separator />
      <Field label="Жишиг хариулт / Үнэлгээний шалгуур" required error={errors.correct_answer} hint="Багш үнэлэхэд хэрэглэнэ">
        <Textarea
          rows={3}
          value={form.correct_answer}
          onChange={(e) => set("correct_answer", e.target.value)}
          placeholder="Жнэ: Гэр бүлийн гишүүдийн нэр, тоо, харилцааг дурдсан байх."
          className="resize-y"
        />
      </Field>
      <FeedbackField form={form} set={set} />
    </>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function FeedbackField({ form, set }: { form: FormState; set: ContentFormProps["set"] }) {
  return (
    <Field label="Тайлбар (feedback)" hint="Хариулсны дараа сурагчид харуулах">
      <Textarea
        rows={2}
        value={form.feedback_text}
        onChange={(e) => set("feedback_text", e.target.value)}
        placeholder="Жнэ: Зөв! Сайн хийлээ."
        className="resize-y"
      />
    </Field>
  );
}

// ─── Metadata (shared) ──────────────────────────────────────────────────────

function MetadataSection({ form, set, toggleList, groups }: Pick<ContentFormProps, "form" | "set" | "toggleList" | "groups">) {
  const showPartial = groups.includes("dictation") || groups.includes("multiple_choice");

  return (
    <>
      <Separator />
      <p className="text-sm font-semibold">Мета өгөгдөл</p>

      <Field label="Алдааны зорилтууд">
        <div className="flex flex-wrap gap-2">
          {ERROR_CODES.map((code) => (
            <ToggleChip
              key={code}
              label={`${code} — ${ERROR_LABELS[code]}`}
              selected={form.error_targets.includes(code)}
              onClick={() => toggleList("error_targets", code)}
            />
          ))}
        </div>
        {form.error_targets.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.error_targets.map((code) => (
              <Badge key={code} variant="secondary">{code}</Badge>
            ))}
          </div>
        )}
      </Field>

      <div className={`grid gap-4 ${showPartial ? "grid-cols-3" : "grid-cols-2"}`}>
        <Field label="Зарцуулах хугацаа (секунд)" hint="Даалгаврын хугацаа">
          <Input
            type="number"
            min={5}
            value={form.estimated_time_seconds}
            onChange={(e) => set("estimated_time_seconds", e.target.value)}
          />
        </Field>
        <Field label="Давтах өдрүүд" hint="Таслалаар, жнэ: 1, 3, 7">
          <Input
            value={form.review_after_days}
            onChange={(e) => set("review_after_days", e.target.value)}
          />
        </Field>
        {showPartial && (
          <Field label="Хэсэгчилсэн оноо">
            <div className="flex h-9 items-center gap-2">
              <Checkbox
                id="allow_partial"
                checked={form.allow_partial}
                onCheckedChange={(c) => set("allow_partial", c === true)}
              />
              <label htmlFor="allow_partial" className="cursor-pointer text-sm text-muted-foreground">
                Тийм
              </label>
            </div>
          </Field>
        )}
      </div>
    </>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

const TYPE_CONTENT_MAP: Record<string, React.FC<SubProps>> = {
  TT1:  WordDictationContent,
  TT2:  SentenceDictationContent,
  TT3:  CorrectionContent,
  TT4:  AudioPlayDictationContent,
  TT5:  ImageDictationContent,
  TT6:  ListenDictationContent,
  TT7:  ChooseCorrectContent,
  TT8:  FillBlankContent,
  TT9:  LetterArrangeContent,
  TT10: WordPartContent,
  TT11: TrueFalseContent,
  TT12: ImageMatchContent,
  TT13: RewriteContent,
  TT14: FreeWriteContent,
};

export function ContentForm({ form, set, toggleList, groups, errors, taskType, audioPreview, onAudioGenerated, imagePreview, onImageGenerated }: ContentFormProps) {
  const TypeContent = TYPE_CONTENT_MAP[taskType];

  if (!TypeContent) {
    return <p className="text-sm text-muted-foreground">Даалгаврын төрөл сонгоно уу.</p>;
  }

  return (
    <div className="space-y-4">
      <TypeContent form={form} set={set} errors={errors} audioPreview={audioPreview} onAudioGenerated={onAudioGenerated} imagePreview={imagePreview} onImageGenerated={onImageGenerated} />
      <MetadataSection form={form} set={set} toggleList={toggleList} groups={groups} />
    </div>
  );
}
