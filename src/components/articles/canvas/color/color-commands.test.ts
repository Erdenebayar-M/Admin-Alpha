import { getSchema, type Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { EditorState, NodeSelection, TextSelection } from "@tiptap/pm/state";
import { describe, expect, it } from "vitest";
import { articleCanvasExtensions } from "../extensions";
import { createMediaDialogStore } from "../media-dialog-store";
import { createSlashMenuStore } from "../slash-menu-store";
import { activeBackgroundNode } from "./color-commands";
import { createColorMenuStore } from "./color-menu-store";

/**
 * `activeBackgroundNode` is what decides which Block kind's `background`
 * gets updated (Admin-Alpha#9) — built on the raw ProseMirror `EditorState`
 * rather than a live `Editor`/view, since it only ever reads
 * `editor.state.selection`, and `EditorState` alone builds without a DOM.
 */
function schema() {
  return getSchema(articleCanvasExtensions(createSlashMenuStore(), createMediaDialogStore(), createColorMenuStore()));
}

function editorAt(json: Parameters<typeof PMNode.fromJSON>[1], pos: number): Editor {
  const doc = PMNode.fromJSON(schema(), json);
  const state = EditorState.create({ doc, selection: TextSelection.create(doc, pos) });
  return { state } as unknown as Editor;
}

/** Selecting the atom node itself (a divider or media Block), the way clicking one in the canvas does. */
function editorSelecting(json: Parameters<typeof PMNode.fromJSON>[1], pos: number): Editor {
  const doc = PMNode.fromJSON(schema(), json);
  const state = EditorState.create({ doc, selection: NodeSelection.create(doc, pos) });
  return { state } as unknown as Editor;
}

describe("activeBackgroundNode", () => {
  it("resolves to the top-level paragraph, not confused by anything nested", () => {
    const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }] };
    expect(activeBackgroundNode(editorAt(doc, 3))).toBe("paragraph");
  });

  it("resolves to the list, not the list item's own wrapping paragraph", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "item" }] }] }],
        },
      ],
    };
    // Position inside the "item" text, nested doc > bulletList > listItem > paragraph > text.
    expect(activeBackgroundNode(editorAt(doc, 4))).toBe("bulletList");
  });

  it("resolves to the ordered list the same way", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "item" }] }] }],
        },
      ],
    };
    expect(activeBackgroundNode(editorAt(doc, 4))).toBe("orderedList");
  });

  it("resolves to quote and callout, whose content is inline directly (no wrapping paragraph)", () => {
    const quoteDoc = { type: "doc", content: [{ type: "quote", content: [{ type: "text", text: "q" }] }] };
    expect(activeBackgroundNode(editorAt(quoteDoc, 1))).toBe("quote");
    const calloutDoc = { type: "doc", content: [{ type: "callout", content: [{ type: "text", text: "c" }] }] };
    expect(activeBackgroundNode(editorAt(calloutDoc, 1))).toBe("callout");
  });

  it("is null for a divider selected as a node (no background-eligible ancestor)", () => {
    const doc = { type: "doc", content: [{ type: "horizontalRule" }, { type: "paragraph", content: [{ type: "text", text: "x" }] }] };
    expect(activeBackgroundNode(editorSelecting(doc, 0))).toBeNull();
  });
});
