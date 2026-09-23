import type { Editor } from "@tiptap/core";
import { BACKGROUND_NODES, DOC_MARK, DOC_NODE } from "@/lib/article-body";
import type { ColorValue } from "@/lib/article-types";

/**
 * Applying a Colour from the menu (Admin-Alpha#9). Kept apart from the menu's
 * React code so the selection-walking logic — the part most worth getting
 * right (never colouring a link, replacing colour with highlight and back)
 * — reads as plain editor operations.
 */

/** True when the selection is non-empty and every character in it carries the link mark. */
export function isSelectionOnlyLink(editor: Editor): boolean {
  const { state } = editor;
  const { from, to, empty } = state.selection;
  if (empty) return false;
  let sawText = false;
  let onlyLink = true;
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return;
    sawText = true;
    if (!node.marks.some((m) => m.type.name === DOC_MARK.link)) onlyLink = false;
  });
  return sawText && onlyLink;
}

/** True when the current selection is inside a subheading — text colour there applies to the whole heading, and highlight doesn't apply at all. */
export function isHeadingActive(editor: Editor): boolean {
  return editor.isActive(DOC_NODE.heading);
}

const BACKGROUND_NODE_NAMES: readonly string[] = BACKGROUND_NODES;

/**
 * The Block kind the selection is inside that can carry a `background`, or
 * `null` (nothing selected, or a Block kind — divider, media — that can't).
 * Looks at the selection's top-level ancestor specifically, not
 * `editor.isActive(type)` for each candidate type: a list item's own content
 * is itself a `paragraph` node (`ListItem.extend({ content: DOC_NODE.paragraph })`
 * in extensions.ts), so `isActive("paragraph")` is also true with the cursor
 * inside a list — which would set `background` on that inner wrapper
 * paragraph instead of the list, a value `docToBlocks`'s `listItems()` never
 * reads back out.
 */
export function activeBackgroundNode(editor: Editor): (typeof BACKGROUND_NODES)[number] | null {
  const { $from } = editor.state.selection;
  if ($from.depth < 1) return null;
  const topLevelType = $from.node(1).type.name;
  return BACKGROUND_NODE_NAMES.includes(topLevelType) ? (topLevelType as (typeof BACKGROUND_NODES)[number]) : null;
}

/** Sets or clears (`null`) a mark across the selection, skipping any text that carries the link mark and removing `otherMark` from the text it does apply to (color/highlight are mutually exclusive). */
function applyMark(editor: Editor, markName: string, otherMarkName: string, color: ColorValue | null): void {
  const { state, view } = editor;
  const { from, to, empty } = state.selection;
  if (empty) return;
  const markType = state.schema.marks[markName];
  const otherType = state.schema.marks[otherMarkName];
  const tr = state.tr;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return;
    const start = Math.max(pos, from);
    const end = Math.min(pos + node.nodeSize, to);
    if (start >= end) return;
    if (node.marks.some((m) => m.type.name === DOC_MARK.link)) return;
    tr.removeMark(start, end, otherType);
    if (color) tr.addMark(start, end, markType.create({ color }));
    else tr.removeMark(start, end, markType);
  });
  view.dispatch(tr);
  editor.commands.focus();
}

/** Sets or clears the selected words' text colour; on a heading, colours the whole heading instead. */
export function applyTextColor(editor: Editor, color: ColorValue | null): void {
  if (isHeadingActive(editor)) {
    editor.chain().focus().updateAttributes(DOC_NODE.heading, { color }).run();
    return;
  }
  applyMark(editor, DOC_MARK.color, DOC_MARK.highlight, color);
}

/** Sets or clears the selected words' highlight. Not applicable inside a heading (no selection-menu path calls this there). */
export function applyHighlight(editor: Editor, color: ColorValue | null): void {
  applyMark(editor, DOC_MARK.highlight, DOC_MARK.color, color);
}

/** Sets or clears the current Block's background. No-op when the selection isn't inside a Block kind that can carry one. */
export function applyBackground(editor: Editor, color: ColorValue | null): void {
  const type = activeBackgroundNode(editor);
  if (!type) return;
  editor.chain().focus().updateAttributes(type, { background: color }).run();
}
