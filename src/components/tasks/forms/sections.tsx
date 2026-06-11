"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Field, SuggestTextarea } from "../shared";
import type { ContentFormProps, SubProps } from "./types";

// ─── Shared: title + prompt + feedback ───────────────────────────────────────

export function CommonFields({ form, set, errors, promptSuggestions = [] }: SubProps & { promptSuggestions?: string[] }) {
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

export function FeedbackFields({ form, set }: Pick<SubProps, "form" | "set">) {
  return (
    <>
      <Textarea
        rows={2}
        value={form.feedback_text}
        onChange={(e) => set("feedback_text", e.target.value)}
        placeholder="Жнэ: 'гэрэл' — г+э+р+э+л"
        className="resize-y"
      />
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

// ─── Metadata ────────────────────────────────────────────────────────────────

export function MetadataSection({ form, set, groups }: Pick<ContentFormProps, "form" | "set" | "toggleList" | "groups">) {
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
