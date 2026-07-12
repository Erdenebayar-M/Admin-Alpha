"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Pencil, Link2Off } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import {
  patchWord,
  deactivateWord,
  connectWordToRoot,
  disconnectWordFromRoot,
  getWord,
  getWords,
  getWordFacets,
} from "@/lib/api";
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

const smallBtn =
  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

/** Search-as-you-type field for picking an existing root word (or explicitly creating a new one). */
function RootConnectField({
  word,
  busy,
  run,
}: {
  word: WordBankEntry;
  busy: string | null;
  run: (label: string, fn: () => Promise<string>) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data } = useQuery({
    queryKey: ["word-root-search", debouncedQuery],
    queryFn: () => getWords({ q: debouncedQuery, active: "true", per_page: 8 }),
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  });

  const matches = (data?.words ?? []).filter((w) => w.id !== word.id);
  const hasExactMatch = matches.some((w) => w.word.toLowerCase() === debouncedQuery.toLowerCase());
  const showDropdown = open && debouncedQuery.length > 0;

  function select(value: string) {
    setQuery(value);
    setOpen(false);
  }

  return (
    <div className="flex items-end gap-2">
      <div className="relative flex flex-1 flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground">Үндэс үгэнд холбох</label>
        <input
          className={fieldCls}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="жишээ: авах"
        />
        {showDropdown && (
          <div className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover shadow-lg">
            {matches.map((w) => (
              <button
                key={w.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(w.word)}
                className="block w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
              >
                {w.word}
              </button>
            ))}
            {!hasExactMatch && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(debouncedQuery)}
                className="block w-full border-t border-dashed border-border px-3 py-1.5 text-left text-sm font-medium text-primary hover:bg-accent"
              >
                + Шинэ үндэс үг үүсгэх: &quot;{debouncedQuery}&quot;
              </button>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={!query.trim() || busy !== null}
        onClick={() =>
          run("connect", async () => {
            const r = await connectWordToRoot(word.id, query.trim());
            return `"${word.word}" → "${r.root_word}"${r.root_created ? " (шинэ үндэс үүсгэв)" : ""}`;
          })
        }
        className={cn(smallBtn, "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}
      >
        Холбох
      </button>
    </div>
  );
}

/** Root ↔ forms management: connect to a root, list forms, delete (detach/cascade). */
function RootFormsSection({
  word,
  onDone,
  onEditForm,
}: {
  word: WordBankEntry;
  onDone: (msg: string, keepOpen?: boolean) => void;
  onEditForm: (id: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<string>, keepOpen = false) {
    setBusy(label);
    setErr(null);
    try {
      const msg = await fn();
      onDone(msg, keepOpen);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(null);
    }
  }

  const hasForms = word.forms.length > 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Үндэс / Хэлбэрүүд
      </p>

      {word.root_word && (
        <p className="text-sm text-muted-foreground">
          Энэ үг <span className="font-medium text-foreground">{word.root_word.word}</span>-ийн хэлбэр.
        </p>
      )}

      {/* Connect to a root */}
      <RootConnectField word={word} busy={busy} run={run} />

      {/* Forms of this root */}
      {hasForms && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Хэлбэрүүд ({word.forms.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {word.forms.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground"
              >
                {f.word}
                <button
                  type="button"
                  title="Хэлбэрийг засах"
                  disabled={busy !== null}
                  onClick={() => onEditForm(f.id)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  title="Үндэс үгээс тасалах"
                  disabled={busy !== null}
                  onClick={() =>
                    run(
                      `disconnect-${f.id}`,
                      async () => {
                        await disconnectWordFromRoot(f.id);
                        return `"${f.word}" холбоос таслагдлаа`;
                      },
                      true,
                    )
                  }
                  className="text-muted-foreground transition-colors hover:text-amber-600"
                >
                  <Link2Off className="size-3" />
                </button>
                <button
                  type="button"
                  title="Хэлбэрийг идэвхгүй болгох"
                  disabled={busy !== null}
                  onClick={() =>
                    run(
                      `form-${f.id}`,
                      async () => {
                        await deactivateWord(f.id, "solo");
                        return `"${f.word}" идэвхгүй болголоо`;
                      },
                      true,
                    )
                  }
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("detach", async () => {
                  await deactivateWord(word.id, "detach");
                  return `"${word.word}" устгаж, хэлбэрүүдийг чөлөөллөө`;
                })
              }
              className={cn(smallBtn, "border-border bg-background text-foreground hover:bg-muted")}
            >
              Устгах (хэлбэрүүд үлдээх)
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("cascade", async () => {
                  await deactivateWord(word.id, "cascade");
                  return `"${word.word}" болон хэлбэрүүдийг устгалаа`;
                })
              }
              className={cn(smallBtn, "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20")}
            >
              Хэлбэрүүдийн хамт устгах
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
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

const CUSTOM_OPTION = "__custom__";

/** Select populated from known values (+ the current value if it isn't in the list), with an escape hatch to type a new one. */
function SelectOrCustom({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const known = new Set(options);
  if (value) known.add(value);
  const sorted = [...known].sort((a, b) => a.localeCompare(b, "mn"));

  const [customMode, setCustomMode] = useState(false);

  if (customMode) {
    return (
      <input
        autoFocus
        className={fieldCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (!value) setCustomMode(false);
        }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <select
      className={fieldCls}
      value={value || ""}
      onChange={(e) => {
        if (e.target.value === CUSTOM_OPTION) {
          onChange("");
          setCustomMode(true);
        } else {
          onChange(e.target.value);
        }
      }}
    >
      <option value="">—</option>
      {sorted.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
      <option value={CUSTOM_OPTION}>+ Шинэ утга нэмэх</option>
    </select>
  );
}

export function EditWordModal({ word, onClose }: Props) {
  const queryClient = useQueryClient();
  const showPageToast = useModalStore((s) => s.showPageToast);

  const [form, setForm] = useState<Form>(() => toForm(word));
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: facets } = useQuery({
    queryKey: ["word-facets"],
    queryFn: getWordFacets,
    staleTime: 60_000,
  });

  const [editFormId, setEditFormId] = useState<string | null>(null);
  const { data: editFormWord } = useQuery({
    queryKey: ["word", editFormId],
    queryFn: () => getWord(editFormId!),
    enabled: editFormId !== null,
  });

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
                <SelectOrCustom
                  value={form.category}
                  options={facets?.categories ?? []}
                  onChange={(v) => setField("category", v)}
                  placeholder="Амьтад"
                />
              </Field>
              <Field label="Үгийн аймаг" rederives>
                <SelectOrCustom
                  value={form.part_of_speech}
                  options={facets?.part_of_speech ?? []}
                  onChange={(v) => setField("part_of_speech", v)}
                  placeholder="нэр үг"
                />
              </Field>
              <Field label="Утгын төрөл" rederives hint="зурагтай → бодит/зурагтай холбож болно">
                <SelectOrCustom
                  value={form.meaning_type}
                  options={facets?.meaning_type ?? []}
                  onChange={(v) => setField("meaning_type", v)}
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

            {/* Root ↔ forms management */}
            <RootFormsSection
              word={word}
              onEditForm={(id) => setEditFormId(id)}
              onDone={(msg, keepOpen) => {
                queryClient.invalidateQueries({ queryKey: ["words"] });
                queryClient.invalidateQueries({ queryKey: ["word"] });
                showPageToast({ type: "success", message: msg });
                if (!keepOpen) onClose();
              }}
            />

            {editFormWord && (
              <EditWordModal word={editFormWord} onClose={() => setEditFormId(null)} />
            )}

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
