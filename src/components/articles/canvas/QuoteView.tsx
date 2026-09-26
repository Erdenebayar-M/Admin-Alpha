"use client";

import { SITE_CLASS } from "../site-tokens";
import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";

/** A quote Block in the canvas: the quoted text is editable inline, the optional attribution in its own field below. */
export function QuoteView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const attribution = typeof node.attrs.attribution === "string" ? node.attrs.attribution : "";
  return (
    <NodeViewWrapper as="blockquote" className={SITE_CLASS.quote}>
      {/* The “ ” are CSS pseudo-elements: not in the DOM tree, so the caret and selection can't enter them and they never reach the saved Body. */}
      <NodeViewContent<"p"> as="p" className="before:select-none before:content-['“'] after:select-none after:content-['”']" />
      <div contentEditable={false} className={`mt-2 flex items-center gap-1 text-sm not-italic ${SITE_CLASS.muted}`}>
        <span aria-hidden>—</span>
        <input
          value={attribution}
          onChange={(e) => updateAttributes({ attribution: e.target.value || null })}
          readOnly={!editor.isEditable}
          placeholder="Эх сурвалж (заавал биш)"
          aria-label="Ишлэлийн эх сурвалж"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[color:var(--site-muted)]/60"
        />
      </div>
    </NodeViewWrapper>
  );
}
