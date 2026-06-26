"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import { patchWord } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import type { WordBankEntry } from "@/lib/types";

const REDERIVE = new Set(["word", "part_of_speech", "meaning_type"]);
const GRADES = ["G1", "G2", "G3", "G4"];

interface Form {
  word: string;
  category: string;
  part_of_speech: string;
  meaning_type: string;
  app_level: string;
  grade_band: string[];
  spelling_tag: string;
  suggested_exercises: string;
  meaning_complexity: string;
  spelling_complexity: string;
  morph_complexity: string;
}

function toForm(w: WordBankEntry): Form {
  return {
    word: w.word,
    category: w.category ?? "",
    part_of_speech: w.part_of_speech ?? "",
    meaning_type: w.meaning_type ?? "",
    app_level: w.app_level ?? "",
    grade_band: w.grade_band ?? [],
    spelling_tag: w.spelling_tag ?? "",
    suggested_exercises: w.suggested_exercises ?? "",
    meaning_complexity: w.meaning_complexity?.toString() ?? "",
    spelling_complexity: w.spelling_complexity?.toString() ?? "",
    morph_complexity: w.morph_complexity?.toString() ?? "",
  };
}

function buildUpdates(form: Form, dirty: Set<string>): Record<string, unknown> {
  const u: Record<string, unknown> = {};
  if (dirty.has("word")) u.word = form.word.trim();
  if (dirty.has("category")) u.category = form.category;
  if (dirty.has("part_of_speech")) u.part_of_speech = form.part_of_speech || null;
  if (dirty.has("meaning_type")) u.meaning_type = form.meaning_type || null;
  if (dirty.has("app_level")) u.app_level = form.app_level || null;
  if (dirty.has("grade_band")) u.grade_band = form.grade_band;
  if (dirty.has("spelling_tag")) u.spelling_tag = form.spelling_tag || null;
  if (dirty.has("suggested_exercises")) u.suggested_exercises = form.suggested_exercises || null;
  if (dirty.has("meaning_complexity"))
    u.meaning_complexity = form.meaning_complexity ? parseInt(form.meaning_complexity, 10) : null;
  if (dirty.has("spelling_complexity"))
    u.spelling_complexity = form.spelling_complexity ? parseInt(form.spelling_complexity, 10) : null;
  if (dirty.has("morph_complexity"))
    u.morph_complexity = form.morph_complexity ? parseInt(form.morph_complexity, 10) : null;
  return u;
}

interface Props {
  word: WordBankEntry;
  onClose: () => void;
}

const fieldCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";

function Field({
  label,
  rederives,
  children,
  hint,
}: {
  label: string;
  rederives?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {label}
        {rederives && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            ↺ re-derives
          </span>
        )}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EditWordModal({ word, onClose }: Props) {
  const queryClient = useQueryClient();
  const showPageToast = useModalStore((s) => s.showPageToast);

  const [form, setForm] = useState<Form>(() => toForm(word));
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
    setError(null);
  }

  const willRederive = [...dirty].some((f) => REDERIVE.has(f));

  async function handleSave() {
    if (dirty.size === 0) return;
    const updates = buildUpdates(form, dirty);
    if (Object.keys(updates).length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const result = await patchWord(word.id, updates);
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      showPageToast({
        type: "success",
        message: `"${word.word}" засагдлаа${result.rederived ? " · чадварын баганууд дахин тооцоологдлоо" : ""}`,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа");
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="large">
        <DialogHeader>
          <div>
            <DialogTitle>Үг засах — {word.word}</DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {word.id}
              {willRederive && (
                <span className="ml-2 font-semibold text-primary">
                  ↺ чадварын баганууд дахин тооцоологдоно
                </span>
              )}
            </p>
          </div>
          <DialogClose className="text-muted-foreground transition-colors hover:text-foreground">✕</DialogClose>
        </DialogHeader>

        <DialogBody className="px-6 py-5">
          <div className="space-y-5">
            {/* Core */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Үндсэн мэдээлэл
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Үг" rederives>
                <input
                  className={fieldCls}
                  value={form.word}
                  onChange={(e) => setField("word", e.target.value)}
                  placeholder="ном"
                />
              </Field>
              <Field label="Ангилал (category)">
                <input
                  className={fieldCls}
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  placeholder="Амьтад"
                />
              </Field>
              <Field label="Үгийн аймаг" rederives>
                <input
                  className={fieldCls}
                  value={form.part_of_speech}
                  onChange={(e) => setField("part_of_speech", e.target.value)}
                  placeholder="нэр үг"
                />
              </Field>
              <Field label="Утгын төрөл" rederives hint="зурагтай → бодит/зурагтай холбож болно">
                <input
                  className={fieldCls}
                  value={form.meaning_type}
                  onChange={(e) => setField("meaning_type", e.target.value)}
                />
              </Field>
            </div>

            {/* Grade & level */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Анги & түвшин
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Анги (grade_band)">
                <div className="flex flex-wrap gap-3 pt-1">
                  {GRADES.map((g) => (
                    <label key={g} className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={form.grade_band.includes(g)}
                        onChange={(e) =>
                          setField(
                            "grade_band",
                            e.target.checked
                              ? [...form.grade_band, g]
                              : form.grade_band.filter((x) => x !== g),
                          )
                        }
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Апп түвшин (app_level)">
                <input
                  className={fieldCls}
                  value={form.app_level}
                  onChange={(e) => setField("app_level", e.target.value)}
                  placeholder="M0–M5"
                />
              </Field>
            </div>

            {/* Complexity */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Төвөгшлийн түвшин
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Утгын (1–5)">
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={fieldCls}
                  value={form.meaning_complexity}
                  onChange={(e) => setField("meaning_complexity", e.target.value)}
                />
              </Field>
              <Field label="Зөв бичих (1–4)">
                <input
                  type="number"
                  min={1}
                  max={4}
                  className={fieldCls}
                  value={form.spelling_complexity}
                  onChange={(e) => setField("spelling_complexity", e.target.value)}
                />
              </Field>
              <Field label="Морфологийн (1–3)">
                <input
                  type="number"
                  min={1}
                  max={3}
                  className={fieldCls}
                  value={form.morph_complexity}
                  onChange={(e) => setField("morph_complexity", e.target.value)}
                />
              </Field>
            </div>

            {/* Tags */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Тэмдэглэгээ
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Зөв бичих tag">
                <input
                  className={fieldCls}
                  value={form.spelling_tag}
                  onChange={(e) => setField("spelling_tag", e.target.value)}
                />
              </Field>
              <Field label="Санал болгох дасгал">
                <input
                  className={fieldCls}
                  value={form.suggested_exercises}
                  onChange={(e) => setField("suggested_exercises", e.target.value)}
                />
              </Field>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </DialogBody>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-xs text-muted-foreground">
            {dirty.size > 0 ? `${dirty.size} талбар өөрчлөгдсөн` : ""}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Болих
            </button>
            <button
              type="button"
              disabled={saving || dirty.size === 0}
              onClick={handleSave}
              className={cn(
                "flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {!saving && willRederive && <RefreshCw className="size-4" />}
              Хадгалах
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
