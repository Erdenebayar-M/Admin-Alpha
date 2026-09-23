// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";
import { DOC_MARK, DOC_NODE } from "@/lib/article-body";
import { articleCanvasExtensions } from "./extensions";
import { applyHighlight, applyTextColor } from "./color/color-commands";
import { createColorMenuStore } from "./color/color-menu-store";
import { createMediaDialogStore } from "./media-dialog-store";
import { createSlashMenuStore } from "./slash-menu-store";

/**
 * `ListMarker`, `ListMarkerIntegrity`, `ListItemExit` and `ListSplitDefaults`
 * (ADR 0005) are only meaningful in terms of what a live `Editor` produces —
 * unlike `article-body.ts`'s pure data conversion or `activeBackgroundNode`'s
 * plain `EditorState` read, these need real ProseMirror commands and
 * `appendTransaction` plugins to actually run, which requires a full
 * `Editor`/view (hence jsdom, not the package's default `node` environment).
 *
 * Content set via `new Editor({ content })` becomes the *initial* state
 * directly, without going through a dispatched transaction — so
 * `appendTransaction` hooks like `ListMarkerIntegrity` never see it. That
 * matches how a saved Article actually loads: `blocksToDoc()` already
 * writes the marker into the JSON before Tiptap ever sees it (Phase 5), so
 * initial load never depends on this repair hook. Tests below that need a
 * *real* marker on freshly-typed content build it via `toggleBulletList`/
 * `toggleOrderedList` first — a dispatched command, exactly like the canvas
 * toolbar/slash-menu use — the same path `ListMarkerIntegrity` exists for.
 */
/** A loosely-typed JSON node — `Editor.getJSON()`'s real type is generic over the exact schema, which these tests don't parameterize. */
interface Json {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: Json[];
}

function newEditor(content?: string) {
  return new Editor({
    extensions: articleCanvasExtensions(createSlashMenuStore(), createMediaDialogStore(), createColorMenuStore()),
    content,
  });
}

function docJson(editor: Editor): Json {
  return editor.getJSON() as unknown as Json;
}

/**
 * A real DOM keydown, not `editor.commands.keyboardShortcut` — that command
 * captures whatever `handleKeyDown` *would* dispatch and replays only its
 * `.steps` onto its own transaction, silently dropping any `setMeta` (as
 * `ListItemExit`'s split tag relies on) along the way. A genuine event goes
 * straight through ProseMirror's real key handling, exactly like a keypress
 * in the browser — the same path meta survives on.
 */
function pressKey(editor: Editor, key: string): boolean {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  editor.view.dom.dispatchEvent(event);
  return event.defaultPrevented;
}

const pressEnter = (editor: Editor) => pressKey(editor, "Enter");
const pressBackspace = (editor: Editor) => pressKey(editor, "Backspace");

function markerOf(listNode: Json, itemIndex: number) {
  const item = listNode.content?.[itemIndex];
  const paragraph = item?.content?.[0];
  return paragraph?.content?.find((c) => c.type === DOC_NODE.listMarker);
}

/** Position right at the end of the Nth paragraph found in document order (0-based) — where an empty item's cursor sits. */
function paragraphEnd(doc: PMNode, index: number): number {
  let seen = -1;
  let pos = -1;
  doc.descendants((node, nodePos) => {
    if (pos !== -1) return false;
    if (node.type.name !== DOC_NODE.paragraph) return true;
    seen += 1;
    if (seen === index) pos = nodePos + node.nodeSize - 1;
    return false;
  });
  if (pos === -1) throw new Error(`no paragraph at index ${index}`);
  return pos;
}

