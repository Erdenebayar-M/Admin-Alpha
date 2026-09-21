"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { generateBlockId } from "@/lib/article-body";
import { uploadArticleImage } from "@/lib/api";
import { isHttpUrl, type LinkCardBlock } from "@/lib/article-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkCardBlockDialogProps {
  open: boolean;
  initial: LinkCardBlock | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (block: LinkCardBlock) => void;
}

/** Insert or edit a link card Block: url/title typed by hand — the server never fetches the url, per ADR 0001. */
export function LinkCardBlockDialog({ open, initial, onOpenChange, onSubmit }: LinkCardBlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Холбоосын карт засах" : "Холбоосын карт нэмэх"}</DialogTitle>
        </DialogHeader>
        {open && (
          <LinkCardBlockForm
            key={initial?.id ?? "new"}
            initial={initial}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LinkCardBlockForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial: LinkCardBlock | null;
  onCancel: () => void;
  onSubmit: (block: LinkCardBlock) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? null);
  const [touched, setTouched] = useState(false);
  const urlValid = isHttpUrl(url.trim());
  const canSubmit = urlValid && title.trim().length > 0;

  const upload = useMutation({
    mutationFn: uploadArticleImage,
    onSuccess: (result) => setImage({ url: result.url, alt: title.trim() || "Холбоосын зураг", width: result.width, height: result.height }),
  });

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      id: initial?.id ?? generateBlockId(),
      type: "link_card",
      url: url.trim(),
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(image ? { image } : {}),
    });
  }

  return (
    <DialogBody className="px-6 py-5">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="link-card-url">URL</Label>
          <Input
            id="link-card-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="https://…"
            aria-invalid={touched && !urlValid}
            autoFocus
          />
          {touched && !urlValid && <p className="text-xs text-destructive">http:// эсвэл https://-ээр эхэлсэн холбоос байх ёстой.</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-card-title">Гарчиг</Label>
          <Input
            id="link-card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !title.trim()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-card-description">Тайлбар (заавал биш)</Label>
          <Input id="link-card-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Зураг (заавал биш)</Label>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={pickFile}
          />
          {image ? (
            <div className="relative w-32 overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size */}
              <img src={image.url} alt="" className="aspect-video w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute right-1 top-1 rounded-md bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Зураг хасах"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              {upload.isPending ? "Байршуулж байна…" : "Зураг сонгох"}
            </Button>
          )}
          {upload.error && <p className="text-xs text-destructive">{upload.error.message}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Болих
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {initial ? "Хадгалах" : "Нэмэх"}
          </Button>
        </div>
      </form>
    </DialogBody>
  );
}
