// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { docToBlocks } from "@/lib/article-body";
import { BLOCK_COMMANDS, filterBlockCommands } from "./block-commands";
import { articleCanvasExtensions } from "./extensions";
import { createColorMenuStore } from "./color/color-menu-store";
import { applyLink, openLinkDialog, removeLink } from "./link-commands";
import { createLinkDialogStore, type LinkDialogRequest } from "./link-dialog-store";
import { createMediaDialogStore } from "./media-dialog-store";
import { createSlashMenuStore } from "./slash-menu-store";

function setup(content: string) {
  const linkDialog = createLinkDialogStore();
  const editor = new Editor({
    extensions: articleCanvasExtensions(createSlashMenuStore(), createMediaDialogStore(), createColorMenuStore(), linkDialog),
    content,
  });
  return { editor, linkDialog };
}

function saved(editor: Editor) {
  return docToBlocks({ ...editor.getJSON(), type: "doc" });
}

function requested(linkDialog: ReturnType<typeof createLinkDialogStore>): LinkDialogRequest | null {
  return linkDialog.getSnapshot();
}

describe("Link dialog", () => {
  it("asks for text and url when nothing is selected", () => {
    const { editor, linkDialog } = setup("<p>Сайн</p>");
    editor.commands.setTextSelection(3);
    openLinkDialog(editor);
    expect(requested(linkDialog)).toEqual({ askText: true, href: "" });
  });

  it("asks only for the url when words are selected", () => {
    const { editor, linkDialog } = setup("<p>Сайн байна</p>");
    editor.commands.setTextSelection({ from: 1, to: 5 });
    openLinkDialog(editor);
    expect(requested(linkDialog)).toEqual({ askText: false, href: "" });
  });

  it("opens on the existing Link's url when the cursor is on a Link", () => {
    const { editor, linkDialog } = setup('<p>Сайн <a href="https://a.mn">байна</a></p>');
    editor.commands.setTextSelection(9);
    openLinkDialog(editor);
    expect(requested(linkDialog)).toEqual({ askText: false, href: "https://a.mn" });
  });

  it("inserts the typed text as a Link, and text typed after it is not linked", () => {
    const { editor } = setup("<p></p>");
    applyLink(editor, { href: "https://a.mn", text: "энд" });
    // What typing does: insert at the cursor, honouring stored marks.
    editor.view.dispatch(editor.state.tr.insertText("дараа"));
    expect(saved(editor)).toMatchObject([
      {
        type: "paragraph",
        content: [{ text: "энд", href: "https://a.mn" }, { text: "дараа" }],
      },
    ]);
    expect(JSON.stringify(saved(editor))).not.toContain('"text":"дараа","href"');
  });

  it("links the selected words", () => {
    const { editor } = setup("<p>Сайн байна</p>");
    editor.commands.setTextSelection({ from: 1, to: 5 });
    applyLink(editor, { href: "https://a.mn" });
    expect(saved(editor)).toMatchObject([{ content: [{ text: "Сайн", href: "https://a.mn" }, { text: " байна" }] }]);
  });

  it("edits and removes the Link under the cursor", () => {
    const { editor } = setup('<p>Сайн <a href="https://a.mn">байна</a></p>');
    editor.commands.setTextSelection(9);
    applyLink(editor, { href: "https://b.mn" });
    expect(JSON.stringify(saved(editor))).toContain("https://b.mn");
    removeLink(editor);
    expect(JSON.stringify(saved(editor))).not.toContain("href");
  });

  it("⌘K opens the dialog through the editor's shortcut", () => {
    const { editor, linkDialog } = setup("<p>Сайн</p>");
    editor.commands.setTextSelection(3);
    editor.view.someProp("handleKeyDown", (f) =>
      f(editor.view, new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })),
    );
    expect(requested(linkDialog)).not.toBeNull();
  });
});

describe("«Текст холбоос» slash entry", () => {
  it("is found by link, холбоос and url, and is not a Block kind", () => {
    for (const q of ["link", "холбоос", "url"]) {
      expect(filterBlockCommands(q).map((c) => c.label)).toContain("Текст холбоос");
    }
    expect(BLOCK_COMMANDS.map((c) => c.label)).not.toContain("Текст холбоос");
  });

  it("opens the dialog", () => {
    const { editor, linkDialog } = setup("<p>Сайн</p>");
    filterBlockCommands("url").find((c) => c.label === "Текст холбоос")?.run(editor);
    expect(requested(linkDialog)).toEqual({ askText: true, href: "" });
  });
});