describe("ListMarkerIntegrity", () => {
  it("gives every item of a freshly-toggled bullet list a marker", () => {
    const editor = newEditor("<p>нэг</p>");
    editor.commands.selectAll();
    editor.commands.toggleBulletList();
    const list = docJson(editor).content?.[0];
    expect(list?.type).toBe(DOC_NODE.bulletList);
    expect(markerOf(list!, 0)).toEqual({ type: DOC_NODE.listMarker, attrs: { color: null } });
  });

  it("gives every item of a freshly-toggled ordered list a marker", () => {
    const editor = newEditor("<p>нэг</p>");
    editor.commands.selectAll();
    editor.commands.toggleOrderedList();
    const list = docJson(editor).content?.[0];
    expect(list?.type).toBe(DOC_NODE.orderedList);
    expect(markerOf(list!, 0)).toEqual({ type: DOC_NODE.listMarker, attrs: { color: null } });
  });

  it("re-synthesizes a marker a Backspace just removed", () => {
    const editor = newEditor("<p>нэг</p>");
    editor.commands.selectAll();
    editor.commands.toggleBulletList();
    const list = docJson(editor).content?.[0];
    expect(list).toBeDefined();
    expect(markerOf(list!, 0)).toBeDefined();

    // The marker sits at position 3 (doc > bulletList > listItem > paragraph > marker);
    // select it as a node (the way clicking it does) and delete it directly.
    editor.commands.setNodeSelection(3);
    expect(editor.state.selection.to - editor.state.selection.from).toBe(1); // exactly the marker, nothing else
    editor.commands.deleteSelection();
    const after = docJson(editor).content?.[0];
    expect(markerOf(after!, 0)).toEqual({ type: DOC_NODE.listMarker, attrs: { color: null } });
  });

  it("gives a genuinely pasted list (dispatched, not just loaded) a marker", () => {
    const editor = newEditor("<p></p>");
    editor.commands.insertContent("<ol><li><p>эхний</p></li><li><p>хоёрдугаар</p></li></ol>");
    const list = docJson(editor).content?.find((n) => n.type === DOC_NODE.orderedList);
    expect(markerOf(list!, 0)).toBeDefined();
    expect(markerOf(list!, 1)).toBeDefined();
  });
});

/**
 * StarterKit's bundled `TrailingNode` extension appends an empty paragraph
 * whenever the doc's last node isn't already one (pre-existing behaviour,
 * unrelated to this feature) — harmless (`docToBlocks` drops any empty
 * paragraph on save) but not part of what a split actually produced, so
 * tests below strip it before asserting on structure.
 */
function withoutTrailingEmptyParagraph(nodes: Json[]): Json[] {
  const last = nodes[nodes.length - 1];
  return last?.type === DOC_NODE.paragraph && !last.content?.length ? nodes.slice(0, -1) : nodes;
}

