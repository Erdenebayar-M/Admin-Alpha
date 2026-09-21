"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2 } from "lucide-react";
import { generateBlockId } from "@/lib/article-body";
import { uploadArticleImage } from "@/lib/api";
import type { ImageBlock } from "@/lib/article-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageBlockDialogProps {
  open: boolean;
  initial: ImageBlock | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (block: ImageBlock) => void;
}

/**
 * Insert or edit an image Block: upload (or replace) the file, then an
 * optional caption. Alt text isn't required to submit here — a missing one
 * is flagged red on the Block in the canvas and blocks Save instead, per
 * spec #5, so staff can drop a picture in first and describe it after.
 */
export function ImageBlockDialog({ open, initial, onOpenChange, onSubmit }: ImageBlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Зураг засах" : "Зураг нэмэх"}</DialogTitle>
        </DialogHeader>
        {open && (
          <ImageBlockForm key={initial?.id ?? "new"} initial={initial} onCancel={() => onOpenChange(false)} onSubmit={onSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImageBlockForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial: ImageBlock | null;
  onCancel: () => void;
  onSubmit: (block: ImageBlock) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [asset, setAsset] = useState<{ url: string; width: number; height: number } | null>(
    initial ? { url: initial.url, width: initial.width ?? 0, height: initial.height ?? 0 } : null,
  );
  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");

  const upload = useMutation({
    mutationFn: uploadArticleImage,
    onSuccess: (result) => setAsset(result),
  });

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!asset) return;
    onSubmit({
      id: initial?.id ?? generateBlockId(),
      type: "image",
      url: asset.url,
      alt: alt.trim(),
      ...(caption.trim() ? { caption: caption.trim() } : {}),
      ...(asset.width ? { width: asset.width } : {}),
      ...(asset.height ? { height: asset.height } : {}),
    });
  }

  return (
    <DialogBody className="px-6 py-5">
      <form className="space-y-4" onSubmit={submit}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={pickFile}
        />
        {asset ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size */}
              <img src={asset.url} alt="" className="max-h-64 w-full object-cover" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              {upload.isPending ? "Байршуулж байна…" : "Солих"}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            {upload.isPending ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {upload.isPending ? "Байршуулж байна…" : "Файл сонгох"}
          </button>
        )}
        {upload.error && <p className="text-xs text-destructive">{upload.error.message}</p>}

        <div className="space-y-2">
          <Label htmlFor="image-block-alt">Alt тайлбар</Label>
          <Input id="image-block-alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Зургийн дэлгэрэнгүй тайлбар" />
          <p className="text-xs text-muted-foreground">Alt тайлбаргүй зураг хадгалахын өмнө улаанаар тэмдэглэгдэнэ.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="image-block-caption">Тайлбар бичвэр (заавал биш)</Label>
          <Input id="image-block-caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Болих
          </Button>
          <Button type="submit" disabled={!asset}>
            {initial ? "Хадгалах" : "Нэмэх"}
          </Button>
        </div>
      </form>
    </DialogBody>
  );
}
