"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { ImageOff, Link2, Pencil, PlayCircle, X } from "lucide-react";
import type { PreservedBlock } from "@/lib/article-body";
import { cn } from "@/lib/utils";
import { getMediaDialog } from "./media-dialog-store";

/**
 * Canvas rendering + click-to-edit for an image, video or link card Block —
 * the three kinds `PreservedBlockNode` carries as one atom. Clicking anywhere
 * on the card reopens the matching dialog pre-filled, per spec #5; a small ×
 * removes the Block outright, since it's an atom a plain Backspace on an
 * empty selection won't reach.
 */
export function MediaBlockView({ node, updateAttributes, editor, selected, deleteNode }: ReactNodeViewProps) {
  const block = node.attrs.block as PreservedBlock | null;

  function edit() {
    if (!block || !editor.isEditable) return;
    const mediaDialog = getMediaDialog(editor);
    if (!mediaDialog) return;
    if (block.type === "image") {
      mediaDialog.open({ kind: "image", initial: block, onSubmit: (next) => updateAttributes({ block: next }) });
    } else if (block.type === "video") {
      mediaDialog.open({ kind: "video", initial: block, onSubmit: (next) => updateAttributes({ block: next }) });
    } else {
      mediaDialog.open({ kind: "link_card", initial: block, onSubmit: (next) => updateAttributes({ block: next }) });
    }
  }

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      onClick={edit}
      className={cn(
        "group relative my-4 cursor-pointer overflow-hidden rounded-lg border border-border transition-colors hover:border-ring",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      {!block ? (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-destructive">
          <ImageOff className="size-4 shrink-0" /> Блок дутуу
        </div>
      ) : block.type === "image" ? (
        <ImagePreview block={block} />
      ) : block.type === "video" ? (
        <VideoPreview block={block} />
      ) : (
        <LinkCardPreview block={block} />
      )}
      {editor.isEditable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode();
          }}
          aria-label="Блок устгах"
          className="absolute right-1.5 top-1.5 rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </NodeViewWrapper>
  );
}

function ImagePreview({ block }: { block: Extract<PreservedBlock, { type: "image" }> }) {
  const missingAlt = !block.alt.trim();
  return (
    <div className={cn(missingAlt && "outline outline-2 -outline-offset-2 outline-destructive")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size */}
      <img src={block.url} alt={block.alt} className="max-h-96 w-full object-cover" />
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
        <span className={cn("truncate", missingAlt ? "font-medium text-destructive" : "text-muted-foreground")}>
          {missingAlt ? "Alt тайлбар дутуу" : block.caption || "Зураг"}
        </span>
        <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
    </div>
  );
}

function VideoPreview({ block }: { block: Extract<PreservedBlock, { type: "video" }> }) {
  const src =
    block.provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${block.video_id}`
      : `https://player.vimeo.com/video/${block.video_id}`;
  return (
    <div className="relative aspect-video w-full bg-black">
      <iframe
        src={src}
        title={block.provider === "youtube" ? "YouTube видео" : "Vimeo видео"}
        className="pointer-events-none absolute inset-0 size-full"
        allowFullScreen
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
        <span className="flex items-center gap-1">
          <PlayCircle className="size-3.5" /> {block.provider === "youtube" ? "YouTube" : "Vimeo"}
        </span>
        <Pencil className="size-3.5 shrink-0" />
      </div>
    </div>
  );
}

function LinkCardPreview({ block }: { block: Extract<PreservedBlock, { type: "link_card" }> }) {
  return (
    <div className="flex items-center gap-3 p-3">
      {block.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size
        <img src={block.image.url} alt={block.image.alt} className="size-16 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
          <Link2 className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{block.title}</p>
        {block.description && <p className="truncate text-xs text-muted-foreground">{block.description}</p>}
        <p className="truncate text-xs text-muted-foreground/80">{block.url}</p>
      </div>
      <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
    </div>
  );
}
