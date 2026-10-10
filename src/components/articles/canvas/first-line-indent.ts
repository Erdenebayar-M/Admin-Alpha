import { Extension, type Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { DOC_NODE } from "@/lib/article-body";

/**
 * First-line indent (ADR 0006): an on/off `indent` attr on a top-level,
 * left-aligned paragraph. Tab turns it on and Shift+Tab off for every such
 * paragraph the selection touches; no levels, no tab characters in the text.
 */

/** Whether a top-level node may carry a First-line indent: a paragraph, left-aligned. */
function canCarryIndent(node: PMNode): boolean {
  return node.type.name === DOC_NODE.paragraph && !node.attrs.alignment;
}

/** Positions of the top-level paragraphs the selection touches that may carry an indent. A selected media Block or text inside a list, quote or callout touches none. */
function indentablePositions(state: EditorState): number[] {
  const { selection, doc } = state;
  if (selection instanceof NodeSelection) return [];
  const positions: number[] = [];
  doc.nodesBetween(selection.from, selection.to, (node, pos, parent) => {
    if (parent === doc && canCarryIndent(node)) positions.push(pos);
    return false;
  });
  return positions;
}

/** Sets the First-line indent on or off for the paragraphs the selection touches. Returns whether anything changed. */
export function setFirstLineIndent(editor: Editor, on: boolean): boolean {
  const { state, view } = editor;
  const tr = state.tr;
  for (const pos of indentablePositions(state)) {
    if (state.doc.nodeAt(pos)?.attrs.indent !== on) tr.setNodeAttribute(pos, "indent", on);
  }
  if (!tr.docChanged) return false;
  view.dispatch(tr);
  return true;
}

/**
 * Tab / Shift+Tab. Both are always consumed, so Tab never moves focus out of
 * the canvas, even where it does nothing (lists, subheadings, quotes,
 * callouts, centred/right-aligned text, a selected media Block). Must be
 * listed before `SlashCommand` in `articleCanvasExtensions()` (later entries
 * get first refusal), so the open `/` menu's own Tab handling still wins,
 * and after `ListItem`, whose Shift+Tab would otherwise lift an item out.
 *
 * After every change, an indent left on a paragraph that can no longer carry
 * it (centred or right-aligned, or wrapped into a list) is cleared, so the
 * canvas never shows an indent the save would drop, and switching back to
 * left doesn't bring it back.
 */
export const FirstLineIndent = Extension.create({
  name: "firstLineIndent",
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        setFirstLineIndent(this.editor, true);
        return true;
      },
      "Shift-Tab": () => {
        setFirstLineIndent(this.editor, false);
        return true;
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("firstLineIndent"),
        appendTransaction(transactions, _old, state) {
          if (!transactions.some((t) => t.docChanged)) return null;
          const tr = state.tr;
          state.doc.descendants((node, pos, parent) => {
            if (node.type.name === DOC_NODE.paragraph && node.attrs.indent && (parent !== state.doc || !canCarryIndent(node))) {
              tr.setNodeAttribute(pos, "indent", false);
            }
            return !node.isTextblock;
          });
          return tr.docChanged ? tr : null;
        },
      }),
    ];
  },
});
