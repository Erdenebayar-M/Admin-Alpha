"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import { createWord, getWordFacets } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import { WordFieldsGrid, EMPTY_FORM, toForm, type Form } from "./EditWordModal";
import type { WordBankEntry } from "@/lib/types";

function buildCreatePayload(form: Form): Record<string, unknown> {
  return {
    word: form.word.trim(),
    category: form.category.trim(),
    part_of_speech: form.part_of_speech || null,
    meaning_type: form.meaning_type || null,
    app_level: form.app_level || null,
    grade_band: form.grade_band,
    spelling_tag: form.spelling_tag || null,
    suggested_exercises: form.suggested_exercises || null,
    meaning_complexity: form.meaning_complexity ? parseInt(form.meaning_complexity, 10) : null,
    spelling_complexity: form.spelling_complexity ? parseInt(form.spelling_complexity, 10) : null,
    morph_complexity: form.morph_complexity ? parseInt(form.morph_complexity, 10) : null,
  };
}

interface Props {
  onClose: () => void;
  /** When creating from a row's "+" button — pre-fills every field with this word's values. */
  prototype?: WordBankEntry;
}

export function CreateWordModal({ onClose, prototype }: Props) {
  const queryClient = useQueryClient();
  const showPageToast = useModalStore((s) => s.showPageToast);

  const [form, setForm] = useState<Form>(() => (prototype ? toForm(prototype) : EMPTY_FORM));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: facets } = useQuery({
    queryKey: ["word-facets"],
    queryFn: getWordFacets,
    staleTime: 60_000,
  });

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleCreate() {
    if (!form.word.trim() || !form.category.trim()) {
      setError("Үг болон ангилал заавал бөглөнө үү");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createWord(buildCreatePayload(form));
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      showPageToast({ type: "success", message: `"${result.word}" үүсгэгдлээ` });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Үүсгэхэд алдаа гарлаа");
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="large">
        <DialogHeader>
          <div>
            <DialogTitle>Шинэ үг нэмэх</DialogTitle>
            {prototype && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                &quot;{prototype.word}&quot;-ийн талбаруудаас хуулбарлав — бүгдийг өөрчилж болно
              </p>
            )}
          </div>
          <DialogClose className="text-muted-foreground transition-colors hover:text-foreground">✕</DialogClose>
        </DialogHeader>

        <DialogBody className="px-6 py-5">
          <div className="space-y-5">
            <WordFieldsGrid form={form} setField={setField} facets={facets} />

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </DialogBody>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Болих
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className={cn(
              "flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Үүсгэх
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