describe("splitting a list with Enter (ADR 0005)", () => {
  it("lifts an empty middle list item into a plain paragraph, splitting the list in two", () => {
    const editor = newEditor("<ol><li><p>нэг</p></li><li><p></p></li><li><p>гурав</p></li></ol>");
    editor.commands.setTextSelection(paragraphEnd(editor.state.doc, 1));
    const handled = pressEnter(editor);
    expect(handled).toBe(true);

    const top = withoutTrailingEmptyParagraph(docJson(editor).content ?? []);
    expect(top.map((n) => n.type)).toEqual([DOC_NODE.orderedList, DOC_NODE.paragraph, DOC_NODE.orderedList]);
    expect(top[0]?.content?.length).toBe(1);
    expect(top[2]?.content?.length).toBe(1);
    // The lifted paragraph is a plain paragraph now — no stray Marker left behind.
    expect(top[1]?.content ?? []).toEqual([]);
  });

  it("splits a bullet list the same way", () => {
    const editor = newEditor("<ul><li><p>нэг</p></li><li><p></p></li><li><p>гурав</p></li></ul>");
    editor.commands.setTextSelection(paragraphEnd(editor.state.doc, 1));
    expect(pressEnter(editor)).toBe(true);
    const top = withoutTrailingEmptyParagraph(docJson(editor).content ?? []);
    expect(top.map((n) => n.type)).toEqual([DOC_NODE.bulletList, DOC_NODE.paragraph, DOC_NODE.bulletList]);
  });

  it("continues the second half's numbering from the first half, but gives it no inherited alignment/background/marker colour", () => {
    const editor = newEditor("<ol><li><p>нэг</p></li><li><p>хоёр</p></li><li><p></p></li><li><p>дөрөв</p></li></ol>");
    editor.commands.setNodeSelection(0);
    editor.commands.updateAttributes(DOC_NODE.orderedList, { background: "gray", alignment: "center" });

    editor.commands.setTextSelection(paragraphEnd(editor.state.doc, 2));
    expect(pressEnter(editor)).toBe(true);

    const top = withoutTrailingEmptyParagraph(docJson(editor).content ?? []);
    expect(top.map((n) => n.type)).toEqual([DOC_NODE.orderedList, DOC_NODE.paragraph, DOC_NODE.orderedList]);
    const [firstList, , secondList] = top;
    expect(firstList?.attrs?.start ?? 1).toBe(1);
    expect(firstList?.content?.length).toBe(2);
    expect(secondList?.content?.length).toBe(1);
    expect(secondList?.attrs?.start).toBe(1 + (firstList?.content?.length ?? 0));
    expect(secondList?.attrs?.background).toBeNull();
    expect(secondList?.attrs?.alignment).toBeNull();
  });

  it("leaves two independently-authored adjacent ordered lists alone, separated by a real paragraph", () => {
    const editor = newEditor("<p>x</p>");
    editor.commands.selectAll();
    editor.commands.toggleOrderedList();
    editor.commands.setTextSelection(editor.state.doc.content.size);
    editor.commands.exitCode(); // leave the list without splitting it
    editor.commands.insertContent("<p>separate paragraph, not a split</p>");
    editor.commands.insertContent("<ol><li><p>y</p></li></ol>");
    const top = withoutTrailingEmptyParagraph(docJson(editor).content ?? []);
    const orderedLists = top.filter((n) => n.type === DOC_NODE.orderedList);
    expect(orderedLists).toHaveLength(2);
    expect(orderedLists[1]?.attrs?.start ?? 1).toBe(1); // not continued — these were never split apart
  });

  it("still leaves two lists alone even with literally nothing between them — only ListItemExit's own transactions are ever gated in", () => {
    const editor = newEditor("<p>x</p>");
    editor.commands.selectAll();
    editor.commands.toggleOrderedList();
    editor.commands.setTextSelection(editor.state.doc.content.size);
    editor.commands.exitCode();
    editor.commands.insertContent("<ol><li><p>y</p></li></ol>");
    const top = withoutTrailingEmptyParagraph(docJson(editor).content ?? []);
    const orderedLists = top.filter((n) => n.type === DOC_NODE.orderedList);
    expect(orderedLists).toHaveLength(2);
    expect(orderedLists[1]?.attrs?.start ?? 1).toBe(1);
  });
});

