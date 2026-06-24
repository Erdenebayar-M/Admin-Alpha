"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import { importWords } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import type { WordImportResult } from "@/lib/types";

const REASON_LABELS: Record<string, string> = {
  review: "Хяналтын жагсаалт (Хянах_үгс)",
  duplicate: "Давхардсан",
  orthography: "Алдаатай бичлэг",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportWordsModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const showPageToast = useModalStore((s) => s.showPageToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<WordImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    setLoading(false);
    setCommitting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFile(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
    setPreview(null);
    setError(null);
    setLoading(true);
    try {
      const result = await importWords(selected, false);
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Файл уншихад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setCommitting(true);
    setError(null);
    try {
      const result = await importWords(file, true);
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      await queryClient.invalidateQueries({ queryKey: ["word-facets"] });
      showPageToast({
        type: "success",
        message: `${result.imported ?? result.summary.kept} үг оруулсан (${result.prefix}-)`,
      });
      handleClose(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Оруулахад алдаа гарлаа");
      setCommitting(false);
    }
  }

  const s = preview?.summary;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Үгийн сан — xlsx оруулах</DialogTitle>
          <DialogClose className="text-muted-foreground transition-colors hover:text-foreground">✕</DialogClose>
        </DialogHeader>

        <DialogBody className="px-6 py-5">
          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <FileSpreadsheet className="size-5" />
            {file ? file.name : "Ангилсан үгсийн .xlsx файл сонгох"}
          </button>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Файлыг боловсруулж байна…
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && s && (
            <div className="mt-5 space-y-4">
              {/* Replace warning */}
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-foreground">
                  Энэ үйлдэл <span className="font-semibold">{preview.prefix}-</span> кодтой
                  {preview.grade != null ? ` ${preview.grade}-р ангийн` : ""} бүх үгийг устгаж,
                  доорх <span className="font-semibold">{s.kept}</span> үгээр солино. Бусад анги болон
                  хуучин үгс хэвээр үлдэнэ.
                </p>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="Уншсан" value={s.parsed} />
                <Stat label="Оруулах" value={s.kept} tone="primary" />
                <Stat label="Хянах хасалт" value={s.removed_review} />
                <Stat label="Давхардал" value={s.removed_duplicate} />
                <Stat label="Алдаатай" value={s.removed_orthography} />
              </div>

              {/* Dropped word list */}
              {preview.dropped && preview.dropped.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Хасагдсан үгс ({preview.dropped.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.dropped.map((d, i) => (
                      <span
                        key={`${d.no}-${i}`}
                        title={`${REASON_LABELS[d.reason] ?? d.reason}${d.detail ? ` — ${d.detail}` : ""}`}
                        className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                      >
                        {d.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Цуцлах
          </button>
          <button
            type="button"
            disabled={!preview || loading || committing}
            onClick={handleConfirm}
            className={cn(
              "flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {committing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Баталгаажуулж оруулах
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "primary" }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
      <div className={cn("text-lg font-bold tabular-nums", tone === "primary" ? "text-primary" : "text-foreground")}>
        {value}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
