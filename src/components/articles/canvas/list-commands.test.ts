// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { DOC_NODE } from "@/lib/article-body";
import { articleCanvasExtensions } from "./extensions";
import { createColorMenuStore } from "./color/color-menu-store";
import { toggleList } from "./list-commands";
import { createMediaDialogStore } from "./media-dialog-store";
import { createSlashMenuStore } from "./slash-menu-store";

function newEditor(content: string) {
  return new Editor({
    extensions: articleCanvasExtensions(createSlashMenuStore(), createMediaDialogStore(), createColorMenuStore()),
    content,
  });
}

/** A loosely-typed JSON node — `Editor.getJSON()`'s real type is generic over the exact schema, which these tests don't parameterize. */
interface Json {
  type: string;
  content?: Json[];
}

function json(editor: Editor): Json[] {
  return (editor.getJSON().content ?? []) as Json[];
}

describe("toggleList", () => {
  it("converts a selection spanning several paragraphs into one bullet list, one item per paragraph", () => {
    const editor = newEditor("<p>нэг</p><p>хоёр</p><p>гурав</p>");
    editor.commands.selectAll();
    toggleList(editor, DOC_NODE.bulletList);
    // A list as the doc's last node gets an empty trailing paragraph appended
    // (Tiptap's stock trailing-node behaviour, unrelated to this command) — assert on the list itself.
    const top = json(editor);
    expect(top[0]?.type).toBe(DOC_NODE.bulletList);
    expect(top[0]?.content?.length).toBe(3);
    for (const item of top[0]?.content ?? []) {
      expect(item.type).toBe(DOC_NODE.listItem);
      expect(item.content?.length).toBe(1);
      expect(item.content?.[0]?.type).toBe(DOC_NODE.paragraph);
    }
  });

  it("does the same for an ordered list", () => {
    const editor = newEditor("<p>нэг</p><p>хоёр</p><p>гурав</p>");
    editor.commands.selectAll();
    toggleList(editor, DOC_NODE.orderedList);
    const top = json(editor);
    expect(top[0]?.type).toBe(DOC_NODE.orderedList);
    expect(top[0]?.content?.length).toBe(3);
  });

  it("still toggles a single-paragraph selection via the stock command (regression check)", () => {
    const editor = newEditor("<p>ганцхан мөр</p>");
    editor.commands.selectAll();
    toggleList(editor, DOC_NODE.bulletList);
    const top = json(editor);
    expect(top[0]?.type).toBe(DOC_NODE.bulletList);
    expect(top[0]?.content?.length).toBe(1);
  });
});
