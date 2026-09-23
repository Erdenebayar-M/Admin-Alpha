import type { Editor } from "@tiptap/core";
import { Fragment, type Node as ProseMirrorNode, type NodeRange } from "@tiptap/pm/model";
import { DOC_NODE } from "@/lib/article-body";

/**
 * Bullet/ordered list toggling (Admin-Alpha list conversion). Kept apart from
 * `block-commands.ts` because the multi-paragraph case below needs to reach
 * past Tiptap's stock `toggleBulletList`/`toggleOrderedList` into a direct
 * ProseMirror transform.
 *
 * `extensions.ts` restricts `listItem` to exactly one paragraph (never a
 * nested Block — CONTEXT.md's List/Marker entries). ProseMirror's
 * `wrapInList` (what the stock toggle commands use) can only wrap a
 * selection that, as a *whole*, already fits through `listItem`'s content
 * expression before any splitting into separate items happens
 * (`findWrappingInside` in `prosemirror-transform`) — so with an
 * exactly-one-paragraph `listItem`, selecting more than one paragraph always
 * failed that check and the toolbar button silently did nothing. A
 * single-paragraph selection never hit this, since nothing else needed to
 * fit through the same content match.
 *
 * `wrapParagraphsInList` bypasses `wrapInList` for that specific case: build
 * the finished `list > listItem+` structure directly (one item per selected
 * paragraph, each item's own paragraph kept as-is) and replace the selected
 * range with it in one step. `ListMarkerIntegrity`/`BlockIds` (both
 * `appendTransaction` plugins in extensions.ts) then insert each item's
 * Marker and the new list's `blockId` automatically, same as they already do
 * for the single-paragraph case.
 */

/** The paragraphs `range` spans, or `null` if any of its top-level children isn't a plain paragraph (already a list, a heading, mixed content, …). */
function paragraphsIn(range: NodeRange): ProseMirrorNode[] | null {
  const { parent, startIndex, endIndex } = range;
  const paragraphs: ProseMirrorNode[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    const child = parent.child(i);
    if (child.type.name !== DOC_NODE.paragraph) return null;
    paragraphs.push(child);
  }
  return paragraphs;
}

function wrapParagraphsInList(editor: Editor, listTypeName: typeof DOC_NODE.bulletList | typeof DOC_NODE.orderedList): boolean {
  const { state, view, schema } = editor;
  const { $from, $to } = state.selection;
  const range = $from.blockRange($to);
  const paragraphs = range && paragraphsIn(range);
  // A single paragraph (or nothing usable) is left to the stock toggle below — it already works.
  if (!range || !paragraphs || paragraphs.length < 2) return false;
  const itemType = schema.nodes[DOC_NODE.listItem];
  const listType = schema.nodes[listTypeName];
  const list = listType.create(null, Fragment.from(paragraphs.map((paragraph) => itemType.create(null, paragraph))));
  view.dispatch(state.tr.replaceWith(range.start, range.end, list));
  editor.commands.focus();
  return true;
}

/** Toggles the selection into/out of a bullet or ordered list — one item per selected paragraph. */
export function toggleList(editor: Editor, listTypeName: typeof DOC_NODE.bulletList | typeof DOC_NODE.orderedList): void {
  if (wrapParagraphsInList(editor, listTypeName)) return;
  const chain = editor.chain().focus();
  if (listTypeName === DOC_NODE.bulletList) chain.toggleBulletList().run();
  else chain.toggleOrderedList().run();
}
