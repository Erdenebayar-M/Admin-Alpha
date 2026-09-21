"use client";

import { useState } from "react";
import { generateBlockId } from "@/lib/article-body";
import { parseVideoUrl, type VideoBlock } from "@/lib/article-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VideoBlockDialogProps {
  open: boolean;
  initial: VideoBlock | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (block: VideoBlock) => void;
}

/** A watch url the stored `{provider, video_id}` round-trips to, so editing has something to start from — the pasted url itself is never stored. */
function canonicalUrl(block: VideoBlock): string {
  return block.provider === "youtube" ? `https://youtu.be/${block.video_id}` : `https://vimeo.com/${block.video_id}`;
}

/** Insert or edit a video Block: paste a YouTube/Vimeo url, parsed and previewed client-side with the same rules as the backend's `parseVideoUrl`. */
export function VideoBlockDialog({ open, initial, onOpenChange, onSubmit }: VideoBlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Видео засах" : "Видео нэмэх"}</DialogTitle>
        </DialogHeader>
        {open && (
          <VideoBlockForm key={initial?.id ?? "new"} initial={initial} onCancel={() => onOpenChange(false)} onSubmit={onSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function VideoBlockForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial: VideoBlock | null;
  onCancel: () => void;
  onSubmit: (block: VideoBlock) => void;
}) {
  const [url, setUrl] = useState(initial ? canonicalUrl(initial) : "");
  const [touched, setTouched] = useState(false);
  const trimmed = url.trim();
  const parsed = trimmed ? parseVideoUrl(trimmed) : null;
  const invalid = touched && trimmed !== "" && !parsed;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!parsed) return;
    onSubmit({ id: initial?.id ?? generateBlockId(), type: "video", provider: parsed.provider, video_id: parsed.video_id });
  }

  return (
    <DialogBody className="px-6 py-5">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="video-block-url">YouTube эсвэл Vimeo холбоос</Label>
          <Input
            id="video-block-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="https://youtu.be/… эсвэл https://vimeo.com/…"
            aria-invalid={invalid}
            autoFocus
          />
          {invalid && <p className="text-xs text-destructive">Зөвхөн YouTube эсвэл Vimeo холбоос дэмжигдэнэ.</p>}
        </div>

        {parsed && (
          <div className="overflow-hidden rounded-lg border border-border bg-black">
            <iframe
              src={
                parsed.provider === "youtube"
                  ? `https://www.youtube-nocookie.com/embed/${parsed.video_id}`
                  : `https://player.vimeo.com/video/${parsed.video_id}`
              }
              title="Урьдчилан үзэх"
              className="aspect-video w-full"
              allowFullScreen
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Болих
          </Button>
          <Button type="submit" disabled={!parsed}>
            {initial ? "Хадгалах" : "Нэмэх"}
          </Button>
        </div>
      </form>
    </DialogBody>
  );
}
