"use client";

import { SITE_CLASS } from "../site-tokens";
import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";

/** A quote Block in the canvas: the quoted text is editable inline, the optional attribution in its own field below. */
export function QuoteView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const attribution = typeof node.attrs.attribution === "string" ? node.attrs.attribution : "";
  return (
    <NodeViewWrapper as="blockquote" className={SITE_CLASS.quote}>
      <NodeViewContent<"p"> as="p" className="before:content-['“'] after:content-['”']" />
      <div contentEditable={false} className="mt-1 flex items-center gap-1 text-sm not-italic text-[color:var(--site-muted)]">
        <span aria-hidden>—</span>
        <input
          value={attribution}
          onChange={(e) => updateAttributes({ attribution: e.target.value || null })}
          readOnly={!editor.isEditable}
          placeholder="Эх сурвалж (заавал биш)"
          aria-label="Ишлэлийн эх сурвалж"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </NodeViewWrapper>
  );
}
