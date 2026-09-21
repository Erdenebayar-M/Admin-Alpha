"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadArticleImage } from "@/lib/api";
import type { ArticleThumbnail } from "@/lib/article-types";
import type { ArticleImageUploadResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ThumbnailFieldProps {
  value: ArticleThumbnail | null;
  onChange: (thumbnail: ArticleThumbnail | null) => void;
  error?: string;
}

/**
 * Upload → describe → attach. The uploaded image stays pending (not part of
 * the Article) until alt text is entered, so a Thumbnail can never be attached
 * without one. Width/height come from the upload response, not the file.
 */
export function ThumbnailField({ value, onChange, error }: ThumbnailFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ArticleImageUploadResult | null>(null);
  const [alt, setAlt] = useState("");

  const upload = useMutation({
    mutationFn: uploadArticleImage,
    onSuccess: (result) => {
      setPending(result);
      setAlt(value?.alt ?? "");
    },
  });

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate(file);
  }

  function attach() {
    if (!pending || !alt.trim()) return;
    onChange({ url: pending.url, alt: alt.trim(), width: pending.width, height: pending.height });
    setPending(null);
    setAlt("");
  }

  function cancelPending() {
    setPending(null);
    setAlt("");
  }

  const shown = pending ?? value;

  return (
    <div className="space-y-2">
      <Label>Нүүр зураг</Label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={pickFile} />

      {shown ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size */}
          <img src={shown.url} alt={pending ? alt : value?.alt} className="aspect-video w-full object-cover" />
          {!pending && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1.5 top-1.5 rounded-md bg-background/80 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Нүүр зураг хасах"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className={cn(
            "flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground",
            error && "border-destructive",
          )}
        >
          {upload.isPending ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          {upload.isPending ? "Байршуулж байна…" : "Зураг байршуулах"}
        </button>
      )}

      {pending ? (
        <div className="space-y-2">
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Зургийн тайлбар (alt) — заавал"
            aria-label="Зургийн тайлбар"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={attach} disabled={!alt.trim()}>
              Хавсаргах
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelPending}>
              Болих
            </Button>
          </div>
          {!alt.trim() && <p className="text-xs text-muted-foreground">Хавсаргахын өмнө alt тайлбар оруулна уу.</p>}
        </div>
      ) : (
        value && (
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-muted-foreground" title={value.alt}>
              alt: {value.alt}
            </p>
            <Button size="xs" variant="outline" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? "Байршуулж байна…" : "Солих"}
            </Button>
          </div>
        )
      )}

      {upload.error && <p className="text-xs text-destructive">{upload.error.message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
