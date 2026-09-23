"use client";

import { useEffect, useState } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { DOC_NODE } from "@/lib/article-body";
import { colorCss } from "@/lib/article-colors";
import { isColorValue } from "@/lib/article-types";
import { cn } from "@/lib/utils";

/**
 * A List item's Marker (ADR 0005): a real, atomic, selectable node — not the
 * browser's native `::marker` — so an author can select it, alone or
 * together with the item's text, and colour it via the same "Text colour"
 * swatch used everywhere else (see `color-commands.ts`). Its glyph/number is
 * never stored: it's computed here from the node's position among its
 * siblings, so it can never drift out of sync with the list's own items.
 * `ListMarkerIntegrity` guarantees one always exists as the first child of
 * every list item's paragraph; `OrderedListContinuation` is the only thing
 * that ever sets an ordered list's `start` after it's created.
 *
 * Subscribes to every editor transaction, not just changes to this node's
 * own attrs — a sibling item being added, removed or reordered elsewhere in
 * the list is exactly what should move this marker's number, and Tiptap only
 * re-renders a node view automatically when its own node/decorations change.
 */
export function ListMarkerView({ node, selected, getPos, editor }: ReactNodeViewProps) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const bump = () => forceUpdate((n) => n + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  const color = node.attrs.color as string | null;
  const glyph = markerGlyph(editor, getPos());

  return (
    <NodeViewWrapper
      as="span"
      contentEditable={false}
      className={cn("mr-1 select-none", selected && "rounded outline outline-2 outline-ring")}
      style={isColorValue(color) ? { color: colorCss(color) } : undefined}
    >
      {glyph}
    </NodeViewWrapper>
  );
}

/** "•" for a bullet item; "`start + index`." for an ordered item — read off the marker's own position, never stored. */
function markerGlyph(editor: Editor, pos: number | undefined): string {
  if (pos === undefined) return "•";
  try {
    const $pos = editor.state.doc.resolve(pos);
    const list = $pos.node(-2);
    const index = $pos.index(-2);
    if (list.type.name === DOC_NODE.orderedList) {
      const start = typeof list.attrs.start === "number" ? list.attrs.start : 1;
      return `${start + index}.`;
    }
    return "•";
  } catch {
    return "•";
  }
}