describe("leaving a list with Backspace (ADR 0005)", () => {
  it("takes a non-empty middle item out as a paragraph, and the second half continues the numbering", () => {
    const editor = newEditor("<ol><li><p>нэг</p></li><li><p>хоёр</p></li><li><p>гурав</p></li></ol>");
    editor.commands.setNodeSelection(0);
    editor.commands.updateAttributes(DOC_NODE.orderedList, { background: "gray" });
    // Caret right after the second item's Marker.
    let markerEnd = -1;
    let seen = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === DOC_NODE.listMarker && ++seen === 2) markerEnd = pos + node.nodeSize;
    });
    editor.commands.setTextSelection(markerEnd);
    expect(pressBackspace(editor)).toBe(true);

    const top = withoutTrailingEmptyParagraph(docJson(editor).content ?? []);
    expect(top.map((n) => n.type)).toEqual([DOC_NODE.orderedList, DOC_NODE.paragraph, DOC_NODE.orderedList]);
    expect(top[1]?.content?.map((c) => c.text)).toEqual(["хоёр"]);
    expect(top[2]?.attrs?.start).toBe(2);
    expect(top[2]?.attrs?.background).toBeNull();
  });

  it("takes the first item out above the list, leaving numbering from 1", () => {
    const editor = newEditor("<ol><li><p>нэг</p></li><li><p>хоёр</p></li></ol>");
    editor.commands.setNodeSelection(0);
    editor.commands.updateAttributes(DOC_NODE.orderedList, { background: "gray" }); // dispatches, so markers get inserted
    editor.commands.setTextSelection(4); // right after the first item's Marker
    expect(pressBackspace(editor)).toBe(true);
    const top = withoutTrailingEmptyParagraph(docJson(editor).content ?? []);
    expect(top.map((n) => n.type)).toEqual([DOC_NODE.paragraph, DOC_NODE.orderedList]);
    expect(top[1]?.attrs?.start ?? 1).toBe(1);
  });
});

describe("ListMarker selectability", () => {
  it("is atomic — a NodeSelection on it is exactly its own size, never less", () => {
    const editor = newEditor("<p>нэг</p>");
    editor.commands.selectAll();
    editor.commands.toggleBulletList();
    editor.commands.setNodeSelection(3); // the marker itself
    expect(editor.state.selection.from).toBe(3);
    expect(editor.state.selection.to).toBe(4);
  });
});

describe("colouring a Marker (ADR 0005)", () => {
  function bulletListEditor() {
    const editor = newEditor("<p>нэг</p>");
    editor.commands.selectAll();
    editor.commands.toggleBulletList();
    return editor; // doc > bulletList > listItem > paragraph > [marker@3, text "нэг"@4..7]
  }

  it("colours a marker selected alone, via the same applyTextColor the toolbar's Text colour swatch calls", () => {
    const editor = bulletListEditor();
    editor.commands.setNodeSelection(3);
    applyTextColor(editor, "brand-blue");
    const marker = docJson(editor).content?.[0]?.content?.[0]?.content?.[0]?.content?.[0];
    expect(marker).toEqual({ type: DOC_NODE.listMarker, attrs: { color: "brand-blue" } });
  });

  it("colours a marker and its item's text together in one call, when both are in the selection", () => {
    const editor = bulletListEditor();
    editor.commands.setTextSelection({ from: 3, to: 7 }); // marker + all of "нэг"
    applyTextColor(editor, "red");
    const paragraph = docJson(editor).content?.[0]?.content?.[0]?.content?.[0];
    expect(paragraph?.content).toEqual([
      { type: DOC_NODE.listMarker, attrs: { color: "red" } },
      { type: "text", text: "нэг", marks: [{ type: DOC_MARK.color, attrs: { color: "red" } }] },
    ]);
  });

  it("never applies a highlight to a marker — only colour does", () => {
    const editor = bulletListEditor();
    editor.commands.setTextSelection({ from: 3, to: 7 });
    applyHighlight(editor, "yellow");
    const paragraph = docJson(editor).content?.[0]?.content?.[0]?.content?.[0];
    const marker = paragraph?.content?.[0];
    const text = paragraph?.content?.[1];
    expect(marker).toEqual({ type: DOC_NODE.listMarker, attrs: { color: null } });
    expect(text?.marks).toEqual([{ type: DOC_MARK.highlight, attrs: { color: "yellow" } }]);
  });

  it("clearing (null) removes a marker's own colour", () => {
    const editor = bulletListEditor();
    editor.commands.setNodeSelection(3);
    applyTextColor(editor, "brand-blue");
    editor.commands.setNodeSelection(3);
    applyTextColor(editor, null);
    const marker = docJson(editor).content?.[0]?.content?.[0]?.content?.[0]?.content?.[0];
    expect(marker).toEqual({ type: DOC_NODE.listMarker, attrs: { color: null } });
  });
});
