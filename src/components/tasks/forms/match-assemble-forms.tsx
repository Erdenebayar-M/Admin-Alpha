"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Field } from "../shared";
import { CommonFields, FeedbackFields } from "./sections";
import { PROMPT_SUGGESTIONS } from "./prompt-suggestions";
import { deriveImageSide } from "@/lib/task-defaults";
import { generateImage } from "@/lib/api";
import { buildImagePrompt } from "@/lib/imagePromptTemplate";
import type { SubProps } from "./types";

// ─── v3: match_pairs ──────────────────────────────────────────────────────────

type PairGenStatus = "idle" | "generating" | "ready" | "error";

export function MatchPairsContent({ form, set, errors }: SubProps) {
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

export function AssembleWordContent({ form, set, errors }: SubProps) {
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
