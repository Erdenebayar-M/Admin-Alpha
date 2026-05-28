"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Field, ToggleChip, ComboSelect, SuggestInput, SuggestTextarea, ChipInput } from "./shared";
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: 'гэрэл' үгийн диктант"
          suggestions={["Үгийн диктант", "Дуу сонсоод бич", "Зөв бичих дасгал"]}
        />
      </Field>
      <Field label="Заавар текст" required error={errors.prompt_text} hint="Сурагчид харуулах заавар">
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Сонсоод бич."
          suggestions={["Сонсоод бич.", "Дуу сонсоод бичнэ үү.", "Анхааралтай сонсоод бичнэ үү."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Өгүүлбэрийн диктант"
          suggestions={["Өгүүлбэрийн диктант", "Өгүүлбэр бичих дасгал", "Сонсоод өгүүлбэр бич"]}
        />
      </Field>
      <Field label="Заавар текст" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Өгүүлбэрийг сонсоод бич."
          suggestions={["Өгүүлбэрийг сонсоод бич.", "Сонсоод өгүүлбэрийг бичнэ үү.", "Анхааралтай сонсоод бичнэ үү."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Дуу сонсоод бич"
          suggestions={["Дуу сонсоод бич", "Аудио диктант", "Тоглуулж сонсоод бичнэ үү"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Дууг тоглуулж сонсоод үгийг бич."
          suggestions={["Дууг тоглуулж сонсоод үгийг бич.", "Аудио сонсоод бичнэ үү.", "Тоглуулж сонсоод зөв бич."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Зурагт тохирох үг бич"
          suggestions={["Зурагт тохирох үг бич", "Зургийн нэрийг бич", "Зураг харж бичнэ үү"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Зураг дээрх зүйлийн нэрийг бичнэ үү."
          suggestions={["Зураг дээрх зүйлийн нэрийг бичнэ үү.", "Зурагт тохирох үгийг бич.", "Зургийг харж нэрийг бичнэ үү."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Сонсоод бич"
          suggestions={["Сонсоод бич", "Үгийн багц диктант", "Олон үг сонсоод бич"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Сайтар сонсоод бичнэ үү."
          suggestions={["Сайтар сонсоод бичнэ үү.", "Сонсоод үгсийг бичнэ үү.", "Анхааралтай сонсоод бич."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Алдаа олж зас"
          suggestions={["Алдаа олж зас", "Бичгийн алдаа засах", "Зөв хэлбэрт оруул"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Доорх текстийн алдааг олж засна уу."
          suggestions={["Доорх текстийн алдааг олж засна уу.", "Алдааг олж, зөв хэлбэрийг бич.", "Текстийн бичгийн алдааг засна уу."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Зөв бичигдсэн үгийг сонго"
          suggestions={["Зөв бичигдсэн үгийг сонго", "Аль нь зөв вэ?", "Зөв хэлбэрийг сонго"]}
        />
      </Field>
      <Field label="Асуулт / Заавар" required error={errors.prompt_text} hint="Сурагчид харуулах асуулт">
        <SuggestTextarea
          rows={2}
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Аль нь зөв бичигдсэн бэ?"
          suggestions={["Аль нь зөв бичигдсэн бэ?", "Зөв үгийг сонгоно уу.", "Зөв бичигдсэн хэлбэрийг сонго."]}
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
        hint="Хамгийн багадаа 2 буруу сонголт нэмнэ үү"
      >
        <ChipInput
          value={form.expected_answers}
          onChange={(v) => set("expected_answers", v)}
          placeholder="Буруу сонголт бичээд Enter дарна..."
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Цоорхой бөглөх"
          suggestions={["Цоорхой бөглөх", "Дутуу үгийг бөглөнө үү", "Зөв үгийг нөхнэ үү"]}
        />
      </Field>
      <Field label="Цоорхойтой өгүүлбэр" required error={errors.prompt_text} hint="'___' тэмдгээр цоорхойг тэмдэглэ">
        <SuggestTextarea
          rows={2}
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Бид ___ руу явна."
          suggestions={["Цоорхойг бөглөнө үү.", "Дутуу үгийг бичнэ үү.", "Зөв үгийг нөхнэ үү."]}
          className="font-medium"
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
        hint="Хамгийн багадаа 2 буруу сонголт нэмнэ үү"
      >
        <ChipInput
          value={form.expected_answers}
          onChange={(v) => set("expected_answers", v)}
          placeholder="Буруу сонголт бичээд Enter дарна..."
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Үсэг тааруулах"
          suggestions={["Үсэг тааруулах", "Үсгийн дараалал", "Холилдсон үсэг"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Үсгүүдийг зөв байрлуулж үг бичнэ үү."
          suggestions={["Үсгүүдийг зөв байрлуулж үг бичнэ үү.", "Холилдсон үсгүүдийг зөв эрэмбэлнэ үү.", "Үсгийн дарааллыг зөв болго."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Үгийн төгсгөлийг бичнэ үү"
          suggestions={["Үгийн төгсгөлийг бич", "Дутуу хэсгийг нөхнэ үү", "Үгийн дутуу хэсэг"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text} hint="Ямар хэсгийг бичих вэ гэдгийг тодорхой зааж өгнө">
        <SuggestTextarea
          rows={2}
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Дараах үгийн дутуу хэсгийг нөхөж бич: сургу___"
          suggestions={["Дутуу хэсгийг нөхөж бич.", "Үгийн дутуу хэсгийг бичнэ үү.", "Цоорхойг зөв үгээр нөхнэ үү."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Зөв/буруу тодорхойлох"
          suggestions={["Зөв/буруу тодорхойлох", "Бичиг зөв үү?", "Зөв эсэхийг шалга"]}
        />
      </Field>
      <Field label="Шалгах өгүүлбэр" required error={errors.prompt_text} hint="Сурагч энэ өгүүлбэр зөв эсэхийг шалгана">
        <SuggestTextarea
          rows={2}
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder={'Жнэ: "Би сургууль руу явна" гэсэн зөв бичигдсэн үү?'}
          suggestions={["Доорх өгүүлбэр зөв бичигдсэн үү?", "Бичлэг зөв эсэхийг тодорхойлно уу.", "Энэ өгүүлбэр зөв үү?"]}
          className="font-medium"
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Зурагт тохирох үг олох"
          suggestions={["Зурагт тохирох үг олох", "Зургийн нэр сонгох", "Зураг — үг тааруулах"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Зураг дээрх зүйлийн нэрийг сонгоно уу."
          suggestions={["Зураг дээрх зүйлийн нэрийг сонгоно уу.", "Зурагт тохирох үгийг сонгоно уу.", "Зургийг харж зөв үгийг сонго."]}
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
        hint="Хамгийн багадаа 2 буруу сонголт нэмнэ үү"
      >
        <ChipInput
          value={form.expected_answers}
          onChange={(v) => set("expected_answers", v)}
          placeholder="Буруу сонголт бичээд Enter дарна..."
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Өгүүлбэрийг зөв бичнэ үү"
          suggestions={["Өгүүлбэрийг зөв бичнэ үү", "Дахин зөв бичих", "Зөв хэлбэрт оруул"]}
        />
      </Field>
      <Field label="Заавар" required error={errors.prompt_text}>
        <SuggestInput
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Дараах текстийг зөв хэлбэрээр дахин бичнэ үү."
          suggestions={["Дараах текстийг зөв хэлбэрээр дахин бичнэ үү.", "Алдааг засаж дахин бичнэ үү.", "Зөв хэлбэрээр бичнэ үү."]}
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
        <SuggestInput
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="Жнэ: Миний гэр бүл"
          suggestions={["Миний гэр бүл", "Өөрийгөө танилцуул", "Миний дуртай зүйл"]}
        />
      </Field>
      <Field label="Сэдэв / Заавар" required error={errors.prompt_text} hint="Сурагчид ямар сэдвээр бичих вэ">
        <SuggestTextarea
          rows={3}
          value={form.prompt_text}
          onChange={(v) => set("prompt_text", v)}
          placeholder="Жнэ: Өөрийн гэр бүлийнхнийхээ тухай 3-5 өгүүлбэр бичнэ үү."
          suggestions={["Өөрийн гэр бүлийнхнийхээ тухай 3-5 өгүүлбэр бичнэ үү.", "Дуртай зүйлийнхээ тухай бичнэ үү.", "Сургуулийн өдөр тухай бичнэ үү."]}
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

      <div className={`grid gap-4 ${showPartial ? "grid-cols-2" : "grid-cols-1"}`}>
        <Field label="Зарцуулах хугацаа (секунд)" hint="Даалгаврын хугацаа">
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
  // G12
  TT_LISTEN_CHOOSE:          ChooseCorrectContent,
  TT_LETTER_FILL:            FillBlankContent,
  TT_IMAGE_WORD_MATCH:       ImageMatchContent,
  TT_COPY_WRITE:             RewriteContent,
  TT_CHOOSE_CORRECT:         ChooseCorrectContent,
  TT_FILL_WRITE:             FillBlankContent,
  TT_MISSING_LETTER:         FillBlankContent,
  TT_WORD_SET_DICTATION:     ListenDictationContent,
  TT_CAPITAL_PUNCTUATION:    CorrectionContent,
  TT_SIMPLE_SUFFIX:          ChooseCorrectContent,
  TT_FIND_ERROR:             CorrectionContent,
  TT_SELF_CHECK:             FreeWriteContent,
  TT_TWO_WORD_DICTATION:     WordDictationContent,
  TT_WORD_ENDING:            FillBlankContent,
  TT_SENTENCE_FILL:          FillBlankContent,
  TT_MIXED_REVIEW:           ChooseCorrectContent,
  // G24
  TT_WORD_FORM_CHOOSE:       ChooseCorrectContent,
  TT_LONG_VOWEL_FILL:        FillBlankContent,
  TT_REDUCED_VOWEL:          FillBlankContent,
  TT_SUFFIX_CHOOSE:          ChooseCorrectContent,
  TT_SHORT_SENTENCE_DICTATION: SentenceDictationContent,
  TT_FIX_ERROR:              CorrectionContent,
  TT_CONSONANT_CONFUSION:    ChooseCorrectContent,
  TT_WORD_FORM_FIX:          CorrectionContent,
  TT_LONG_VOWEL_IN_SENTENCE: ChooseCorrectContent,
  TT_REDUCED_VOWEL_IN_SENTENCE: FillBlankContent,
  TT_CASE_SUFFIX:            ChooseCorrectContent,
  TT_BASIC_COMMA:            CorrectionContent,
  TT_TWO_SENTENCE_DICTATION: SentenceDictationContent,
  TT_FIND_OMITTED_LETTER:    CorrectionContent,
  TT_MIXED_WORD_SET:         ChooseCorrectContent,
  TT_SUFFIX_WRITE:           FillBlankContent,
  TT_SENTENCE_BOUNDARY:      CorrectionContent,
  TT_MINI_TEXT_DICTATION:    SentenceDictationContent,
  TT_OWN_WRITING_CORRECTION: FreeWriteContent,
  TT_LONG_VOWEL_CHALLENGE:   ChooseCorrectContent,
  TT_COMPOUND_SUFFIX:        FillBlankContent,
  TT_MIXED_CHECKPOINT:       ChooseCorrectContent,
  TT_EXPLAINED_CORRECTION:   CorrectionContent,
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
